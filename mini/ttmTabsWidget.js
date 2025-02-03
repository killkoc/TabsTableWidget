/**
 * Initialize a Google Sheet-based widget.
 * 
 * @param {Element} widgetElement - The HTML element to host the widget.
 * @param {number} widgetIndex - The unique index of this widget instance.
 * @param {string} widgetType - The type of widget to create ('ttmTabsWidget' or 'ttmTableWidget').
 */
async function ttmCreateGSTWidget(widgetElement, widgetIndex, widgetType) {
    // Prevent reinitialization of a widget
    if (widgetElement.hasAttribute('ttmWidgetInit')) return;
    
    // Mark this widget as initialized
    widgetElement.setAttribute('ttmWidgetInit', '');
    
    // Generate a unique ID for this widget instance and assign it to the widgetElement
    const widgetId = `${widgetType}-${widgetIndex}`;
    widgetElement.id = widgetId;
    
    // Retrieve the Google Sheet ID from the widgetElement's data attributes
    const GSheetID = widgetElement.getAttribute('data-ttmGSID');
    if (!GSheetID) {
        // Display a message when there's no data to be loaded
        displayNoDataMessage(widgetElement);
        return;
    }

    // Start a timer to measure how long the widget creation takes
    console.time(widgetId);

    // Generate the URL to access the Google Sheet in CSV format
    const GSheetURL = GSheetID.startsWith('2PAC')
        ? `https://docs.google.com/spreadsheets/d/e/${GSheetID}/pub?output=csv`
        : `https://docs.google.com/spreadsheets/d/${GSheetID}/pub?output=csv`;
    try {
        // Fetch the Google Sheet data and parse the CSV
        const GSheetData = await fetchGSheetData(GSheetURL);
        const parsedCSVData = await parseCSV(GSheetData, widgetId);
        
        // Clear the widget element to prepare for the new content
        widgetElement.innerHTML = '';
        
        // Create the widget, either as a set of tabs or as a table, depending on `widgetType`
        if (widgetType === 'ttmTabsWidget') {
            initializeTabs(widgetElement, widgetId, parsedCSVData);
        } else {
            initializeTable(widgetElement, widgetId, parsedCSVData);
        }
    } catch (error) {
        // Log and display errors that occur while fetching or processing the Google Sheet data
        console.error('Error fetching Google Sheet data:', error);
        displayNoDataMessage(widgetElement);
    }


    /**
     * Fetch the contents of a Google Sheet as a CSV-formatted string.
     * 
     * @param {string} GSheetURL - The URL to fetch the Google Sheet data from.
     * @returns {Promise<string>} - A promise that resolves with the fetched CSV data.
     * @throws Will throw an error if the fetch operation fails.
     */
    async function fetchGSheetData(GSheetURL) {
        // Send a network request to fetch the data from the Google Sheet
        const response = await fetch(GSheetURL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse and return the response text
        return await response.text();
    }


    /**
     * Parse a CSV-formatted string into an array of objects.
     * 
     * @param {string} data - The CSV data to parse.
     * @param {string} widgetId - The ID of the widget, used for debugging.
     * @returns {Array<Object>} - The parsed CSV data.
     */
    function parseCSV(data, widgetId) {
        // End the timer and log the time taken for performance debugging
        console.timeEnd(widgetId);
        
        // Normalize newlines and split the CSV data into lines
        data = data.replace(/\r\n/g, '\n');
        const [headerLine, ...rows] = data.split('\n');
        
        // Create unique header names by appending the column index
        const originalHeaders = headerLine.split(',');
        const uniqueHeaders = originalHeaders.map((header, index) => `${header}_${index}`);
        
        // Map each row of the CSV data to an object using the unique header names as keys
        return rows.map(row => {
            const cells = row.split(',');
            return Object.fromEntries(uniqueHeaders.map((header, index) => [header, cells[index] || '']));
        });
    }


    /**
     * Initialize a tabbed widget with data from a Google Sheet.
     * 
     * @param {Element} widgetElement - The HTML element to host the widget.
     * @param {string} widgetId - The ID of the widget.
     * @param {Array<Object>} GSheetData - The parsed data from the Google Sheet.
     */
    function initializeTabs(widgetElement, widgetId, GSheetData) {
        // Add child structure in preparation for tabs
        const structure = document.createElement('div');
        structure.className = "ttmTW-flex ttmTW-justify-center";
        structure.innerHTML = '<div class="ttmTW-w-full"><div class="ttmTW-bg-transparent ttmTW-shadow-sm ttmTW-my-6"><ul class="ttmTW-flex ttmTW-justify-around"></ul><div class="ttmTW-w-full widget-container"></div></div></div>';
        widgetElement.appendChild(structure);

        // Find the tab bar element and determine the category name for tabs
        const tabBar = widgetElement.querySelector('ul');
        const categoryName = Object.keys(GSheetData[0])[0];

        // Create a map to store rows of data by category
        const tabDataMap = {};
        GSheetData.forEach(row => {
            const category = row[categoryName];
            if (!tabDataMap[category]) {
                tabDataMap[category] = [];
            }
            const { [categoryName]: _, ...rest } = row;
            tabDataMap[category].push(rest);
        });

        // Create and append tabs for each unique category
        const uniqueTabs = Object.keys(tabDataMap);
        const tabFragment = document.createDocumentFragment();
        uniqueTabs.forEach((tab, index) => {
            tabFragment.appendChild(createTab(widgetElement, widgetId, tab, index));
        });
        tabBar.appendChild(tabFragment);

        // Add a click event listener to handle tab switching
        tabBar.addEventListener('click', (event) => {
            const target = event.target;
            const tabElements = Array.from(tabBar.children);
            const clickedTab = target.closest('.ttmTab-element');
            if (clickedTab) {
                const tabIndex = tabElements.indexOf(clickedTab);
                switchTab(widgetElement, widgetId, tabIndex, tabDataMap);
            }
        });

        // Automatically switch to the first tab, if it exists
        if (tabBar.firstChild) {
            switchTab(widgetElement, widgetId, 0, tabDataMap);
        }
    }


    /**
     * Create a new tab element for the tabbed widget.
     * 
     * @param {Element} widgetElement - The HTML element to host the widget.
     * @param {string} widgetId - The ID of the widget.
     * @param {string} category - The name of the tab.
     * @param {number} index - The index of the tab.
     * @returns {Element} - The created tab element.
     */
    function createTab(widgetElement, widgetId, category, index) {
        const tabElement = document.createElement('li');
        tabElement.className = 'ttmTW-flex-auto ttmTW-ml-0 last:ttmTW-mr-0 ttmTW-text-center ttmTW-bg-gray-400 ttmTW-text-white ttmTW-rounded-t-xl ttmTab-element';
        tabElement.innerHTML = `<div class="ttmTW-text-xs ttmTW-font-semibold ttmTW-uppercase ttmTW-px-3 ttmTW-py-3 ttmTW-block ttmTW-leading-normal">${category}</div>`;
        return tabElement;
    }
    function createTab(widgetElement, widgetId, category, index) {
        const tabElement = document.createElement('li');
        tabElement.className = 'ttmTW-flex-auto ttmTW-ml-0 last:ttmTW-mr-0 ttmTW-bg-gray-400 ttmTW-text-white ttmTW-rounded-t-xl ttmTab-element';
        tabElement.innerHTML = `<div class="ttmTW-flex ttmTW-justify-center ttmTW-items-center ttmTW-text-xs ttmTW-font-semibold ttmTW-uppercase ttmTW-px-3 ttmTW-py-3 ttmTW-block ttmTW-leading-normal">${category}</div>`;
        return tabElement;
    }
    /**
     * Switch to a specific tab in the tabbed widget.
     * 
     * @param {Element} widgetElement - The HTML element hosting the widget.
     * @param {string} widgetId - The ID of the widget.
     * @param {number} tabIndex - The index of the tab to switch to.
     * @param {Object} tabDataMap - The map of tab data, keyed by tab name.
     */
    function switchTab(widgetElement, widgetId, tabIndex, tabDataMap) {
        const tabElements = widgetElement.querySelectorAll('ul li');
        const tabContentsContainer = widgetElement.querySelector('.widget-container');
        const tabNames = Object.keys(tabDataMap);
        const existingTableContent = tabContentsContainer.querySelector(`[data-tab-name="${tabNames[tabIndex]}"]`);
        
        // Hide all existing tab contents
        const allTableContents = tabContentsContainer.querySelectorAll('.table-content');
        allTableContents.forEach(content => content.style.display = 'none');
        
        // Update classes for all tabs
        tabElements.forEach(tab => {
            tab.classList.remove('ttmTW-bg-blue-500');  // Remove the blue background
            tab.classList.add('ttmTW-bg-gray-400');     // Ensure the gray background is applied
        });
        
        // Set the clicked tab to active
        const activeTab = tabElements[tabIndex];
        activeTab.classList.remove('ttmTW-bg-gray-400');  // Remove the gray background
        activeTab.classList.add('ttmTW-bg-blue-500');     // Add the blue background
        
        // Check if content for clicked tab is already loaded
        if (existingTableContent) {
            // If it's already loaded, just display it
            existingTableContent.style.display = 'block';
        } else {
            // If not, load the content for that tab
            const tabData = tabDataMap[tabNames[tabIndex]];
            const contentFragment = loadTabData(tabNames[tabIndex], tabIndex, tabData);
            
            // Append the newly created contentFragment to the tabContentsContainer
            tabContentsContainer.appendChild(contentFragment);
        }
    }

    /**
     * Load data for a specific tab.
     * 
     * @param {string} tab - The name of the tab.
     * @param {number} index - The index of the tab.
     * @param {Array<Object>} filteredData - The data for this tab.
     * @returns {DocumentFragment} - A fragment containing the loaded tab data.
     */
    function loadTabData(tab, index, filteredData) {
        // Step 1: Create a table element from the filtered data
        const tableElement = createTableElement(filteredData);

        // Step 2: Create a new DocumentFragment to hold the content for this tab
        const contentFragment = document.createDocumentFragment();

        // Step 3: Create a 'div' element to serve as the container for the table
        const tableContainer = document.createElement('div');
        tableContainer.style.display = 'block';
        tableContainer.classList.add('table-content');

        // Use the tab name as a data attribute for easy identification of the table
        tableContainer.dataset.tabName = tab;

        // Step 4: Create a 'div' element to directly hold the table
        const divTableElement = document.createElement('div');
        divTableElement.className = "ttmTW-relative ttmTW-overflow-x-auto ttmTW-shadow-sm";

        // Step 5: Append the table element to divTableElement
        divTableElement.appendChild(tableElement);

        // Step 6: Append divTableElement to tableContainer
        tableContainer.appendChild(divTableElement);

        // Step 7: Append tableContainer to the DocumentFragment
        contentFragment.appendChild(tableContainer);

        // Step 8: Return the DocumentFragment, now containing the tab's content
        return contentFragment;
    }


    /**
     * Initialize a table widget with data from a Google Sheet.
     * 
     * @param {Element} widgetElement - The HTML element to host the widget.
     * @param {string} widgetId - The ID of the widget.
     * @param {Array<Object>} GSheetData - The parsed data from the Google Sheet.
     */
    function initializeTable(widgetElement, widgetId, GSheetData) {
        // Add child structure in preparation for table
        const structure = document.createElement('div');
        structure.className = "ttmTW-flex ttmTW-justify-center";
        structure.innerHTML = '<div class="ttmTW-w-full"><div class="ttmTW-bg-transparent ttmTW-shadow-sm ttmTW-rounded-sm ttmTW-my-6"><div class="ttmTW-w-full widget-container"></div></div></div>';
        widgetElement.appendChild(structure);

        // Find the table container and create the table element
        const tableContainer = widgetElement.querySelector('.widget-container');
        const tableElement = createTableElement(GSheetData);
        const divTableElement = document.createElement('div');
        divTableElement.className = "ttmTW-relative ttmTW-overflow-x-auto ttmTW-shadow-sm sm:ttmTW-rounded-lg";
        divTableElement.appendChild(tableElement);
        tableContainer.appendChild(divTableElement);
        tableContainer.classList.add('table-content');
    }


    /**
     * Create an HTML table element from an array of data objects.
     * 
     * @param {Array<Object>} dataArray - The data to create the table from.
     * @returns {Element} - The created table element.
     */
    function createTableElement(dataArray) {
        // Get the headers for the table
        const headers = getHeaders(dataArray[0]);

        const table = document.createElement('table'); // Create a new table element
        table.className = "ttmTable-content ttmTW-w-full ttmTW-text-xs ttmTW-text-left ttmTW-text-gray-500 dark:ttmTW-text-gray-400"; // Set the CSS class for the table
        
        const allHeadersEmpty = headers.every(({ header }) => !header.trim()); // Check if all header names are empty strings
        if (!allHeadersEmpty) { // If not all headers are empty, create and append header row
            const thead = document.createElement('thead'); // Create a new table header element
            thead.className = "ttmTW-text-xs ttmTW-text-gray-700 ttmTW-uppercase ttmTW-bg-gray-50 dark:ttmTW-bg-gray-700 dark:ttmTW-text-gray-400"; // Set the CSS class for the table header
            const tr = document.createElement('tr'); // Create a new table row element for the header
            headers.forEach(({ header, alignment, textColor, fontSize}) => {
                const th = document.createElement('th'); // Create a new table header cell element

                th.className = `ttmTW-px-2 ttmTW-py-3 ttmTW-border-b-2 ttmTW-border-gray-200 ttmTW-bg-blue-500 ${alignment} ttmTW-font-medium ${textColor} ttmTW-uppercase ttmTW-align-middle`; // Set the CSS class for the header cell
                th.innerHTML = fontSize ? `<span style="font-size:${fontSize}px">${header}</span>` : header; // Set the content of the header cell, potentially with a specific font size
                tr.appendChild(th); // Append the header cell to the header row
            });
            thead.appendChild(tr); // Append the header row to the table header
            table.appendChild(thead); // Append the table header to the table
        }
        
        const tbody = document.createElement('tbody'); // Create a new table body element
        dataArray.forEach((row, index) => {
            const rowElement = getRowElement(row, headers, index); // Create a row element from the data object
            tbody.appendChild(rowElement); // Append the row element to the table body
        });
        table.appendChild(tbody); // Append the table body to the table
        
        return table; // Return the fully constructed table element
    }


    /**
     * Extract the headers from a data row object, and apply formatting options based on special codes in the header names.
     * 
     * @param {Object} row - A data row object.
     * @returns {Array<Object>} - An array of header objects.
     */
    function getHeaders(row) {
        // Map the keys of the input row object to an array of header objects
        let headers = Object.keys(row).map(originalHeader => {
            let alignment = 'ttmTW-text-center'; // Initialize alignment to 'text-center'
            let header = originalHeader;   // Initialize header with the name of the property in the row object
            let textColor = 'ttmTW-text-white';  // Initialize text color to 'text-white'
            let fontSize = '';             // Initialize font size to an empty string
            
            // Check for alignment codes in the header and set the alignment accordingly
            if (header.includes('{C}')) {
                alignment = 'ttmTW-text-center';
                header = header.replace('{C}', ''); // Remove the alignment code from the header
            } else if (header.includes('{L}')) {
                alignment = 'ttmTW-text-left';
                header = header.replace('{L}', ''); // Remove the alignment code from the header
            } else if (header.includes('{R}')) {
                alignment = 'ttmTW-text-right';
                header = header.replace('{R}', ''); // Remove the alignment code from the header
            }
            
            // Check for color codes in the header and set the text color accordingly
            if (header.includes('{r}')) {
                textColor = 'ttmTW-text-red-500';
                header = header.replace('{r}', ''); // Remove the color code from the header
            } else if (header.includes('{g}')) {
                textColor = 'ttmTW-text-green-500';
                header = header.replace('{g}', ''); // Remove the color code from the header
            } else if (header.includes('{b}')) {
                textColor = 'ttmTW-text-blue-500';
                header = header.replace('{b}', ''); // Remove the color code from the header
            }
            
            // Check for font size codes in the header and set the font size accordingly
            const fontSizeMatch = header.match(/{f(\d+)}/);
            if (fontSizeMatch) {
                fontSize = fontSizeMatch[1];                    // Set the font size to the matched value
                header = header.replace(fontSizeMatch[0], '');  // Remove the font size code from the header
            }
            
            header = header.split('_')[0]; // Split the header at underscore and take the first part
            
            return { header, alignment, originalHeader, textColor, fontSize }; // Return the header object
        });
        
        return headers; // Return the array of header objects
    }


    /**
     * Create an HTML row element from a data row object.
     * 
     * @param {Object} row - A data row object.
     * @param {Array<Object>} headers - An array of header objects.
     * @param {number} index - The index of the row.
     * @returns {Element} - The created row element.
     */
    function getRowElement(row, headers, index) {
        const tr = document.createElement('tr'); // Create a new table row element
        
        tr.className = index % 2 === 0 ? '' : 'ttmTW-bg-white ttmTW-border-b dark:ttmTW-bg-gray-800 dark:ttmTW-border-gray-700 ttmTW-hover:ttmTW-bg-gray-50 dark:ttmTW-hover:ttmTW-bg-gray-600'; // Apply alternating row styles based on the index of the row
        
        let skipCells = 0; // Initialize skipCells to determine if the current cell should be skipped due to colspan
        
        headers.forEach(({ originalHeader, alignment, textColor, fontSize }) => { // Iterate through each header
            if (skipCells > 0) { // Check if cells should be skipped due to colspan
                skipCells--; // Decrease skipCells by 1
                return; // Skip the current iteration
            }

            let cellValue = row[originalHeader]; // Get the value of the cell from the row data
            let cellAlignment = alignment; // Set cell text alignment
            let cellTextColor = textColor === 'ttmTW-text-white' ? 'ttmTW-text-black' : textColor; // Set cell text color
            let cellColSpan = 1; // Initialize cellColSpan to 1
            let cellFontCss = fontSize ? `font-size:${fontSize}px` : ''; // Set cell font size if specified
            
            if (cellValue && cellValue.includes('{C}')) { // Check for center alignment in cell value
                cellAlignment = 'ttmTW-text-center';
                cellValue = cellValue.replace('{C}', ''); // Remove alignment tag from cell value
            } else if (cellValue && cellValue.includes('{L}')) { // Check for left alignment in cell value
                cellAlignment = 'ttmTW-text-left';
                cellValue = cellValue.replace('{L}', ''); // Remove alignment tag from cell value
            } else if (cellValue && cellValue.includes('{R}')) { // Check for right alignment in cell value
                cellAlignment = 'ttmTW-text-right';
                cellValue = cellValue.replace('{R}', ''); // Remove alignment tag from cell value
            }
            
            if (cellValue && cellValue.includes('{r}')) { // Check for red text in cell value
                cellTextColor = 'ttmTW-text-red-500';
                cellValue = cellValue.replace('{r}', ''); // Remove color tag from cell value
            }
            if (cellValue && cellValue.includes('{g}')) { // Check for green text in cell value
                cellTextColor = 'ttmTW-text-green-500';
                cellValue = cellValue.replace('{g}', ''); // Remove color tag from cell value
            }
            if (cellValue && cellValue.includes('{b}')) { // Check for blue text in cell value
                cellTextColor = 'ttmTW-text-blue-500';
                cellValue = cellValue.replace('{b}', ''); // Remove color tag from cell value
            }
            
            if (cellValue && cellValue.includes('{W}')) { // Check for colspan in cell value
                cellValue = cellValue.replace('{W}', ''); // Remove colspan tag from cell value
                let nextHeaderIndex = headers.findIndex(({ originalHeader: oh }) => oh === originalHeader) + 1; // Find the next header index
                while (nextHeaderIndex < headers.length && (!row[headers[nextHeaderIndex].originalHeader] || row[headers[nextHeaderIndex].originalHeader] === '')) { // Check for empty adjacent cells
                    cellColSpan++; // Increase colspan
                    skipCells++; // Increase skipCells
                    nextHeaderIndex++; // Move to the next header index
                }
            }
            
            const fontSizeMatch = cellValue.match(/{f(\d+)}/);
            if (fontSizeMatch) { // Check for font size in cell value
                cellFontCss = `font-size:${fontSizeMatch[1]}px`; // Set the font size for the cell
                cellValue = cellValue.replace(fontSizeMatch[0], ''); // Remove font size tag from cell value
            }
            
            const td = getCellElement(cellColSpan, cellValue, cellTextColor, cellAlignment, cellFontCss); // Create the cell element with the extracted and computed properties
            
            tr.appendChild(td); // Append the cell to the row
        });

        return tr; // Return the fully constructed row element
    }


    /**
     * Create an HTML cell element for a table row.
     * 
     * @param {number} cellColSpan - The colspan attribute for the cell.
     * @param {string} cellValue - The text content of the cell.
     * @param {string} cellTextColor - The text color for the cell.
     * @param {string} cellAlignment - The text alignment for the cell.
     * @param {string} fontCss - The font css/size for the cell.
     * @returns {Element} - The created cell element.
     */
    function getCellElement(cellColSpan, cellValue, cellTextColor, cellAlignment, fontCss) {
        const td = document.createElement('td'); // Create a new table cell element
        
        // td.style.width = columnWidth; // Set the width attribute for the cell
        td.colSpan = cellColSpan; // Set the colspan attribute for the cell
        
        td.className = `ttmTW-px-2 ttmTW-py-2 ttmTW-border-b ttmTW-border-gray-200 ttmTW-bg-white ttmTW-font-normal ${cellTextColor} ${cellAlignment} ttmTW-align-middle`; // Set the CSS class for the cell, based on computed color and alignment
        
        if (fontCss) { // Check if a specific font size is specified
            td.style.cssText += `; ${fontCss}`; // Apply the computed font size
        }
        
        if (cellValue.includes('{B}')) { // Check if cell content should be rendered as a button
            let [buttonName, buttonURL] = cellValue.replace('{B}', '').split('>'); // Extract button name and URL
            if (!buttonURL.startsWith('http://') && !buttonURL.startsWith('https://')) { // Validate URL protocol
                buttonURL = `https://${buttonURL}`; // Add https protocol if missing
            }
            const button = document.createElement('button'); // Create a new button element
            
            button.className = 'ttmTW-bg-blue-500 ttmTW-hover:bg-blue-700 ttmTW-text-white ttmTW-font-medium ttmTW-py-1 ttmTW-px-2 ttmTW-rounded'; // Set the CSS class for the button
            
            button.onclick = () => window.open(buttonURL, '_blank'); // Set the click event handler for the button
            
            button.innerHTML = buttonName; // Set the text content of the button
            
            td.appendChild(button); // Append the button to the cell
        } else {
            td.innerHTML = cellValue; // Set the text content of the cell
        }
        
        return td; // Return the fully constructed cell element
    }


    /**
     * Display a message indicating that no data is available for the widget.
     * 
     * @param {Element} widgetElement - The HTML element that was supposed to host the widget.
     */
    function displayNoDataMessage(widgetElement) {
        // Set the inner HTML of the widget element to show a 'No data available' message
        widgetElement.innerHTML = '<div class="ttmTW-flex ttmTW-justify-center ttmTW-items-center ttmTW-h-full ttmTW-text-gray-500 ttmTW-text-lg">No data available</div>';
    }
}


function ttmInitializeWidgets() {
    // Initialize 'ttmTabsWidget' elements
    Array.from(document.getElementsByClassName('ttmTabsWidget')).forEach((element, index) => {
        ttmCreateGSTWidget(element, index, 'ttmTabsWidget');
    });
    
    // Initialize 'ttmTableWidget' elements
    Array.from(document.getElementsByClassName('ttmTableWidget')).forEach((element, index) => {
        ttmCreateGSTWidget(element, index, 'ttmTableWidget');
    });
}


if (document.readyState === 'loading') {
    // If the document is still loading, listen for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', ttmInitializeWidgets);
} else {
    // If DOMContentLoaded has already fired, run the function immediately
    ttmInitializeWidgets();
}
