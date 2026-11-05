const cds = require('@sap/cds');
const { parseCsv, toNumber, toDate, readText } = require('./lib/csv');

const LOG = cds.log('vanstock');
const round = (number, decimals) => Math.round(number * 10 ** decimals) / 10 ** decimals;
const unitPrice = (value, quantity) => (quantity > 0 ? round(value / quantity, 2) : 0);

module.exports = class AdminService extends cds.ApplicationService {
  init() {
    const { Uploads } = this.entities;
    const db = cds.entities('vanstock.profile');
    const results = new Map();

    this.before('SAVE', Uploads, async req => {
      const { ID, scenario } = req.data;
      if (await SELECT.one.from(db.Uploads).columns('ID').where({ ID })) {
        return req.reject({ status: 400, message: 'UPLOAD_ALREADY_PROCESSED' });
      }
      const draft = await SELECT.one.from(Uploads.drafts).columns('content').where({ ID });
      const rows = parseCsv(await readText(draft?.content));
      if (!rows.length) return req.reject({ status: 400, message: 'UPLOAD_FILE_MISSING', target: 'content' });

      const posting = new ProfilePosting(db, ID, scenario, req.locale);
      await posting.run(rows);
      const { maxNo } = await SELECT.one.from(db.Uploads).columns('max(uploadNo) as maxNo');
      const result = { uploadNo: (maxNo || 0) + 1, ...posting.summary(rows.length) };
      Object.assign(req.data, result);
      results.set(ID, result);
      LOG.info('upload processed', { ID, scenario, ...result });
    });

    this.after('SAVE', Uploads, async (data, req) => {
      const ID = data?.ID ?? req.data.ID;
      const result = results.get(ID);
      if (!result) return;
      results.delete(ID);
      await UPDATE(db.Uploads, ID).with(result);
      const args = [result.uploadNo, result.rowsPosted, result.rowsFailed];
      if (result.rowsFailed) req.warn({ message: 'UPLOAD_CREATED_WITH_ERRORS', args });
      else req.notify({ message: 'UPLOAD_CREATED', args });
    });

    return super.init();
  }
};

/** Posts the rows of one uploaded file to the van stock profiles and writes the logs. */
class ProfilePosting {
  constructor(db, uploadID, scenario, locale) {
    Object.assign(this, { db, uploadID, scenario, locale });
    this.messages = [];
    this.touched = new Set();
    this.posted = 0;
    this.failed = 0;
  }

  async run(rows) {
    const hive = await SELECT.from(this.db.HiveProfitCentres).columns('profitCentre');
    this.hive = new Set(hive.map(h => h.profitCentre));
    if (this.scenario === 'Upload') {
      for (const row of rows) await this.add(row);
    } else {
      for (const [engineerId, lines] of groupByEngineer(rows)) await this.reduce(engineerId, lines);
    }
    for (const profileID of this.touched) await this.updateTotals(profileID);
    if (this.messages.length) await INSERT.into(this.db.UploadMessages).entries(this.messages);
  }

  summary(rowsTotal) {
    const status = !this.failed ? 'Success' : this.posted ? 'Partial' : 'Failed';
    return { status, rowsTotal, rowsPosted: this.posted, rowsFailed: this.failed };
  }

  /** Upload template: Date Created, Engineer ID, Profit Centre, Part Number, Quantity, Value */
  async add({ rowNo, cells }) {
    const [dateText, engineerId, profitCentre, partNumber, quantityText, valueText] = cells;
    const quantity = toNumber(quantityText);
    const value = toNumber(valueText);
    const dateCreated = dateText ? toDate(dateText) : new Date().toISOString().slice(0, 10);
    const row = { rowNo, engineerId, partNumber };

    if (!engineerId || !partNumber) return this.error(row, 'ROW_KEY_MISSING');
    if (!dateCreated) return this.error(row, 'ROW_DATE_INVALID', [dateText]);
    if (!(quantity > 0)) return this.error(row, 'ROW_QUANTITY_INVALID', [quantityText]);
    if (value === null || !(value >= 0)) return this.error(row, 'ROW_VALUE_INVALID', [valueText]);

    const { Profiles, ProfileItems } = this.db;
    let profile = await SELECT.one.from(Profiles).where({ engineerId });
    if (profile?.status === 'Closed') return this.error(row, 'PROFILE_CLOSED', [engineerId]);
    if (!profile) {
      profile = { ID: cds.utils.uuid(), engineerId, businessUnit: profitCentre, dateCreated, status: 'Active' };
      await INSERT.into(Profiles).entries(profile);
    }

    const item = await SELECT.one.from(ProfileItems).where({ profile_ID: profile.ID, partNumber });
    const old = { quantity: Number(item?.quantity ?? 0), value: Number(item?.value ?? 0) };
    const quantityNew = round(old.quantity + quantity, 3);
    const valueNew = round(old.value + value, 2);
    const map = unitPrice(valueNew, quantityNew);
    if (item) {
      await UPDATE(ProfileItems, item.ID).with({ quantity: quantityNew, value: valueNew, map, profitCentre: profitCentre || item.profitCentre });
    } else {
      await INSERT.into(ProfileItems).entries({ profile_ID: profile.ID, profitCentre, partNumber, quantity: quantityNew, uom: 'EA', value: valueNew, map });
    }
    await this.log(profile, partNumber, profitCentre || item?.profitCentre, old, { quantity: quantityNew, value: valueNew });
  }

  /** Returns / leavers template: Engineer ID, Part Number, Quantity, Value (optional, default = quantity x MAP) */
  async reduce(engineerId, lines) {
    const { Profiles } = this.db;
    const profile = await SELECT.one.from(Profiles).where({ engineerId });
    const failAll = (key, args) => lines.forEach(({ rowNo, cells }) => this.error({ rowNo, engineerId, partNumber: cells[1] }, key, args));
    if (!engineerId) return failAll('ROW_KEY_MISSING');
    if (!profile) return failAll('PROFILE_NOT_FOUND', [engineerId]);
    if (profile.status === 'Closed') return failAll('PROFILE_CLOSED', [engineerId]);

    const isLeaver = this.scenario === 'Leaver';
    if (isLeaver) {
      await this.setStatus(profile, 'Leaver');
      await this.archive(profile);
      await this.setStatus(profile, 'Active');
    }
    for (const line of lines) await this.decrement(profile, line);
    if (!isLeaver) return;

    await this.updateTotals(profile.ID);
    const items = await SELECT.from(this.db.ProfileItems).columns('quantity').where({ profile_ID: profile.ID });
    if (items.some(item => Number(item.quantity) > 0)) {
      return this.info({ rowNo: 0, engineerId }, 'LEAVER_BALANCE_REMAINING', [engineerId]);
    }
    await this.setStatus(profile, 'Closed');
    await this.archive(profile);
    this.info({ rowNo: 0, engineerId }, 'LEAVER_PROFILE_CLOSED', [engineerId]);
  }

  async decrement(profile, { rowNo, cells }) {
    const [, partNumber, quantityText, valueText] = cells;
    const { engineerId } = profile;
    const row = { rowNo, engineerId, partNumber };
    const quantity = toNumber(quantityText);
    const value = toNumber(valueText);

    if (!partNumber) return this.error(row, 'ROW_KEY_MISSING');
    if (!(quantity > 0)) return this.error(row, 'ROW_QUANTITY_INVALID', [quantityText]);
    if (Number.isNaN(value) || value < 0) return this.error(row, 'ROW_VALUE_INVALID', [valueText]);

    const { ProfileItems } = this.db;
    const item = await SELECT.one.from(ProfileItems).where({ profile_ID: profile.ID, partNumber });
    if (!item) return this.error(row, 'PART_NOT_IN_PROFILE', [partNumber, engineerId]);

    const old = { quantity: Number(item.quantity), value: Number(item.value) };
    const quantityNew = round(old.quantity - quantity, 3);
    if (quantityNew < 0) return this.error(row, 'QUANTITY_NEGATIVE', [partNumber, engineerId, old.quantity]);

    const valueChange = value ?? quantity * Number(item.map);
    const valueNew = quantityNew === 0 ? 0 : Math.max(0, round(old.value - valueChange, 2));
    await UPDATE(ProfileItems, item.ID).with({ quantity: quantityNew, value: valueNew, map: unitPrice(valueNew, quantityNew) || item.map });
    await this.log(profile, partNumber, item.profitCentre, old, { quantity: quantityNew, value: valueNew });
  }

  async log(profile, partNumber, profitCentre, old, now) {
    this.touched.add(profile.ID);
    this.posted++;
    await INSERT.into(this.db.ChangeLog).entries({
      upload_ID: this.uploadID,
      scenario: this.scenario,
      engineerId: profile.engineerId,
      partNumber,
      profitCentre,
      quantityOld: old.quantity,
      quantityChange: round(now.quantity - old.quantity, 3),
      quantityNew: now.quantity,
      valueOld: old.value,
      valueChange: round(now.value - old.value, 2),
      valueNew: now.value
    });
  }

  async setStatus(profile, status) {
    profile.status = status;
    await UPDATE(this.db.Profiles, profile.ID).with({ status });
  }

  async archive(profile) {
    const header = await SELECT.one.from(this.db.Profiles, profile.ID);
    const items = await SELECT.from(this.db.ProfileItems).where({ profile_ID: profile.ID });
    await INSERT.into(this.db.ProfileArchive).entries({
      archivedAt: new Date().toISOString(),
      engineerId: profile.engineerId,
      status: profile.status,
      totalValue: header.totalValue,
      upload_ID: this.uploadID,
      snapshot: JSON.stringify({ ...header, status: profile.status, items })
    });
  }

  async updateTotals(profileID) {
    const items = await SELECT.from(this.db.ProfileItems).columns('profitCentre', 'value').where({ profile_ID: profileID });
    const sum = list => round(list.reduce((total, item) => total + Number(item.value), 0), 2);
    const hiveItems = items.filter(item => this.hive.has(item.profitCentre));
    const totalValueHive = sum(hiveItems);
    const totalValue = sum(items);
    await UPDATE(this.db.Profiles, profileID).with({ totalValueHive, totalValueNonHive: round(totalValue - totalValueHive, 2), totalValue });
  }

  error(row, key, args) {
    this.failed++;
    this.message(row, 'Error', key, args);
  }

  info(row, key, args) {
    this.message(row, 'Info', key, args);
  }

  message({ rowNo, engineerId, partNumber }, severity, key, args = []) {
    const text = cds.i18n?.messages?.at(key, this.locale, args) ?? `${key} ${args.join(' ')}`;
    this.messages.push({ upload_ID: this.uploadID, rowNo, engineerId, partNumber, severity, text });
  }
}

function groupByEngineer(rows) {
  const groups = new Map();
  for (const row of rows) {
    const engineerId = row.cells[0];
    if (!groups.has(engineerId)) groups.set(engineerId, []);
    groups.get(engineerId).push(row);
  }
  return groups;
}
