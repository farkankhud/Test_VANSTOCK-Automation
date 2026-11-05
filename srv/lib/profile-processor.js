const cds = require('@sap/cds')

const round = (number, digits) => Number(Number(number).toFixed(digits))
const toNumber = (raw) => (raw === undefined || raw === null || raw === '' ? null : Number(raw))
const today = () => new Date().toISOString().slice(0, 10)

/**
 * Applies the rows of one uploaded file to the van stock profiles and writes the change log.
 * Scenarios (spec R2R.04.02): Upload adds stock, Return decrements stock,
 * Leaver archives the profile, decrements stock and closes the profile when nothing is left.
 */
class ProfileProcessor {
  constructor(upload, text) {
    this.upload = upload
    this.text = text
    this.db = cds.entities('vanstock.profile')
    this.logs = []
    this.touched = new Set()
  }

  async run(rows) {
    if (this.upload.scenario === 'Leaver') await this.processLeavers(rows)
    else for (const row of rows) await this.processRow(row)
    await this.updateTotals()
    if (this.logs.length) await INSERT.into(this.db.ChangeLogs).entries(this.logs)
    return {
      successRows: this.logs.filter((l) => l.result === 'S').length,
      errorRows: this.logs.filter((l) => l.result === 'E').length
    }
  }

  log(row, result, key, args = [], change = {}) {
    this.logs.push({
      upload_ID: this.upload.ID,
      lineNo: row.lineNo,
      scenario: this.upload.scenario,
      engineerId: row.engineerId,
      partNumber: row.partNumber,
      result,
      message: this.text(key, args).slice(0, 255),
      ...change
    })
  }

  async processRow(row) {
    const error = this.validate(row)
    if (error) return this.log(row, 'E', error, [row.lineNo])
    if (this.upload.scenario === 'Upload') return this.addStock(row)
    return this.removeStock(row)
  }

  validate(row) {
    const isUpload = this.upload.scenario === 'Upload'
    const quantity = toNumber(row.quantity)
    const value = toNumber(row.value)
    if (!row.engineerId) return 'ROW_ENGINEER_MISSING'
    if (!row.partNumber) return 'ROW_PART_MISSING'
    if (quantity === null || Number.isNaN(quantity) || quantity <= 0) return 'ROW_QUANTITY_INVALID'
    if ((isUpload && value === null) || Number.isNaN(value) || value < 0) return 'ROW_VALUE_INVALID'
    if (isUpload && !row.profitCentre) return 'ROW_PROFIT_CENTRE_MISSING'
    if (isUpload && row.dateCreated === null) return 'ROW_DATE_INVALID'
    return null
  }

  async addStock(row) {
    const { Profiles, ProfileItems } = this.db
    const engineerId = String(row.engineerId)
    const partNumber = String(row.partNumber)
    const quantity = toNumber(row.quantity)
    const value = toNumber(row.value)

    const profile = await SELECT.one.from(Profiles).where({ engineerId })
    if (profile?.status === 'Closed') return this.log(row, 'E', 'PROFILE_CLOSED', [engineerId])
    if (!profile) {
      await INSERT.into(Profiles).entries({
        engineerId,
        dateCreated: row.dateCreated || today(),
        businessUnit: row.profitCentre,
        status: 'Active'
      })
    }

    const item = await SELECT.one.from(ProfileItems).where({ profile_engineerId: engineerId, partNumber })
    const oldQuantity = item ? Number(item.quantity) : 0
    const newQuantity = round(oldQuantity + quantity, 3)
    const newValue = round((item ? Number(item.value) : 0) + value, 2)
    const map = round(newValue / newQuantity, 2)

    if (item) {
      await UPDATE(ProfileItems, item.ID).with({ quantity: newQuantity, value: newValue, map })
    } else {
      await INSERT.into(ProfileItems).entries({
        profile_engineerId: engineerId,
        profitCentre: row.profitCentre,
        partNumber,
        quantity: newQuantity,
        uom: row.uom || 'EA',
        value: newValue,
        map
      })
    }
    this.touched.add(engineerId)
    this.log(row, 'S', 'LINE_ADDED', [partNumber, quantity, engineerId], {
      oldQuantity, quantityChange: quantity, newQuantity, valueChange: value
    })
  }

  async removeStock(row) {
    const { Profiles, ProfileItems } = this.db
    const engineerId = String(row.engineerId)
    const partNumber = String(row.partNumber)
    const quantity = toNumber(row.quantity)

    const profile = await SELECT.one.from(Profiles).where({ engineerId })
    if (!profile) return this.log(row, 'E', 'PROFILE_NOT_FOUND', [engineerId])
    if (profile.status === 'Closed') return this.log(row, 'E', 'PROFILE_CLOSED', [engineerId])

    const item = await SELECT.one.from(ProfileItems).where({ profile_engineerId: engineerId, partNumber })
    if (!item) return this.log(row, 'E', 'PART_NOT_IN_PROFILE', [partNumber, engineerId])

    const oldQuantity = Number(item.quantity)
    const newQuantity = round(oldQuantity - quantity, 3)
    if (newQuantity < 0) {
      return this.log(row, 'E', 'QUANTITY_NEGATIVE', [partNumber, oldQuantity, quantity], { oldQuantity })
    }

    // Value from the file (finance-approved MAP), otherwise quantity x current MAP
    const valueChange = round(toNumber(row.value) ?? quantity * Number(item.map), 2)
    const newValue = newQuantity === 0 ? 0 : Math.max(0, round(Number(item.value) - valueChange, 2))
    await UPDATE(ProfileItems, item.ID).with({ quantity: newQuantity, value: newValue })

    this.touched.add(engineerId)
    this.log(row, 'S', 'LINE_REDUCED', [partNumber, quantity, engineerId], {
      oldQuantity, quantityChange: -quantity, newQuantity, valueChange: -valueChange
    })
  }

  async processLeavers(rows) {
    const { Profiles, ProfileItems } = this.db
    const byEngineer = new Map()
    for (const row of rows) {
      const key = String(row.engineerId ?? '')
      if (!byEngineer.has(key)) byEngineer.set(key, [])
      byEngineer.get(key).push(row)
    }

    for (const [engineerId, engineerRows] of byEngineer) {
      const profile = engineerId && (await SELECT.one.from(Profiles).where({ engineerId }))
      if (!profile || profile.status === 'Closed') {
        const key = profile ? 'PROFILE_CLOSED' : 'PROFILE_NOT_FOUND'
        for (const row of engineerRows) {
          this.log(row, 'E', engineerId ? key : 'ROW_ENGINEER_MISSING', [engineerId || row.lineNo])
        }
        continue
      }

      await this.setStatusAndArchive(engineerId, 'Leaver')
      for (const row of engineerRows) await this.processRow(row)

      const remaining = await SELECT.one.from(ProfileItems)
        .where({ profile_engineerId: engineerId, quantity: { '>': 0 } })
      const last = engineerRows[engineerRows.length - 1]
      if (remaining) {
        await UPDATE(Profiles, engineerId).with({ status: 'Active' })
        this.log({ ...last, partNumber: null }, 'I', 'LEAVER_BALANCE_REMAINING', [engineerId])
      } else {
        await this.updateTotals([engineerId])
        await this.setStatusAndArchive(engineerId, 'Closed')
        this.log({ ...last, partNumber: null }, 'I', 'PROFILE_CLOSED_INFO', [engineerId])
      }
    }
  }

  async setStatusAndArchive(engineerId, status) {
    const { Profiles, ProfileItems, ProfileArchives } = this.db
    await UPDATE(Profiles, engineerId).with({ status })
    const profile = await SELECT.one.from(Profiles).where({ engineerId })
    const items = await SELECT.from(ProfileItems).where({ profile_engineerId: engineerId })
    await INSERT.into(ProfileArchives).entries({
      engineerId,
      status,
      archivedAt: new Date().toISOString(),
      upload_ID: this.upload.ID,
      snapshot: JSON.stringify({ ...profile, items })
    })
  }

  async updateTotals(engineerIds = [...this.touched]) {
    const { Profiles, ProfileItems, HiveProfitCentres } = this.db
    const hive = new Set((await SELECT.from(HiveProfitCentres).columns('profitCentre')).map((h) => h.profitCentre))
    for (const engineerId of engineerIds) {
      const items = await SELECT.from(ProfileItems).columns('profitCentre', 'value').where({ profile_engineerId: engineerId })
      let totalValueHive = 0
      let totalValueNonHive = 0
      for (const item of items) {
        if (hive.has(item.profitCentre)) totalValueHive += Number(item.value)
        else totalValueNonHive += Number(item.value)
      }
      await UPDATE(Profiles, engineerId).with({
        totalValueHive: round(totalValueHive, 2),
        totalValueNonHive: round(totalValueNonHive, 2),
        totalValue: round(totalValueHive + totalValueNonHive, 2)
      })
    }
  }
}

module.exports = ProfileProcessor
