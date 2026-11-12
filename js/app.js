/*
 * Cuentas Claras — UI. Hash routing, one render function per screen.
 */
(() => {
  const { eur, pct, esc, date } = CC.fmt;
  const C = CC.calc, S = CC.store, D = CC.docs, T = CC.TAX;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const main = $("#main");

  const NAV = [
    ["home", "Overview", "◎"],
    ["roadmap", "Roadmap", "➜"],
    ["libros", "Libros (ledger)", "▤"],
    ["trimestral", "Quarterly 303 / 130", "Q"],
    ["renta", "Renta & documents", "⇩"],
    ["reta", "Cuota autónomo", "€"],
    ["compare", "Autónomo vs S.L.", "⇄"],
    ["factura", "Invoice generator", "✎"],
    ["calendar", "Tax calendar", "▦"],
    ["expat", "Expat guide", "✈"],
    ["guide", "Expenses & glossary", "?"],
    ["settings", "Profile & backup", "⚙"],
  ];

  const now = new Date();
  const curYear = now.getFullYear();
  const years = () => {
    const ys = new Set([curYear, curYear - 1, T.year]);
    S.entries().forEach((e) => e.date && ys.add(C.yearOf(e.date)));
    return [...ys].sort((a, b) => b - a);
  };
  const yearOptions = (sel) => years().map((y) => `<option ${y === sel ? "selected" : ""}>${y}</option>`).join("");
  const verifyBadge = (v) => (v ? `<span class="badge warn" title="Pending official confirmation for this year — check the BOE/AEAT">verify</span>` : "");
  const num = (v) => +String(v ?? "").replace(",", ".") || 0;

  function nav() {
    const route = (location.hash.replace(/^#\/?/, "") || "home").split("/")[0];
    $("#nav").innerHTML = NAV.map(([id, label, ic]) => `<a href="#/${id}" class="${route === id ? "active" : ""}"><span class="ic">${ic}</span>${label}</a>`).join("");
    return route;
  }

  function render() {
    const route = nav();
    const fn = SCREENS[route] || SCREENS.home;
    main.innerHTML = "";
    fn();
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    document.body.classList.remove("nav-open");
  }

  /* ---------------- Deadlines ---------------- */
  function deadlines(y) {
    return [
      [`${y}-01-30`, "303 + 130 Q4, 390, 190/180"], [`${y}-02-28`, "347"], [`${y}-03-31`, "720 / 721"],
      [`${y}-04-20`, "303 + 130 Q1, 202 (S.L.)"], [`${y}-06-30`, "Renta (modelo 100)"], [`${y}-07-20`, "303 + 130 Q2"],
      [`${y}-07-25`, "200 Sociedades"], [`${y}-10-20`, "303 + 130 Q3, 202 (S.L.)"], [`${y}-12-20`, "202 (S.L.)"],
    ].map(([d, t]) => ({ d: new Date(d + "T23:59:59"), t }));
  }
  const nextDeadlines = (n = 3) => [...deadlines(curYear), ...deadlines(curYear + 1)].filter((x) => x.d >= now).slice(0, n);

  /* ================================================================ */
  const SCREENS = {};

  SCREENS.home = () => {
    const p = S.profile();
    const y = curYear, q = Math.floor(now.getMonth() / 3) + 1;
    const entries = S.entries();
    const v = C.modelo303(entries, y, q), m = C.modelo130(entries, y, q);
    const a = C.annualFromLedger(entries, y);
    const all = Object.values(CC.ROADMAPS).flatMap((r) => r.steps);
    const done = all.filter((s) => S.isDone(s.id)).length;
    main.innerHTML = `
      <header class="page-head"><h1>Cuentas Claras</h1><p class="lead">Your own asesoría for being self-employed in Spain as an expat — from NIE to autónomo to Sociedad Limitada. Keep your books, compute every quarterly model, estimate your renta and download the documents you need.</p></header>
      ${entries.length ? "" : `<div class="callout"><b>Start here:</b> fill in your <a href="#/settings">profile</a>, follow the <a href="#/roadmap">roadmap</a>, then record invoices in the <a href="#/libros">libros</a>. Want to explore first? <button class="btn small" data-act="demo">Load demo data</button></div>`}
      <div class="stats">
        <div class="stat"><div class="k">Roadmap</div><div class="v">${done}/${all.length}</div><div class="s">steps done</div></div>
        <div class="stat"><div class="k">Income ${y}</div><div class="v">${eur(a.ingresos)}</div><div class="s">${entries.filter((e) => e.type === "income" && C.yearOf(e.date) === y).length} invoices</div></div>
        <div class="stat"><div class="k">303 · ${q}T so far</div><div class="v">${eur(v.resultado)}</div><div class="s">${v.resultado >= 0 ? "to pay" : "to offset"}</div></div>
        <div class="stat"><div class="k">130 · ${q}T so far</div><div class="v">${eur(m.ingresar)}</div><div class="s">${m.exempt70 ? "likely exempt (≥70 % withheld)" : "IRPF advance"}</div></div>
      </div>
      <div class="grid2">
        <section class="card"><h2>Next deadlines</h2><ul class="deadlines">${nextDeadlines(4).map((x) => `<li><span class="date">${x.d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</span>${esc(x.t)}<span class="muted"> · in ${Math.ceil((x.d - now) / 864e5)} days</span></li>`).join("")}</ul><a class="btn ghost" href="#/calendar">Full calendar</a></section>
        <section class="card"><h2>Which path are you on?</h2>
          <div class="paths">
            <a class="path" href="#/roadmap/foundation"><b>New in Spain</b><span>NIE, padrón, certificado digital, residency & Beckham</span></a>
            <a class="path" href="#/roadmap/autonomo"><b>Becoming autónomo</b><span>036, RETA, tarifa plana, invoicing, quarterly models</span></a>
            <a class="path" href="#/roadmap/sl"><b>Moving to an S.L.</b><span>Name, notary, Registro, autónomo societario, accounts</span></a>
          </div></section>
      </div>
      <section class="card"><h2>What this app does like an asesoría — and better</h2>
        <div class="features">
          <div><b>Libros registro</b><p>Income, expenses and assets, exportable in the AEAT column layout.</p></div>
          <div><b>303 & 130</b><p>Quarterly VAT and IRPF advance computed from your books, including reverse charge and the 70 % retention rule.</p></div>
          <div><b>Renta E1 sheet</b><p>A ready-to-copy summary for Renta WEB with an estimate of what you will pay or get back.</p></div>
          <div><b>Shows its working</b><p>Every figure comes with the steps behind it, so you can check it yourself.</p></div>
        </div></section>
      <p class="disclaimer">Parameters: tax year ${T.year}. Figures marked <span class="badge warn">verify</span> were pending official confirmation when written. This tool supports your own filings; it is not a substitute for advice on unusual situations (inheritances, international restructurings, inspections).</p>`;
  };

  /* ---------------- Roadmap ---------------- */
  SCREENS.roadmap = () => {
    const tab = location.hash.split("/")[2] || "foundation";
    const r = CC.ROADMAPS[tab] || CC.ROADMAPS.foundation;
    const done = r.steps.filter((s) => S.isDone(s.id)).length;
    main.innerHTML = `
      <header class="page-head"><h1>Roadmap</h1><p class="lead">Step by step, in the order the administration expects. Tick steps as you go — progress is saved in this browser.</p></header>
      <div class="tabs">${Object.entries(CC.ROADMAPS).map(([k, v]) => `<a href="#/roadmap/${k}" class="${k === tab ? "active" : ""}">${esc(v.title)}</a>`).join("")}</div>
      <div class="progress"><div style="width:${(done / r.steps.length) * 100}%"></div></div>
      <p class="muted">${done} of ${r.steps.length} done · <button class="link" data-act="print-roadmap">Download roadmap as PDF</button></p>
      <p>${esc(r.intro)}</p>
      <ol class="steps">${r.steps.map((s) => `
        <li class="step ${S.isDone(s.id) ? "done" : ""}">
          <label class="check"><input type="checkbox" data-step="${s.id}" ${S.isDone(s.id) ? "checked" : ""}><span></span></label>
          <details ${S.isDone(s.id) ? "" : "open"}>
            <summary><b>${esc(s.title)}</b> ${s.tag ? `<span class="badge">${esc(s.tag)}</span>` : ""}</summary>
            <p>${esc(s.why)}</p>
            ${s.how ? `<ul>${s.how.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
            ${s.docs ? `<p><b>Bring:</b> ${s.docs.map(esc).join(" · ")}</p>` : ""}
            ${s.forms ? `<p><b>Forms:</b> ${s.forms.map((f) => { const F = CC.FORMS.find((x) => x.code === f); return F ? `<a href="${F.url}" target="_blank" rel="noopener">Modelo ${f}</a>` : `Modelo ${esc(f)}`; }).join(" · ")}</p>` : ""}
            ${s.link ? `<p><a href="${s.link}" target="_blank" rel="noopener">Official page ↗</a></p>` : ""}
          </details></li>`).join("")}</ol>`;
    $$("[data-step]").forEach((cb) => cb.addEventListener("change", () => { S.toggleStep(cb.dataset.step, cb.checked); render(); }));
  };

  /* ---------------- Libros ---------------- */
  let ledgerFilter = { y: curYear, q: 0, type: "" };
  let editing = null;

  SCREENS.libros = () => {
    const f = ledgerFilter;
    const list = S.entries().filter((e) => C.yearOf(e.date) === f.y && (!f.q || C.quarterOf(e.date) === f.q) && (!f.type || e.type === f.type));
    const s = C.sums(list);
    const e = editing || { type: "income", date: new Date().toISOString().slice(0, 10), ivaRate: 21, irpfRate: S.profile().newActivity ? 7 : 15, deductiblePct: 100, category: "otros" };
    const catOpts = Object.entries(CC.CATEGORIES).map(([k, v]) => `<option value="${k}" ${e.category === k ? "selected" : ""}>${esc(v)}</option>`).join("");
    const assetOpts = Object.entries(C.AMORT).map(([k, v]) => `<option value="${k}" ${e.assetType === k ? "selected" : ""}>${esc(v.label)} (${v.rate * 100} %)</option>`).join("");
    const nextNum = `${S.profile().invoiceSeries || f.y}-${String(S.profile().nextInvoice || 1).padStart(3, "0")}`;

    main.innerHTML = `
      <header class="page-head"><h1>Libros registro</h1><p class="lead">Record every invoice you issue and receive. This is the source for the quarterly models, the renta summary and the CSV books.</p></header>
      <section class="card">
        <h2>${editing ? "Edit entry" : "New entry"}</h2>
        <form id="entry" class="form" autocomplete="off">
          <div class="seg">${["income", "expense"].map((t) => `<label><input type="radio" name="type" value="${t}" ${e.type === t ? "checked" : ""}><span>${t === "income" ? "Factura emitida (income)" : "Factura recibida (expense)"}</span></label>`).join("")}</div>
          <div class="row">
            <label>Date<input type="date" name="date" value="${esc(e.date)}" required></label>
            <label>Invoice nº<input name="number" value="${esc(e.number ?? (e.type === "income" ? nextNum : ""))}" placeholder="${e.type === "income" ? nextNum : "Supplier's number"}"></label>
            <label class="grow">${e.type === "income" ? "Client" : "Supplier"}<input name="party" value="${esc(e.party)}" required></label>
            <label>NIF / VAT nº<input name="partyNif" value="${esc(e.partyNif)}"></label>
          </div>
          <div class="row">
            <label class="grow">Concept<input name="concept" value="${esc(e.concept)}"></label>
            <label>Base (€, excl. VAT)<input name="base" inputmode="decimal" value="${esc(e.base)}" required></label>
            <label>IVA %<select name="ivaRate">${[21, 10, 4, 0].map((r) => `<option ${+e.ivaRate === r ? "selected" : ""}>${r}</option>`).join("")}</select></label>
            <label>IRPF retention %<select name="irpfRate">${[0, 7, 15, 19].map((r) => `<option ${+e.irpfRate === r ? "selected" : ""}>${r}</option>`).join("")}</select></label>
          </div>
          <div class="row only-income">
            <label class="inline"><input type="checkbox" name="noVat" ${e.noVat ? "checked" : ""}> No Spanish VAT (EU B2B or outside the EU)</label>
            <label class="inline"><input type="checkbox" name="euB2B" ${e.euB2B ? "checked" : ""}> EU business client (goes to modelo 349)</label>
          </div>
          <div class="row only-expense">
            <label>Category<select name="category">${catOpts}</select></label>
            <label>% business use<input name="deductiblePct" inputmode="decimal" value="${esc(e.deductiblePct ?? 100)}"></label>
            <label class="inline"><input type="checkbox" name="reverseCharge" ${e.reverseCharge ? "checked" : ""}> Reverse charge (EU/foreign service without Spanish VAT)</label>
            <label class="inline"><input type="checkbox" name="isInvestment" ${e.isInvestment ? "checked" : ""}> Asset (bien de inversión &gt; 300 €)</label>
            <label class="only-asset">Asset type<select name="assetType">${assetOpts}</select></label>
          </div>
          <div class="actions"><button class="btn" type="submit">${editing ? "Save changes" : "Add to libro"}</button>${editing ? `<button class="btn ghost" type="button" data-act="cancel-edit">Cancel</button>` : ""}<span class="muted" id="preview"></span></div>
        </form>
      </section>
      <section class="card">
        <div class="toolbar">
          <label>Year<select id="fy">${yearOptions(f.y)}</select></label>
          <label>Quarter<select id="fq"><option value="0">All</option>${[1, 2, 3, 4].map((q) => `<option value="${q}" ${f.q === q ? "selected" : ""}>${q}T</option>`).join("")}</select></label>
          <label>Type<select id="ft"><option value="">All</option><option value="income" ${f.type === "income" ? "selected" : ""}>Income</option><option value="expense" ${f.type === "expense" ? "selected" : ""}>Expenses</option></select></label>
          <span class="grow"></span>
          <button class="btn ghost small" data-act="csv-in">Ingresos CSV</button><button class="btn ghost small" data-act="csv-out">Gastos CSV</button><button class="btn ghost small" data-act="csv-assets">Bienes CSV</button>
        </div>
        <div class="stats mini">
          <div class="stat"><div class="k">Income</div><div class="v">${eur(s.ingresos)}</div></div>
          <div class="stat"><div class="k">Expenses (deductible)</div><div class="v">${eur(s.gastos + s.reta)}</div></div>
          <div class="stat"><div class="k">VAT charged − paid</div><div class="v">${eur(s.ivaRepercutido - s.ivaSoportado)}</div></div>
          <div class="stat"><div class="k">IRPF withheld by clients</div><div class="v">${eur(s.retenciones)}</div></div>
        </div>
        <div class="table-wrap"><table class="data"><thead><tr><th>Date</th><th>Nº</th><th>Party</th><th>Concept</th><th class="n">Base</th><th class="n">IVA</th><th class="n">IRPF</th><th class="n">Total</th><th></th></tr></thead><tbody>
        ${list.map((x) => {
          const base = +x.base || 0, iva = x.noVat || x.reverseCharge ? 0 : base * (+x.ivaRate || 0) / 100, ret = base * (+x.irpfRate || 0) / 100;
          return `<tr class="${x.type}"><td>${date(x.date)}</td><td>${esc(x.number)}</td><td>${esc(x.party)}<div class="muted small">${esc(x.partyNif)}</div></td><td>${esc(x.concept)}${x.isInvestment ? ' <span class="badge">asset</span>' : ""}${x.reverseCharge ? ' <span class="badge">ISP</span>' : ""}${x.euB2B ? ' <span class="badge">EU</span>' : ""}${x.deductiblePct && +x.deductiblePct !== 100 && x.type === "expense" ? ` <span class="badge">${x.deductiblePct} %</span>` : ""}</td><td class="n">${x.type === "expense" ? "−" : ""}${eur(base)}</td><td class="n">${eur(iva)}</td><td class="n">${ret ? "−" + eur(ret) : ""}</td><td class="n">${eur(base + iva - ret)}</td><td class="nowrap"><button class="icon" data-edit="${x.id}" title="Edit">✎</button><button class="icon" data-del="${x.id}" title="Delete">✕</button></td></tr>`;
        }).join("") || `<tr><td colspan="9" class="empty">No entries for this filter. ${S.entries().length ? "" : '<button class="btn small" data-act="demo">Load demo data</button>'}</td></tr>`}
        </tbody></table></div>
      </section>`;

    const form = $("#entry");
    const sync = () => {
      const t = form.type.value;
      $$(".only-income", form).forEach((el) => (el.hidden = t !== "income"));
      $$(".only-expense", form).forEach((el) => (el.hidden = t !== "expense"));
      $$(".only-asset", form).forEach((el) => (el.hidden = !(t === "expense" && form.isInvestment.checked)));
      if (form.euB2B.checked) form.noVat.checked = true;
      const base = num(form.base.value), iva = (t === "income" && form.noVat.checked) || (t === "expense" && form.reverseCharge.checked) ? 0 : base * form.ivaRate.value / 100;
      const ret = t === "income" ? base * form.irpfRate.value / 100 : 0;
      $("#preview").textContent = base ? `Total ${eur(base + iva - ret)} (IVA ${eur(iva)}${ret ? `, retention −${eur(ret)}` : ""})` : "";
    };
    form.addEventListener("input", sync);
    form.addEventListener("change", (ev) => {
      if (ev.target.name === "type") {
        editing = { ...readEntry(form), type: form.type.value, irpfRate: form.type.value === "expense" ? 0 : (S.profile().newActivity ? 7 : 15), number: form.type.value === "income" ? undefined : "" , id: editing?.id };
        if (!editing.id) delete editing.id;
        render();
      }
      if (ev.target.name === "noVat" || ev.target.name === "euB2B") { if (form.noVat.checked) { form.ivaRate.value = 0; form.irpfRate.value = 0; } sync(); }
    });
    sync();
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const x = readEntry(form);
      if (editing && editing.id) x.id = editing.id;
      else if (x.type === "income" && x.number === nextNum) S.setProfile({ nextInvoice: (S.profile().nextInvoice || 1) + 1 });
      S.upsertEntry(x);
      editing = null;
      ledgerFilter.y = C.yearOf(x.date);
      toast("Saved to the libro");
      render();
    });
    $("#fy").onchange = (ev) => { ledgerFilter.y = +ev.target.value; render(); };
    $("#fq").onchange = (ev) => { ledgerFilter.q = +ev.target.value; render(); };
    $("#ft").onchange = (ev) => { ledgerFilter.type = ev.target.value; render(); };
    $$("[data-edit]").forEach((b) => (b.onclick = () => { editing = { ...S.entries().find((x) => x.id === b.dataset.edit) }; render(); }));
    $$("[data-del]").forEach((b) => (b.onclick = () => { if (confirm("Delete this entry?")) { S.removeEntry(b.dataset.del); render(); } }));
  };

  function readEntry(form) {
    const fd = new FormData(form);
    const t = fd.get("type");
    const x = {
      type: t, date: fd.get("date"), number: (fd.get("number") || "").trim(), party: (fd.get("party") || "").trim(),
      partyNif: (fd.get("partyNif") || "").trim().toUpperCase(), concept: (fd.get("concept") || "").trim(),
      base: num(fd.get("base")), ivaRate: +fd.get("ivaRate"), irpfRate: +fd.get("irpfRate"),
    };
    if (t === "income") { x.noVat = !!fd.get("noVat"); x.euB2B = !!fd.get("euB2B"); if (x.noVat) x.ivaRate = 0; }
    else {
      x.category = fd.get("category"); x.deductiblePct = num(fd.get("deductiblePct")) || 100; x.reverseCharge = !!fd.get("reverseCharge");
      x.isInvestment = !!fd.get("isInvestment"); if (x.isInvestment) x.assetType = fd.get("assetType");
      if (x.category === "reta") { x.ivaRate = 0; x.deductiblePct = 100; }
    }
    return x;
  }

  /* ---------------- Trimestral ---------------- */
  let qSel = { y: curYear, q: Math.max(1, Math.floor(now.getMonth() / 3)) || 1 };
  SCREENS.trimestral = () => {
    const entries = S.entries();
    const v = C.modelo303(entries, qSel.y, qSel.q), m = C.modelo130(entries, qSel.y, qSel.q);
    const due = ["1–20 April", "1–20 July", "1–20 October", `1–30 January ${qSel.y + 1}`][qSel.q - 1];
    main.innerHTML = `
      <header class="page-head"><h1>Quarterly models</h1><p class="lead">Modelo 303 (VAT) and modelo 130 (IRPF advance) computed from your libros. Copy the boxes into the AEAT forms (or Pre303).</p></header>
      <div class="toolbar"><label>Year<select id="qy">${yearOptions(qSel.y)}</select></label>
        <div class="seg">${[1, 2, 3, 4].map((q) => `<label><input type="radio" name="qq" value="${q}" ${qSel.q === q ? "checked" : ""}><span>${q}T</span></label>`).join("")}</div>
        <span class="grow"></span><span class="muted">Filing period: <b>${due}</b></span>
        <button class="btn small" data-act="print-q">Download worksheet (PDF)</button></div>
      ${v.count === 0 ? `<div class="callout">No entries in ${qSel.q}T ${qSel.y}. Add invoices in the <a href="#/libros">libros</a>${S.entries().length ? "" : ' or <button class="btn small" data-act="demo">load demo data</button>'}.</div>` : ""}
      <div class="grid2">
        <section class="card"><h2>Modelo 303 — IVA <a class="ext" href="${CC.FORMS.find((f) => f.code === "303").url}" target="_blank" rel="noopener">AEAT ↗</a></h2>
          <table class="calc">
            ${Object.entries(v.byRate).map(([r, x]) => `<tr><td>Base at ${r} % → cuota</td><td class="n">${eur(x.base)} → ${eur(x.cuota)}</td></tr>`).join("")}
            ${v.reverseCharge ? `<tr><td>Reverse charge (devengado and deducible)</td><td class="n">${eur(v.reverseCharge)}</td></tr>` : ""}
            <tr class="sub"><td>IVA devengado</td><td class="n">${eur(v.devengado)}</td></tr>
            <tr><td>IVA deducible (purchases × business use)</td><td class="n">−${eur(v.deducible)}</td></tr>
            <tr class="total"><td>${v.resultado >= 0 ? "To pay" : qSel.q === 4 ? "To refund or offset" : "To offset next quarter"}</td><td class="n">${eur(Math.abs(v.resultado))}</td></tr>
          </table>
          ${v.euSales ? `<p class="note">EU B2B sales ${eur(v.euSales)}: declare them in the 303 informative box for intra-EU deliveries/services and in <b>modelo 349</b> the same quarter.</p>` : ""}
          ${v.exportsNoSujeto ? `<p class="note">Services to non-EU clients ${eur(v.exportsNoSujeto)}: "operaciones no sujetas por reglas de localización" box.</p>` : ""}
          <p class="muted small">A negative result in Q1–Q3 is offset in later quarters. In Q4 you can ask for a refund, or offset it next year.</p>
        </section>
        <section class="card"><h2>Modelo 130 — IRPF <a class="ext" href="${CC.FORMS.find((f) => f.code === "130").url}" target="_blank" rel="noopener">AEAT ↗</a></h2>
          <table class="calc">
            <tr><td>[01] Income 1 Jan → end ${qSel.q}T</td><td class="n">${eur(m.ingresos)}</td></tr>
            <tr><td>[02] Deductible expenses (incl. RETA ${m.amort ? "and amortisation " + eur(m.amort) : ""})</td><td class="n">−${eur(m.gastos)}</td></tr>
            <tr class="sub"><td>[03] Net yield</td><td class="n">${eur(m.rn)}</td></tr>
            <tr><td>[04] 20 %</td><td class="n">${eur(m.c03)}</td></tr>
            <tr><td>[05] Previous 130 payments this year</td><td class="n">−${eur(m.previos)}</td></tr>
            <tr><td>[06] IRPF withheld by clients (accumulated)</td><td class="n">−${eur(m.retenciones)}</td></tr>
            <tr class="total"><td>To pay</td><td class="n">${eur(m.ingresar)}</td></tr>
          </table>
          ${m.resultado < 0 ? `<p class="note">The result is negative (${eur(m.resultado)}): file the 130 with result 0 — the amount is not refunded, but because the 130 is cumulative it reduces later quarters. The real balance is settled in the renta.</p>` : ""}
          ${m.exempt70 ? `<p class="note good">≥ 70 % of your income this year carried IRPF retention: if that was also true last year, <b>you don't need to file the 130</b> (art. 109.1 RIRPF).</p>` : ""}
        </section>
      </div>
      <section class="card"><h2>Also this quarter?</h2><ul>
        <li><b>Modelo 111</b> — if you paid invoices with IRPF retention (e.g. another freelancer) or salaries.</li>
        <li><b>Modelo 115</b> — if you rent an office/premises: withhold 19 % of the rent.</li>
        <li><b>Modelo 349</b> — if you had EU B2B sales or bought EU services (also reverse-charge SaaS like Google, Meta, AWS Ireland).</li></ul></section>`;
    $("#qy").onchange = (ev) => { qSel.y = +ev.target.value; render(); };
    $$("[name=qq]").forEach((r) => (r.onchange = () => { qSel.q = +r.value; render(); }));
  };

  /* ---------------- RETA ---------------- */
  let retaIn = { profit: 30000, tarifa: false, societario: false };
  SCREENS.reta = () => {
    const r = C.reta({ annualNetProfit: retaIn.profit, tarifaPlana: retaIn.tarifa, societario: retaIn.societario });
    main.innerHTML = `
      <header class="page-head"><h1>Cuota de autónomo ${T.year} ${verifyBadge(T.reta.verify)}</h1><p class="lead">Since 2023 the cuota depends on your real net yield. You pick a tramo with your forecast; the TGSS regularises it the following year with the AEAT data (refund or extra charge).</p></header>
      <section class="card"><form class="form" id="rf">
        <div class="row"><label class="grow">Expected annual net profit (income − expenses, before the cuota)<input name="profit" inputmode="decimal" value="${retaIn.profit}"></label></div>
        <div class="row"><label class="inline"><input type="checkbox" name="tarifa" ${retaIn.tarifa ? "checked" : ""}> Tarifa plana (first 12 months: ${T.reta.tarifaPlana.monthly} €/month)</label>
        <label class="inline"><input type="checkbox" name="societario" ${retaIn.societario ? "checked" : ""}> Autónomo societario (partner-administrator of an S.L.)</label></div></form>
        <div class="stats"><div class="stat accent"><div class="k">Monthly cuota</div><div class="v">${eur(r.monthly)}</div><div class="s">${eur(r.annual)} per year · fully deductible</div></div>
          <div class="stat"><div class="k">Tramo</div><div class="v">${r.tramo.table} ${r.tramoIndex}</div><div class="s">monthly yield ${eur(r.monthlyYield)}</div></div>
          <div class="stat"><div class="k">Base de cotización</div><div class="v">${eur(r.base)}</div><div class="s">range ${eur(r.baseMin)} – ${eur(r.baseMax)}</div></div></div>
        <h3>How it's computed</h3>
        <ol class="working"><li>Profit ${eur(retaIn.profit)} − ${r.deduction * 100} % generic deduction = ${eur(r.ssYieldAnnual)} SS yield</li><li>÷ 12 = ${eur(r.monthlyYield)} per month → tramo ${r.tramo.table} ${r.tramoIndex} (${eur(r.tramo.from)} – ${r.tramo.to === Infinity ? "∞" : eur(r.tramo.to)})</li>
        <li>${r.tarifaPlana ? `Tarifa plana: ${T.reta.tarifaPlana.monthly} €/month regardless of tramo (extendable 12 more months if your yield is below the SMI).` : `Minimum base ${eur(r.base)} × ${(T.reta.rate * 100).toFixed(1)} % = ${eur(r.monthly)} / month`}</li></ol>
        <p class="muted small">${esc(T.reta.note)} You may choose a higher base (up to ${eur(r.baseMax)}) to raise future pension/sick-pay benefits.</p>
      </section>
      <section class="card"><h2>All tramos ${T.year}</h2><div class="table-wrap"><table class="data"><thead><tr><th>Table</th><th>Monthly net yield</th><th class="n">Base mínima</th><th class="n">Cuota mínima</th></tr></thead><tbody>
        ${T.reta.tramos.map((t, i) => `<tr class="${t === r.tramo ? "hl" : ""}"><td>${t.table} ${i < 3 ? i + 1 : i - 2}</td><td>${eur(t.from)} – ${t.to === Infinity ? "+" : eur(t.to)}</td><td class="n">${eur(t.baseMin)}</td><td class="n">${eur(t.baseMin * T.reta.rate)}</td></tr>`).join("")}
      </tbody></table></div></section>`;
    $("#rf").addEventListener("input", (ev) => { const f = ev.currentTarget; retaIn = { profit: num(f.profit.value), tarifa: f.tarifa.checked, societario: f.societario.checked }; SCREENS_rerender(); });
  };

  // Re-render while keeping focus and caret in the input being edited.
  function SCREENS_rerender() {
    const a = document.activeElement, name = a && a.name, pos = a && a.selectionStart;
    render();
    if (name) { const el = main.querySelector(`[name="${name}"]`); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) {} } }
  }

  /* ---------------- Renta ---------------- */
  let rentaIn = null;
  SCREENS.renta = () => {
    const p = S.profile();
    const defaultYear = now.getMonth() < 6 ? curYear - 1 : curYear;
    if (!rentaIn) rentaIn = { y: defaultYear, fromLedger: true, ingresos: 40000, gastos: 4000, reta: 3600, amort: 0, retenciones: 0, pagos130: 4000, otherIncome: 0, retOtras: 0, savings: 0, pensiones: 0 };
    const ri = rentaIn;
    let src = ri;
    if (ri.fromLedger) {
      const a = C.annualFromLedger(S.entries(), ri.y);
      src = { ...ri, ingresos: a.ingresos, gastos: a.gastos, reta: a.reta, amort: a.amort, retenciones: a.retenciones, pagos130: a.pagos130 };
    }
    const ir = C.irpf({ year: ri.y, ingresos: src.ingresos, gastos: src.gastos, cuotaReta: src.reta, amortizaciones: src.amort,
      retenciones: (+src.retenciones || 0) + (+ri.retOtras || 0), pagos130: src.pagos130, otherGeneralIncome: ri.otherIncome, savingsIncome: ri.savings,
      planPensiones: ri.pensiones, region: p.region, age: p.age, children: p.children, childrenUnder3: p.childrenUnder3 });
    const fld = (n, l, dis) => `<label>${l}<input name="${n}" inputmode="decimal" value="${C.r2(+src[n] || 0)}" ${dis ? "disabled" : ""}></label>`;
    const regionLabel = (T.irpf.regionalScales[p.region] || T.irpf.regionalScales.generic).label;

    main.innerHTML = `
      <header class="page-head"><h1>Declaración de la renta</h1><p class="lead">Estimate your modelo 100 and download every document you need for the campaign (April–June ${ri.y + 1} for tax year ${ri.y}).</p></header>
      <section class="card"><h2>Documents to download</h2>
        <div class="docs">
          <button class="doc" data-act="doc-resumen"><b>Renta summary — apartado E1</b><span>Income, expenses, net yield, retentions and 130s laid out for Renta WEB, plus estimate (PDF)</span></button>
          <button class="doc" data-act="doc-checklist"><b>Renta checklist</b><span>Every paper you need: activity, personal, family, foreign income (PDF)</span></button>
          <button class="doc" data-act="csv-in"><b>Libro de ingresos ${ri.y}</b><span>Issued invoices, AEAT column layout (CSV / Excel)</span></button>
          <button class="doc" data-act="csv-out"><b>Libro de gastos ${ri.y}</b><span>Received invoices with deductible VAT and IRPF (CSV)</span></button>
          <button class="doc" data-act="csv-assets"><b>Libro de bienes de inversión</b><span>Assets with amortisation table (CSV)</span></button>
          <button class="doc" data-act="doc-347"><b>Modelo 347 list</b><span>Spanish clients/suppliers above 3.005,06 € (CSV)</span></button>
          <button class="doc" data-act="doc-q4"><b>Quarterly worksheets</b><span>303 + 130 drafts for each quarter (PDF)</span></button>
          <button class="doc" data-act="doc-gastos"><b>Deductible expenses guide</b><span>What you can deduct and how much (PDF)</span></button>
          <button class="doc" data-act="ics"><b>Tax calendar ${ri.y + 1}</b><span>All deadlines with reminders 5 days before (ICS for Google/Outlook/Apple)</span></button>
        </div>
        <p class="muted small">Official forms are filed online only — open them from the <a href="#/guide">forms index</a>. Renta WEB: <a href="${CC.FORMS.find((f) => f.code === "100").url}" target="_blank" rel="noopener">sede.agenciatributaria.gob.es ↗</a></p>
      </section>
      <section class="card"><h2>Estimate</h2>
        <form class="form" id="rf">
          <div class="row"><label>Tax year<select name="y">${yearOptions(ri.y)}</select></label>
            <label class="inline"><input type="checkbox" name="fromLedger" ${ri.fromLedger ? "checked" : ""}> Take activity figures from my libros</label>
            <span class="muted small">Region: <b>${esc(regionLabel)}</b> · age ${p.age} · ${p.children} children (<a href="#/settings">change</a>)</span></div>
          <div class="row">${fld("ingresos", "Activity income", ri.fromLedger)}${fld("gastos", "Expenses (excl. RETA)", ri.fromLedger)}${fld("reta", "RETA cuotas paid", ri.fromLedger)}${fld("amort", "Amortisation", ri.fromLedger)}</div>
          <div class="row">${fld("retenciones", "IRPF withheld on invoices", ri.fromLedger)}${fld("pagos130", "Modelo 130 paid", ri.fromLedger)}</div>
          <div class="row"><label>Other work income (net)<input name="otherIncome" inputmode="decimal" value="${ri.otherIncome}"></label><label>Retentions on that income<input name="retOtras" inputmode="decimal" value="${ri.retOtras}"></label>
            <label>Savings income (interest, dividends, gains)<input name="savings" inputmode="decimal" value="${ri.savings}"></label><label>Pension plan contributions<input name="pensiones" inputmode="decimal" value="${ri.pensiones}"></label></div>
        </form>
        <div class="stats"><div class="stat accent"><div class="k">${ir.resultado >= 0 ? "To pay" : "Refund"}</div><div class="v">${eur(Math.abs(ir.resultado))}</div><div class="s">after retentions and 130s</div></div>
          <div class="stat"><div class="k">Total IRPF for the year</div><div class="v">${eur(ir.cuotaLiquida)}</div><div class="s">average ${pct(ir.tipoMedio)} · marginal ${pct(ir.tipoMarginal)}</div></div>
          <div class="stat"><div class="k">Net activity yield</div><div class="v">${eur(ir.rn)}</div><div class="s">after ${ir.gdjPct * 100} % difícil justificación</div></div></div>
        <h3>Working</h3>
        <table class="calc">
          <tr><td>Income − expenses − RETA − amortisation</td><td class="n">${eur(ir.rnPrevio)}</td></tr>
          <tr><td>− Gastos de difícil justificación (${ir.gdjPct * 100} %, max 2.000 €) ${verifyBadge(T.irpf.gastosDificilJustificacion.verify)}</td><td class="n">−${eur(ir.gdj)}</td></tr>
          ${ir.reduccion ? `<tr><td>− Reduction for low yields (art. 32.2.3 LIRPF)</td><td class="n">−${eur(ir.reduccion)}</td></tr>` : ""}
          ${ir.other ? `<tr><td>+ Other general income</td><td class="n">${eur(ir.other)}</td></tr>` : ""}
          <tr class="sub"><td>Base liquidable general</td><td class="n">${eur(ir.baseGeneral)}</td></tr>
          ${ir.baseAhorro ? `<tr class="sub"><td>Base liquidable del ahorro</td><td class="n">${eur(ir.baseAhorro)}</td></tr>` : ""}
          <tr><td>Mínimo personal y familiar (taxed at 0 %)</td><td class="n">${eur(ir.minimo)}</td></tr>
          <tr><td>State scale</td><td class="n">${eur(ir.cuotaEstatal)}</td></tr>
          <tr><td>Regional scale — ${esc(regionLabel)}</td><td class="n">${eur(ir.cuotaAutonomica)}</td></tr>
          ${ir.cuotaAhorro ? `<tr><td>Savings scale</td><td class="n">${eur(ir.cuotaAhorro)}</td></tr>` : ""}
          <tr class="sub"><td>Cuota líquida</td><td class="n">${eur(ir.cuotaLiquida)}</td></tr>
          <tr><td>− Already paid (retentions + 130s)</td><td class="n">−${eur(ir.retenciones + ir.pagos130)}</td></tr>
          <tr class="total"><td>${ir.resultado >= 0 ? "A ingresar" : "A devolver"}</td><td class="n">${eur(Math.abs(ir.resultado))}</td></tr>
        </table>
        <p class="muted small">Not included: regional deductions (rent, children, donations), joint filing, rental property, foreign tax credits. Renta WEB adds these from your datos fiscales.</p>
      </section>
      <section class="card"><h2>Step by step in Renta WEB</h2><ol>
        <li>Log in at the AEAT Sede → <i>Renta ${ri.y}</i> → <i>Servicio de tramitación de borrador / declaración (Renta WEB)</i> with certificado, Cl@ve or reference number.</li>
        <li>Check <b>datos personales</b>: tax address (decides the region), family situation, IBAN.</li>
        <li>Import <b>datos fiscales</b>. They include retentions from your clients' modelo 190 and your own 130s — compare them with the summary PDF.</li>
        <li>Go to <b>Rendimientos de actividades económicas → Estimación directa (E1)</b>: enter the epígrafe IAE and copy ingresos, gastos per line, amortisations, and let it compute the 5 %/7 % provision.</li>
        <li>Foreign income: declare it in the matching section and claim the <b>deducción por doble imposición internacional</b> for tax paid abroad.</li>
        <li>Compare individual vs joint filing (Renta WEB shows both), choose payment: direct debit (until ~25 June) or split 60/40 (second instalment early November).</li>
        <li>Save the PDF justificante with the CSV code and keep it with your libros for at least 4 years.</li></ol></section>`;
    const f = $("#rf");
    f.addEventListener("input", (ev) => {
      if (ev.target.name === "y" || ev.target.name === "fromLedger") return;
      ["ingresos", "gastos", "reta", "amort", "retenciones", "pagos130", "otherIncome", "retOtras", "savings", "pensiones"].forEach((k) => { if (f[k] && !f[k].disabled) rentaIn[k] = num(f[k].value); });
      SCREENS_rerender();
    });
    f.y.onchange = () => { rentaIn.y = +f.y.value; render(); };
    f.fromLedger.onchange = () => { if (!f.fromLedger.checked) Object.assign(rentaIn, { ingresos: src.ingresos, gastos: src.gastos, reta: src.reta, amort: src.amort, retenciones: src.retenciones, pagos130: src.pagos130 }); rentaIn.fromLedger = f.fromLedger.checked; render(); };
  };

  /* ---------------- Compare ---------------- */
  let cmpIn = { profit: 70000, salary: 30000, payoutPct: 0, gestoriaAutonomo: 720, gestoriaSL: 1800, setupCost: 900, micro: true, nueva: false };
  SCREENS.compare = () => {
    const p = S.profile();
    const o = { ...cmpIn, region: p.region, age: p.age, children: p.children };
    const c = C.compare(o);
    const be = C.breakEven({ ...o, salaryMode: "auto" });
    const better = c.sl.netPlusRetained > c.autonomo.net;
    main.innerHTML = `
      <header class="page-head"><h1>Autónomo vs Sociedad Limitada</h1><p class="lead">Same business profit, two structures. The S.L. pays you a salary (taxed in IRPF), the company pays Impuesto sobre Sociedades on the rest, and dividends are taxed again at 19–30 %. Money left in the company is only taxed once — that's the S.L. advantage.</p></header>
      <section class="card"><form class="form" id="cf">
        <div class="row"><label>Business profit / year (before your pay)<input name="profit" inputmode="decimal" value="${cmpIn.profit}"></label>
          <label>Your gross salary from the S.L.<input name="salary" inputmode="decimal" value="${cmpIn.salary}"></label>
          <label>% of after-tax profit paid as dividends<input name="payoutPct" inputmode="decimal" value="${cmpIn.payoutPct}"></label></div>
        <div class="row"><label>Gestoría autónomo / year<input name="gestoriaAutonomo" inputmode="decimal" value="${cmpIn.gestoriaAutonomo}"></label>
          <label>Extra S.L. costs / year (gestoría, Registro, bank)<input name="gestoriaSL" inputmode="decimal" value="${cmpIn.gestoriaSL}"></label>
          <label>One-off setup (notary, Registro)<input name="setupCost" inputmode="decimal" value="${cmpIn.setupCost}"></label></div>
        <div class="row"><label class="inline"><input type="checkbox" name="micro" ${cmpIn.micro ? "checked" : ""}> Microempresa (turnover &lt; 1 M€)</label>
          <label class="inline"><input type="checkbox" name="nueva" ${cmpIn.nueva ? "checked" : ""}> Newly created company (15 % first 2 profitable years)</label></div></form>
        <div class="versus">
          <div class="side ${!better ? "win" : ""}"><h3>Autónomo</h3><table class="calc">
            <tr><td>Profit</td><td class="n">${eur(cmpIn.profit)}</td></tr>
            <tr><td>RETA (${c.autonomo.reta.tramo.table} ${c.autonomo.reta.tramoIndex})</td><td class="n">−${eur(c.autonomo.reta.annual)}</td></tr>
            <tr><td>IRPF (avg ${pct(c.autonomo.irpf.tipoMedio)}, marginal ${pct(c.autonomo.irpf.tipoMarginal)})</td><td class="n">−${eur(c.autonomo.irpf.cuotaLiquida)}</td></tr>
            <tr><td>Gestoría</td><td class="n">−${eur(c.autonomo.gestoria)}</td></tr>
            <tr class="total"><td>In your pocket</td><td class="n">${eur(c.autonomo.net)}</td></tr></table></div>
          <div class="side ${better ? "win" : ""}"><h3>Sociedad Limitada</h3><table class="calc">
            <tr><td>Profit</td><td class="n">${eur(cmpIn.profit)}</td></tr>
            <tr><td>Your salary</td><td class="n">−${eur(c.sl.salary)}</td></tr>
            <tr><td>Extra S.L. costs</td><td class="n">−${eur(c.sl.extraCosts)}</td></tr>
            <tr class="sub"><td>Company taxable base</td><td class="n">${eur(c.sl.companyBase)}</td></tr>
            <tr><td>Impuesto Sociedades (${esc(c.sl.is.rateLabel)}) ${verifyBadge(T.sociedades.verify)}</td><td class="n">−${eur(c.sl.is.tax)}</td></tr>
            <tr><td>Dividends paid out</td><td class="n">${eur(c.sl.payout)}</td></tr>
            <tr><td>Retained in the company</td><td class="n">${eur(c.sl.retained)}</td></tr>
            <tr><td>Your RETA (societario)</td><td class="n">−${eur(c.sl.reta.annual)}</td></tr>
            <tr><td>Your IRPF (salary + dividends)</td><td class="n">−${eur(c.sl.irpf.cuotaLiquida)}</td></tr>
            <tr class="sub"><td>Cash in your pocket</td><td class="n">${eur(c.sl.net)}</td></tr>
            <tr class="total"><td>Pocket + retained in S.L.</td><td class="n">${eur(c.sl.netPlusRetained)}</td></tr></table>
            <p class="muted small">First year also: setup ≈ ${eur(c.sl.setup)}.</p></div>
        </div>
        <div class="verdict ${better ? "good" : ""}">${better ? `The S.L. leaves you <b>${eur(c.sl.netPlusRetained - c.autonomo.net)}</b> more per year (counting money retained in the company). Cash in hand is ${c.sl.net > c.autonomo.net ? "also higher" : `${eur(c.autonomo.net - c.sl.net)} lower — the gain is only real if you leave money in the company`}.` : `At this profit, staying autónomo leaves you <b>${eur(c.autonomo.net - c.sl.netPlusRetained)}</b> more per year.`}</div>
      </section>
      <section class="card"><h2>Break-even curve</h2><p class="muted">Net result per year as profit grows (S.L. salary set to half the profit, between 15.000 € and 45.000 €). ${be.breakEven ? `If you take <b>all</b> profit out as dividends, the S.L. wins from about <b>${eur(be.breakEven)}</b> profit.` : "Taking all profit out, the S.L. does not overtake autónomo in this range."} ${be.breakEvenDeferred ? `If you leave the profit in the company (taxed later when you take it out), from about <b>${eur(be.breakEvenDeferred)}</b>.` : ""}</p>
        ${chart(be.points)}</section>
      <section class="card"><h2>Beyond the numbers</h2><div class="features">
        <div><b>Liability</b><p>Autónomo: unlimited, your personal assets answer for business debts. S.L.: limited to the capital (except personal guarantees and administrator liability).</p></div>
        <div><b>Admin</b><p>S.L.: full accounting, annual accounts, legalised books, two sets of filings (company + you). Count on 120–250 €/month gestoría.</p></div>
        <div><b>Getting money out</b><p>Salary (IRPF + RETA), dividends (19–30 %), or a loan from the company at market interest. Personal expenses paid by the S.L. are a classic inspection target.</p></div>
        <div><b>Expats</b><p>Under the Beckham regime dividends are taxed at 19–28 % and salary at 24 % up to 600.000 € — an S.L. salary can qualify if you are an employee/administrator meeting the rules.</p></div>
      </div></section>`;
    const f = $("#cf");
    f.addEventListener("input", () => {
      cmpIn = { ...cmpIn, profit: num(f.profit.value), salary: num(f.salary.value), payoutPct: Math.min(100, num(f.payoutPct.value)), gestoriaAutonomo: num(f.gestoriaAutonomo.value), gestoriaSL: num(f.gestoriaSL.value), setupCost: num(f.setupCost.value), micro: f.micro.checked, nueva: f.nueva.checked };
      SCREENS_rerender();
    });
  };

  function chart(points) {
    const W = 720, H = 280, P = { l: 64, r: 16, t: 16, b: 36 };
    const maxX = points[points.length - 1].profit, minX = points[0].profit;
    const maxY = Math.max(...points.map((p) => Math.max(p.autonomo, p.sl, p.slFull))) * 1.05;
    const x = (v) => P.l + ((v - minX) / (maxX - minX)) * (W - P.l - P.r);
    const y = (v) => H - P.b - (v / maxY) * (H - P.t - P.b);
    const line = (k) => points.map((p, i) => `${i ? "L" : "M"}${x(p.profit).toFixed(1)},${y(p[k]).toFixed(1)}`).join("");
    const ticksX = [25000, 50000, 100000, 150000, 200000];
    const ticksY = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round((maxY * t) / 10000) * 10000);
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Net income autónomo vs S.L. by profit">
      ${ticksY.map((v) => `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${P.l - 8}" y="${y(v) + 4}" text-anchor="end" class="tick">${v / 1000}k</text>`).join("")}
      ${ticksX.map((v) => `<text x="${x(v)}" y="${H - 12}" text-anchor="middle" class="tick">${v / 1000}k</text>`).join("")}
      <path d="${line("autonomo")}" class="l1"/><path d="${line("slFull")}" class="l2"/><path d="${line("sl")}" class="l3"/>
    </svg><div class="legend"><span class="k1">Autónomo — net</span><span class="k2">S.L. — all paid out as dividends</span><span class="k3">S.L. — salary + money retained in company</span></div></div>`;
  }

  /* ---------------- Factura ---------------- */
  let inv = null;
  SCREENS.factura = () => {
    const p = S.profile();
    if (!inv) inv = { number: `${p.invoiceSeries || curYear}-${String(p.nextInvoice || 1).padStart(3, "0")}`, date: new Date().toISOString().slice(0, 10), due: "", kind: "es", client: "", clientNif: "", clientAddress: "", ivaRate: 21, irpfRate: p.newActivity ? 7 : 15, lines: [{ desc: "", qty: 1, price: "" }] };
    const t = C.invoice(inv.lines, inv);
    main.innerHTML = `
      <header class="page-head"><h1>Invoice generator</h1><p class="lead">A legally complete Spanish invoice (RD 1619/2012) with the right VAT wording for Spanish, EU and non-EU clients. Save it as PDF and, if you want, record it in the libro in one click.</p></header>
      ${!p.name || !p.nie ? `<div class="callout">Add your name, NIE and address in <a href="#/settings">Profile</a> — they are printed as the issuer.</div>` : ""}
      <section class="card"><form class="form" id="if">
        <div class="seg">${[["es", "Spanish client"], ["eu", "EU business (reverse charge)"], ["world", "Outside the EU"]].map(([k, l]) => `<label><input type="radio" name="kind" value="${k}" ${inv.kind === k ? "checked" : ""}><span>${l}</span></label>`).join("")}</div>
        <div class="row"><label>Invoice nº<input name="number" value="${esc(inv.number)}"></label><label>Date<input type="date" name="date" value="${esc(inv.date)}"></label><label>Due date<input type="date" name="due" value="${esc(inv.due)}"></label></div>
        <div class="row"><label class="grow">Client<input name="client" value="${esc(inv.client)}"></label><label>${inv.kind === "eu" ? "EU VAT nº (check VIES)" : "NIF"}<input name="clientNif" value="${esc(inv.clientNif)}"></label></div>
        <div class="row"><label class="grow">Client address<textarea name="clientAddress" rows="2">${esc(inv.clientAddress)}</textarea></label></div>
        <table class="lines"><thead><tr><th>Description</th><th>Qty</th><th>Unit price (€)</th><th></th></tr></thead><tbody>
          ${inv.lines.map((l, i) => `<tr><td><input name="desc${i}" value="${esc(l.desc)}"></td><td><input name="qty${i}" inputmode="decimal" value="${esc(l.qty)}"></td><td><input name="price${i}" inputmode="decimal" value="${esc(l.price)}"></td><td>${inv.lines.length > 1 ? `<button type="button" class="icon" data-rmline="${i}">✕</button>` : ""}</td></tr>`).join("")}
        </tbody></table><button type="button" class="btn ghost small" data-act="addline">+ Line</button>
        <div class="row"><label>IVA %<select name="ivaRate" ${inv.kind !== "es" ? "disabled" : ""}>${[21, 10, 4, 0].map((r) => `<option ${+inv.ivaRate === r ? "selected" : ""}>${r}</option>`).join("")}</select></label>
          <label>IRPF retention %<select name="irpfRate" ${inv.kind !== "es" ? "disabled" : ""}>${[0, 7, 15].map((r) => `<option ${+inv.irpfRate === r ? "selected" : ""}>${r}</option>`).join("")}</select></label>
          <p class="muted small grow">Retention applies only to professional services (IAE section 2) billed to Spanish businesses or autónomos — not to private individuals or foreign clients.</p></div>
        </form>
        <div class="totals"><div>Base <b>${eur(t.base)}</b></div><div>IVA <b>${eur(t.iva)}</b></div>${t.ret ? `<div>Retention <b>−${eur(t.ret)}</b></div>` : ""}<div class="big">Total <b>${eur(t.total)}</b></div></div>
        <div class="actions"><button class="btn" data-act="inv-print">Generate PDF</button><button class="btn ghost" data-act="inv-record">Record in libro de ingresos</button><button class="btn ghost" data-act="inv-new">New invoice</button></div>
      </section>`;
    const f = $("#if");
    const read = () => {
      inv.kind = f.kind.value; inv.number = f.number.value; inv.date = f.date.value; inv.due = f.due.value;
      inv.client = f.client.value; inv.clientNif = f.clientNif.value.toUpperCase(); inv.clientAddress = f.clientAddress.value;
      inv.lines = inv.lines.map((_, i) => ({ desc: f[`desc${i}`].value, qty: num(f[`qty${i}`].value), price: f[`price${i}`].value === "" ? "" : num(f[`price${i}`].value) }));
      if (inv.kind !== "es") { inv.ivaRate = 0; inv.irpfRate = 0; } else { inv.ivaRate = +f.ivaRate.value; inv.irpfRate = +f.irpfRate.value; }
    };
    f.addEventListener("input", () => { read(); SCREENS_rerender(); });
    f.addEventListener("change", (ev) => { if (ev.target.name === "kind") { read(); if (inv.kind === "es") { inv.ivaRate = 21; inv.irpfRate = p.newActivity ? 7 : 15; } render(); } });
    $$("[data-rmline]").forEach((b) => (b.onclick = () => { read(); inv.lines.splice(+b.dataset.rmline, 1); render(); }));
  };

  /* ---------------- Calendar ---------------- */
  SCREENS.calendar = () => {
    main.innerHTML = `
      <header class="page-head"><h1>Tax calendar</h1><p class="lead">When a deadline falls on a weekend or national holiday it moves to the next working day. Direct-debit (domiciliación) deadlines are ~5 days earlier.</p></header>
      <div class="toolbar"><button class="btn" data-act="ics">Add ${curYear + (now.getMonth() > 9 ? 1 : 0)} deadlines to my calendar (.ics)</button></div>
      <div class="timeline">${CC.CALENDAR.map((c) => `<div class="tl ${c.who}"><div class="when">${esc(c.when)}<span class="badge">${c.who === "both" ? "Autónomo + S.L." : c.who === "sl" ? "S.L." : "Autónomo"}</span></div><ul>${c.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}</div>`;
  };

  /* ---------------- Expat ---------------- */
  SCREENS.expat = () => {
    main.innerHTML = `
      <header class="page-head"><h1>Expat guide</h1><p class="lead">The parts of Spanish tax that asesorías often get wrong for foreigners.</p></header>
      <section class="card"><h2>Tax residency</h2><p>You are a Spanish tax resident for a calendar year if <b>any</b> of these applies: you spend more than 183 days in Spain (sporadic absences count as Spain unless you prove residency elsewhere); your main business or economic interests are in Spain; your spouse (not separated) and minor children live here.</p>
        <p>Residents pay IRPF on <b>worldwide income</b>. Non-residents pay IRNR (modelo 210) only on Spanish-source income — you can't be autónomo-with-IRPF without being resident. If you move mid-year, Spain does not split the year: you are resident for the full year or not at all, and the double taxation treaty's tie-breaker rules decide conflicts. Ask your home country for a tax residence certificate if needed.</p></section>
      <section class="card"><h2>Beckham law — régimen especial de impatriados</h2>
        <ul><li>Flat <b>24 %</b> on Spanish-source work income up to ${eur(T.thresholds.beckhamCap)}, 47 % above; foreign income mostly not taxed (except work income); no modelo 720 obligation.</li>
        <li>Conditions: not resident in Spain in the previous <b>5</b> years; move due to an employment contract, an administrator post in a company (with < 25 % stake unless it's a startup), remote work as a digital nomad, or an <b>entrepreneurial activity</b> classified as innovative (ENISA report), or as a highly qualified professional serving startups.</li>
        <li><b>A regular autónomo (e.g. freelance consultant) does not qualify</b> unless the activity is certified as innovative by ENISA.</li>
        <li>Apply with <b>modelo 149</b> within 6 months of your Social Security registration. Then each year file <b>modelo 151</b> instead of the 100. Applies for the year of arrival + 5 more.</li></ul></section>
      <section class="card"><h2>Foreign assets — modelos 720 and 721</h2><p>Residents (not under Beckham) must report by 31 March foreign assets when any category exceeds ${eur(T.thresholds.modelo720)} on 31 Dec or as average Q4 balance: (1) bank accounts, (2) securities, insurance, funds, (3) real estate. Modelo 721: crypto held with foreign custodians. Re-file only if a category increased by more than 20.000 € or you closed it. After the 2022 EU ruling the penalties are the general ones, but missing it is still a fine.</p></section>
      <section class="card"><h2>Double taxation</h2><ul>
        <li>Spain has treaties with ~100 countries. Income taxed abroad that Spain can also tax gets a <b>deducción por doble imposición internacional</b> in the renta (the lower of the tax paid abroad or the Spanish tax on that income).</li>
        <li>Foreign clients: invoices to non-EU businesses have no Spanish VAT ("no sujeta"); if the client withholds tax in their country, keep the certificate to claim it.</li>
        <li>Foreign pensions: government (public-sector) pensions are usually taxed only in the paying country, private pensions in Spain — check the treaty.</li>
        <li>Moving from abroad: if your home country applies an exit tax or treats you as resident in the exit year, request a residence certificate from the AEAT (modelo 01).</li></ul></section>
      <section class="card"><h2>Social Security across borders</h2><ul>
        <li>EU/EEA/Switzerland: you can only be insured in one country. If you keep working temporarily for your home-country business, an <b>A1 certificate</b> keeps you in your home system (up to 24 months). Otherwise you join the RETA.</li>
        <li>Your contributions from other EU countries add up for the Spanish pension (form S1/P1 coordination).</li>
        <li>Non-EU countries with bilateral agreements: USA, UK (post-Brexit protocol), Canada, Japan, Australia, Morocco, most of Latin America, etc.</li></ul></section>
      <section class="card"><h2>Banking, crypto and Wise/Revolut</h2><p>Foreign IBANs (Wise BE, Revolut LT) are valid for the RETA and Hacienda under SEPA, but they count as <b>foreign accounts</b> for modelo 720 and their interest is foreign income. Exchange gains on non-EUR balances can be taxable gains.</p></section>`;
  };

  /* ---------------- Guide ---------------- */
  SCREENS.guide = () => {
    main.innerHTML = `
      <header class="page-head"><h1>Expenses, forms & glossary</h1></header>
      <section class="card"><h2>Deductible expenses (autónomo, estimación directa)</h2><div class="toolbar"><button class="btn ghost small" data-act="doc-gastos">Download as PDF</button></div>
        <div class="table-wrap"><table class="data"><thead><tr><th>Expense</th><th>IRPF</th><th>IVA</th><th>Notes</th></tr></thead><tbody>${CC.EXPENSES.map((e) => `<tr><td><b>${esc(e.item)}</b></td><td>${esc(e.irpf)}</td><td>${esc(e.iva)}</td><td class="muted">${esc(e.note)}</td></tr>`).join("")}</tbody></table></div></section>
      <section class="card"><h2>Forms index (modelos)</h2><div class="table-wrap"><table class="data"><thead><tr><th>Modelo</th><th>What</th><th>Who</th><th></th></tr></thead><tbody>${CC.FORMS.map((f) => `<tr><td><b>${f.code}</b></td><td>${esc(f.name)}</td><td>${f.who === "both" ? "Both" : f.who === "sl" ? "S.L." : "Autónomo"}</td><td><a href="${f.url}" target="_blank" rel="noopener">AEAT ↗</a></td></tr>`).join("")}</tbody></table></div><p class="muted small">${esc(CC.FORMS_NOTE)}</p></section>
      <section class="card"><h2>Glossary</h2><dl class="gloss">${CC.GLOSSARY.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></section>`;
  };

  /* ---------------- Settings ---------------- */
  SCREENS.settings = () => {
    const p = S.profile();
    const regions = Object.entries(T.irpf.regionalScales).map(([k, v]) => `<option value="${k}" ${p.region === k ? "selected" : ""}>${esc(v.label)}${v.verify ? " (verify)" : ""}</option>`).join("");
    main.innerHTML = `
      <header class="page-head"><h1>Profile & backup</h1><p class="lead">Your data stays in this browser only — nothing is uploaded. Download a backup regularly and keep it with your invoices.</p></header>
      <section class="card"><h2>Profile</h2><form class="form" id="pf">
        <div class="row"><label class="grow">Full name (as on NIE)<input name="name" value="${esc(p.name)}"></label><label>NIE / NIF<input name="nie" value="${esc(p.nie)}"></label><label>Email<input name="email" type="email" value="${esc(p.email)}"></label></div>
        <div class="row"><label class="grow">Fiscal address<input name="address" value="${esc(p.address)}"></label><label>Postcode<input name="postcode" value="${esc(p.postcode)}"></label><label>City<input name="city" value="${esc(p.city)}"></label></div>
        <div class="row"><label>Region (tax residence)<select name="region">${regions}</select></label><label>Activity start date<input type="date" name="startDate" value="${esc(p.startDate)}"></label><label>IBAN (printed on invoices)<input name="iban" value="${esc(p.iban)}"></label></div>
        <div class="row"><label>Age<input name="age" inputmode="numeric" value="${esc(p.age)}"></label><label>Children (living with you, &lt; 25)<input name="children" inputmode="numeric" value="${esc(p.children)}"></label><label>…of which under 3<input name="childrenUnder3" inputmode="numeric" value="${esc(p.childrenUnder3)}"></label></div>
        <div class="row"><label>Invoice series prefix<input name="invoiceSeries" value="${esc(p.invoiceSeries)}" placeholder="${curYear}"></label><label>Next invoice number<input name="nextInvoice" inputmode="numeric" value="${esc(p.nextInvoice)}"></label>
          <label class="inline"><input type="checkbox" name="newActivity" ${p.newActivity ? "checked" : ""}> New activity (7 % retention for the first 3 years)</label></div>
        <p class="muted small">Region not listed? Pick "Generic": most regional scales are within ±1 point of the state scale. Edit <code>js/data.js</code> to add yours.</p>
      </form></section>
      <section class="card"><h2>Backup</h2><div class="actions"><button class="btn" data-act="backup">Download backup (.json)</button><label class="btn ghost">Restore backup<input type="file" accept=".json,application/json" id="restore" hidden></label><button class="btn ghost" data-act="demo">Load demo data</button><button class="btn danger" data-act="reset">Erase all data</button></div></section>`;
    const f = $("#pf");
    f.addEventListener("input", () => {
      const fd = new FormData(f);
      S.setProfile({ name: fd.get("name"), nie: (fd.get("nie") || "").toUpperCase(), email: fd.get("email"), address: fd.get("address"), postcode: fd.get("postcode"), city: fd.get("city"),
        region: fd.get("region"), startDate: fd.get("startDate"), iban: fd.get("iban"), age: num(fd.get("age")), children: num(fd.get("children")), childrenUnder3: num(fd.get("childrenUnder3")),
        invoiceSeries: fd.get("invoiceSeries"), nextInvoice: num(fd.get("nextInvoice")) || 1, newActivity: !!fd.get("newActivity") });
    });
    $("#restore").onchange = async (ev) => {
      const file = ev.target.files[0]; if (!file) return;
      try { S.importJSON(await file.text()); toast("Backup restored"); render(); } catch (e) { alert("Could not restore: " + e.message); }
    };
  };

  /* ---------------- Global actions ---------------- */
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }

  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act;
    const y = route() === "renta" && rentaIn ? rentaIn.y : route() === "libros" ? ledgerFilter.y : curYear;
    const A = {
      demo: () => { if (!S.entries().length || confirm("Replace your entries with demo data?")) { S.loadDemo(); ledgerFilter.y = T.year; qSel = { y: T.year, q: 1 }; if (rentaIn) rentaIn.y = T.year; toast("Demo data loaded"); render(); } },
      "print-roadmap": D.roadmap,
      "csv-in": () => D.libroIngresos(y), "csv-out": () => D.libroGastos(y), "csv-assets": () => D.libroBienes(y),
      "doc-347": () => D.modelo347List(y),
      "doc-resumen": () => D.rentaResumen(y, { otherIncome: rentaIn?.otherIncome, retencionesOtras: rentaIn?.retOtras, savings: rentaIn?.savings }),
      "doc-checklist": D.checklist, "doc-gastos": D.expensesGuide,
      "doc-q4": () => D.allQuarters(y),
      "print-q": () => D.quarterWorksheet(qSel.y, qSel.q),
      ics: () => D.calendarICS(route() === "renta" ? y + 1 : curYear + (now.getMonth() > 9 ? 1 : 0)),
      backup: D.backup,
      reset: () => { if (confirm("Erase profile, libros and progress from this browser? Download a backup first if unsure.")) { S.reset(); render(); } },
      "cancel-edit": () => { editing = null; render(); },
      addline: () => { inv.lines.push({ desc: "", qty: 1, price: "" }); render(); },
      "inv-print": () => D.factura(inv),
      "inv-record": () => {
        const t = C.invoice(inv.lines, inv);
        if (!t.base) return alert("Add at least one line with a price.");
        S.upsertEntry({ type: "income", date: inv.date, number: inv.number, party: inv.client, partyNif: inv.clientNif, concept: inv.lines.map((l) => l.desc).filter(Boolean).join("; "), base: t.base, ivaRate: inv.ivaRate, irpfRate: inv.irpfRate, noVat: inv.kind !== "es", euB2B: inv.kind === "eu" });
        const p = S.profile(); S.setProfile({ nextInvoice: (p.nextInvoice || 1) + 1 });
        toast("Recorded in the libro de ingresos"); inv = null; render();
      },
      "inv-new": () => { inv = null; render(); },
    };
    if (A[act]) { ev.preventDefault(); A[act](); }
  });
  const route = () => (location.hash.replace(/^#\/?/, "") || "home").split("/")[0];

  $("#menu").onclick = () => document.body.classList.toggle("nav-open");
  window.addEventListener("hashchange", () => { editing = null; render(); });
  render();
})();
