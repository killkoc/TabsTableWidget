function ttmCreateGSTWidget(widgetElement, widgetIndex, widgetType) {
    if (widgetElement.hasAttribute('ttmWidgetInit')) return;
    widgetElement.setAttribute('ttmWidgetInit', '');
    const widgetId = `${widgetType}-${widgetIndex}`;
    widgetElement.id = widgetId;
    const GSheetID = widgetElement.getAttribute('data-ttmGSID');
    if (!GSheetID) {
        displayNoDataMessage(widgetElement);
        return;
    }
    const GSheetURL = `https://docs.google.com/spreadsheets/d/e/${GSheetID}/pub?output=csv`;
    fetchGSheetData(GSheetURL)
        .then(data => {
            const GSheetData = parseCSV(data);
            widgetType === 'ttmTabsWidget' ? initializeTabs(widgetElement, widgetId, GSheetData) : initializeTable(widgetElement, widgetId, GSheetData);
        })
        .catch(error => {
            console.error('Error fetching Google Sheet data:', error);
            displayNoDataMessage(widgetElement);
        });

    async function fetchGSheetData(GSheetURL) {
        const response = await fetch(GSheetURL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    }

    function parseCSV(data) {
        data = data.replace(/\r\n/g, '\n');
        const [headerLine, ...rows] = data.split('\n');
        const originalHeaders = headerLine.split(',');
        const uniqueHeaders = originalHeaders.map((header, index) => `${header}_${index}`);
        return rows.map(row => {
            const cells = row.split(',');
            return Object.fromEntries(uniqueHeaders.map((header, index) => [header, cells[index] || '']));
        });
    }

function initializeTabs(widgetElement, widgetId, GSheetData) {
    if (widgetElement.children.length === 0) {
        const structure = document.createElement('div');
        structure.className = "flex justify-center";
        structure.innerHTML = '<div class="w-full"><div class="bg-transparent shadow-sm my-6"><ul class="flex justify-around"></ul><div class="w-full widget-container"></div></div></div>';
        widgetElement.appendChild(structure);
    }

    const tabBar = widgetElement.querySelector('ul');
    const categoryName = Object.keys(GSheetData[0])[0];

    const tabDataMap = {};
    GSheetData.forEach(row => {
        const category = row[categoryName];
        if (!tabDataMap[category]) {
            tabDataMap[category] = [];
        }
        const { [categoryName]: _, ...rest } = row;
        tabDataMap[category].push(rest);
    });

    const uniqueTabs = Object.keys(tabDataMap);
    const tabFragment = document.createDocumentFragment();
    uniqueTabs.forEach((tab, index) => {
        tabFragment.appendChild(createTab(widgetElement, widgetId, tab, index));
    });

    tabBar.appendChild(tabFragment);

    tabBar.addEventListener('click', (event) => {
        const target = event.target;
        const tabElements = Array.from(tabBar.children);
        const clickedTab = target.closest('.ttmTab-element');
        if (clickedTab) {
            const tabIndex = tabElements.indexOf(clickedTab);
            switchTab(widgetElement, widgetId, tabIndex, tabDataMap);
        }
    });

    if (tabBar.firstChild) {
        switchTab(widgetElement, widgetId, 0, tabDataMap);
    }
}


function loadTabData(tab, index, filteredData) {
	const tableElement = createTableElement(filteredData);
    const contentFragment = document.createDocumentFragment();
    const tableContainer = document.createElement('div');
    tableContainer.style.display = 'block'; // Changed this line
    tableContainer.classList.add('table-content');
    tableContainer.dataset.tabName = tab;
    const divTableElement = document.createElement('div');
    divTableElement.className = "relative overflow-x-auto shadow-sm";
    divTableElement.appendChild(tableElement);
    tableContainer.appendChild(divTableElement);
    contentFragment.appendChild(tableContainer);
    return contentFragment;
}

    function initializeTable(widgetElement, widgetId, GSheetData) {
        if (widgetElement.children.length === 0) {
            const structure = document.createElement('div');
            structure.className = "flex justify-center";
            structure.innerHTML = '<div class="w-full"><div class="bg-transparent shadow-sm rounded-sm my-6"><div class="w-full widget-container"></div></div></div>';
            widgetElement.appendChild(structure);
        }
        const tableContainer = widgetElement.querySelector('.widget-container');
        const tableElement = createTableElement(GSheetData);
        const divTableElement = document.createElement('div');
        divTableElement.className = "relative overflow-x-auto shadow-sm sm:rounded-lg";
        divTableElement.appendChild(tableElement);
        tableContainer.appendChild(divTableElement);
        tableContainer.classList.add('table-content');
    }

    function createTab(widgetElement, widgetId, category, index) {
        const tabElement = document.createElement('li');
        tabElement.className = 'flex-auto ml-0 last:mr-0 text-center bg-gray-400 text-white rounded-t-xl ttmTab-element';
        tabElement.innerHTML = `<div class="text-xs font-bold uppercase px-5 py-3 block leading-normal">${category}</div>`;
        return tabElement;
    }

function switchTab(widgetElement, widgetId, tabIndex, tabDataMap) {
    const tabElements = widgetElement.querySelectorAll('ul li');
    const tabContentsContainer = widgetElement.querySelector('.widget-container');
    const tabNames = Object.keys(tabDataMap);
    const existingTableContent = tabContentsContainer.querySelector(`[data-tab-name="${tabNames[tabIndex]}"]`);
    
    // Hide all existing tab contents
    const allTableContents = tabContentsContainer.querySelectorAll('.table-content');
    allTableContents.forEach(content => content.style.display = 'none');
    
    // Remove active class from all tabs
    tabElements.forEach(tab => tab.classList.remove('bg-blue-500'));
    
    // Set the clicked tab to active
    tabElements[tabIndex].classList.add('bg-blue-500');
    
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


    function createTableElement(dataArray) {
        const headers = getHeaders(dataArray[0]);
        const table = document.createElement('table');
        table.className = "ttmTable-content w-full text-xs text-left text-gray-500 dark:text-gray-400";
        const allHeadersEmpty = headers.every(({ header }) => !header.trim());
        if (!allHeadersEmpty) {
            const thead = document.createElement('thead');
            thead.className = "text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400";
            const tr = document.createElement('tr');
            headers.forEach(({ header, alignment, textColor, fontSize, columnWidth }) => {
                const th = document.createElement('th');
                th.scope = "col";
                th.style.width = columnWidth;
                th.className = `px-5 py-5 border-b-2 border-gray-200 bg-blue-500 ${alignment} font-semibold ${textColor} uppercase align-middle`;
                th.innerHTML = fontSize ? `<span style="font-size:${fontSize}px">${header}</span>` : header;
                tr.appendChild(th);
            });
            thead.appendChild(tr);
            table.appendChild(thead);
        }
        const tbody = document.createElement('tbody');
        dataArray.forEach((row, index) => {
            const rowElement = getRowElement(row, headers, '', index);
            tbody.appendChild(rowElement);
        });
        table.appendChild(tbody);
        return table;
    }

    function getHeaders(row) {
        let headers = Object.keys(row).map(originalHeader => {
            let alignment = 'text-center';
            let header = originalHeader;
            let textColor = 'text-white';
            let fontSize = '';
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
            const fontSizeMatch = header.match(/{f(\d+)}/);
            if (fontSizeMatch) {
                fontSize = fontSizeMatch[1];
                header = header.replace(fontSizeMatch[0], '');
            }
            header = header.split('_')[0];
            return { header, alignment, originalHeader, textColor, fontSize };
        });
        return headers;
    }

    function getRowElement(row, headers, columnWidth, index) {
        const tr = document.createElement('tr');
        tr.className = index % 2 === 0 ? '' : 'bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600';
        let skipCells = 0;
        headers.forEach(({ originalHeader, alignment, textColor, fontSize }) => {
            if (skipCells > 0) {
                skipCells--;
                return;
            }
            let cellValue = row[originalHeader];
            let cellAlignment = alignment;
            let cellTextColor = textColor === 'text-white' ? 'text-black' : textColor;
            let cellColSpan = 1;
            let cellFontSize = fontSize ? `font-size:${fontSize}px` : '';
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
            if (cellValue && cellValue.includes('{W}')) {
                cellValue = cellValue.replace('{W}', '');
                let nextHeaderIndex = headers.findIndex(({ originalHeader: oh }) => oh === originalHeader) + 1;
                while (nextHeaderIndex < headers.length && (!row[headers[nextHeaderIndex].originalHeader] || row[headers[nextHeaderIndex].originalHeader] === '')) {
                    cellColSpan++;
                    skipCells++;
                    nextHeaderIndex++;
                }
            }
            const fontSizeMatch = cellValue.match(/{f(\d+)}/);
            if (fontSizeMatch) {
                cellFontSize = `font-size:${fontSizeMatch[1]}px`;
                cellValue = cellValue.replace(fontSizeMatch[0], '');
            }
            const td = getCellElement(columnWidth, cellColSpan, cellValue, cellTextColor, cellAlignment, cellFontSize);
            tr.appendChild(td);
        });
        return tr;
    }

    function getCellElement(columnWidth, cellColSpan, cellValue, cellTextColor, cellAlignment, fontSize) {
        const td = document.createElement('td');
        td.style.width = columnWidth;
        td.colSpan = cellColSpan;
        td.className = `px-3 py-5 border-b border-gray-200 bg-white ${cellTextColor} ${cellAlignment} align-middle`;
        if (fontSize) {
            td.style.cssText += `; ${fontSize}`;
        }
        if (cellValue.includes('{B}')) {
            let [buttonName, buttonURL] = cellValue.replace('{B}', '').split('>');
            if (!buttonURL.startsWith('http://') && !buttonURL.startsWith('https://')) {
                buttonURL = `https://${buttonURL}`;
            }
            const button = document.createElement('button');
            button.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded';
            button.onclick = () => window.open(buttonURL, '_blank');
            button.innerHTML = buttonName;
            td.appendChild(button);
        } else {
            td.innerHTML = cellValue;
        }
        return td;
    }

    function displayNoDataMessage(widgetElement) {
        widgetElement.innerHTML = '<div class="flex justify-center items-center h-full text-gray-500 text-lg">No data available</div>';
    }
}

window.addEventListener('load', function() {
    Array.from(document.getElementsByClassName('ttmTabsWidget')).forEach((element, index) => {
        ttmCreateGSTWidget(element, index, 'ttmTabsWidget');
    });
    Array.from(document.getElementsByClassName('ttmTableWidget')).forEach((element, index) => {
        ttmCreateGSTWidget(element, index, 'ttmTableWidget');
    });
}, false);
