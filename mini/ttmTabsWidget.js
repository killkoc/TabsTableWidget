/**
 * Initialize a Google Sheet-based widget.
 *
 * @param {Element} widgetElement - The HTML element to host the widget.
 * @param {number}  widgetIndex   - The unique index of this widget instance.
 * @param {string}  widgetType    - The type of widget to create ('ttmTabsWidget' or 'ttmTableWidget').
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
        const GSheetData   = await fetchGSheetData(GSheetURL);
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

    /* ---------------------------------------------------------------------
       Internal helpers
       ------------------------------------------------------------------ */

    /**
     * Fetch the contents of a Google Sheet as a CSV-formatted string.
     */
    async function fetchGSheetData(GSheetURL) {
        const response = await fetch(GSheetURL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    }

    /**
     * Parse CSV string into array of objects.
     */
    function parseCSV(data, widgetId) {
        console.timeEnd(widgetId);                         // stop perf timer

        data = data.replace(/\r\n/g, '\n');                // normalise newlines
        const [headerLine, ...rows] = data.split('\n');

        // Build unique header names
        const originalHeaders = headerLine.split(',');
        const uniqueHeaders   = originalHeaders.map((h, i) => `${h}_${i}`);

        return rows.map(row => {
            const cells = row.split(',');
            return Object.fromEntries(
                uniqueHeaders.map((h, i) => [h, cells[i] || ''])
            );
        });
    }

    /* ──────────────────────────────────────────────────────────────────
       1.  TABS WIDGET
       ────────────────────────────────────────────────────────────────── */
    function initializeTabs(widgetElement, widgetId, GSheetData) {
        /*  Inject structure:
              <div class="...">
                <div class="...">
                  <ul class="... fixed classes ..."></ul>
                  <div class="widget-container"></div>
                </div>
              </div>
        */
        const structure = document.createElement('div');
        structure.className = "ttmTW-flex ttmTW-justify-center";
        structure.innerHTML =
            '<div class="ttmTW-w-full">' +
                '<div class="ttmTW-bg-transparent ttmTW-shadow-sm ttmTW-my-6">' +
                    /* ►►► FIX: list defaults killed + full width ◄◄◄ */
                    '<ul class="ttmTW-flex ttmTW-justify-around ' +
                              'ttmTW-w-full ttmTW-list-none ttmTW-m-0 ttmTW-p-0"></ul>' +
                    /* -------------------------------------------------------------------- */
                    '<div class="ttmTW-w-full widget-container"></div>' +
                '</div>' +
            '</div>';
        widgetElement.appendChild(structure);

        const tabBar       = widgetElement.querySelector('ul');
        const categoryName = Object.keys(GSheetData[0])[0];

        /* Split rows per category ------------------------------------------------------ */
        const tabDataMap = {};
        GSheetData.forEach(row => {
            const category = row[categoryName];
            if (!tabDataMap[category]) tabDataMap[category] = [];
            const { [categoryName]: _, ...rest } = row;
            tabDataMap[category].push(rest);
        });

        /* Build tabs ------------------------------------------------------------------- */
        const uniqueTabs  = Object.keys(tabDataMap);
        const tabFragment = document.createDocumentFragment();
        uniqueTabs.forEach((tab, idx) =>
            tabFragment.appendChild(createTab(widgetId, tab, idx))
        );
        tabBar.appendChild(tabFragment);

        /* Click handling -------------------------------------------------------------- */
        tabBar.addEventListener('click', evt => {
            const clicked = evt.target.closest('.ttmTab-element');
            if (!clicked) return;
            const tabs = Array.from(tabBar.children);
            switchTab(widgetElement, widgetId, tabs.indexOf(clicked), tabDataMap);
        });

        /* Autoselect first tab --------------------------------------------------------- */
        if (tabBar.firstChild) switchTab(widgetElement, widgetId, 0, tabDataMap);
    }

    function createTab(widgetId, category) {
        const li = document.createElement('li');
        li.className =
            'ttmTW-flex-auto ttmTW-flex ttmTW-justify-center ttmTW-items-center ' +
            'ttmTW-ml-0 last:ttmTW-mr-0 ttmTW-bg-gray-400 ttmTW-text-white ' +
            'ttmTW-rounded-t-xl ttmTab-element';
        li.innerHTML =
            `<div class="ttmTW-text-xs ttmTW-font-semibold ttmTW-uppercase ` +
            `ttmTW-px-3 ttmTW-py-3">${category}</div>`;
        return li;
    }

    function switchTab(widgetElement, widgetId, tabIndex, tabDataMap) {
        const tabElements          = widgetElement.querySelectorAll('ul li');
        const tabContentsContainer = widgetElement.querySelector('.widget-container');
        const tabNames             = Object.keys(tabDataMap);

        /* Hide everything, reset tab styles ------------------------------------------ */
        tabContentsContainer.querySelectorAll('.table-content')
            .forEach(el => el.style.display = 'none');
        tabElements.forEach(tab => {
            tab.classList.remove('ttmTW-bg-blue-500');
            tab.classList.add   ('ttmTW-bg-gray-400');
        });

        /* Activate selected tab ------------------------------------------------------- */
        const activeTab = tabElements[tabIndex];
        activeTab.classList.remove('ttmTW-bg-gray-400');
        activeTab.classList.add   ('ttmTW-bg-blue-500');

        /* Show or build content ------------------------------------------------------- */
        const existing = tabContentsContainer
            .querySelector(`[data-tab-name="${tabNames[tabIndex]}"]`);
        if (existing) {
            existing.style.display = 'block';
            return;
        }

        const fragment = loadTabData(
            tabNames[tabIndex],
            tabIndex,
            tabDataMap[tabNames[tabIndex]]
        );
        tabContentsContainer.appendChild(fragment);
    }

    function loadTabData(tab, index, filteredData) {
        const tableElement = createTableElement(filteredData);

        const container        = document.createElement('div');
        container.dataset.tabName = tab;
        container.style.display   = 'block';
        container.classList.add('table-content');

        const wrapper = document.createElement('div');
        wrapper.className =
            "ttmTW-relative ttmTW-overflow-x-auto ttmTW-shadow-sm";
        wrapper.appendChild(tableElement);

        container.appendChild(wrapper);

        const frag = document.createDocumentFragment();
        frag.appendChild(container);
        return frag;
    }

    /* ──────────────────────────────────────────────────────────────────
       2.  SIMPLE TABLE WIDGET
       ────────────────────────────────────────────────────────────────── */
    function initializeTable(widgetElement, widgetId, GSheetData) {
        const structure = document.createElement('div');
        structure.className = "ttmTW-flex ttmTW-justify-center";
        structure.innerHTML =
            '<div class="ttmTW-w-full">' +
                '<div class="ttmTW-bg-transparent ttmTW-shadow-sm ' +
                            'ttmTW-rounded-sm ttmTW-my-6">' +
                    '<div class="ttmTW-w-full widget-container"></div>' +
                '</div>' +
            '</div>';
        widgetElement.appendChild(structure);

        const tableContainer = widgetElement.querySelector('.widget-container');
        const tableElement   = createTableElement(GSheetData);

        const wrapper = document.createElement('div');
        wrapper.className =
            "ttmTW-relative ttmTW-overflow-x-auto ttmTW-shadow-sm sm:ttmTW-rounded-lg";
        wrapper.appendChild(tableElement);

        tableContainer.appendChild(wrapper);
        tableContainer.classList.add('table-content');
    }

    /* ──────────────────────────────────────────────────────────────────
       3.  TABLE BUILDING HELPERS
       ────────────────────────────────────────────────────────────────── */
    function createTableElement(dataArray) {
        const headers        = getHeaders(dataArray[0]);
        const table          = document.createElement('table');
        table.className      =
            "ttmTable-content ttmTW-w-full ttmTW-text-xs ttmTW-text-left " +
            "ttmTW-text-gray-500 dark:ttmTW-text-gray-400";

        /* Table head --------------------------------------------------------------- */
        const allEmpty = headers.every(({ header }) => !header.trim());
        if (!allEmpty) {
            const thead = document.createElement('thead');
            thead.className =
                "ttmTW-text-xs ttmTW-text-gray-700 ttmTW-uppercase " +
                "ttmTW-bg-gray-50 dark:ttmTW-bg-gray-700 dark:ttmTW-text-gray-400";

            const tr = document.createElement('tr');
            headers.forEach(({ header, alignment, textColor, fontSize }) => {
                const th = document.createElement('th');
                th.className =
                    `ttmTW-px-2 ttmTW-py-3 ttmTW-border-b-2 ttmTW-border-gray-200 ` +
                    `ttmTW-bg-blue-500 ${alignment} ttmTW-font-medium ${textColor} ` +
                    `ttmTW-uppercase ttmTW-align-middle`;
                th.innerHTML = fontSize
                    ? `<span style="font-size:${fontSize}px">${header}</span>`
                    : header;
                tr.appendChild(th);
            });
            thead.appendChild(tr);
            table.appendChild(thead);
        }

        /* Table body --------------------------------------------------------------- */
        const tbody = document.createElement('tbody');
        dataArray.forEach((row, i) => tbody.appendChild(getRowElement(row, headers, i)));
        table.appendChild(tbody);

        return table;
    }

    function getHeaders(row) {
        return Object.keys(row).map(orig => {
            let alignment = 'ttmTW-text-center';
            let header    = orig;
            let color     = 'ttmTW-text-white';
            let fontSize  = '';

            if (header.includes('{C}')) { alignment = 'ttmTW-text-center'; header = header.replace('{C}',''); }
            else if (header.includes('{L}')) { alignment = 'ttmTW-text-left'; header = header.replace('{L}',''); }
            else if (header.includes('{R}')) { alignment = 'ttmTW-text-right'; header = header.replace('{R}',''); }

            if (header.includes('{r}')) { color = 'ttmTW-text-red-500';   header = header.replace('{r}',''); }
            else if (header.includes('{g}')) { color = 'ttmTW-text-green-500'; header = header.replace('{g}',''); }
            else if (header.includes('{b}')) { color = 'ttmTW-text-blue-500';  header = header.replace('{b}',''); }

            const fsMatch = header.match(/{f(\d+)}/);
            if (fsMatch) { fontSize = fsMatch[1]; header = header.replace(fsMatch[0],''); }

            header = header.split('_')[0];
            return { header, alignment, originalHeader: orig, textColor: color, fontSize };
        });
    }

    function getRowElement(row, headers, idx) {
        const tr = document.createElement('tr');
        tr.className = idx % 2
            ? 'ttmTW-bg-white ttmTW-border-b dark:ttmTW-bg-gray-800 ' +
              'dark:ttmTW-border-gray-700 ttmTW-hover:ttmTW-bg-gray-50 ' +
              'dark:ttmTW-hover:ttmTW-bg-gray-600'
            : '';

        let skip = 0;
        headers.forEach(({ originalHeader, alignment, textColor, fontSize }) => {
            if (skip) { skip--; return; }

            let val     = row[originalHeader] || '';
            let align   = alignment;
            let color   = textColor === 'ttmTW-text-white' ? 'ttmTW-text-black' : textColor;
            let colspan = 1;
            let fontCSS = fontSize ? `font-size:${fontSize}px` : '';

            if (val.includes('{C}')) { align = 'ttmTW-text-center'; val = val.replace('{C}',''); }
            else if (val.includes('{L}')) { align = 'ttmTW-text-left'; val = val.replace('{L}',''); }
            else if (val.includes('{R}')) { align = 'ttmTW-text-right'; val = val.replace('{R}',''); }

            if (val.includes('{r}')) { color = 'ttmTW-text-red-500';   val = val.replace('{r}',''); }
            if (val.includes('{g}')) { color = 'ttmTW-text-green-500'; val = val.replace('{g}',''); }
            if (val.includes('{b}')) { color = 'ttmTW-text-blue-500';  val = val.replace('{b}',''); }

            if (val.includes('{W}')) {
                val = val.replace('{W}','');
                let nextIdx = headers.findIndex(h => h.originalHeader === originalHeader) + 1;
                while (
                    nextIdx < headers.length &&
                    (!row[headers[nextIdx].originalHeader] ||
                     row[headers[nextIdx].originalHeader] === '')
                ) {
                    colspan++; skip++; nextIdx++;
                }
            }

            const fsMatch = val.match(/{f(\d+)}/);
            if (fsMatch) { fontCSS = `font-size:${fsMatch[1]}px`; val = val.replace(fsMatch[0],''); }

            const td = getCellElement(colspan, val, color, align, fontCSS);
            tr.appendChild(td);
        });
        return tr;
    }

    function getCellElement(colspan, value, color, align, fontCSS) {
        const td   = document.createElement('td');
        td.colSpan = colspan;
        td.className =
            `ttmTW-px-2 ttmTW-py-2 ttmTW-border-b ttmTW-border-gray-200 ` +
            `ttmTW-bg-white ttmTW-font-normal ${color} ${align} ttmTW-align-middle`;
        if (fontCSS) td.style.cssText += `; ${fontCSS}`;

        if (value.includes('{B}')) {
            let [btnText, url] = value.replace('{B}','').split('>');
            if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
            const btn = document.createElement('button');
            btn.className =
                'ttmTW-bg-blue-500 ttmTW-hover:bg-blue-700 ttmTW-text-white ' +
                'ttmTW-font-medium ttmTW-py-1 ttmTW-px-2 ttmTW-rounded';
            btn.onclick  = () => window.open(url, '_blank');
            btn.textContent = btnText;
            td.appendChild(btn);
        } else {
            td.innerHTML = value;
        }
        return td;
    }

    /* ────────────────────────────────────────────────────────────────── */
    function displayNoDataMessage(widgetElement) {
        widgetElement.innerHTML =
            '<div class="ttmTW-flex ttmTW-justify-center ttmTW-items-center ' +
            'ttmTW-h-full ttmTW-text-gray-500 ttmTW-text-lg">' +
            'No data available' +
            '</div>';
    }
}

/* ---------------------------------------------------------------------
   Bootstrapping helpers
   ------------------------------------------------------------------ */
function ttmInitializeWidgets() {
    Array.from(document.getElementsByClassName('ttmTabsWidget'))
        .forEach((el, i) => ttmCreateGSTWidget(el, i, 'ttmTabsWidget'));

    Array.from(document.getElementsByClassName('ttmTableWidget'))
        .forEach((el, i) => ttmCreateGSTWidget(el, i, 'ttmTableWidget'));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ttmInitializeWidgets);
} else {
    ttmInitializeWidgets();
}
