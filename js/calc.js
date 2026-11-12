/*
 * Cuentas Claras — calculation engine. Pure functions, no DOM.
 * Every function returns the intermediate steps too, so the UI can show the
 * working like an asesoría would on paper.
 */
window.CC = window.CC || {};

CC.calc = (() => {
  const T = CC.TAX;
  const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

  /** Tax on `base` using a progressive scale [{upTo, rate}]. */
  function progressive(base, scale) {
    let tax = 0, prev = 0;
    const bands = [];
    for (const band of scale) {
      if (base <= prev) break;
      const slice = Math.min(base, band.upTo) - prev;
      const t = slice * band.rate;
      bands.push({ from: prev, to: Math.min(base, band.upTo), rate: band.rate, tax: t });
      tax += t;
      prev = band.upTo;
    }
    return { tax, bands };
  }

  /* ---------------------------- RETA ---------------------------- */

  function retaTramo(monthlyYield) {
    return T.reta.tramos.find((t) => monthlyYield >= t.from && monthlyYield < t.to) || T.reta.tramos[T.reta.tramos.length - 1];
  }

  /**
   * Monthly autónomo cuota.
   * annualNetProfit: fiscal net yield (income − expenses, before the RETA cuota itself).
   * Social Security computes: (rendimiento neto + cuotas) − 7 % generic expenses
   * (3 % for societarios). Since the cuota is added back, we start from the
   * profit before the cuota.
   */
  function reta({ annualNetProfit, societario = false, tarifaPlana = false, chosenBase = null }) {
    const ded = societario ? T.reta.genericDeductionSocietario : T.reta.genericDeduction;
    const ssYieldAnnual = Math.max(0, annualNetProfit) * (1 - ded);
    const monthlyYield = ssYieldAnnual / 12;
    const tramo = retaTramo(monthlyYield);
    let baseMin = tramo.baseMin;
    if (societario) baseMin = Math.max(baseMin, T.reta.baseMinSocietario);
    const base = chosenBase ? Math.min(Math.max(chosenBase, baseMin), tramo.baseMax) : baseMin;
    const monthly = tarifaPlana ? T.reta.tarifaPlana.monthly : base * T.reta.rate;
    const tramoIndex = T.reta.tramos.indexOf(tramo) + 1;
    return {
      ssYieldAnnual, monthlyYield, tramo, tramoIndex, base, baseMin, baseMax: tramo.baseMax,
      monthly: r2(monthly), annual: r2(monthly * 12), rate: T.reta.rate, deduction: ded,
      tarifaPlana,
    };
  }

  /* ---------------------------- IRPF ---------------------------- */

  function minimoPersonalFamiliar({ age = 35, children = 0, childrenUnder3 = 0 }) {
    const I = T.irpf;
    let m = I.minimoPersonal;
    if (age >= 65) m += I.minimoOver65;
    if (age >= 75) m += I.minimoOver75;
    for (let i = 0; i < children; i++) m += I.minimoDescendientes[Math.min(i, 3)];
    m += Math.min(childrenUnder3, children) * I.minimoDescendienteUnder3;
    return m;
  }

  function gdjRate(year) {
    const g = T.irpf.gastosDificilJustificacion;
    return g[year] !== undefined ? g[year] : 0.05;
  }

  /**
   * Annual IRPF for an autónomo in estimación directa simplificada.
   * ingresos, gastos (excluding RETA), cuotaReta, otherGeneralIncome (net work income etc.),
   * savingsIncome (dividends/interest), retenciones (withheld by clients + employers),
   * pagos130 (already paid), region, year, age, children.
   */
  function irpf(o) {
    const year = o.year || T.year;
    const ingresos = +o.ingresos || 0;
    const gastos = (+o.gastos || 0) + (+o.cuotaReta || 0) + (+o.amortizaciones || 0);
    const rnPrevio = ingresos - gastos;
    const gdjPct = gdjRate(year);
    const gdj = rnPrevio > 0 ? Math.min(rnPrevio * gdjPct, T.irpf.gastosDificilJustificacion.cap) : 0;
    const rn = rnPrevio - gdj;

    // Art. 32.2.3 LIRPF reduction for low yields.
    const R = T.irpf.reduccionBajosRendimientos;
    const other = +o.otherGeneralIncome || 0;
    let reduccion = 0;
    if (o.applyReduccion !== false && rn > 0 && other <= R.maxOtherIncome) {
      if (rn <= R.lower) reduccion = R.full;
      else if (rn < R.upper) reduccion = R.full - R.slope * (rn - R.lower);
      reduccion = Math.min(reduccion, rn);
    }
    const rnReducido = rn - reduccion;

    const baseGeneral = Math.max(0, rnReducido + other - (+o.planPensiones || 0));
    const baseAhorro = Math.max(0, +o.savingsIncome || 0);
    const minimo = minimoPersonalFamiliar(o);

    const regional = (T.irpf.regionalScales[o.region] || T.irpf.regionalScales.generic).scale;
    // Mínimo is applied first to the general base; any remainder to the savings base.
    const minGen = Math.min(minimo, baseGeneral);
    const minAho = Math.min(minimo - minGen, baseAhorro);
    const half = (scale) => Math.max(0, progressive(baseGeneral, scale).tax - progressive(minGen, scale).tax);
    const cuotaEstatal = half(T.irpf.stateScale);
    const cuotaAutonomica = half(regional);
    const savingsHalf = T.irpf.savingsScale.map((b) => ({ upTo: b.upTo, rate: b.rate }));
    const cuotaAhorro = Math.max(0, progressive(baseAhorro, savingsHalf).tax - progressive(minAho, savingsHalf).tax);
    const deducciones = +o.deducciones || 0;
    const cuotaLiquida = Math.max(0, cuotaEstatal + cuotaAutonomica + cuotaAhorro - deducciones);
    const pagado = (+o.retenciones || 0) + (+o.pagos130 || 0);
    const resultado = cuotaLiquida - pagado;
    const tipoMedio = baseGeneral + baseAhorro > 0 ? cuotaLiquida / (baseGeneral + baseAhorro) : 0;
    const tipoMarginal = marginal(baseGeneral, regional);

    return {
      ingresos, gastos, rnPrevio, gdjPct, gdj, rn, reduccion, rnReducido, other, baseGeneral, baseAhorro,
      minimo, cuotaEstatal, cuotaAutonomica, cuotaAhorro, deducciones, cuotaLiquida,
      retenciones: +o.retenciones || 0, pagos130: +o.pagos130 || 0, resultado, tipoMedio, tipoMarginal,
    };
  }

  function marginal(base, regional) {
    const f = (s) => (s.find((b) => base < b.upTo) || s[s.length - 1]).rate;
    return f(T.irpf.stateScale) + f(regional);
  }

  /* ---------------------- Quarterly from ledger ---------------------- */

  const quarterOf = (d) => Math.floor((new Date(d).getMonth()) / 3) + 1;
  const yearOf = (d) => new Date(d).getFullYear();

  // Simplified amortisation table (estimación directa simplificada).
  const AMORT = {
    "equipos-informaticos": { label: "Computers & IT equipment", rate: 0.26 },
    "mobiliario": { label: "Furniture & installations", rate: 0.10 },
    "maquinaria": { label: "Machinery", rate: 0.12 },
    "vehiculos": { label: "Vehicles", rate: 0.16 },
    "utiles": { label: "Tools & small equipment", rate: 0.26 },
    "software": { label: "Software (intangible)", rate: 0.33 },
  };

  /** Amortisation of one asset inside year `y` (months in use / 12). Assets ≤ 300 € are expensed fully. */
  function amortisationFor(entry, y) {
    if (!entry.isInvestment) return 0;
    const base = (+entry.base || 0) * ((+entry.deductiblePct || 100) / 100);
    if (base <= 300) return yearOf(entry.date) === y ? base : 0;
    const rate = (AMORT[entry.assetType] || AMORT["equipos-informaticos"]).rate;
    const start = new Date(entry.date);
    if (start.getFullYear() > y) return 0;
    // accumulated so far
    let acc = 0;
    for (let yy = start.getFullYear(); yy < y; yy++) {
      const months = yy === start.getFullYear() ? 12 - start.getMonth() : 12;
      acc += base * rate * (months / 12);
    }
    if (acc >= base) return 0;
    const months = y === start.getFullYear() ? 12 - start.getMonth() : 12;
    return Math.min(base * rate * (months / 12), base - acc);
  }

  /** Amortisation inside a cumulative window (Jan → end of quarter q) for the 130. */
  function amortisationToQuarter(entry, y, q) {
    const full = amortisationFor(entry, y);
    if (!full) return 0;
    const base = (+entry.base || 0) * ((+entry.deductiblePct || 100) / 100);
    if (base <= 300) return quarterOf(entry.date) <= q ? full : 0;
    const start = new Date(entry.date);
    const startMonth = start.getFullYear() === y ? start.getMonth() : 0;
    const endMonth = q * 3; // exclusive
    const monthsInYear = 12 - startMonth;
    const monthsSoFar = Math.max(0, endMonth - startMonth);
    return full * Math.min(1, monthsSoFar / monthsInYear);
  }

  /** Sums for a set of ledger entries. */
  function sums(entries) {
    const s = { ingresos: 0, ivaRepercutido: 0, retenciones: 0, gastos: 0, ivaSoportado: 0, reverseCharge: 0, reta: 0, byCategory: {} };
    for (const e of entries) {
      const base = +e.base || 0;
      const pct = (e.deductiblePct === undefined || e.deductiblePct === "" ? 100 : +e.deductiblePct) / 100;
      if (e.type === "income") {
        s.ingresos += base;
        if (!e.noVat) s.ivaRepercutido += base * (+e.ivaRate || 0) / 100;
        s.retenciones += base * (+e.irpfRate || 0) / 100;
      } else {
        const ivaRate = (+e.ivaRate || 0) / 100;
        if (e.reverseCharge) {
          s.reverseCharge += base * (ivaRate || 0.21);
        } else {
          s.ivaSoportado += base * ivaRate * (e.ivaDeductiblePct === undefined ? pct : +e.ivaDeductiblePct / 100);
        }
        if (e.isInvestment) continue; // via amortisation
        if (e.category === "reta") s.reta += base;
        else s.gastos += base * pct;
        const cat = e.category || "otros";
        s.byCategory[cat] = (s.byCategory[cat] || 0) + (e.category === "reta" ? base : base * pct);
      }
    }
    return s;
  }

  function modelo303(entries, y, q, compensarPrevio = 0) {
    const inQ = entries.filter((e) => e.date && yearOf(e.date) === y && quarterOf(e.date) === q);
    const s = sums(inQ);
    const devengado = s.ivaRepercutido + s.reverseCharge;
    const deducible = s.ivaSoportado + s.reverseCharge;
    const resultado = devengado - deducible - compensarPrevio;
    const euSales = inQ.filter((e) => e.type === "income" && e.euB2B).reduce((a, e) => a + (+e.base || 0), 0);
    const exportsNoSujeto = inQ.filter((e) => e.type === "income" && e.noVat && !e.euB2B).reduce((a, e) => a + (+e.base || 0), 0);
    const byRate = {};
    for (const e of inQ.filter((x) => x.type === "income" && !x.noVat)) {
      const k = String(+e.ivaRate || 0);
      byRate[k] = byRate[k] || { base: 0, cuota: 0 };
      byRate[k].base += +e.base || 0;
      byRate[k].cuota += (+e.base || 0) * (+e.ivaRate || 0) / 100;
    }
    return { y, q, count: inQ.length, ...s, devengado, deducible, resultado, euSales, exportsNoSujeto, byRate,
      ingresar: resultado > 0 ? resultado : 0,
      compensar: resultado < 0 ? -resultado : 0 };
  }

  function modelo130(entries, y, q, opts = {}) {
    const upTo = entries.filter((e) => e.date && yearOf(e.date) === y && quarterOf(e.date) <= q);
    const s = sums(upTo);
    const amort = entries.reduce((a, e) => a + amortisationToQuarter(e, y, q), 0);
    const gastos = s.gastos + s.reta + amort;
    const gdj = Math.max(0, Math.min((s.ingresos - gastos) * gdjRate(y), T.irpf.gastosDificilJustificacion.cap));
    // The 130 itself does not include the 5 % provision in the form, but many advisors apply it.
    const useGdj = opts.applyGdj === true;
    const rn = s.ingresos - gastos - (useGdj ? gdj : 0);
    const c03 = Math.max(0, rn * T.irpf.pagoFraccionado130);
    // previous positive payments this year
    let previos = 0;
    for (let qq = 1; qq < q; qq++) {
      const p = modelo130(entries, y, qq, opts);
      previos += p.ingresar;
    }
    const resultado = c03 - s.retenciones - previos;
    const retPct = s.ingresos > 0 ? s.retenciones / (s.ingresos * 0.15) : 0;
    return { y, q, ingresos: s.ingresos, gastos, amort, rn, c03, retenciones: s.retenciones, previos, resultado,
      ingresar: Math.max(0, resultado),
      exempt70: s.ingresos > 0 && upTo.filter((e) => e.type === "income" && +e.irpfRate > 0).reduce((a, e) => a + (+e.base || 0), 0) / s.ingresos >= 0.7,
      retPct };
  }

  function annualFromLedger(entries, y) {
    const inY = entries.filter((e) => e.date && yearOf(e.date) === y);
    const s = sums(inY);
    const amort = entries.reduce((a, e) => a + amortisationFor(e, y), 0);
    const pagos130 = [1, 2, 3, 4].reduce((a, q) => a + modelo130(entries, y, q).ingresar, 0);
    const iva = [1, 2, 3, 4].map((q) => modelo303(entries, y, q));
    const thirdParties = {};
    // Operations with IRPF retention are reported in the 190, not in the 347.
    for (const e of inY.filter((x) => !(+x.irpfRate > 0))) {
      const key = (e.partyNif || e.party || "?").trim().toUpperCase();
      thirdParties[key] = thirdParties[key] || { party: e.party, nif: e.partyNif, type: e.type, total: 0 };
      // 347 uses totals incl. VAT.
      thirdParties[key].total += (+e.base || 0) * (1 + (e.noVat || e.reverseCharge ? 0 : (+e.ivaRate || 0) / 100));
    }
    // 347 covers Spanish counterparties only: skip foreign VAT numbers (two-letter prefix other than ES).
    const m347 = Object.values(thirdParties).filter((t) => t.total > T.thresholds.modelo347 && !/^(?!ES)[A-Z]{2}/.test((t.nif || "").toUpperCase()));
    return { y, ...s, amort, pagos130, iva, m347 };
  }

  /* -------------------- Autónomo vs S.L. -------------------- */

  function sociedadTax(base, { year = T.year, micro = true, nueva = false } = {}) {
    const S = T.sociedades;
    if (base <= 0) return { tax: 0, rateLabel: "—" };
    if (nueva) return { tax: base * S.nuevaCreacion.rate, rateLabel: "15 % (nueva creación)" };
    if (micro) {
      const rates = S.micro[year] || S.micro[2027];
      const a = Math.min(base, S.micro.firstBracket) * rates[0];
      const b = Math.max(0, base - S.micro.firstBracket) * rates[1];
      return { tax: a + b, rateLabel: `${rates[0] * 100} % / ${rates[1] * 100} % (microempresa)` };
    }
    const rate = S.erd[year] || S.general;
    return { tax: base * rate, rateLabel: `${r2(rate * 100)} %` };
  }

  /** Work income tax (administrator salary). */
  function irpfTrabajo(gross, cotizaciones, o) {
    const rnt = Math.max(0, gross - cotizaciones - 2000); // 2.000 € otros gastos deducibles
    return irpf({ ...o, ingresos: 0, gastos: 0, otherGeneralIncome: rnt, applyReduccion: false });
  }

  function compare(o) {
    const profit = +o.profit || 0; // business profit before owner's pay and before RETA
    const year = o.year || T.year;

    // --- Autónomo ---
    const ra = reta({ annualNetProfit: profit });
    const ia = irpf({ ingresos: profit, gastos: 0, cuotaReta: ra.annual, region: o.region, year, age: o.age, children: o.children });
    const gestoriaA = +o.gestoriaAutonomo || 0;
    const netA = profit - ra.annual - ia.cuotaLiquida - gestoriaA;

    // --- S.L. ---
    const salary = Math.min(+o.salary || 0, profit);
    const rs = reta({ annualNetProfit: salary, societario: true });
    const extraCosts = +o.gestoriaSL || 0;
    const companyBase = profit - salary - extraCosts; // cuota RETA paid by the partner out of the salary
    const is = sociedadTax(companyBase, { year, micro: o.micro !== false, nueva: !!o.nueva });
    const afterIS = companyBase - is.tax; // a loss stays in the company and reduces what you have
    const payout = Math.max(0, afterIS) * ((+o.payoutPct || 0) / 100);
    const retained = afterIS - payout;
    const it = irpfTrabajo(salary, rs.annual, { region: o.region, year, age: o.age, children: o.children, savingsIncome: payout });
    const netS = salary - rs.annual - it.cuotaLiquida + payout;
    const firstYearSetup = +o.setupCost || 0;

    return {
      autonomo: { reta: ra, irpf: ia, gestoria: gestoriaA, net: netA, totalTax: ra.annual + ia.cuotaLiquida },
      sl: { salary, reta: rs, extraCosts, companyBase, is, afterIS, payout, retained, irpf: it, net: netS,
        netPlusRetained: netS + retained, totalTax: rs.annual + is.tax + it.cuotaLiquida, setup: firstYearSetup },
    };
  }

  /** Break-even profit at which the S.L. (keeping salary optimal-ish) beats autónomo. */
  function breakEven(o) {
    const points = [];
    for (let p = 15000; p <= 200000; p += 5000) {
      const salary = Math.min(p, o.salaryMode === "fixed" ? +o.salary : Math.max(15000, Math.min(p * 0.5, 45000)));
      const keep = compare({ ...o, profit: p, salary, payoutPct: 0 });
      const all = compare({ ...o, profit: p, salary, payoutPct: 100 });
      points.push({ profit: p, autonomo: keep.autonomo.net, sl: keep.sl.netPlusRetained, slFull: all.sl.netPlusRetained });
    }
    // Fair break-even: everything paid out as dividends (no tax deferral).
    const be = points.find((pt) => pt.slFull > pt.autonomo);
    const beDeferred = points.find((pt) => pt.sl > pt.autonomo);
    return { points, breakEven: be ? be.profit : null, breakEvenDeferred: beDeferred ? beDeferred.profit : null };
  }

  /* ---------------------------- Invoice ---------------------------- */

  function invoice(lines, { ivaRate = 21, irpfRate = 15 } = {}) {
    const base = lines.reduce((a, l) => a + (+l.qty || 0) * (+l.price || 0), 0);
    const iva = base * ivaRate / 100;
    const ret = base * irpfRate / 100;
    return { base: r2(base), iva: r2(iva), ret: r2(ret), total: r2(base + iva - ret) };
  }

  return { r2, progressive, reta, retaTramo, irpf, minimoPersonalFamiliar, gdjRate, sums, modelo303, modelo130,
    annualFromLedger, amortisationFor, AMORT, compare, breakEven, sociedadTax, invoice, quarterOf, yearOf };
})();
