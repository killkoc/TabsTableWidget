/**
 * This function creates a widget that fetches data from a Google Sheet and displays it in a tabbed layout.
 * 
 * @param {HTMLElement} widgetElement The DOM element that will contain the widget.
 * @param {number} widgetIndex The index of the widget, used to generate a unique ID for the widget.
 * @param {string} widgetType The type of the widget, used to generate a unique ID for the widget.
 */
function ttmCreateGSTWidget(widgetElement, widgetIndex, widgetType) {
    // If the widget element already has the attribute 'ttmWidgetInit', we don't need to initialize it again.
    if (widgetElement.hasAttribute('ttmWidgetInit')) return;

    // We set the 'ttmWidgetInit' attribute to prevent the widget from being initialized multiple times.
    widgetElement.setAttribute('ttmWidgetInit', '');

    // We create a unique ID for the widget using the widgetType and widgetIndex parameters.
    const widgetId = `${widgetType}-${widgetIndex}`;
    widgetElement.id = widgetId;
    
    // Store references to the DOM elements that will be used multiple times.
    const ttmTabBar = document.querySelector(`#${widgetId} ul`);
    const ttmTabContentsContainer = document.querySelector(`#${widgetId} .widget-container`);

    // We get the Google Sheet ID from a data attribute in the element of the widget.
    const GSheetID = widgetElement.getAttribute('data-ttmGSID');

    // If the data attribute is not set or is empty, we display a message indicating that no data could be found.
    if (!GSheetID) {
        displayNoDataMessage();
        return;
    }

    // We construct the URL to fetch the Google Sheet data as CSV.
    const GSheetURL = `https://docs.google.com/spreadsheets/d/e/${GSheetID}/pub?output=csv`;

    // We fetch the Google Sheet data, parse it, and depending on the widgetType parameter, we initialize tabs or a table with the data.
    fetchGSheetData(GSheetURL)
        .then(data => {
            const GSheetData = parseCSV(data);
            widgetType === 'ttmTabsWidget' ? initializeTabs(GSheetData) : initializeTable(GSheetData);
        })
        .catch(error => {
            console.error('Error fetching Google Sheet data:', error);
            displayNoDataMessage();
        });

    /**
     * Fetches data from a Google Sheet.
     * 
     * @param {string} GSheetURL The URL to the Google Sheet data.
     * @returns {Promise<string>} A promise that resolves with the fetched data as a string.
     */
    async function fetchGSheetData(GSheetURL) {
        const response = await fetch(GSheetURL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    }

    /**
     * Parses CSV data into an array of objects.
     * 
     * @param {string} data The CSV data.
     * @returns {Object[]} An array of objects representing the CSV data.
     */
    function parseCSV(data) {
        // Replace all occurrences of the carriage return and newline sequence with a newline.
        data = data.replace(/\r\n/g, '\n');
        // Split the data into lines.
        const [headerLine, ...rows] = data.split('\n');
        // Split the header line into individual headers.
        const originalHeaders = headerLine.split(',');
        // Create unique headers by appending an index to each original header.
        const uniqueHeaders = originalHeaders.map((header, index) => `${header}_${index}`);
        // Map each row to an object with properties corresponding to the unique headers.
        return rows.map(row => {
            const cells = row.split(',');
            return Object.fromEntries(uniqueHeaders.map((header, index) => [header, cells[index] || '']));
        });
    }

    /**
     * Initializes the tabs in the widget.
     * 
     * @param {Object[]} GSheetData The parsed Google Sheet data.
     * @returns {Set<string>} A set of unique tab names.
     */
    function initializeTabs(GSheetData) {
        // Create document fragments to hold the new tabs and their contents.
        const tabBarFragment = document.createDocumentFragment();
        const tabContentsContainerFragment = document.createDocumentFragment();
        // Create a set to keep track of the unique tabs.
        const uniqueTabs = new Set();
        let tabIndex = 0;
        // Get the category name from the first key of the first row of data.
        const categoryName = Object.keys(GSheetData[0])[0];
        // For each row of data, create a tab for its category (if not already created).
        GSheetData.forEach(row => {
            const category = row[categoryName];
            if (!uniqueTabs.has(category)) {
                uniqueTabs.add(category);
                tabBarFragment.appendChild(createTab(category, tabIndex));
                tabIndex++;
            }
        });
        // For each unique tab, create a content section with the corresponding data.
        Array.from(uniqueTabs).forEach((tab, index) => {
            tabContentsContainerFragment.appendChild(loadTabData(tab, index, GSheetData, categoryName));
        });
        // Add the new tabs and their contents to the DOM.
        ttmTabBar.appendChild(tabBarFragment);
        ttmTabContentsContainer.appendChild(tabContentsContainerFragment);
        // Automatically select the first tab.
        ttmTabBar.firstElementChild.click();

        // Add event listener to the tab bar.
        ttmTabBar.addEventListener('click', (event) => {
            // Check if the event target is a tab.
            if (event.target && event.target.matches('.ttmTab-element')) {
                // Get the index of the tab.
                const tabIndex = Array.from(ttmTabBar.children).indexOf(event.target);
                // Switch to the tab.
                switchTab(event.target, tabIndex);
            }
        });

        return uniqueTabs;
    }

    /**
     * Loads the data for a tab.
     * 
     * @param {string} tab The name of the tab.
     * @param {number} index The index of the tab.
     * @param {Object[]} GSheetData The parsed Google Sheet data.
     * @param {string} categoryName The name of the category for the tab.
     * @returns {HTMLElement} A div element containing the data for the tab.
     */
    function loadTabData(tab, index, GSheetData, categoryName) {
        // Filter the data for the current tab and remove the category column.
        const filteredData = GSheetData.filter(row => row[categoryName] === tab).map(row => {
            const { [categoryName]: _, ...rest } = row;
            return rest;
        });
        // Create HTML for the table.
        const tableHTML = createTableHTML(filteredData, false);
        // Create a container for the table and add the table to it.
        const tableContainer = document.createElement('div');
        tableContainer.innerHTML = tableHTML;
        // Show the container if this is the first tab, otherwise hide it.
        tableContainer.style.display = index === 0 ? 'block' : 'none';
        // Add a class to the container to make it easier to select later.
        tableContainer.classList.add('tab-content');
        return tableContainer;
    }

    /**
     * Initializes the table in the widget.
     * 
     * @param {Object[]} GSheetData The parsed Google Sheet data.
     */
    function initializeTable(GSheetData) {
        // Query the DOM for the table container.
        const tableContainer = document.querySelector(`#${widgetId} .widget-container`);
        // Create HTML for the table and add it to the container.
        const tableHTML = createTableHTML(GSheetData, true);
        tableContainer.innerHTML = tableHTML;
        // Add a class to the container to make it easier to select later.
        tableContainer.classList.add('table-content');
    }

    /**
     * Creates a tab element.
     * 
     * @param {string} category The name of the category for the tab.
     * @param {number} index The index of the tab.
     * @returns {HTMLElement} A li element representing the tab.
     */
    function createTab(category, index) {
        const tabElement = document.createElement('li');
        tabElement.className = 'flex-auto ml-0 last:mr-0 text-center bg-gray-400 text-white rounded-t-xl ttmTab-element';
        tabElement.innerHTML = `<div class="text-xs font-bold uppercase px-5 py-3 block leading-normal">${category}</div>`;
        tabElement.addEventListener('click', () => switchTab(index));
        return tabElement;
    }

    /**
     * Switches to a tab.
     * 
     * @param {HTMLElement} tabElement The DOM element representing the tab.
     * @param {number} tabIndex The index of the tab.
     */
    function switchTab(tabIndex) {
        // Query the DOM for all tabs and their contents.
        const tabElements = document.querySelectorAll(`#${widgetId} ul li`);
        const tabContents = document.querySelectorAll(`#${widgetId} .widget-container .tab-content, #${widgetId} .widget-container .table-content`);
        // Deselect all tabs and hide their contents.
        Array.from(tabElements).forEach((element, i) => {
            element.classList.remove('bg-blue-500');
            tabContents[i].style.display = 'none';
        });
        // Select the clicked tab and show its content.
        tabElements[tabIndex].classList.add('bg-blue-500');
        tabContents[tabIndex].style.display = 'block';
    }

    /**
     * Creates the HTML for a table.
     * 
     * @param {Object[]} dataArray The data for the table.
     * @param {boolean} roundedHeader Whether the table should have rounded headers.
     * @returns {string} The HTML for the table.
     */
    function createTableHTML(dataArray, roundedHeader = true) {
        // Get the headers for the table
        const headers = getHeaders(dataArray[0]);

        // Calculate the width of each column
        const totalColumns = headers.length;
        const columnWidth = `${Math.floor(100 / totalColumns)}%`;

        // Check if all headers are empty
        const allHeadersEmpty = headers.every(({ header }) => !header.trim());

        // Generate the HTML for each header cell
        const headerCells = headers.map(({ header, alignment, textColor, fontSize }) => {
            let headerHTML = header;
            if (fontSize) {
                headerHTML = `<span style="font-size:${fontSize}px">${header}</span>`;
            }
            return `<th scope="col" style="width: ${columnWidth}" class="px-5 py-5 border-b-2 border-gray-200 bg-blue-500 ${alignment} font-semibold ${textColor} uppercase align-middle">${headerHTML}</th>`;
        }).join('');

        // Generate the HTML for each row in the table
        const rows = dataArray.map((row, index) => getRowHTML(row, headers, columnWidth, index)).join('');

        // Construct the HTML string
        let tableHTML = `
            <div class="relative overflow-x-auto shadow-sm ${roundedHeader ? 'sm:rounded-lg' : ''}">
                <table class="ttmTable-content w-full text-xs text-left text-gray-500 dark:text-gray-400">
                    ${allHeadersEmpty ? `<tr><td colspan="${totalColumns}" style="border-bottom: 1px solid #ccc;"></td></tr>` : `<thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"><tr>${headerCells}</tr></thead>`}
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;

        // Remove all colspan="1" attributes from the tableHTML
        tableHTML = tableHTML.replace(/colspan="1"\\s*/g, '');

        return tableHTML;
    }

    /**
     * Gets the headers for a table.
     * 
     * @param {Object} row A row of data.
     * @returns {Object[]} An array of header objects.
     */
    function getHeaders(row) {
        // Map the keys of the row to an array of header objects
        let headers = Object.keys(row).map(originalHeader => {
            // Set default values for the alignment and text color
            let alignment = 'text-center';
            let header = originalHeader;
            let textColor = 'text-white'; // default text color for headers
            let fontSize = '';

            // Update the alignment and header based on any alignment tags in the header
            if (header.includes('{C}')) {
                alignment = 'text-center';
                header = header.replace('{C}', '');
            } else if (header.includes('{L}')) {
                alignment = 'text-left';
                header = header.replace('{L}', '');
            } else if (header.includes('{R}')) {
                alignment = 'text-right';
                header = header.replace('{R}', '');
            }

            // Update the text color based on any color tags in the header
            if (header.includes('{r}')) {
                textColor = 'text-red-500';
                header = header.replace('{r}', '');
            } else if (header.includes('{g}')) {
                textColor = 'text-green-500';
                header = header.replace('{g}', '');
            } else if (header.includes('{b}')) {
                textColor = 'text-blue-500';
                header = header.replace('{b}', '');
            }

            // Update the font size based on any font size tags in the header
            const fontSizeMatch = header.match(/{f(\d+)}/);
            if (fontSizeMatch) {
                fontSize = fontSizeMatch[1];
                header = header.replace(fontSizeMatch[0], '');
            }

            // Remove the index from the header name
            header = header.split('_')[0];

            return { header, alignment, originalHeader, textColor, fontSize };
        });

        return headers;
    }

    /**
     * Gets the HTML for a row in a table.
     * 
     * @param {Object} row A row of data.
     * @param {Object[]} headers An array of header objects.
     * @param {string} columnWidth The width of each column.
     * @param {number} index The index of the row.
     * @returns {string} The HTML for the row.
     */
    function getRowHTML(row, headers, columnWidth, index) {
        // Start the row with an opening <tr> tag, adding a class for alternate rows
        let rowHtml = index % 2 === 0 ? '<tr>' : '<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">';
        let skipCells = 0;

        // Generate the HTML for each cell in the row
        headers.forEach(({ originalHeader, alignment, textColor, fontSize }) => {
            if (skipCells > 0) {
                skipCells--;
                return;
            }

            // Get the value for the cell and set default values for the alignment and text color
            let cellValue = row[originalHeader];
            let cellAlignment = alignment;
            let cellTextColor = textColor === 'text-white' ? 'text-black' : textColor;
            let cellColSpan = 1;
            let cellFontSize = fontSize ? `style="font-size:${fontSize}px"` : '';

            // Update the alignment and cell value based on any alignment tags in the cell value
            if (cellValue && cellValue.includes('{C}')) {
                cellAlignment = 'text-center';
                cellValue = cellValue.replace('{C}', '');
            } else if (cellValue && cellValue.includes('{L}')) {
                cellAlignment = 'text-left';
                cellValue = cellValue.replace('{L}', '');
            } else if (cellValue && cellValue.includes('{R}')) {
                cellAlignment = 'text-right';
                cellValue = cellValue.replace('{R}', '');
            }

            // Update the text color based on any color tags in the cell value
            if (cellValue && cellValue.includes('{r}')) {
                cellTextColor = 'text-red-500';
                cellValue = cellValue.replace('{r}', '');
            } else if (cellValue && cellValue.includes('{g}')) {
                cellTextColor = 'text-green-500';
                cellValue = cellValue.replace('{g}', '');
            } else if (cellValue && cellValue.includes('{b}')) {
                cellTextColor = 'text-blue-500';
                cellValue = cellValue.replace('{b}', '');
            }

            // Calculate the colspan and how many cells to skip based on any width tags in the cell value
            if (cellValue && cellValue.includes('{W}')) {
                cellValue = cellValue.replace('{W}', '');

                let nextHeaderIndex = headers.findIndex(({ originalHeader: oh }) => oh === originalHeader) + 1;
                while (nextHeaderIndex < headers.length && (!row[headers[nextHeaderIndex].originalHeader] || row[headers[nextHeaderIndex].originalHeader] === '')) {
                    cellColSpan++;
                    skipCells++;
                    nextHeaderIndex++;
                }
            }

            // Update the font size based on any font size tags in the cell value
            const fontSizeMatch = cellValue.match(/{f(\d+)}/);
            if (fontSizeMatch) {
                fontSize = fontSizeMatch[1];
                cellValue = cellValue.replace(fontSizeMatch[0], '');
            }

            // Add the cell to the row
            rowHtml += getCellHTML(columnWidth, cellColSpan, cellValue, cellTextColor, cellAlignment, fontSize);
        });

        return rowHtml + '</tr>';
    }

    /**
     * Generates the HTML for a cell in a table.
     * 
     * @param {string} columnWidth The width of the cell.
     * @param {number} cellColSpan The colspan of the cell.
     * @param {string} cellValue The value of the cell.
     * @param {string} cellTextColor The text color of the cell.
     * @param {string} cellAlignment The alignment of the cell.
     * @param {string} fontSize The font size of the cell.
     * @returns {string} The HTML for the cell.
     */
    function getCellHTML(columnWidth, cellColSpan, cellValue, cellTextColor, cellAlignment, fontSize) {
        if (cellColSpan === 1 && cellValue === '') {
            return `<td style="width: ${columnWidth}" class="px-3 py-5 border-b border-gray-200 bg-white ${cellTextColor} ${cellAlignment} align-middle"></td>`;
        } else if (cellValue !== '') {
            if (cellValue.includes('{B}')) {
                let [buttonName, buttonURL] = cellValue.replace('{B}', '').split('>');
                if (!buttonURL.startsWith('http://') && !buttonURL.startsWith('https://')) {
                    // Assuming your site uses the HTTPS protocol
                    buttonURL = `https://${buttonURL}`;
                }

                return `<td style="width: ${columnWidth}; font-size: ${fontSize}px" colspan="${cellColSpan}" class="px-3 py-5 border-b border-gray-200 bg-white ${cellTextColor} ${cellAlignment} align-middle">
                            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick="window.open('${buttonURL}', '_blank')">${buttonName}</button>
                        </td>`;
            } else {
                return `<td style="width: ${columnWidth}; font-size: ${fontSize}px" colspan="${cellColSpan}" class="px-3 py-5 border-b border-gray-200 bg-white ${cellTextColor} ${cellAlignment} align-middle">${cellValue}</td>`;
            }
        }
    }

    /**
     * Displays a message indicating that no data could be found.
     */
    function displayNoDataMessage() {
        // Query the DOM for the widget container.
        const widgetContainer = document.querySelector(`#${widgetId} .widget-container`);
        // Set the container's content to an error message.
        widgetContainer.innerHTML = `
        <div style="width: 100%; height: 200px; background-color: lightgray; display: flex; justify-content: center; align-items: center;">
            <p>Google Sheet not found! Add a Data Attribute named data-ttmGSID whose value is the published ID of the Google Sheet you want to access</p>
        </div>
        `;
        // Log an error message to the console.
        console.error('Google Sheet not found! Add a Data Attribute named data-ttmGSID whose value is the published ID of the Google Sheet you want to access');
    }
}

/**
 * When the document is loaded
 * Initialize all widgets of type 'ttmTabsWidget' and 'ttmTableWidget'.
 */
document.addEventListener('DOMContentLoaded', function() {
    Array.from(document.getElementsByClassName('ttmTabsWidget')).forEach((element, index) => {
        ttmCreateGSTWidget(element, index, 'ttmTabsWidget');
    });
    Array.from(document.getElementsByClassName('ttmTableWidget')).forEach((element, index) => {
        ttmCreateGSTWidget(element, index, 'ttmTableWidget');
    });
}, false);
