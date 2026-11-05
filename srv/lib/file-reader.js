const XLSX = require('xlsx')

// Maps normalised column headers of the upload file to field names
const COLUMNS = {
  datecreated: 'dateCreated',
  engineerid: 'engineerId',
  engineerud: 'engineerId',
  profitcentre: 'profitCentre',
  profitcenter: 'profitCentre',
  partnumber: 'partNumber',
  quantity: 'quantity',
  value: 'value',
  uom: 'uom',
  unitofmeasure: 'uom'
}

const normalise = (header) => String(header).toLowerCase().replace(/[^a-z]/g, '')

function toIsoDate(raw) {
  // Excel dates can be a few seconds before midnight, so round to the nearest day
  if (raw instanceof Date) return new Date(raw.getTime() + 12 * 3600 * 1000).toISOString().slice(0, 10)
  const text = String(raw ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const dmy = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  return null
}

/**
 * Reads the first sheet of an .xlsx or .csv file into plain row objects.
 * Each row gets its 1-based line number in the file (header = line 1).
 */
function readRows(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const records = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true })
  return records.map((record, index) => {
    const row = { lineNo: index + 2 }
    for (const [header, cell] of Object.entries(record)) {
      const field = COLUMNS[normalise(header)]
      if (field) row[field] = typeof cell === 'string' ? cell.trim() : cell
    }
    if (row.dateCreated !== undefined) row.dateCreated = toIsoDate(row.dateCreated)
    return row
  })
}

module.exports = { readRows }
