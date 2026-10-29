/**
 * MOKI leads → Google Sheet. Paste into Extensions → Apps Script of the sheet.
 * 1. Project Settings → Script properties → add LEADS_EXPORT_TOKEN (same value as on Vercel).
 * 2. Run installAutoSync once and allow access. The "Leads" tab then refreshes every 15 minutes.
 * Leads are listed oldest first, so a new lead always lands at the bottom and your own notes
 * in column K onwards stay on the right row. Columns A–J are rewritten on every sync.
 */
const FEED_URL = 'https://www.mokisystems.us/api/leads-export';
const SHEET_NAME = 'Leads';
const HEADERS = ['Received', 'Name', 'Email', 'Company', 'Services', 'Challenge', 'Source', 'Page', 'Status', 'Reference'];

function syncLeads() {
  const token = PropertiesService.getScriptProperties().getProperty('LEADS_EXPORT_TOKEN');
  if (!token) throw new Error('Add LEADS_EXPORT_TOKEN under Project Settings → Script properties.');
  const res = UrlFetchApp.fetch(FEED_URL, { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('Leads feed answered ' + res.getResponseCode());
  const leads = JSON.parse(res.getContentText()).leads.slice().reverse(); // oldest first

  const book = SpreadsheetApp.getActive();
  const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
  sheet.getRange(1, 1, sheet.getMaxRows(), HEADERS.length).clearContent();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  if (!leads.length) return;
  const rows = leads.map(l => [
    l.createdAt ? new Date(l.createdAt) : '', l.name, l.email, l.company, l.services.join(', '),
    l.challenge, l.source, l.page, l.status, l.reference,
  ]);
  sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  sheet.getRange(2, 1, rows.length, 1).setNumberFormat('dd mmm yyyy, hh:mm');
}

function installAutoSync() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'syncLeads')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncLeads').timeBased().everyMinutes(15).create();
  syncLeads();
}
