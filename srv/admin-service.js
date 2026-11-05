const cds = require('@sap/cds')
const { readRows } = require('./lib/file-reader')
const ProfileProcessor = require('./lib/profile-processor')

const LOG = cds.log('vanstock-upload')

async function toBuffer(content) {
  if (!content) return null
  if (Buffer.isBuffer(content)) return content
  if (typeof content === 'string') return Buffer.from(content, 'base64')
  const chunks = []
  for await (const chunk of content) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

module.exports = class AdminService extends cds.ApplicationService {
  init() {
    const { Uploads } = this.entities
    const db = cds.entities('vanstock.profile')

    // Uploads can only be created; keep the file of the draft for processing after activation
    this.before('SAVE', Uploads, async (req) => {
      const { ID } = req.data
      if (await SELECT.one.from(db.Uploads, ID).columns('ID')) {
        return req.reject({ status: 400, message: 'UPLOAD_NOT_CHANGEABLE' })
      }
      const draft = await SELECT.one.from(Uploads.drafts, ID).columns('content')
      req.uploadFile = await toBuffer(draft?.content)
    })

    this.before('DELETE', Uploads, (req) => req.reject({ status: 400, message: 'UPLOAD_NOT_CHANGEABLE' }))

    this.after('SAVE', Uploads, async (result, req) => {
      const ID = result?.ID ?? req.data.ID
      const upload = await SELECT.one.from(db.Uploads, ID).columns('ID', 'scenario_code as scenario')
      let file = req.uploadFile
      if (!file?.length) file = await toBuffer((await SELECT.one.from(db.Uploads, ID).columns('content'))?.content)
      if (!file?.length) return req.reject({ status: 400, message: 'UPLOAD_FILE_MISSING', target: 'content' })

      let rows
      try {
        rows = readRows(file)
      } catch (error) {
        LOG.warn('Upload file could not be read', error)
        return req.reject({ status: 400, message: 'UPLOAD_FILE_INVALID', target: 'content' })
      }
      if (!rows.length) return req.reject({ status: 400, message: 'UPLOAD_FILE_EMPTY', target: 'content' })

      const text = (key, args) => {
        try {
          return cds.i18n.messages.at(key, req.locale, args) ?? key
        } catch {
          return key
        }
      }
      const { successRows, errorRows } = await new ProfileProcessor(upload, text).run(rows)

      const { maxNo } = await SELECT.one.from(db.Uploads).columns('max(uploadNo) as maxNo')
      const uploadNo = (maxNo ?? 0) + 1
      const status = errorRows === 0 ? 'Processed' : successRows === 0 ? 'Failed' : 'ProcessedWithErrors'
      const stats = { uploadNo, status, totalRows: rows.length, successRows, errorRows }
      await UPDATE(db.Uploads, ID).with(stats)
      if (result) Object.assign(result, stats)

      const message = { message: 'UPLOAD_PROCESSED', args: [uploadNo, successRows, errorRows] }
      if (errorRows) req.warn(message)
      else req.notify(message)
    })

    return super.init()
  }
}
