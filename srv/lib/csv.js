/**
 * Minimal CSV helpers for the upload templates.
 * Accepts comma or semicolon separated files (Excel "Save as CSV"); the first line is the header.
 */

function parseCsv(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const header = lines[0] || '';
  const separator = (header.match(/;/g) || []).length > (header.match(/,/g) || []).length ? ';' : ',';
  return lines
    .map((line, index) => ({ rowNo: index + 1, cells: line.split(separator).map(cell => cell.trim().replace(/^"|"$/g, '')) }))
    .slice(1)
    .filter(row => row.cells.some(cell => cell !== ''));
}

function toNumber(text) {
  if (text === undefined || text === '') return null;
  const number = Number(String(text).replace(/\s/g, ''));
  return Number.isFinite(number) ? number : NaN;
}

function toDate(text) {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const european = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(text);
  const [year, month, day] = iso ? [iso[1], iso[2], iso[3]] : european ? [european[3], european[2], european[1]] : [];
  if (!year) return null;
  const date = new Date(Date.UTC(+year, +month - 1, +day));
  return date.getUTCDate() === +day ? date.toISOString().slice(0, 10) : null;
}

async function readText(content) {
  if (!content) return '';
  if (Buffer.isBuffer(content)) return content.toString('utf8');
  if (typeof content === 'string') {
    return /^[A-Za-z0-9+/=\r\n]+$/.test(content) ? Buffer.from(content, 'base64').toString('utf8') : content;
  }
  const chunks = [];
  for await (const chunk of content) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

module.exports = { parseCsv, toNumber, toDate, readText };
