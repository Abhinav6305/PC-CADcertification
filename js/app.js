(function () {
  const CFG = window.CERT_CONFIG;
  const PEOPLE = window.PARTICIPANTS || [];
  const $ = (id) => document.getElementById(id);

  const els = {
    form: $("search-form"), q: $("q"), msg: $("msg"), results: $("results"),
    searchView: $("search-view"), personView: $("person-view"), back: $("back"),
    name: $("p-name"), meta: $("p-meta"), badge: $("p-badge"), tabs: $("tabs"),
    canvas: $("canvas"), loading: $("loading"),
    pdf: $("dl-pdf"), png: $("dl-png"), all: $("dl-all"),
  };

  // ---------- search ----------
  const norm = (s) => s.toLowerCase().replace(/[.\-_,]/g, " ").replace(/\s+/g, " ").trim();
  const compact = (s) => norm(s).replace(/ /g, "");

  function search(raw) {
    const q = norm(raw);
    if (!q) return [];
    const qc = q.replace(/ /g, "").toUpperCase();

    // Roll number: exact first, then partial (needs a digit and 4+ chars)
    const exact = PEOPLE.filter((p) => p.roll === qc);
    if (exact.length) return exact;
    if (/\d/.test(qc) && qc.length >= 4) {
      const partial = PEOPLE.filter((p) => p.roll.includes(qc));
      if (partial.length) return partial;
    }

    // Name: every query word must start some word of the name,
    // or the squashed query must appear inside the squashed name.
    const words = q.split(" ");
    return PEOPLE.filter((p) => {
      const nw = norm(p.name).split(" ");
      const byWords = words.every((w) => nw.some((n) => n.startsWith(w)));
      return byWords || (q.length >= 4 && compact(p.name).includes(compact(q)));
    });
  }

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const found = search(els.q.value);
    els.results.innerHTML = "";
    els.msg.textContent = "";
    if (!found.length) {
      els.msg.textContent = "No match found. Check your roll number or try part of your name.";
      return;
    }
    if (found.length === 1) return open(found[0]);
    els.msg.textContent = "";
    found.slice(0, 10).forEach((p) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = '<span class="r-name"></span><span class="r-roll"></span>';
      b.querySelector(".r-name").textContent = p.name;
      b.querySelector(".r-roll").textContent = p.roll;
      b.addEventListener("click", () => open(p));
      li.appendChild(b);
      els.results.appendChild(li);
    });
    if (found.length > 10) els.msg.textContent = `Showing 10 of ${found.length} matches — type more of your name.`;
  });

  els.back.addEventListener("click", () => {
    els.personView.hidden = true;
    els.searchView.hidden = false;
    els.q.focus();
    history.replaceState(null, "", location.pathname);
  });

  // ---------- templates ----------
  const imgCache = {};
  function loadImage(src) {
    if (!imgCache[src]) {
      imgCache[src] = new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => rej(new Error("Could not load " + src));
        im.src = src;
      });
    }
    return imgCache[src];
  }

  let fontReady = null;
  function ensureFont() {
    if (!fontReady) {
      fontReady = (document.fonts && document.fonts.load)
        ? document.fonts.load(`${CFG.nameWeight} 100px 'Playfair Display'`).catch(() => {})
        : Promise.resolve();
    }
    return fontReady;
  }

  async function render(canvas, person, type) {
    const t = CFG.templates[type];
    const [img] = await Promise.all([loadImage(t.file), ensureFont()]);
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const W = canvas.width, H = canvas.height;
    let size = Math.round(t.size * H);
    const setFont = () => (ctx.font = `${CFG.nameWeight} ${size}px ${CFG.nameFont}`);
    setFont();
    const maxW = t.maxWidth * W;
    while (ctx.measureText(person.name).width > maxW && size > 20) { size -= 2; setFont(); }

    ctx.fillStyle = CFG.nameColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(person.name, t.x * W, t.y * H);
    return canvas;
  }

  // ---------- person view ----------
  let current = null, currentType = null, busy = false;

  function certTypes(p) {
    const list = [];
    // Winners get only their Merit certificate; everyone else gets Participation
    if (p.award === "first-place" || p.award === "runner-up") return [p.award];
    return ["participation"];
  }

  function open(p) {
    current = p;
    els.searchView.hidden = true;
    els.personView.hidden = false;
    els.name.textContent = p.name;
    els.meta.textContent = `${p.roll} · ${p.year} Year` + (p.team ? ` · ${p.team}` : "");

    els.badge.hidden = !p.award;
    els.badge.className = "badge " + (p.award === "first-place" ? "first" : "runner");
    els.badge.textContent = p.award === "first-place" ? "★ First Place" : p.award === "runner-up" ? "Runner Up" : "";

    const types = certTypes(p);
    els.tabs.innerHTML = "";
    els.tabs.hidden = types.length < 2;
    types.forEach((type) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.dataset.type = type;
      b.textContent = CFG.templates[type].label;
      b.addEventListener("click", () => show(type));
      els.tabs.appendChild(b);
    });
    els.all.hidden = types.length < 2;
    els.all.textContent = `Download all ${types.length} as one PDF`;

    history.replaceState(null, "", "#" + p.roll);
    show(types[0]);
    window.scrollTo({ top: els.personView.offsetTop - 20, behavior: "smooth" });
  }

  async function show(type) {
    currentType = type;
    [...els.tabs.children].forEach((b) => b.setAttribute("aria-selected", b.dataset.type === type));
    els.loading.hidden = false;
    els.loading.textContent = "Preparing certificate…";
    try {
      await render(els.canvas, current, type);
      if (currentType === type) els.loading.hidden = true;
    } catch (err) {
      els.loading.textContent = "Couldn't load the certificate template. Please refresh and try again.";
      console.error(err);
    }
  }

  // ---------- downloads ----------
  const safe = (s) => s.replace(/[^\w]+/g, "_").replace(/^_|_$/g, "");
  const fileBase = (p, type) => `PSCAD_${safe(CFG.templates[type].label.replace("Certificate of ", "").replace("—", ""))}_${safe(p.name)}`;

  function save(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  const toBlob = (canvas, type, q) => new Promise((res) => canvas.toBlob(res, type, q));

  async function pageFor(type) {
    const c = type === currentType ? els.canvas : await render(document.createElement("canvas"), current, type);
    const blob = await toBlob(c, "image/jpeg", 0.93);
    return { jpegBytes: new Uint8Array(await blob.arrayBuffer()), width: c.width, height: c.height };
  }

  async function withBusy(btn, label, fn) {
    if (busy) return;
    busy = true;
    const old = btn.textContent;
    btn.disabled = true; btn.textContent = label;
    try { await fn(); } catch (e) { console.error(e); alert("Download failed. Please try again."); }
    finally { btn.disabled = false; btn.textContent = old; busy = false; }
  }

  els.pdf.addEventListener("click", () => withBusy(els.pdf, "Preparing PDF…", async () => {
    save(window.makeImagePdf([await pageFor(currentType)]), fileBase(current, currentType) + ".pdf");
  }));

  els.png.addEventListener("click", () => withBusy(els.png, "Preparing PNG…", async () => {
    save(await toBlob(els.canvas, "image/png"), fileBase(current, currentType) + ".png");
  }));

  els.all.addEventListener("click", () => withBusy(els.all, "Preparing PDF…", async () => {
    const pages = [];
    for (const t of certTypes(current)) pages.push(await pageFor(t));
    save(window.makeImagePdf(pages), `PSCAD_Certificates_${safe(current.name)}.pdf`);
  }));

  // ---------- deep link: #ROLLNO ----------
  const hash = decodeURIComponent(location.hash.slice(1)).toUpperCase();
  const linked = hash && PEOPLE.find((p) => p.roll === hash);
  if (linked) open(linked);

  // Warm the templates in the background
  Object.values(CFG.templates).forEach((t) => loadImage(t.file).catch(() => {}));
})();
