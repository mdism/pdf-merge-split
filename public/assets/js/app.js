/* PDF Merge & Split: copies pages between documents with pdf-lib, all in memory. */
(function () {
  const { dropZone, formatBytes, download, baseName } = window.Tool;
  const { PDFDocument } = window.PDFLib;
  const $ = s => document.querySelector(s);
  const isPdf = f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);

  /* ---------- tabs ---------- */
  const tabs = { merge: [$('#tabMerge'), $('#paneMerge')], split: [$('#tabSplit'), $('#paneSplit')] };
  Object.entries(tabs).forEach(([key, [tab]]) => tab.addEventListener('click', () => {
    Object.entries(tabs).forEach(([k, [t, pane]]) => { t.setAttribute('aria-selected', k === key); pane.hidden = k !== key; });
  }));

  async function openPdf(file) {
    const bytes = await file.arrayBuffer();
    try {
      return await PDFDocument.load(bytes);
    } catch (e) {
      if (/encrypt/i.test(e.message)) throw new Error(`"${file.name}" is password-protected. Remove the password first, then try again.`);
      throw new Error(`"${file.name}" could not be read as a PDF.`);
    }
  }

  function showErr(el, msg) { el.textContent = msg; el.hidden = !msg; }

  /* ---------- merge ---------- */
  const mergeList = $('#mergeList'), mergeCard = $('#mergeCard'), mergeErr = $('#mergeErr');
  let mergeFiles = []; // { file, pages }

  dropZone($('#dropMerge'), async files => {
    showErr(mergeErr, '');
    for (const file of files.filter(isPdf)) {
      const entry = { file, pages: null };
      mergeFiles.push(entry);
      renderMerge();
      try { entry.pages = (await openPdf(file)).getPageCount(); }
      catch (e) { entry.error = e.message; }
      renderMerge();
    }
  });

  function renderMerge() {
    mergeCard.hidden = !mergeFiles.length;
    mergeList.innerHTML = '';
    mergeFiles.forEach((entry, i) => {
      const li = document.createElement('li');
      li.className = 'item';
      const pages = entry.error ? `<span class="err">${entry.error}</span>` : entry.pages == null ? 'Reading…' : `${entry.pages} page${entry.pages > 1 ? 's' : ''}`;
      li.innerHTML = `<div class="thumb" style="display:grid;place-items:center;font-weight:800;color:var(--orange)">${i + 1}</div>
        <div class="info"><div class="name"></div><div class="meta">${formatBytes(entry.file.size)} · ${pages}</div></div>
        <div class="actions">
          <button class="btn small" type="button" data-act="up" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn small" type="button" data-act="down" aria-label="Move down" ${i === mergeFiles.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn small" type="button" data-act="rm" aria-label="Remove">✕</button>
        </div>`;
      li.querySelector('.name').textContent = entry.file.name;
      li.addEventListener('click', e => {
        const act = e.target.closest('button')?.dataset.act;
        if (!act) return;
        if (act === 'rm') mergeFiles.splice(i, 1);
        if (act === 'up') [mergeFiles[i - 1], mergeFiles[i]] = [mergeFiles[i], mergeFiles[i - 1]];
        if (act === 'down') [mergeFiles[i + 1], mergeFiles[i]] = [mergeFiles[i], mergeFiles[i + 1]];
        renderMerge();
      });
      mergeList.appendChild(li);
    });
    const total = mergeFiles.reduce((s, f) => s + (f.pages || 0), 0);
    $('#mergeInfo').textContent = `${mergeFiles.length} file${mergeFiles.length === 1 ? '' : 's'} · ${total} pages in total`;
    $('#mergeBtn').disabled = mergeFiles.length < 2 || mergeFiles.some(f => f.pages == null);
  }

  $('#mergeClear').addEventListener('click', () => { mergeFiles = []; showErr(mergeErr, ''); renderMerge(); });

  $('#mergeBtn').addEventListener('click', async () => {
    const btn = $('#mergeBtn'), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Merging…'; showErr(mergeErr, '');
    try {
      const out = await PDFDocument.create();
      for (const { file } of mergeFiles) {
        const src = await openPdf(file);
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach(p => out.addPage(p));
      }
      const bytes = await out.save();
      download(new Blob([bytes], { type: 'application/pdf' }), 'merged.pdf');
    } catch (e) { showErr(mergeErr, e.message); }
    btn.textContent = label; btn.disabled = false;
  });

  /* ---------- split ---------- */
  const splitCard = $('#splitCard'), splitErr = $('#splitErr'), dropSplit = $('#dropSplit');
  let splitFile = null, splitDoc = null, mode = 'range';

  dropZone(dropSplit, async files => {
    const file = files.find(isPdf);
    if (!file) return;
    showErr(splitErr, '');
    try {
      splitDoc = await openPdf(file);
      splitFile = file;
      $('#splitName').textContent = file.name;
      $('#splitPages').textContent = `${formatBytes(file.size)} · ${splitDoc.getPageCount()} pages`;
      $('#range').value = '';
      splitCard.hidden = false; dropSplit.hidden = true;
    } catch (e) {
      splitCard.hidden = false; showErr(splitErr, e.message);
    }
  });

  $('#splitClear').addEventListener('click', () => {
    splitFile = splitDoc = null; splitCard.hidden = true; dropSplit.hidden = false; showErr(splitErr, '');
  });

  document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', x === b));
    $('#modeRange').hidden = mode !== 'range';
    $('#modeChunks').hidden = mode !== 'chunks';
  }));

  /** "1-3, 5, 9-7" → [0,1,2,4,8,7,6] (zero-based). Throws on anything out of range. */
  function parseRange(text, count) {
    const out = [];
    const parts = text.split(',').map(s => s.trim()).filter(Boolean);
    if (!parts.length) throw new Error('Type the pages you want, for example 1-3, 5.');
    for (const part of parts) {
      const m = part.match(/^(\d+)\s*(?:-\s*(\d+|end))?$/i);
      if (!m) throw new Error(`"${part}" is not a page or range.`);
      const a = +m[1], b = m[2] ? (m[2].toLowerCase() === 'end' ? count : +m[2]) : a;
      if (a < 1 || b < 1 || a > count || b > count) throw new Error(`Page ${Math.max(a, b)} does not exist. This PDF has ${count} pages.`);
      const step = a <= b ? 1 : -1;
      for (let p = a; p !== b + step; p += step) out.push(p - 1);
    }
    return out;
  }

  async function buildPdf(indices) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(splitDoc, indices);
    pages.forEach(p => out.addPage(p));
    return out.save();
  }

  $('#splitBtn').addEventListener('click', async () => {
    const btn = $('#splitBtn'), label = btn.textContent;
    showErr(splitErr, '');
    const count = splitDoc.getPageCount(), name = baseName(splitFile.name);
    try {
      let groups;
      if (mode === 'range') groups = [parseRange($('#range').value, count)];
      else {
        const size = mode === 'each' ? 1 : Math.max(1, parseInt($('#chunk').value, 10) || 1);
        groups = [];
        for (let i = 0; i < count; i += size) groups.push([...Array(Math.min(size, count - i)).keys()].map(k => k + i));
      }
      btn.disabled = true; btn.textContent = 'Working…';

      if (groups.length === 1) {
        const bytes = await buildPdf(groups[0]);
        download(new Blob([bytes], { type: 'application/pdf' }), `${name}-pages.pdf`);
      } else {
        const files = {};
        for (const g of groups) {
          const part = g.length === 1 ? `${g[0] + 1}` : `${g[0] + 1}-${g[g.length - 1] + 1}`;
          files[`${name}-page-${part}.pdf`] = [await buildPdf(g), { level: 0 }];
        }
        download(new Blob([fflate.zipSync(files)], { type: 'application/zip' }), `${name}-split.zip`);
      }
    } catch (e) { showErr(splitErr, e.message); }
    btn.textContent = label; btn.disabled = false;
  });
})();
