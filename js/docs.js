/*
 * Cuentas Claras — document generators.
 * CSV / ICS / JSON files are downloaded directly. Printable documents open in a
 * new tab with a print layout: use "Save as PDF" in the print dialog.
 */
window.CC = window.CC || {};

CC.fmt = {
  eur: (n) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(+n || 0),
  num: (n) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(+n || 0),
  pct: (n) => new Intl.NumberFormat("es-ES", { style: "percent", maximumFractionDigits: 2 }).format(+n || 0),
  date: (d) => (d ? new Date(d).toLocaleDateString("es-ES") : ""),
  esc: (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
};

CC.docs = (() => {
  const { eur, num, esc, date } = CC.fmt;
  const C = CC.calc;

  function download(filename, content, mime = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // Spanish Excel expects ";" separators and "," decimals, plus a BOM for accents.
  function csv(rows) {
    const cell = (v) => {
      if (typeof v === "number") v = num(v).replace(/\./g, "");
      v = String(v ?? "");
      return /[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    };
    return "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
  }

  const byYear = (y) => CC.store.entries().filter((e) => e.date && C.yearOf(e.date) === y);

  /* ---------------------- Libros registro (CSV) ---------------------- */

  function libroIngresos(y) {
    const rows = [["Ejercicio", "Periodo", "Fecha expedición", "Serie-Número", "NIF destinatario", "Nombre destinatario", "Concepto", "Base imponible", "Tipo IVA %", "Cuota IVA", "Tipo retención %", "Retención IRPF", "Total factura", "Clave operación"]];
    for (const e of byYear(y).filter((x) => x.type === "income")) {
      const base = +e.base || 0;
      const iva = e.noVat ? 0 : base * (+e.ivaRate || 0) / 100;
      const ret = base * (+e.irpfRate || 0) / 100;
      const clave = e.euB2B ? "Entrega/servicio intracomunitario (ISP)" : e.noVat ? "No sujeta (art. 69 LIVA)" : "Operación interior";
      rows.push([y, `${C.quarterOf(e.date)}T`, date(e.date), e.number, e.partyNif, e.party, e.concept, base, e.noVat ? 0 : +e.ivaRate || 0, iva, +e.irpfRate || 0, ret, base + iva - ret, clave]);
    }
    download(`libro-registro-ingresos-${y}.csv`, csv(rows), "text/csv;charset=utf-8");
  }

  function libroGastos(y) {
    const rows = [["Ejercicio", "Periodo", "Fecha", "Nº factura proveedor", "NIF proveedor", "Nombre proveedor", "Concepto", "Categoría", "Base imponible", "Tipo IVA %", "Cuota IVA soportado", "% afectación", "IVA deducible", "Gasto deducible IRPF", "Inversión sujeto pasivo", "Bien de inversión"]];
    for (const e of byYear(y).filter((x) => x.type === "expense")) {
      const base = +e.base || 0;
      const pct = (e.deductiblePct === undefined || e.deductiblePct === "" ? 100 : +e.deductiblePct) / 100;
      const iva = base * (+e.ivaRate || 0) / 100;
      rows.push([y, `${C.quarterOf(e.date)}T`, date(e.date), e.number, e.partyNif, e.party, e.concept, e.category, base, +e.ivaRate || 0, iva, pct * 100,
        e.reverseCharge ? iva : iva * pct, e.isInvestment ? 0 : (e.category === "reta" ? base : base * pct), e.reverseCharge ? "Sí" : "No", e.isInvestment ? "Sí" : "No"]);
    }
    download(`libro-registro-gastos-${y}.csv`, csv(rows), "text/csv;charset=utf-8");
  }

  function libroBienes(y) {
    const rows = [["Fecha alta", "Proveedor", "Descripción", "Tipo de bien", "Coeficiente", "Valor adquisición", "% afectación", "Amortización ejercicio", "Amortización acumulada", "Valor pendiente"]];
    for (const e of CC.store.entries().filter((x) => x.isInvestment && C.yearOf(x.date) <= y)) {
      const t = C.AMORT[e.assetType] || C.AMORT["equipos-informaticos"];
      const base = (+e.base || 0) * ((+e.deductiblePct || 100) / 100);
      let acc = 0;
      for (let yy = C.yearOf(e.date); yy <= y; yy++) acc += C.amortisationFor(e, yy);
      rows.push([date(e.date), e.party, e.concept, t.label, `${t.rate * 100} %`, +e.base || 0, +e.deductiblePct || 100, C.amortisationFor(e, y), acc, base - acc]);
    }
    download(`libro-bienes-inversion-${y}.csv`, csv(rows), "text/csv;charset=utf-8");
  }

  function modelo347List(y) {
    const a = C.annualFromLedger(CC.store.entries(), y);
    const rows = [["NIF", "Nombre", "Clave (A=compras, B=ventas)", "Importe anual (IVA incl.)"]];
    for (const t of a.m347) rows.push([t.nif, t.party, t.type === "income" ? "B" : "A", t.total]);
    download(`modelo-347-${y}.csv`, csv(rows), "text/csv;charset=utf-8");
  }

  function backup() {
    download(`cuentas-claras-backup-${new Date().toISOString().slice(0, 10)}.json`, CC.store.exportJSON(), "application/json");
  }

  /* ---------------------- Calendar (ICS) ---------------------- */

  function calendarICS(y) {
    const ev = [
      [`${y}-01-30`, "303 Q4 + 390 + 130 Q4 + 111/115 Q4 + 190/180", "Fin plazo trimestral Q4 y resúmenes anuales"],
      [`${y}-02-28`, "Modelo 347", "Operaciones con terceros > 3.005,06 €"],
      [`${y}-03-31`, "Modelo 720 / 721", "Bienes y criptomonedas en el extranjero"],
      [`${y}-04-20`, "303 Q1 + 130 Q1 + 111/115 Q1", "Trimestral Q1"],
      [`${y}-06-25`, "Renta — fin domiciliación", "Último día para domiciliar el pago de la renta"],
      [`${y}-06-30`, "Renta (modelo 100) — fin campaña", "Fin campaña de la renta"],
      [`${y}-07-20`, "303 Q2 + 130 Q2 + 111/115 Q2", "Trimestral Q2"],
      [`${y}-07-25`, "Modelo 200 (S.L.)", "Impuesto sobre Sociedades"],
      [`${y}-10-20`, "303 Q3 + 130 Q3 + 111/115 Q3 + 202", "Trimestral Q3"],
      [`${y}-11-05`, "Renta — segundo plazo", "Cargo del 40 % si fraccionaste"],
      [`${y}-12-20`, "Modelo 202 (S.L.)", "Tercer pago fraccionado sociedades"],
    ];
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cuentas Claras//ES", "CALSCALE:GREGORIAN"];
    ev.forEach(([d, title, desc], i) => {
      const dt = d.replace(/-/g, "");
      lines.push("BEGIN:VEVENT", `UID:cc-${y}-${i}@cuentas-claras`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${dt}`, `SUMMARY:${title}`, `DESCRIPTION:${desc}. Comprueba el calendario oficial de la AEAT (si el día cae en festivo, el plazo se traslada).`,
        "BEGIN:VALARM", "TRIGGER:-P5D", "ACTION:DISPLAY", `DESCRIPTION:${title}`, "END:VALARM", "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    download(`calendario-fiscal-${y}.ics`, lines.join("\r\n"), "text/calendar");
  }

  /* ---------------------- Printable documents ---------------------- */

  const PRINT_CSS = `
    *{box-sizing:border-box} body{font:13px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c2430;margin:0;padding:32px;background:#fff}
    h1{font-size:22px;margin:0 0 4px} h2{font-size:15px;margin:24px 0 8px;border-bottom:2px solid #c2410c;padding-bottom:4px;color:#7c2d12}
    .meta{color:#5b6472;font-size:12px;margin-bottom:16px} table{width:100%;border-collapse:collapse;margin:8px 0}
    th,td{border:1px solid #d6dae0;padding:6px 8px;text-align:left;vertical-align:top} th{background:#f4f1ec;font-weight:600}
    td.n,th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap} tr.total td{font-weight:700;background:#fbf7f2}
    .note{background:#fff7ed;border-left:3px solid #c2410c;padding:8px 12px;margin:12px 0;font-size:12px}
    .box{border:1px solid #d6dae0;padding:12px;border-radius:6px} .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    ul.check{list-style:none;padding:0} ul.check li{padding:4px 0 4px 26px;position:relative} ul.check li:before{content:"";position:absolute;left:0;top:6px;width:14px;height:14px;border:1.5px solid #5b6472;border-radius:3px}
    ul.check li.done:before{background:#c2410c;border-color:#c2410c}
    .toolbar{position:fixed;top:12px;right:12px} .toolbar button{font:inherit;padding:8px 14px;border-radius:6px;border:0;background:#c2410c;color:#fff;cursor:pointer}
    footer{margin-top:32px;font-size:11px;color:#5b6472;border-top:1px solid #d6dae0;padding-top:8px}
    @media print{.toolbar{display:none} body{padding:0} h2{break-after:avoid} tr{break-inside:avoid}}`;

  function printDoc(title, body) {
    const w = window.open("", "_blank");
    if (!w) { alert("Your browser blocked the new tab. Allow pop-ups for this page to generate documents."); return; }
    const p = CC.store.profile();
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${PRINT_CSS}</style></head><body>
      <div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
      ${body}
      <footer>Generated with Cuentas Claras on ${new Date().toLocaleDateString("es-ES")}${p.name ? " · " + esc(p.name) : ""}${p.nie ? " · NIF " + esc(p.nie) : ""}. Working document — not an official AEAT form. Check every figure against Renta WEB / the official model before filing.</footer>
      </body></html>`);
    w.document.close();
  }

  const row = (label, value, cls = "") => `<tr class="${cls}"><td>${label}</td><td class="n">${value}</td></tr>`;
  const head = (title, sub) => {
    const p = CC.store.profile();
    return `<h1>${esc(title)}</h1><div class="meta">${esc(sub || "")}<br>${esc(p.name || "—")} · NIF/NIE ${esc(p.nie || "—")} · ${esc([p.address, p.postcode, p.city].filter(Boolean).join(", ") || "—")}</div>`;
  };

  /** Annual activity summary laid out like apartado E1 of the renta. */
  function rentaResumen(y, extra = {}) {
    const entries = CC.store.entries();
    const a = C.annualFromLedger(entries, y);
    const p = CC.store.profile();
    const gastosSinReta = a.gastos;
    const ir = C.irpf({
      year: y, ingresos: a.ingresos, gastos: gastosSinReta, cuotaReta: a.reta, amortizaciones: a.amort,
      retenciones: a.retenciones + (+extra.retencionesOtras || 0), pagos130: a.pagos130,
      otherGeneralIncome: +extra.otherIncome || 0, savingsIncome: +extra.savings || 0,
      region: p.region, age: p.age, children: p.children, childrenUnder3: p.childrenUnder3,
    });
    const cats = Object.entries(a.byCategory).filter(([k]) => k !== "reta").sort((x, z) => z[1] - x[1])
      .map(([k, v]) => row(esc(CC.CATEGORIES[k] || k), eur(v))).join("");
    const ivaRows = a.iva.map((q) => `<tr><td>${q.q}T</td><td class="n">${eur(q.devengado)}</td><td class="n">${eur(q.deducible)}</td><td class="n">${eur(q.resultado)}</td></tr>`).join("");
    const m130 = [1, 2, 3, 4].map((q) => C.modelo130(entries, y, q));
    const m130Rows = m130.map((m) => `<tr><td>${m.q}T</td><td class="n">${eur(m.ingresos)}</td><td class="n">${eur(m.gastos)}</td><td class="n">${eur(m.rn)}</td><td class="n">${eur(m.retenciones)}</td><td class="n">${eur(m.ingresar)}</td></tr>`).join("");

    printDoc(`Resumen renta ${y}`, `${head(`Declaración de la renta ${y} — resumen de la actividad económica`, `Ejercicio ${y} · Estimación directa simplificada · to be filed April–June ${y + 1}`)}
      <div class="note">Use this sheet while filling <b>Renta WEB → Apartado E1 "Rendimientos de actividades económicas en estimación directa"</b>. Enter the activity (epígrafe IAE), then copy the figures below into the matching boxes. Retentions and pagos fraccionados are pre-filled by the AEAT from your clients' 190 and your own 130s — compare them with this sheet.</div>
      <h2>1 · Ingresos</h2><table>${row("Ingresos íntegros de explotación (ventas y prestación de servicios)", eur(a.ingresos))}${row("Otros ingresos / subvenciones", eur(0))}${row("Total ingresos computables", eur(a.ingresos), "total")}</table>
      <h2>2 · Gastos fiscalmente deducibles</h2><table>${row("Seguridad Social del titular (cuotas RETA)", eur(a.reta))}${cats}${row("Amortizaciones (dotaciones del ejercicio)", eur(a.amort))}${row("Total gastos", eur(a.reta + gastosSinReta + a.amort), "total")}</table>
      <h2>3 · Rendimiento neto</h2><table>
        ${row("Diferencia ingresos − gastos (rendimiento neto previo)", eur(ir.rnPrevio))}
        ${row(`Provisiones y gastos de difícil justificación (${ir.gdjPct * 100} %, máx. 2.000 €)`, eur(ir.gdj))}
        ${row("Rendimiento neto", eur(ir.rn), "total")}
        ${row("Reducción art. 32.2.3 LIRPF (rendimientos bajos)", eur(ir.reduccion))}
        ${row("Rendimiento neto reducido de la actividad", eur(ir.rnReducido), "total")}</table>
      <h2>4 · Pagos a cuenta ya realizados</h2><table>
        ${row("Retenciones e ingresos a cuenta soportados (facturas con IRPF)", eur(a.retenciones))}
        ${extra.retencionesOtras ? row("Otras retenciones (nómina, etc.)", eur(extra.retencionesOtras)) : ""}
        ${row("Pagos fraccionados modelo 130", eur(a.pagos130))}</table>
      <h2>5 · Estimated result</h2><table>
        ${row("Base liquidable general", eur(ir.baseGeneral))}${ir.baseAhorro ? row("Base liquidable del ahorro", eur(ir.baseAhorro)) : ""}
        ${row("Mínimo personal y familiar", eur(ir.minimo))}
        ${row("Cuota íntegra estatal", eur(ir.cuotaEstatal))}${row(`Cuota íntegra autonómica (${esc((CC.TAX.irpf.regionalScales[p.region] || {}).label || "generic")})`, eur(ir.cuotaAutonomica))}
        ${ir.cuotaAhorro ? row("Cuota base del ahorro", eur(ir.cuotaAhorro)) : ""}
        ${row("Cuota líquida", eur(ir.cuotaLiquida), "total")}
        ${row("− Retenciones y pagos fraccionados", eur(ir.retenciones + ir.pagos130))}
        ${row(ir.resultado >= 0 ? "Resultado: a ingresar" : "Resultado: a devolver", eur(Math.abs(ir.resultado)), "total")}</table>
      <div class="note">Estimate only: it does not include regional deductions, joint filing (tributación conjunta), rental income or foreign tax credits. Renta WEB applies them automatically from your datos fiscales.</div>
      <h2>6 · IVA del ejercicio (for modelo 390)</h2><table><tr><th>Trimestre</th><th class="n">IVA devengado</th><th class="n">IVA deducible</th><th class="n">Resultado</th></tr>${ivaRows}</table>
      <h2>7 · Modelos 130 del ejercicio</h2><table><tr><th>Trimestre</th><th class="n">Ingresos acum.</th><th class="n">Gastos acum.</th><th class="n">Rendimiento acum.</th><th class="n">Retenciones acum.</th><th class="n">A ingresar</th></tr>${m130Rows}</table>
      ${a.m347.length ? `<h2>8 · Terceros &gt; 3.005,06 € (modelo 347, February)</h2><table><tr><th>NIF</th><th>Nombre</th><th>Clave</th><th class="n">Importe</th></tr>${a.m347.map((t) => `<tr><td>${esc(t.nif)}</td><td>${esc(t.party)}</td><td>${t.type === "income" ? "B (ventas)" : "A (compras)"}</td><td class="n">${eur(t.total)}</td></tr>`).join("")}</table>` : ""}`);
  }

  function quarterWorksheet(y, q) {
    printDoc(`${q}T ${y} — 303 y 130`, quarterBody(y, q));
  }

  function allQuarters(y) {
    printDoc(`Trimestres ${y} — 303 y 130`, [1, 2, 3, 4].map((q) => quarterBody(y, q)).join('<div style="break-before:page"></div>'));
  }

  function quarterBody(y, q) {
    const entries = CC.store.entries();
    const v = C.modelo303(entries, y, q);
    const m = C.modelo130(entries, y, q);
    const rates = Object.entries(v.byRate).map(([r, x]) => `<tr><td>Régimen general ${r} %</td><td class="n">${eur(x.base)}</td><td class="n">${eur(x.cuota)}</td></tr>`).join("");
    const list = entries.filter((e) => C.yearOf(e.date) === y && C.quarterOf(e.date) === q)
      .map((e) => `<tr><td>${date(e.date)}</td><td>${e.type === "income" ? "Emitida" : "Recibida"}</td><td>${esc(e.number)}</td><td>${esc(e.party)}</td><td class="n">${eur(e.base)}</td><td class="n">${e.ivaRate || 0} %</td></tr>`).join("");
    return (`${head(`Borrador trimestral ${q}T ${y}`, `Modelos 303 (IVA) y 130 (IRPF) · plazo: ${["1–20 abril", "1–20 julio", "1–20 octubre", "1–30 enero " + (y + 1)][q - 1]}`)}
      <h2>Modelo 303 — IVA</h2>
      <table><tr><th>IVA devengado</th><th class="n">Base</th><th class="n">Cuota</th></tr>${rates || `<tr><td colspan="3">No sales with Spanish VAT</td></tr>`}
        ${v.reverseCharge ? `<tr><td>Adquisiciones con inversión del sujeto pasivo (servicios UE/extranjero)</td><td class="n">—</td><td class="n">${eur(v.reverseCharge)}</td></tr>` : ""}
        <tr class="total"><td>Total cuota devengada</td><td></td><td class="n">${eur(v.devengado)}</td></tr></table>
      <table><tr><th>IVA deducible</th><th class="n">Cuota</th></tr>${row("Cuotas soportadas en operaciones interiores corrientes / bienes de inversión", eur(v.ivaSoportado))}${v.reverseCharge ? row("Inversión del sujeto pasivo (deducible)", eur(v.reverseCharge)) : ""}${row("Total a deducir", eur(v.deducible), "total")}</table>
      <table>${v.euSales ? row("Entregas/servicios intracomunitarios (casilla informativa + modelo 349)", eur(v.euSales)) : ""}${v.exportsNoSujeto ? row("Operaciones no sujetas por reglas de localización (art. 69 LIVA)", eur(v.exportsNoSujeto)) : ""}
        ${row(v.resultado >= 0 ? "Resultado 303: a ingresar" : (q === 4 ? "Resultado 303: a devolver / compensar" : "Resultado 303: a compensar en trimestres siguientes"), eur(Math.abs(v.resultado)), "total")}</table>
      <h2>Modelo 130 — IRPF pago fraccionado (acumulado 1 enero – fin del ${q}T)</h2>
      <table>${row("[01] Ingresos computables acumulados", eur(m.ingresos))}${row("[02] Gastos fiscalmente deducibles acumulados (incl. RETA y amortizaciones)", eur(m.gastos))}
        ${row("[03] Rendimiento neto", eur(m.rn))}${row("[04] 20 % del rendimiento neto", eur(m.c03))}
        ${row("[05] Pagos fraccionados de trimestres anteriores", eur(m.previos))}${row("[06] Retenciones e ingresos a cuenta acumulados", eur(m.retenciones))}
        ${row("Resultado 130", m.resultado > 0 ? eur(m.resultado) : `${eur(0)} (negativo: ${eur(m.resultado)})`, "total")}</table>
      ${m.exempt70 ? `<div class="note">≥ 70 % of your income this year had IRPF withheld: you are <b>not obliged</b> to file the 130 (art. 109 RIRPF), as long as that also held last year.</div>` : ""}
      <h2>Facturas del trimestre</h2><table><tr><th>Fecha</th><th>Tipo</th><th>Nº</th><th>Cliente / proveedor</th><th class="n">Base</th><th class="n">IVA</th></tr>${list || `<tr><td colspan="6">No entries</td></tr>`}</table>`);
  }

  function checklist() {
    const html = CC.RENTA_CHECKLIST.map((g) => `<h2>${esc(g.group)}</h2><ul class="check">${g.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`).join("");
    printDoc("Checklist renta", `${head("Checklist — documentos para la declaración de la renta", `Ejercicio ${CC.TAX.year} · campaña abril–junio ${CC.TAX.year + 1}`)}${html}`);
  }

  function roadmap() {
    const html = Object.values(CC.ROADMAPS).map((r) => `<h2>${esc(r.title)}</h2><ul class="check">${r.steps.map((s) => `<li class="${CC.store.isDone(s.id) ? "done" : ""}"><b>${esc(s.title)}</b><br><span style="color:#5b6472">${esc(s.why)}</span>${s.docs ? `<br><i>Bring:</i> ${s.docs.map(esc).join(" · ")}` : ""}</li>`).join("")}</ul>`).join("");
    printDoc("Roadmap autónomo y S.L.", `${head("Roadmap — de NIE a autónomo y S.L.", "Your progress is marked")}${html}`);
  }

  function expensesGuide() {
    const rows = CC.EXPENSES.map((e) => `<tr><td>${esc(e.item)}</td><td>${esc(e.irpf)}</td><td>${esc(e.iva)}</td><td>${esc(e.note)}</td></tr>`).join("");
    printDoc("Guía de gastos deducibles", `${head("Guía de gastos deducibles — autónomo en estimación directa")}<table><tr><th>Gasto</th><th>IRPF</th><th>IVA</th><th>Notas</th></tr>${rows}</table>
      <div class="note">General rule (art. 28 LIRPF + art. 30): an expense is deductible if it is linked to the activity, justified with an invoice in your name and NIF, and recorded in the libro de gastos.</div>`);
  }

  function factura(inv) {
    const p = CC.store.profile();
    const t = C.invoice(inv.lines, inv);
    const lines = inv.lines.filter((l) => l.desc || l.price).map((l) => `<tr><td>${esc(l.desc)}</td><td class="n">${num(l.qty)}</td><td class="n">${eur(l.price)}</td><td class="n">${eur((+l.qty || 0) * (+l.price || 0))}</td></tr>`).join("");
    const legal = {
      es: "",
      eu: "Inversión del sujeto pasivo — art. 196 Directiva 2006/112/CE · Reverse charge.",
      world: "Operación no sujeta a IVA — art. 69 Ley 37/1992 (reglas de localización).",
    }[inv.kind || "es"];
    printDoc(`Factura ${inv.number}`, `
      <div class="grid"><div><h1>FACTURA</h1><div class="meta">Nº <b>${esc(inv.number)}</b><br>Fecha de expedición: ${date(inv.date)}${inv.opDate && inv.opDate !== inv.date ? `<br>Fecha de operación: ${date(inv.opDate)}` : ""}</div></div>
      <div class="box"><b>${esc(p.name || "Tu nombre")}</b><br>NIF ${esc(p.nie || "—")}<br>${esc(p.address || "")}<br>${esc([p.postcode, p.city].filter(Boolean).join(" "))}${p.email ? "<br>" + esc(p.email) : ""}</div></div>
      <h2>Cliente</h2><div class="box"><b>${esc(inv.client)}</b><br>${inv.kind === "eu" ? "VAT" : "NIF"} ${esc(inv.clientNif)}<br>${esc(inv.clientAddress).replace(/\n/g, "<br>")}</div>
      <h2>Detalle</h2><table><tr><th>Descripción</th><th class="n">Cantidad</th><th class="n">Precio</th><th class="n">Importe</th></tr>${lines}</table>
      <table style="width:50%;margin-left:auto">${row("Base imponible", eur(t.base))}${row(`IVA ${inv.ivaRate} %`, eur(t.iva))}${+inv.irpfRate ? row(`Retención IRPF −${inv.irpfRate} %`, "−" + eur(t.ret)) : ""}${row("TOTAL", eur(t.total), "total")}</table>
      ${legal ? `<div class="note">${legal}</div>` : ""}
      ${p.iban ? `<p>Forma de pago: transferencia a <b>${esc(p.iban)}</b>${inv.due ? ` antes del ${date(inv.due)}` : ""}.</p>` : ""}`);
  }

  return { download, csv, libroIngresos, libroGastos, libroBienes, modelo347List, backup, calendarICS, rentaResumen, quarterWorksheet, allQuarters, checklist, roadmap, expensesGuide, factura, printDoc };
})();

CC.CATEGORIES = {
  reta: "Seguridad Social del titular (RETA)",
  gestoria: "Servicios de profesionales independientes (gestoría, abogados)",
  software: "Software, suscripciones y hosting",
  alquiler: "Arrendamientos y cánones",
  suministros: "Suministros (luz, agua, internet)",
  telefono: "Teléfono e internet",
  viajes: "Desplazamientos y viajes",
  dietas: "Manutención (dietas)",
  formacion: "Formación y libros",
  seguros: "Primas de seguro",
  publicidad: "Publicidad y marketing",
  material: "Material de oficina y consumibles",
  bancos: "Gastos financieros y comisiones",
  equipos: "Equipos (bienes de inversión)",
  tributos: "Tributos fiscalmente deducibles (IAE, IBI, tasas)",
  otros: "Otros servicios exteriores",
};
