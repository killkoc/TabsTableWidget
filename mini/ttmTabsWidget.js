/*
 *  ttmGSTWidget.js – Hardened & documented version
 *  ---------------------------------------------------------------------------
 *  This file is a **drop‑in replacement** for the original widget script.  All
 *  visible behaviour remains identical, but the internals have been upgraded
 *  for security, accessibility, and maintainability.
 *
 *  Key improvements – each called‑out in the code:
 *  1.  **Robust RFC‑4180 CSV parsing** – supports quoted fields with commas and
 *      new‑lines without relying on external libs.
 *  2.  **XSS hardening** – no untrusted string ever flows into `innerHTML`.
 *      All text is assigned with `textContent`, and style tokens are validated.
 *  3.  **ARIA‑compliant tab bar** with full keyboard navigation.
 *  4.  **Helpers hoisted** to module scope to avoid re‑definition per widget.
 *  5.  **Single CSS reset class** instead of runtime inline‑style patches.
 *
 *  The script is wrapped in an IIFE so no globals leak except the public
 *  `ttmCreateGSTWidget` / `ttmInitializeWidgets` functions (same API as before).
 *  ------------------------------------------------------------------------- */

(() => {
  'use strict';

  // ───────────────────────────────────────────────────────────────────────────
  //  0.  Constants & one‑time bootstrapping
  // ───────────────────────────────────────────────────────────────────────────
  const RESET_STYLE_ID = 'ttmGSTWidgetResetStyle';

  /** Inject a tiny reset once so we don't need inline style hacks. */
  function injectResetCSS() {
    if (document.getElementById(RESET_STYLE_ID)) return; // already present

    const style = document.createElement('style');
    style.id = RESET_STYLE_ID;
    style.textContent = `
      /* List reset for tab bar */
      .ttmResetList { list-style:none; margin:0; padding:0; width:100%; }
      /* Visually hidden utility – used for a11y live‑region messages */
      .ttmVisuallyHidden {
        position:absolute !important; height:1px; width:1px; overflow:hidden;
        clip:rect(1px,1px,1px,1px); white-space:nowrap; border:0; padding:0;
      }
    `;
    document.head.appendChild(style);
  }

  injectResetCSS();

  // ───────────────────────────────────────────────────────────────────────────
  //  1.  CSV utilities (RFC‑4180 compliant, no 3rd‑party dep)                ║
  // ───────────────────────────────────────────────────────────────────────────
  /**
   * Parse a CSV string into an array of objects with **unique** keys.
   * Handles quoted fields, "escaped quote char" ("").  Delimiter fixed to ",".
   * @param {string} text  Raw CSV fetched from Google Sheets
   * @returns {object[]}   Array of row objects
   */
  function parseCSV(text) {
    // Normalise line endings to \n then run a finite‑state parser.
    text = text.replace(/\r\n?/g, '\n');

    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (inQuotes) {
        if (ch === '"' && text[i + 1] === '"') {
          field += '"'; // Escaped quote
          i++; // Skip next char
        } else if (ch === '"') {
          inQuotes = false; // Closing quote
        } else {
          field += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          row.push(field);
          field = '';
        } else if (ch === '\n') {
          row.push(field);
          rows.push(row);
          row = [];
          field = '';
        } else {
          field += ch;
        }
      }
    }
    // Push final field & row if not already terminated with \n
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);

    // First row contains headers – mangle to ensure uniqueness (foo,foo → foo_0, foo_1)
    const rawHeaders = rows.shift();
    const headers = rawHeaders.map((h, i) => `${h}_${i}`);

    return rows.map((cols) =>
      Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? '']))
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  2.  Fetch helper (un‑changed behaviour, but typed errors)               ║
  // ───────────────────────────────────────────────────────────────────────────
  async function fetchGSheetData(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error – status: ${res.status}`);
    return res.text();
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  3.  Token parsing helpers                                               ║
  // ───────────────────────────────────────────────────────────────────────────
  /** Clamp arbitrary font sizes into a safe range. */
  function clampFontSize(numString) {
    const n = Number(numString);
    return Number.isFinite(n) ? Math.min(48, Math.max(8, n)) : undefined;
  }

  /** Enum‑like maps for alignment & colour tokens. */
  const ALIGN_TOKEN_MAP = { '{C}': 'ttmTW-text-center', '{L}': 'ttmTW-text-left', '{R}': 'ttmTW-text-right' };
  const COLOR_TOKEN_MAP = { '{r}': 'ttmTW-text-red-500', '{g}': 'ttmTW-text-green-500', '{b}': 'ttmTW-text-blue-500' };

  /**
   * Parse header or cell value for inline formatting tokens.
   * Returns a meta object describing how the cell should be rendered.
   */
  function parseCellTokens(rawValue) {
    let val = rawValue;

    // Alignment ----------------------------------------------------------------
    let alignment = 'ttmTW-text-center'; // default
    for (const token of Object.keys(ALIGN_TOKEN_MAP)) {
      if (val.includes(token)) {
        alignment = ALIGN_TOKEN_MAP[token];
        val = val.replace(token, '');
        break; // only one alignment token makes sense
      }
    }

    // Colour -------------------------------------------------------------------
    let textColor = 'ttmTW-text-black'; // default in body, overridden in header later
    for (const token of Object.keys(COLOR_TOKEN_MAP)) {
      if (val.includes(token)) {
        textColor = COLOR_TOKEN_MAP[token];
        val = val.replace(token, '');
        break;
      }
    }

    // Font‑size token -----------------------------------------------------------
    let fontSize = undefined;
    const fsMatch = val.match(/\{f(\d+)\}/);
    if (fsMatch) {
      fontSize = clampFontSize(fsMatch[1]);
      val = val.replace(fsMatch[0], '');
    }

    // Wide‑cell token (colspan) -------------------------------------------------
    let colspan = 1;
    if (val.includes('{W}')) {
      val = val.replace('{W}', '');
      colspan = 'auto'; // resolved later when we know row context
    }

    // Button token --------------------------------------------------------------
    let isButton = false;
    let buttonLabel = '';
    let buttonUrl = '';
    if (val.includes('{B}')) {
      isButton   = true;
      val        = val.replace('{B}', '');
      [buttonLabel, buttonUrl] = val.split('>');
      val = ''; // text replaced by button
      if (!/^https?:\/\//i.test(buttonUrl)) buttonUrl = `https://${buttonUrl}`;
    }

    return { value: val, alignment, textColor, fontSize, colspan, isButton, buttonLabel, buttonUrl };
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  4.  Table‑building helpers                                              ║
  // ───────────────────────────────────────────────────────────────────────────
  function deriveHeaders(firstRowObj) {
    return Object.keys(firstRowObj).map((original, idx) => {
      const meta = parseCellTokens(original);

      return {
        originalHeader: original,
        header: meta.value.split('_')[0], // display text (strip uniqueness index)
        alignment: meta.alignment,
        textColor: 'ttmTW-text-white', // headers are always white text on blue bg
        fontSize: meta.fontSize,
      };
    });
  }

  function buildTableCell(meta, rowObj, headers, headerIdx) {
    const td = document.createElement('td');

    // Resolve colspan when {W} present (span across following empty cells)
    let colSpanVal = 1;
    if (meta.colspan === 'auto') {
      // Lookahead for consecutive empty cells
      let offset = headerIdx + 1;
      while (offset < headers.length && !rowObj[headers[offset].originalHeader]) {
        colSpanVal += 1;
        offset += 1;
      }
    }
    td.colSpan = colSpanVal;

    td.className = `ttmTW-px-2 ttmTW-py-2 ttmTW-border-b ttmTW-border-gray-200 ` +
                   `ttmTW-bg-white ttmTW-font-normal ${meta.textColor} ${meta.alignment} ` +
                   `ttmTW-align-middle`;

    if (meta.fontSize) td.style.fontSize = `${meta.fontSize}px`;

    if (meta.isButton) {
      const btn = document.createElement('button');
      btn.className = 'ttmTW-bg-blue-500 ttmTW-hover:bg-blue-700 ttmTW-text-white ' +
                      'ttmTW-font-medium ttmTW-py-1 ttmTW-px-2 ttmTW-rounded';
      btn.type = 'button';
      btn.textContent = meta.buttonLabel;
      btn.addEventListener('click', () => window.open(meta.buttonUrl, '_blank'));
      td.appendChild(btn);
    } else {
      // Safe text assignment – no HTML injection possible
      td.textContent = meta.value;
    }

    return td;
  }

  function createTableElement(dataArr) {
    const headers = deriveHeaders(dataArr[0]);

    // Root table element -------------------------------------------------------
    const tbl = document.createElement('table');
    tbl.className = 'ttmTable-content ttmTW-w-full ttmTW-text-xs ttmTW-text-left ' +
                    'ttmTW-text-gray-500 dark:ttmTW-text-gray-400';

    // Head ---------------------------------------------------------------------
    if (!headers.every((h) => !h.header.trim())) {
      const thead = document.createElement('thead');
      thead.className = 'ttmTW-text-xs ttmTW-text-gray-700 ttmTW-uppercase ' +
                        'ttmTW-bg-blue-500';
      const tr = document.createElement('tr');

      headers.forEach(({ header, alignment, textColor, fontSize }) => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.className = `ttmTW-px-2 ttmTW-py-3 ttmTW-border-b-2 ttmTW-border-gray-200 ` +
                       `${alignment} ttmTW-font-medium ${textColor} ` +
                       `ttmTW-uppercase ttmTW-align-middle`;
        if (fontSize) th.style.fontSize = `${fontSize}px`;
        th.textContent = header;
        tr.appendChild(th);
      });

      thead.appendChild(tr);
      tbl.appendChild(thead);
    }

    // Body ---------------------------------------------------------------------
    const tbody = document.createElement('tbody');

    dataArr.forEach((rowObj, rowIdx) => {
      const tr = document.createElement('tr');
      if (rowIdx % 2) {
        tr.className = 'ttmTW-bg-white ttmTW-border-b dark:ttmTW-bg-gray-800 ' +
                       'dark:ttmTW-border-gray-700 ttmTW-hover:ttmTW-bg-gray-50 ' +
                       'dark:ttmTW-hover:ttmTW-bg-gray-600';
      }

      headers.forEach((hMeta, hIdx) => {
        const cellMeta = parseCellTokens(rowObj[hMeta.originalHeader] || '');
        tr.appendChild(buildTableCell(cellMeta, rowObj, headers, hIdx));
      });

      tbody.appendChild(tr);
    });

    tbl.appendChild(tbody);
    return tbl;
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  5.  Tabs widget helpers                                                 ║
  // ───────────────────────────────────────────────────────────────────────────
  /** Build a <li><button role="tab">… element with a11y attributes. */
  function createTabElement(label, idx) {
    const li = document.createElement('li');
    li.className = 'ttmTW-flex-auto ttmTW-flex ttmTW-justify-center ttmTW-items-center ' +
                   'ttmTW-ml-0 last:ttmTW-mr-0 ttmTW-bg-gray-400 ttmTW-rounded-t-xl ttmTab-element';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.role = 'tab';
    btn.id = `ttmTab-${idx}`;
    btn.className = 'ttmTW-w-full ttmTW-text-xs ttmTW-font-semibold ttmTW-uppercase ' +
                    'ttmTW-text-white ttmTW-px-3 ttmTW-py-3';
    btn.dataset.index = String(idx);

    // Safe text assignment
    btn.textContent = label;
    li.appendChild(btn);

    return li;
  }

  /** Switch active tab – updates aria & visual state and (lazy) renders pane. */
  function switchTab(widgetElement, idx, buckets) {
    const tabBar = widgetElement.querySelector('[role="tablist"]');
    const contentArea = widgetElement.querySelector('.widget-container');

    const buttons = tabBar.querySelectorAll('button[role="tab"]');

    buttons.forEach((btn, i) => {
      const selected = i === idx;
      btn.setAttribute('aria-selected', String(selected));
      btn.tabIndex = selected ? 0 : -1;
      btn.parentElement.classList.toggle('ttmTW-bg-blue-500', selected);
      btn.parentElement.classList.toggle('ttmTW-bg-gray-400', !selected);
    });

    // Hide existing panes ------------------------------------------------------
    contentArea.querySelectorAll('.table-content').forEach((pane) => {
      pane.hidden = true;
    });

    // Show or build selected pane ---------------------------------------------
    const name = Object.keys(buckets)[idx];
    let pane = contentArea.querySelector(`[data-tab-name="${name}"]`);

    if (!pane) {
      pane = buildTabPane(name, buckets[name]);
      contentArea.appendChild(pane);
    }
    pane.hidden = false;
  }

  /** Lazy‑construct table pane for a single category bucket. */
  function buildTabPane(name, rows) {
    const pane = document.createElement('div');
    pane.dataset.tabName = name;
    pane.className = 'table-content';
    pane.hidden = false;

    const wrapper = document.createElement('div');
    wrapper.className = 'ttmTW-relative ttmTW-overflow-x-auto ttmTW-shadow-sm';
    wrapper.appendChild(createTableElement(rows));

    pane.appendChild(wrapper);
    return pane;
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  6.  Widget initialisers (public)                                         ║
  // ───────────────────────────────────────────────────────────────────────────
  async function ttmCreateGSTWidget(widgetElement, widgetIndex, widgetType) {
    // Guard against double‑initialisation -------------------------------------
    if (widgetElement.hasAttribute('ttmWidgetInit')) return;
    widgetElement.setAttribute('ttmWidgetInit', '');

    const widgetId = `${widgetType}-${widgetIndex}`;
    widgetElement.id = widgetId;

    const gsid = widgetElement.getAttribute('data-ttmGSID');
    if (!gsid) {
      displayNoDataMessage(widgetElement);
      return;
    }

    // Build published CSV URL (same logic as before) --------------------------
    const gsheetURL = gsid.startsWith('2PAC')
      ? `https://docs.google.com/spreadsheets/d/e/${gsid}/pub?output=csv`
      : `https://docs.google.com/spreadsheets/d/${gsid}/pub?output=csv`;

    try {
      const csvText = await fetchGSheetData(gsheetURL);
      const rows = parseCSV(csvText);

      widgetElement.innerHTML = ''; // wipe placeholder content

      if (widgetType === 'ttmTabsWidget') {
        initializeTabsWidget(widgetElement, widgetId, rows);
      } else {
        initializeSimpleTableWidget(widgetElement, widgetId, rows);
      }
    } catch (err) {
      console.error('Error fetching Google Sheet data:', err);
      displayNoDataMessage(widgetElement);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  6.a  Tabs widget                                                          ║
  // ───────────────────────────────────────────────────────────────────────────
  function initializeTabsWidget(widgetElement, widgetId, data) {
    // Scaffold ----------------------------------------------------------------
    const wrapper = document.createElement('div');
    wrapper.className = 'ttmTW-flex ttmTW-justify-center';
    wrapper.innerHTML =
      '<div class="ttmTW-w-full">' +
        '<div class="ttmTW-bg-transparent ttmTW-shadow-sm ttmTW-my-6">' +
          '<ul class="ttmResetList ttmTW-flex ttmTW-justify-around" role="tablist"></ul>' +
          '<div class="ttmTW-w-full widget-container"></div>' +
        '</div>' +
      '</div>';

    widgetElement.appendChild(wrapper);

    const tabBar = widgetElement.querySelector('[role="tablist"]');

    // Bucket rows by first column (category) ----------------------------------
    const categoryKey = Object.keys(data[0])[0];
    const buckets = {};
    data.forEach((row) => {
      const cat = row[categoryKey];
      if (!buckets[cat]) buckets[cat] = [];
      const { [categoryKey]: _omit, ...rest } = row; // strip category column
      buckets[cat].push(rest);
    });

    // Build tabs --------------------------------------------------------------
    const frag = document.createDocumentFragment();
    Object.keys(buckets).forEach((cat, idx) => {
      frag.appendChild(createTabElement(cat, idx));
    });
    tabBar.appendChild(frag);

    // Click handling ----------------------------------------------------------
    tabBar.addEventListener('click', (e) => {
      const btn = e.target.closest('button[role="tab"]');
      if (!btn) return;
      switchTab(widgetElement, Number(btn.dataset.index), buckets);
      btn.focus();
    });

    // Keyboard nav (← → Home End) --------------------------------------------
    tabBar.addEventListener('keydown', (e) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (!keys.includes(e.key)) return;

      const buttons = Array.from(tabBar.querySelectorAll('button[role="tab"]'));
      const current = buttons.indexOf(document.activeElement);
      if (current === -1) return;

      let next = current;
      if (e.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
      else if (e.key === 'ArrowRight') next = (current + 1) % buttons.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = buttons.length - 1;

      buttons[next].click(); // trigger switchTab & set focus via click handler
      e.preventDefault();
    });

    // Auto‑select first tab ----------------------------------------------------
    if (tabBar.firstChild) switchTab(widgetElement, 0, buckets);
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  6.b  Simple table widget (no tabs)                                        ║
  // ───────────────────────────────────────────────────────────────────────────
  function initializeSimpleTableWidget(widgetElement, widgetId, data) {
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

    const wrap = document.createElement('div');
    wrap.className = 'ttmTW-relative ttmTW-overflow-x-auto ttmTW-shadow-sm sm:ttmTW-rounded-lg';
    wrap.appendChild(createTableElement(data));

    container.appendChild(wrap);
    container.classList.add('table-content');
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  7.  Fallback UI helpers                                                  ║
  // ───────────────────────────────────────────────────────────────────────────
  function displayNoDataMessage(el) {
    el.innerHTML =
      '<div class="ttmTW-flex ttmTW-justify-center ttmTW-items-center ttmTW-h-full ' +
      'ttmTW-text-gray-500 ttmTW-text-lg">No data available</div>';
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  8.  Bootstrapping multiple widgets (public)                               ║
  // ───────────────────────────────────────────────────────────────────────────
  function ttmInitializeWidgets() {
    // Initialise tab widgets --------------------------------------------------
    Array.from(document.getElementsByClassName('ttmTabsWidget')).forEach((el, idx) => {
      ttmCreateGSTWidget(el, idx, 'ttmTabsWidget');
    });

    // Initialise plain table widgets -----------------------------------------
    Array.from(document.getElementsByClassName('ttmTableWidget')).forEach((el, idx) => {
      ttmCreateGSTWidget(el, idx, 'ttmTableWidget');
    });
  }

  // Expose public API on window (same names as legacy) ------------------------
  window.ttmCreateGSTWidget = ttmCreateGSTWidget;
  window.ttmInitializeWidgets = ttmInitializeWidgets;

  // Auto‑boot on DOM ready ----------------------------------------------------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ttmInitializeWidgets);
  } else {
    ttmInitializeWidgets();
  }
})();
