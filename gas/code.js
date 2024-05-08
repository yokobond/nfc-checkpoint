/* eslint-disable no-unused-vars */

const ss = SpreadsheetApp.openById("REPLACE_SPREAD_SHEET_ID");

/**
 * Creates a new sheet with the specified name in the active spreadsheet if it does not already exist.
 *
 * @param {string} sheetName - The name of the sheet to be created.
 */
function createSheetIfNotExists(sheetName) {
  var sheet = ss.getSheetByName(sheetName);

  // Check if the sheet does not exist
  if (!sheet) {
    // Create the sheet
    ss.insertSheet(sheetName);
  }
}

createSheetIfNotExists('Record');
createSheetIfNotExists('NameList');
createSheetIfNotExists('Archive');
createSheetIfNotExists('log');

/**
 * Convert epoch time to date time entry
 * @param {number} epochTime
 * @returns {string}
 */
function toDateTimeEntry(epochTime) {
  const date = new Date(epochTime);
  //get timezone of spreadsheet
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  //format date to readable format
  var formatted = Utilities.formatDate(date, tz, 'yyyy/MM/dd HH:mm:ss');
  return formatted;
}

/**
 * Log data to sheet
 * @param {any} data
 */
function sheetLog(data) {
  const dataSheet = ss.getSheetByName('log');
  dataSheet.appendRow([toDateTimeEntry(Date.now()), JSON.stringify(data)]);
}

/**
 * doGet
 * @param {any} e
 * @returns {GoogleAppsScript.Content.TextOutput}
 * @see https://developers.google.com/apps-script/guides/web
 */
function doGet(e) {
  const reqParam = e.parameter;//パラメーターを取得
  // sheetLog(reqParam);
  switch (reqParam.action) {//actionパラメーターの内容によって処理を分岐
    case "getRecordList":
      {
        const after = reqParam.after;
        const data = getRecordList(after ? parseInt(after) : null);
        return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
      }
    case "getNameList":
      {
        const data = getNameList();
        return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
      }
    default:
      {
        return HtmlService.createTemplateFromFile('index').evaluate();
      }
  }
}

/**
 * Test doGet
 */
function testDoGet() {
  var e = {};
  e.parameter = { "after": "1712847600000", "action": "getRecordList" };
  doGet(e);
}


/**
 * doPost
 * @param {any} e
 * @returns {GoogleAppsScript.Content.TextOutput}
 * @see https://developers.google.com/apps-script/guides/web
 */
function doPost(e) {
  const command = JSON.parse(e.postData.contents);
  switch (command.action) {
    case "recordID":
      {
        const record = [command.id];
        const recordedData = addRecord(record);
        const output = ContentService.createTextOutput();
        output.setContent(JSON.stringify(recordedData));
        output.setMimeType(ContentService.MimeType.JSON);
        return output;
      }
    case "updateName":
      {
        const result = updateName(command.id, command.name);
        const output = ContentService.createTextOutput();
        output.setContent(JSON.stringify(result));
        output.setMimeType(ContentService.MimeType.JSON);
        return output;
      }
    default:
      {
        sheetLog(e.postData.contents);
        break;
      }
  }
}

/**
 * Test doPost
 */
function testDoPost() {
  var e = {};
  e.postData = {};
  e.postData.contents = JSON.stringify({ "id": "id_xxx", "action": "recordID" });
  const output = doPost(e);
  console.log(output.getContent());
}

function getRecordList(after) {
  const recordSheet = ss.getSheetByName('Record');
  const records = recordSheet.getDataRange().getValues();
  if (after) {
    const afterDate = new Date(after);
    const filteredData = records.filter(function (row) {
      const rowTimestamp = row[0];
      return rowTimestamp > afterDate;
    });
    return filteredData;
  }
  return records;
}

/**
 * Test getRecordList
 */
function testGetRecordList() {
  const testRecord1 = ['test1'];
  addRecord(testRecord1);
  const testRecord2 = ['test2'];
  addRecord(testRecord2);
  const after = new Date();
  after.setSeconds(after.getSeconds() - 10);
  const result = getRecordList(after.valueOf());
  if (result.length !== 2) console.error(result);
  if (result[0][1] !== 'test1') console.error(result);
  const recordSheet = ss.getSheetByName('Record');
  const lastRow = recordSheet.getLastRow();
  recordSheet.deleteRow(lastRow);
  recordSheet.deleteRow(lastRow - 1);
  console.log('testGetRecordList() success!');
}

/**
 * Get name list
 * @returns {Array<Array<string>>} array of id and name
 */
function getNameList() {
  const nameListSheet = ss.getSheetByName('NameList');
  const nameList = nameListSheet.getDataRange().getValues();
  return nameList;
}

/**
 * Add record
 * @param {Array<string>} record record data
 * @returns {Array<string>} recorded data with timestamp
 */
function addRecord(record) {
  const recordedData = [toDateTimeEntry(Date.now()), ...record];
  const recordSheet = ss.getSheetByName('Record');
  recordSheet.appendRow(recordedData);
  return recordedData;
}

/**
 * Test addRecord
 */
function testAddRecord() {
  const testRecord = ['ID_xxxx'];
  addRecord(testRecord);
  const recordSheet = ss.getSheetByName('Record');
  const records = recordSheet.getDataRange().getValues();
  const last = records[records.length - 1];
  if (last[1] !== testRecord[0]) {
    console.error(last);
  }
  const lastRow = recordSheet.getLastRow();
  recordSheet.deleteRow(lastRow);
  console.log('testAddRecord() success!');
}

/**
 * Update name entry
 * @param {string} id id
 * @param {string} newName new name
 * @returns {Object} updated data
 */
function updateName(id, newName) {
  const nameColumn = 2;
  const nameListSheet = ss.getSheetByName('NameList');
  const nameList = nameListSheet.getDataRange().getValues();
  for (let i = 0; i < nameList.length; i++) {
    if (nameList[i][0] == id) {
      const cell = nameListSheet.getRange(i + 1, nameColumn);
      cell.setValue(newName);
      return { id: id, name: newName };
    }
  }
  nameListSheet.appendRow([id, newName]);
  return { id: id, name: newName };
}

/**
 * Test updateName
 */
function testUpdateName() {
  const addData = { id: 'id_xxx_1', name: 'added' };
  let result = updateName(addData.id, addData.name);
  const nameListSheet = ss.getSheetByName('NameList');
  let nameList = nameListSheet.getDataRange().getValues();
  const added = nameList[nameList.length - 1];
  if (added[0] !== addData.id || added[1] !== addData.name) {
    console.error(result);
    return;
  }
  const updateData = { id: 'id_xxx_1', name: 'updated' };
  result = updateName(updateData.id, updateData.name);
  nameList = nameListSheet.getDataRange().getValues();
  const updated = nameList[nameList.length - 1];
  if (updated[0] !== updateData.id || updated[1] !== updateData.name) {
    console.error(result);
    return;
  }
  const lastRow = nameListSheet.getLastRow();
  nameListSheet.deleteRow(lastRow);
}

/**
 * Moves rows from the 'Record' sheet to the 'Archive' sheet if the date in column 'A' is before the specified date.
 *
 * @param {Date} beforeDate - The date before which rows should be moved.
 */
function archiveRecords(beforeDate) {
  if (!beforeDate) {
    beforeDate = new Date();
    beforeDate.setHours(0, 0, 0, 0);
  }
  const recordSheet = ss.getSheetByName('Record');
  const archiveSheet = ss.getSheetByName('Archive');

  // Get all data from the 'Record' sheet
  const data = recordSheet.getDataRange().getValues();

  // Collect rows to be moved and their indices
  const rowsToMove = [];
  const indicesToMove = [];

  for (let i = 0; i < data.length; i++) {
    // Parse the date from column 'A'
    const date = new Date(data[i][0]);

    // Check if the date is before the specified date
    if (date < beforeDate) {
      // Add the row to the list of rows to be moved
      rowsToMove.push(data[i]);

      // Add the index to the list of indices to be moved
      indicesToMove.push(i + 1);
    }
  }

  // Append the rows to the 'Archive' sheet
  rowsToMove.forEach(row => archiveSheet.appendRow(row));

  // Delete the rows from the 'Record' sheet in reverse order
  indicesToMove.reverse().forEach(index => recordSheet.deleteRow(index));
}

/**
 * Test of archiveRecords
 */
function testArchiveRecords() {
  archiveRecords();
}
