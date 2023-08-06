# TabsTableWidget

## Introduction

This JavaScript code is designed to create and manage widgets that fetch data from a Google Sheet and display it in a tabbed layout or a table layout. The widgets are initialized when the document is loaded. Each widget is associated with a Google Sheet via a data attribute in its HTML element. The data from the Google Sheet is fetched and parsed into a format that can be used to populate the widget. The widgets can be of two types: 'ttmTabsWidget' and 'ttmTableWidget'.

The 'ttmTabsWidget' displays the data in a tabbed layout, with each tab corresponding to a unique value in the first column of the Google Sheet data. The rows of data displayed in each tab are filtered based on the value in the first column. The 'ttmTableWidget' displays the data in a table layout. If all the headers in the Google Sheet data are empty, the widget only draws the rows without a header element.

The layout of the data in the widgets can be customized using special tags in the headers and cells of the Google Sheet. These tags are enclosed in curly braces {}. The tags in headers apply to all the cells in the same column, while the tags in cells apply only to that given cell but override everything set by default or by tags in headers.

## Detailed Breakdown

The detailed breakdown of the code is as follows:

- **ttmCreateGSTWidget**: This is the main function that initializes a widget. It takes three parameters: the DOM element that will contain the widget, the index of the widget, and the type of the widget. The function first checks if the widget has already been initialized. If not, it sets an attribute to prevent the widget from being initialized multiple times. It then fetches the Google Sheet ID from a data attribute in the widget element and constructs the URL to fetch the Google Sheet data as CSV. Depending on the widget type, it initializes tabs or a table with the parsed data.

- **fetchGSheetData**: Fetches data from a Google Sheet. It takes the URL to the Google Sheet data as a parameter and returns a promise that resolves with the fetched data as a string.

- **parseCSV**: Parses CSV data into an array of objects. It takes the CSV data as a parameter and returns an array of objects representing the CSV data.

- **initializeTabs**: Initializes the tabs in the Tabs widget. It takes the parsed Google Sheet data as a parameter and returns a set of unique tab names. The assumption is that the first column of the Google Sheet is handled in a special manner as it contains information to generate tabs and filter the respective tab tables accordingly. The function takes the uniques of the first column as Tab Names and then filters the table rows by tab names.

- **initializeTable**: Initializes the table in the Table widget. It takes the parsed Google Sheet data as a parameter.

- **createTab**: Creates a tab element. It takes the name of the category for the tab and the index of the tab as parameters and returns a li element representing the tab.

- **switchTab**: Switches to a tab. It takes the DOM element representing the tab and the index of the tab as parameters.

- **createTableHTML**: Generates the HTML for a table. It takes an array of data and a boolean indicating whether the header should be rounded as parameters and returns the HTML string for the table. When are headers are empty, no HTML is generated for the Table headers.

- **getHeaders**: Maps the keys of a row to an array of header objects. It sets default values for the alignment and text color, and updates these values based on any alignment or color tags in the header. Also manages the {} tags in headers.

- **getRowHTML**: Generates the HTML for a row in a table. It starts with an opening `<tr>` tag, adding a class for alternate rows, and generates the HTML for each cell in the row. Also manages most {} tags in cells.

- **getCellHTML**: Generates the HTML for a cell in a table. It handles different cases based on the cell value and any tags in it. Also manages {B} tags in cells.

- **displayNoDataMessage**: Displays a message indicating that no data could be found. It sets the container's content to an error message.

- **DOM Event Listener**: When the document is loaded, all widgets of type 'ttmTabsWidget' and 'ttmTableWidget' are initialized. This is done by adding an event listener to the `DOMContentLoaded` event. The event listener function gets all elements with the class 'ttmTabsWidget' or 'ttmTableWidget', and for each element, it calls the `ttmCreateGSTWidget` function to create a widget.

## Dependencies

This project relies on the Tailwind CSS library. You can find the documentation for Tailwind CSS [here](https://tailwindcss.com/docs).

## Installation

### Webpage <head>
To install and use these widgets, you need to add the Tailwind CSS link, the style for the function, and the script enclosing the functions to the header of your webpage.
```html
<!-- Add this to your webpage's <head> -->
<link href="https://cdn.tailwindcss.com/2.2.19/tailwind.min.css" rel="stylesheet">
/* <style> content of ttmTabsWidgetStyles.css or ttmTabsWidgetStyles_minified.css */
<script> /* content of ttmTabsWidget.js or ttmTabsWidget_minified.js */ </script>
```
### Webpage <body>
The div containers for the table or tabs widgets need to be added to the body of the webpage, wherever they need to be displayed.

- **Install Tabs Widget**: Add this to your webpage to display a Tabs Widget. Replace "GOOGLE_SHEET_ID"by the published ID of your Google Sheet
```html
<!-- Add this to your webpage's <body> -->
/* ttmTabsWidgetDivTable_minified.html */
<div class="ttmTabsWidget container mx-auto" data-ttmGSID="GOOGLE_SHEET_ID"><div class="flex justify-center"><div class="w-full"><div class="bg-white shadow-sm rounded-sm my-6"><ul class="flex justify-around"></ul><div class="w-full widget-container"></div></div></div></div></div><script>if(typeof ttmCreateGSTWidget!=='function'){Array.from(document.getElementsByClassName('ttmTabsWidget')).forEach(el=>{el.innerHTML=`<div style="height:192px;background-color:#D3D3D3;color:#808080;display:flex;align-items:center;justify-content:center;flex-direction:column;"><p>EC Teams Tabs Widget from Google Sheets Data</p><br><p>No data available yet. Attach a Data Attribute to this object, named data-ttmGSID whose value is the published ID of the Google Sheet you want to access</p></div>`;});}</script>
```

- **Install Table Widget**: Add this to your webpage to display a Table Widget. Replace "YOUR_GOOGLE_SHEET_ID"by the published ID of your Google Sheet
```html
<!-- Add this to your webpage's <body> -->
/* ttmTabsWidgetDivTable_minified.html */
<div class="ttmTableWidget container mx-auto" data-ttmGSID="GOOGLE_SHEET_ID"><div class="flex justify-center"><div class="w-full"><div class="bg-white shadow-sm rounded-sm my-6"><div class="w-full widget-container"></div></div></div></div></div><script>if(typeof ttmCreateGSTWidget!=='function'){Array.from(document.getElementsByClassName('ttmTableWidget')).forEach(el=>{el.innerHTML=`<div style="height:192px;background-color:#D3D3D3;color:#808080;display:flex;align-items:center;justify-content:center;flex-direction:column;"><p>Camps Pricing Table Widget from Google Sheets Data</p><br><p>No data available yet. Attach a Data Attribute to this object, named data-ttmGSID whose value is the published ID of the Google Sheet you want to access</p></div>`;});}</script>
```

## Special Tags

The layout of the data in the widgets can be customized using special tags in the headers and cells of the Google Sheet. These tags are enclosed in curly braces {}. The tags in headers apply to all the cells in the same column, while the tags in cells apply only to that given cell but override everything set by default or by tags in headers.

### In Headers

The tags that can be used in headers are {C}, {L}, {R}, {r}, {g}, {b}, and {fN}, where N is a number. The {W} and {B} tags do not work in headers. The tags in headers apply to all the cells in the same column.

- **{C}, {L}, {R}**: These tags set the alignment of the text in the cells of the column. {C} sets the alignment to center, {L} sets the alignment to left, and {R} sets the alignment to right.

- **{r}, {g}, {b}**: These tags set the color of the text in the cells of the column. {r} sets the color to red, {g} sets the color to green, and {b} sets the color to blue.

- **{fN}**: This tag sets the font size of the text in the cells of the column. N is the size of the font.

### In Cells

The tags that can be used in cells are {C}, {L}, {R}, {r}, {g}, {b}, {W}, {B}, and {fN}, where N is a number.

- **{C}, {L}, {R}**: These tags set the alignment of the text in the cell. {C} sets the alignment to center, {L} sets the alignment to left, and {R} sets the alignment to right.

- **{r}, {g}, {b}**: These tags set the color of the text in the cell. {r} sets the color to red, {g} sets the color to green, and {b} sets the color to blue.

- **{W}**: This tag makes the cell span multiple columns. The cell will span as many columns as there are consecutive cells with no data.

- **{B}**: This tag turns the cell into a button. The text in the cell should be in the format "ButtonName>ButtonURL". The button will have the name "ButtonName" and will open the URL "ButtonURL" when clicked.

- **{fN}**: This tag sets the font size of the text in the cell. N is the size of the font.

The tags in cells apply only to that given cell but override everything set by default or by tags in headers.
