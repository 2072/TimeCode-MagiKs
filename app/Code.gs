/**
 * @OnlyCurrentDoc  Limits the script to only accessing the current spreadsheet.
 */

/**
 * TimeCode-Magiks - functions to manipulate timecodes and EDLs
 * Copyright © 2015-2019 John Wellesz
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

/**
 * Adds a custom menu with items to show the dialogs.
 *
 * @param {Object} e The event parameter for a simple onOpen trigger.
 */
function onOpen(e) {
    var menu = SpreadsheetApp.getUi().createAddonMenu();

    if (e && e.authMode == ScriptApp.AuthMode.NONE) {
        menu.addItem('Enable in this document', 'onEnable')
        menu.addToUi();
    } else {
        menu.addItem('Import EDL', 'showImportEDLDialog')
            .addItem('Export EDL', 'showExportEDLDialog')
            .addSeparator()
            .addItem('See usage examples', 'openUsageExamplesLink')
            .addItem('See version "'+ TCM_VERSION + '" News', 'openVersionChangelogDialog')
            .addToUi();
    }
}

/**
 * Runs when the add-on is installed; calls onOpen() to ensure menu creation and
 * any other initializion work is done immediately.
 *
 * @param {Object} e The event parameter for a simple onInstall trigger.
 */
function onInstall(e) {
  onOpen(e);
}

function onEnable(e) {
  onOpen(e);
  openUsageExamplesLink();
}


/**
 * Opens a dialog. The dialog structure is described in the Dialog.html
 * project file.
 */
function showImportEDLDialog() {
  var ui = HtmlService.createTemplateFromFile('importDialog')
      .evaluate()
      .setWidth(800)
      .setHeight(450);
  SpreadsheetApp.getUi().showModalDialog(ui, "TimeCode-MagiKs - EDL Import");
}

function showExportEDLDialog() {
  var ui = HtmlService.createTemplateFromFile('exportDialog')
      .evaluate()
      .setWidth(800)
      .setHeight(610);
  SpreadsheetApp.getUi().showModalDialog(ui, 'TimeCode-MagiKs - EDL Export');
}

function openUsageExamplesLink() {
    var buttonOpen = '<a href="https://www.2072productions.com/to/TimeCode-Magiks-examples" target="blank" onclick="google.script.host.close()" style="color: #fff;"><button class="action">Open</button></a>';
    var buttonClose = '<button onclick="google.script.host.close()">Close</button>';

    var text = "Open a spreadsheet with many usage examples and detailed instructions?";
    var html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><link rel="stylesheet" href="https://ssl.gstatic.com/docs/script/css/add-ons1.css" /><title>Usage examples</title></head>'
        + '<body style="text-align:center">'
        + text
        + '<br /><br />'
        + '<div class="block form-group" style="margin: 30px;"><div class="inline">'
        + buttonOpen
        + '</div><div class="inline">'
        + buttonClose
        + '</div></div>'
        + '</body></html>';


    var ui = HtmlService.createHtmlOutput(html).setWidth(450).setHeight(100);
    SpreadsheetApp.getUi().showModelessDialog(ui,"TimeCode-Magiks - Usage Examples");
}

function openVersionChangelogDialog() {
    var buttonClose = '<button onclick="google.script.host.close()">Close</button>';

    var html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><link rel="stylesheet" href="https://ssl.gstatic.com/docs/script/css/add-ons1.css" /><title>Version Change log</title>'
        + "<?!= HtmlService.createHtmlOutputFromFile('Stylesheet').getContent(); ?>"
        + '</head>'
        + '<body style="text-align:center">'
        + '<div class="block">'
        + '<textarea class="width-100 fixedFont" style="height: 15em" readonly>'
        + "<?!= HtmlService.createHtmlOutputFromFile('changelog.md').getContent(); ?>"
        + '</textarea>'
        + '</div>'
        + '<div class="inline ">'
        + buttonClose
        + '</div>'
        + '</body></html>';


    var ui = HtmlService.createTemplate(html).evaluate().setWidth(500).setHeight(230);
    SpreadsheetApp.getUi().showModelessDialog(ui,"TimeCode-Magiks - Version '" + TCM_VERSION + "' News");
}

/**
 * Append an aray to the active sheet.
 *
 * @param {Number} a_values An array opf values to be added.
 */
function appendArray(a_values) {
    var ss = SpreadsheetApp.getActiveSheet();

    a_values.forEach(function (row) {ss.appendRow(row);});
}


/**
 * Import an EDL into the active sheet
 *
 * @param {String} rawEDL The raw EDL as text to be imported.
 */
function appendEDL(rawEDL, frameRate, keepComments, ResolveMarkerEDL) {
    var ss = SpreadsheetApp.getActiveSheet();
    var edlAsArray;

    if (!ResolveMarkerEDL) {
        edlAsArray = EDLUtils_.rawEDLToArrays(rawEDL, frameRate, keepComments);
        if (ss.getLastRow() >= 3)
            ss.getRange("A3:H" + ss.getLastRow()).clear({contentsOnly: true});

        ss.getRange("A3:" + "H" + (edlAsArray.length + 2) ).setValues(edlAsArray);
        ss.getRange("K3").setFormula("=EDL_SUMMARY(A3:H)");
    } else {
        edlAsArray = EDLUtils_.rawResolveEDLMarkerToArrays(rawEDL, frameRate);
        if (ss.getLastRow() >= 3)
            ss.getRange("A3:F" + ss.getLastRow()).clear({contentsOnly: true});

        ss.getRange("A3:" + "F" + (edlAsArray.length + 2) ).setValues(edlAsArray);
    }
}

/**
 * Export an EDL from the active sheet
 *
 * @param {String} title The title of the EDL
 * @param {String} range The range to extract the EDL from.
 * @param {Number} frameRate The framerate of the EDL.
 */
function extractEDL(title, range, frameRate) {
    var ss = SpreadsheetApp.getActiveSheet();
    var edlBuilder = EDLUtils_.getEDLbuilder(title ? title : "No title given", frameRate);

    edlBuilder.importEvents(ss.getRange(range).getValues());

    // TODO:
    // - add default source name
    // - option to make record TC continuous

    var builtEDL = edlBuilder.build();

    return [builtEDL, edlBuilder.warnings, edlBuilder.EDLSummary];
}

/**
 * Get the active range (the current cell(s) selection) as 'A1' notation
 *
 */
function getActiveRangeAsA1Notation() {
  return SpreadsheetApp.getActiveSheet().getActiveRange().getA1Notation();
}

// vi:filetype=javascript
