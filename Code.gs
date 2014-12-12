// Article
//
//   http://bitvectors.blogspot.com/2014/12/page1.html
//
// describes this application . . .

// The doGet() and runQuery() functions
// and the onOpen() trigger all see the
// spreadsheet, so declare these next
// variables globally.

// Use a PropertiesService object to store the
// relevant database / connection values. Store
// them here to make it easier to manage them
// across different situations. The spreadSheetURL
// value has the specific Google Docs Spreadsheet
// for this application.
//
// In the setProperty functions, replace the empty
// string values in the second parameter with the
// actual database, connection, and spreadsheet
// URL values . . .

var scriptProperties = PropertiesService.getScriptProperties();

scriptProperties.setProperty('db', '');
scriptProperties.setProperty('address', '');
scriptProperties.setProperty('user', '');
scriptProperties.setProperty('userPwd', '');
scriptProperties.setProperty('spreadSheetURL', '');

var localSpreadSheet = SpreadsheetApp.openByUrl(scriptProperties.getProperty('spreadSheetURL'));

function onOpen()
{  
  // Set up the header cells and spreadsheet
  // formatting when the spreadsheet loads.
  // This way, the Code.gs and CloudSQLDemoApp.html
  // files can build the spreadsheet themselves
  // with minimal developer / user involvement . . .

  // These lines set cell values, format the sheet, etc.
  // For cell range A2:F2 the background color #c9daf8
  // draws a light blue . . .

  localSpreadSheet.getRange("A1:E2").setFontFamily("TimesNewRoman");
  localSpreadSheet.getRange("A1:E2").setHorizontalAlignment("center");
  localSpreadSheet.getRange("A1").setValue("CLOUD SQL GOOGLE APPS SCRIPT RECURSION\nAPPLICATION TO UNPACK AN INTEGER\nINTO ITS BASE-10 MULTIPLE-OF-TWO COMPONENTS");
  localSpreadSheet.getRange("A1:F1").merge();
  localSpreadSheet.getRange("A1:F1").setFontWeight("bold");
  localSpreadSheet.getRange("A1:F1").setFontSize(24);
  localSpreadSheet.getRange("A2:F2").setBackground("#c9daf8");
  localSpreadSheet.getRange("A2:F2").merge();

  localSpreadSheet.setColumnWidth(1, 41);
  localSpreadSheet.setColumnWidth(2, 194);
  localSpreadSheet.setColumnWidth(3, 65);
  localSpreadSheet.setColumnWidth(4, 96);
  localSpreadSheet.setColumnWidth(5, 218);
  localSpreadSheet.setColumnWidth(6, 226);

  localSpreadSheet.getRange("B4").setValue("Raw Integer to Unpack Into\nBase-10 Multiples of Two:");
  localSpreadSheet.getRange("B6").setValue("Base-10 Multiple-of-Two\nComponents");
  localSpreadSheet.getRange("F6").setValue("Comma-Delimited List of the\nBase-10 Multiple of Two\nComponents");

  localSpreadSheet.getRange("B4:F6").setHorizontalAlignment("center");

  localSpreadSheet.getRange("B4:F6").setFontWeight("bold");
}

function clearSheet(){

  // The reset jQuery function in the HTML script section of
  //
  //     CloudSQLDemoApp.html
  //
  // will call this function. This function clears out the
  // data in the spreadsheet to mirror the web page
  // behavior. . .

  localSpreadSheet.getRange("C4").clear();
  localSpreadSheet.getRange("B8:F23").clear();
}

function doGet(){

  //  A request made to the script URL runs the doGet() function.
  //  This function loads the HTML file BigQueryDemoApp.html in
  //  the browser . . .

  return HtmlService.createTemplateFromFile("CloudSQLDemoApp.html").evaluate();
}

function returnFormParams(spinnerVal){

  // This function queries the MySQL database and calls other
  // functions to write the result set(s) on the spreadsheet
  // and the HTML page.
  //
  // First, use properties from the scriptProperties object
  // declared / set earlier to set up the database connection
  // so that this app can actually talk with the MySQL
  // database . . .

  var db = scriptProperties.getProperty('db');
  var address = scriptProperties.getProperty('address');
  var dbUrl = 'jdbc:mysql://' + address + '/' + db;

  var user = scriptProperties.getProperty('user');
  var userPwd = scriptProperties.getProperty('userPwd');

  // Set up the stored procedure calls . . .

  var conn = Jdbc.getConnection(dbUrl, user, userPwd);
  var stmt1 = conn.prepareCall("{call usp_return_tbl_of_values(?)}");
  var stmt2 = conn.prepareCall("{call usp_return_comma_dlm_string(?)}");

  //  Hardwire the second parameter - an input parameter - to the spinnerVal value for stmt1 . . .

  stmt1.setInt(1, spinnerVal);

  //  Hardwire the second parameter - an input parameter - to the spinnerVal value for stmt2 . . .

  stmt2.setInt(1, spinnerVal);

  // An executeQuery result set is forward-only and potentially expensive,
  // so try to call it once and then clean / restructure / etc. the result
  // set(s) if possible . . .

  var results1 = stmt1.executeQuery();
  var results2 = stmt2.executeQuery();

  // Arbitrarily hardwire the spreadsheet
  // target locations for the result
  // sets . . .

  var firstTargetRange = 'B8';
  var secondTargetRange = 'F8';

  // Call writeResults to write the result sets on the spreadsheet
  // and write HTML string equivalents of those result sets. These
  // HTML string equivalents will draw HTML result set equivalents
  // on the HTML form. The resultsArray[n] variables hold those
  // strings. Variable resultsArray1 holds a two-dimensional
  // result set and resultsArray2 holds a comma-delimited list
  // of the base-10 multiple-of-two integer components of the
  // spinnerVal integer . . .

  var resultsArray1 = writeResults(results1, firstTargetRange);
  var resultsArray2 = writeResults(results2, secondTargetRange);

  // Close the database connectivity variables ASAP . . .

  stmt1.close();
  stmt2.close();

  results1.close();
  results2.close();

  conn.close();

  // Write the integer number value
  // spinnerVal in cell C4 . . .

  localSpreadSheet.getRange("C4").setValue(spinnerVal);

  // Place the result set HTML strings first for the two-dimensional
  // result set and second for the comma-delimited component integer
  // string in an array, and return it from the function . . .

  var resultSetArray = Array(resultsArray1, resultsArray2);
  return resultSetArray;
}

function writeResults(results, topLeftCell) {

  // Write the result set on localSpreadSheet as a range, placing
  // the upper left cell of results at cell topLeftCell . . .

  var startLocation = localSpreadSheet.getRange(topLeftCell);
  var rangeCol = topLeftCell.substr(0, 1);
  var rangeRow = topLeftCell.substr(1, 1);

  var colVar = 0;
  var rowVar = 0;

  // See
  //
  //    https://developers.google.com/apps-script/reference/spreadsheet/range#offset(Integer,Integer,Integer,Integer)
  //
  // for more about the offset method. The "derived"
  // range clearRange starts at the upper left of
  // the topLeftCell parameter (essentially cell
  // topLeftCell itself because this cell is one
  // row / one column) and extends sixteen rows
  // and two columns because the results row set
  // will have at most this row / column count . . .

  var clearRange = startLocation.offset(0, 0, 16, 4);
  clearRange.clear();
  clearRange.setHorizontalAlignment("right");

  // From
  //
  //   https://www.google.com/webhp?sourceid=chrome-instant&rlz=1C1VFKB_enUS615US615&ion=1&espv=2&ie=UTF-8#q=JDBC+executequery+google+apps+script
  //
  // and
  //
  //   http://stackoverflow.com/questions/20509025/google-app-script-jdbc-connection-executequery-returns-only-one-result
  //
  // build a function to dynamically place a result set on a designated place on a sheet. In a two-column result
  // set, column 1 has label equivalents, like
  //
  //   SIXTH      (2 ^  6)
  //
  // and column 2 has the actual component integer values. Variable sumVals will sum the column 2 values for placement
  // in cell C4. This cell is arbitrarily chosen.

  // The resultsString will draw HTML rows on the
  // form, so start off with a <tr> tag . . .

  var resultsString = "<tr>";

  // Use results.next() in a while loop even for a one-row result set.
  // This is the only way Google Apps Script can see the actual result
  // set values.
  
  // Look at each row in results: the result set variable. Inside each
  // row, extract each (column) value and write it on the spreadsheet.
  // The startLocation.offset determines the exact cell location for
  // the value. The getStrng(colVar + 1) part extracts the relevant
  // value from the results result set row. Note that here, result set
  // columns start at 1, not zero. This means add 1 to colVar to
  // compensate. . .

  // The results record set is forward-only, so we have no way to see the exact
  // number of rows it has. Therefore, parse it with a while-loop . . .

  while (results.next()) {
    for (colVar = 0; colVar < results.getMetaData().getColumnCount(); colVar++) {
      startLocation.offset(rowVar, colVar).setValue(results.getString(colVar + 1));
      resultsString += '<td>' + results.getString(colVar + 1) + '</td>';
    }

    // Increment rowVar . . .

    rowVar++;

    // Add close row / start row tags to resultsString to start
    // a new row. This will work for all rows but with this, the
    // last row will have an unmatched <tr> tag. Manually delete
    // this tag later on . . 

    resultsString += '</tr><tr>';
  }

  // The while loop adds '</tr><tr>' to resultsString. This will leave an extra '<tr>'
  // at the end of resultsString when the loop finishes, so trim that last <tr> tag
  // from resultsString . . .

  return resultsString.slice(0, -4);
}
