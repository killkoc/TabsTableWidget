// ttmGSTWidget.js – FULL source with tab‑bar fix clearly visible
// -----------------------------------------------------------------------------
// ‼  The only functional change compared with your original file is in
//     initializeTabs(): we add four inline‑style properties right after we grab
//     the <ul> element that holds the tabs (see the ░ lines).
// -----------------------------------------------------------------------------

/**
 * Initialize a Google Sheet‑based widget (tabs or plain table).
 *
 * @param {Element} widgetElement  Host element
 * @param {number}  widgetIndex    Unique index per instance
 * @param {string}  widgetType     'ttmTabsWidget' | 'ttmTableWidget'
 */
async function ttmCreateGSTWidget(widgetElement, widgetIndex, widgetType) {
  // ───────────────────────────────────────────────────────────────────────────
  //  Early‑exit guard
  // ───────────────────────────────────────────────────────────────────────────
  if (widgetElement.hasAttribute('ttmWidgetInit')) return; // already initialised
  widgetElement.setAttribute('ttmWidgetInit', '');

  const widgetId = `${widgetType}-${widgetIndex}`;
  widgetElement.id = widgetId;

  const gsid = widgetElement.getAttribute('data-ttmGSID');
  if (!gsid) {
    displayNoDataMessage(widgetElement);
    return;
  }

  console.time(widgetId); // perf timer starts

  /*
  const gsheetURL = gsid.startsWith('2PAC')
    ? `https://docs.google.com/spreadsheets/d/e/${gsid}/pub?output=csv`
    : `https://docs.google.com/spreadsheets/d/${gsid}/pub?output=csv`;

  try {
    const csvText = await fetchGSheetData(gsheetURL);
    const rows    = parseCSV(csvText, widgetId);

    widgetElement.innerHTML = ''; // wipe any placeholder content

    if (widgetType === 'ttmTabsWidget') {
      initializeTabs(widgetElement, widgetId, rows);
    } else {
      initializeTable(widgetElement, widgetId, rows);
    }
  } catch (err) {
    console.error('Error fetching Google Sheet data:', err);
    displayNoDataMessage(widgetElement);
  }
  */
  const id  = gsid; // can be 2PACX-* OR a real fileId
  const gid = widgetElement.getAttribute('data-ttmGID') || '0';
  
  try {
    const csvText = await fetchCsvDualStrategy(id, gid);
    const rows    = parseCSV(csvText, widgetId);
  
    widgetElement.innerHTML = ''; // wipe any placeholder content
  
    if (widgetType === 'ttmTabsWidget') {
      initializeTabs(widgetElement, widgetId, rows);
    } else {
      initializeTable(widgetElement, widgetId, rows);
    }
  } catch (err) {
    console.error('Error fetching Google Sheet data:', err);

    // If it's a 2PACX id and CSV is blocked, fall back to the working pubhtml iframe
    if (/^2PACX-/.test(id)) {
      const iframeUrl = `https://docs.google.com/spreadsheets/d/e/${id}/pubhtml?gid=${encodeURIComponent(gid)}&single=true&widget=true&headers=false`;
      widgetElement.innerHTML = `
        <div class="ttmTW-w-full ttmTW-my-4">
          <iframe src="${iframeUrl}" style="width:100%;height:600px;border:0;overflow:auto"></iframe>
        </div>`;
      return;
    }
  
    displayNoDataMessage(widgetElement);
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  Helpers – fetch & parse
  // ───────────────────────────────────────────────────────────────────────────
  /*
  async function fetchGSheetData(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.text();
  }

  function parseCSV(text, id) {
    console.timeEnd(id); // stop timer

    text = text.replace(/\r\n/g, "\n"); // normalise CRLF
    const [headerLine, ...lines] = text.split("\n");

    const rawHeaders = headerLine.split(',');
    const headers    = rawHeaders.map((h, i) => `${h}_${i}`); // ensure uniqueness

    return lines.map(line => {
      const cells = line.split(',');
      return Object.fromEntries(headers.map((h, i) => [h, cells[i] || '']));
    });
  }
  */
  async function fetchCsvDualStrategy(id, gid) {
    const is2PACX = /^2PACX-/.test(id);
  
    // If it's 2PACX → use legacy publish-to-web CSV endpoints
    if (is2PACX) {
      return await fetchCsvFromUrls([
        `https://docs.google.com/spreadsheets/d/e/${id}/pub?gid=${encodeURIComponent(gid)}&single=true&output=csv`,
        `https://docs.google.com/spreadsheets/d/e/${id}/pub?gid=${encodeURIComponent(gid)}&output=csv`,
        `https://docs.google.com/spreadsheets/d/e/${id}/pub?output=csv`,
      ]);
    }
  
    // Else treat it as a fileId → stable export endpoints
    return await fetchCsvFromUrls([
      `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${encodeURIComponent(gid)}`,
      `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(gid)}`,
    ]);
  }
  
  async function fetchCsvFromUrls(urls) {
    let lastErr;
    for (const url of urls) {
      try {
        const res  = await fetch(url, { credentials: 'omit', cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        const text = await res.text();
  
        // Reject HTML / interstitials (e.g., “Sorry, unable to open the file”)
        if (/^\s*<!doctype|^\s*<html/i.test(text)) throw new Error('HTML instead of CSV');
  
        // Sanity check: header + at least one data row
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) throw new Error('Empty CSV');
  
        return text;
      } catch (e) {
        lastErr = e;
        console.warn('[GSTWidget] CSV candidate failed', url, e.message);
      }
    }
    throw lastErr || new Error('All CSV fetch attempts failed');
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  1.  Tabs widget
  // ───────────────────────────────────────────────────────────────────────────
  function initializeTabs(widgetElement, widgetId, data) {
    // Build scaffolding
    const wrapper = document.createElement('div');
    wrapper.className = 'ttmTW-flex ttmTW-justify-center';
    wrapper.innerHTML =
      '<div class="ttmTW-w-full">' +
        '<div class="ttmTW-bg-transparent ttmTW-shadow-sm ttmTW-my-6">' +
          '<ul class="ttmTW-flex ttmTW-justify-around"></ul>' +
          '<div class="ttmTW-w-full widget-container"></div>' +
        '</div>' +
      '</div>';
    widgetElement.appendChild(wrapper);

    const tabBar = widgetElement.querySelector('ul');

    // ░░░░░  ZERO‑OUT BROWSER LIST DEFAULTS  ░░░░░
    tabBar.style.listStyle = 'none';  // remove bullets
    tabBar.style.margin    = '0';    // kill top/bottom margin
    tabBar.style.padding   = '0';    // kill left padding that caused mis‑width
    tabBar.style.width     = '100%'; // make bar span full widget width
    // ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

    // Split data by first column (category)
    const categoryKey = Object.keys(data[0])[0];
    const buckets = {};
    data.forEach(row => {
      const cat = row[categoryKey];
      if (!buckets[cat]) buckets[cat] = [];
      const { [categoryKey]: _omit, ...rest } = row;
      buckets[cat].push(rest);
    });

    // Build tab buttons
    const frag = document.createDocumentFragment();
    Object.keys(buckets).forEach(cat => frag.appendChild(createTab(cat)));
    tabBar.appendChild(frag);

    // Click handling
    tabBar.addEventListener('click', e => {
      const li = e.target.closest('.ttmTab-element');
      if (!li) return;
      const idx = [...tabBar.children].indexOf(li);
      switchTab(idx, buckets);
    });

    // Auto‑select first tab if present
    if (tabBar.firstChild) switchTab(0, buckets);
  }

  function createTab(label) {
    const li = document.createElement('li');
    li.className =
      'ttmTW-flex-auto ttmTW-flex ttmTW-justify-center ttmTW-items-center ' +
      'ttmTW-ml-0 last:ttmTW-mr-0 ttmTW-bg-gray-400 ttmTW-text-white ' +
      'ttmTW-rounded-t-xl ttmTab-element';
    li.innerHTML =
      `<div class="ttmTW-text-xs ttmTW-font-semibold ttmTW-uppercase ` +
      `ttmTW-px-3 ttmTW-py-3">${label}</div>`;
    return li;
  }

  function switchTab(idx, buckets) {
    const tabBar   = widgetElement.querySelector('ul');
    const content  = widgetElement.querySelector('.widget-container');
    const tabs     = [...tabBar.children];
    const catNames = Object.keys(buckets);

    // visual state
    tabs.forEach(li => {
      li.classList.remove('ttmTW-bg-blue-500');
      li.classList.add   ('ttmTW-bg-gray-400');
    });
    tabs[idx].classList.remove('ttmTW-bg-gray-400');
    tabs[idx].classList.add   ('ttmTW-bg-blue-500');

    // hide current
    content.querySelectorAll('.table-content').forEach(el => el.style.display = 'none');

    // show or build
    const name = catNames[idx];
    let pane = content.querySelector(`[data-tab-name="${name}"]`);
    if (pane) {
      pane.style.display = 'block';
      return;
    }

    pane = buildTabPane(name, buckets[name]);
    content.appendChild(pane);
  }

  function buildTabPane(name, rows) {
    const table = createTableElement(rows);

    const pane = document.createElement('div');
    pane.dataset.tabName = name;
    pane.style.display   = 'block';
    pane.className       = 'table-content';

    const wrap = document.createElement('div');
    wrap.className = 'ttmTW-relative ttmTW-overflow-x-auto ttmTW-shadow-sm';
    wrap.appendChild(table);
    pane.appendChild(wrap);

    return pane;
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  2.  Simple table widget (no tabs)
  // ───────────────────────────────────────────────────────────────────────────
  function initializeTable(widgetElement, widgetId, data) {
    const holder = document.createElement('div');
    holder.className = 'ttmTW-flex ttmTW-justify-center';
    holder.innerHTML =
      '<div class="ttmTW-w-full">' +
        '<div class="ttmTW-bg-transparent ttmTW-shadow-sm ttmTW-rounded-sm ttmTW-my-6">' +
          '<div class="ttmTW-w-full widget-container"></div>' +
        '</div>' +
      '</div>';
    widgetElement.appendChild(holder);

    const container = widgetElement.querySelector('.widget-container');
    const table     = createTableElement(data);

    const wrap = document.createElement('div');
    wrap.className =
      'ttmTW-relative ttmTW-overflow-x-auto ttmTW-shadow-sm sm:ttmTW-rounded-lg';
    wrap.appendChild(table);

    container.appendChild(wrap);
    container.classList.add('table-content');
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  3.  Table builders (shared)
  // ───────────────────────────────────────────────────────────────────────────
  function createTableElement(dataArr) {
    const headers = deriveHeaders(dataArr[0]);
    const tbl     = document.createElement('table');
    tbl.className =
      'ttmTable-content ttmTW-w-full ttmTW-text-xs ttmTW-text-left ' +
      'ttmTW-text-gray-500 dark:ttmTW-text-gray-400';

    // Head ------------------------------------------------------------
    if (!headers.every(h => !h.header.trim())) {
      const thead = document.createElement('thead');
      thead.className =
        'ttmTW-text-xs ttmTW-text-gray-700 ttmTW-uppercase ' +
        'ttmTW-bg-gray-50 dark:ttmTW-bg-gray-700 dark:ttmTW-text-gray-400';

      const tr = document.createElement('tr');
      headers.forEach(({ header, alignment, textColor, fontSize }) => {
        const th = document.createElement('th');
        th.className =
          `ttmTW-px-2 ttmTW-py-3 ttmTW-border-b-2 ttmTW-border-gray-200 ` +
          `ttmTW-bg-blue-500 ${alignment} ttmTW-font-medium ${textColor} ` +
          `ttmTW-uppercase ttmTW-align-middle`;
        th.innerHTML = fontSize ? `<span style="font-size:${fontSize}px">${header}</span>` : header;
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      tbl.appendChild(thead);
    }

    // Body -----------------------------------------------------------
    const tbody = document.createElement('tbody');
    dataArr.forEach((row, i) => tbody.appendChild(buildRow(row, headers, i)));
    tbl.appendChild(tbody);
    return tbl;
  }

  function deriveHeaders(row) {
    return Object.keys(row).map(orig => {
      let header = orig;
      let align  = 'ttmTW-text-center';
      let color  = 'ttmTW-text-white';
      let fs     = '';

      if (header.includes('{C}')) { align = 'ttmTW-text-center'; header = header.replace('{C}', ''); }
      else if (header.includes('{L}')) { align = 'ttmTW-text-left'; header = header.replace('{L}', ''); }
      else if (header.includes('{R}')) { align = 'ttmTW-text-right'; header = header.replace('{R}', ''); }

      if (header.includes('{r}')) { color = 'ttmTW-text-red-500';   header = header.replace('{r}', ''); }
      else if (header.includes('{g}')) { color = 'ttmTW-text-green-500'; header = header.replace('{g}', ''); }
      else if (header.includes('{b}')) { color = 'ttmTW-text-blue-500';  header = header.replace('{b}', ''); }

      const m = header.match(/\{f(\d+)\}/);
      if (m) { fs = m[1]; header = header.replace(m[0], ''); }

      header = header.split('_')[0];
      return { header, alignment: align, originalHeader: orig, textColor: color, fontSize: fs };
    });
  }

  function buildRow(row, headers, idx) {
    const tr = document.createElement('tr');
    tr.className = idx % 2
      ? 'ttmTW-bg-white ttmTW-border-b dark:ttmTW-bg-gray-800 dark:ttmTW-border-gray-700 ttmTW-hover:ttmTW-bg-gray-50 dark:ttmTW-hover:ttmTW-bg-gray-600'
      : '';

    let skip = 0;
    headers.forEach(({ originalHeader, alignment, textColor, fontSize }) => {
      if (skip) { skip--; return; }

      let val  = row[originalHeader] || '';
      let align = alignment;
      let color = textColor === 'ttmTW-text-white' ? 'ttmTW-text-black' : textColor;
      let span = 1;
      let fcss = fontSize ? `font-size:${fontSize}px` : '';

      if (val.includes('{C}')) { align = 'ttmTW-text-center'; val = val.replace('{C}', ''); }
      else if (val.includes('{L}')) { align = 'ttmTW-text-left'; val = val.replace('{L}', ''); }
      else if (val.includes('{R}')) { align = 'ttmTW-text-right'; val = val.replace('{R}', ''); }

      if (val.includes('{r}')) { color = 'ttmTW-text-red-500'; val = val.replace('{r}', ''); }
      if (val.includes('{g}')) { color = 'ttmTW-text-green-500'; val = val.replace('{g}', ''); }
      if (val.includes('{b}')) { color = 'ttmTW-text-blue-500'; val = val.replace('{b}', ''); }

      if (val.includes('{W}')) {
        val = val.replace('{W}', '');
        let next = headers.findIndex(h => h.originalHeader === originalHeader) + 1;
        while (next < headers.length && (!row[headers[next].originalHeader] || row[headers[next].originalHeader] === '')) {
          span++; skip++; next++; }
      }

      const m = val.match(/\{f(\d+)\}/);
      if (m) { fcss = `font-size:${m[1]}px`; val = val.replace(m[0], ''); }

      tr.appendChild(buildCell(span, val, color, align, fcss));
    });
    return tr;
  }

  function buildCell(span, val, color, align, fcss) {
    const td = document.createElement('td');
    td.colSpan = span;
    td.className =
      `ttmTW-px-2 ttmTW-py-2 ttmTW-border-b ttmTW-border-gray-200 ` +
      `ttmTW-bg-white ttmTW-font-normal ${color} ${align} ttmTW-align-middle`;
    if (fcss) td.style.cssText += `; ${fcss}`;

    if (val.includes('{B}')) {
      let [txt, url] = val.replace('{B}', '').split('>');
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      const btn = document.createElement('button');
      btn.className = 'ttmTW-bg-blue-500 ttmTW-hover:bg-blue-700 ttmTW-text-white ttmTW-font-medium ttmTW-py-1 ttmTW-px-2 ttmTW-rounded';
      btn.onclick = () => window.open(url, '_blank');
      btn.textContent = txt;
      td.appendChild(btn);
    } else {
      td.innerHTML = val;
    }
    return td;
  }

  // ───────────────────────────────────────────────────────────────────────────
  function displayNoDataMessage(el) {
    el.innerHTML =
      '<div class="ttmTW-flex ttmTW-justify-center ttmTW-items-center ttmTW-h-full ttmTW-text-gray-500 ttmTW-text-lg">No data available</div>';
  }
}

// ============================================================================
//  Bootstrapping utilities
// ============================================================================
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
