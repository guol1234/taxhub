/*
 * Cuentas Claras — local storage. Everything stays in this browser; nothing is
 * ever sent anywhere. Use Settings → Backup to move data between devices.
 */
window.CC = window.CC || {};

CC.store = (() => {
  const KEY = "cuentas-claras-v1";
  const empty = () => ({
    profile: {
      name: "", nie: "", address: "", city: "", postcode: "", email: "", iban: "",
      region: "generic", startDate: "", form: "autonomo", age: 35, children: 0, childrenUnder3: 0,
      newActivity: true, invoiceSeries: "", nextInvoice: 1,
    },
    entries: [],
    progress: {},
  });

  let state = empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...empty(), ...parsed, profile: { ...empty().profile, ...(parsed.profile || {}) } };
    }
  } catch (e) { /* private mode or blocked storage: run in memory */ }

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  return {
    get: () => state,
    profile: () => state.profile,
    setProfile(p) { state.profile = { ...state.profile, ...p }; save(); },
    entries: () => state.entries,
    upsertEntry(e) {
      if (!e.id) { e.id = uid(); state.entries.push(e); }
      else { const i = state.entries.findIndex((x) => x.id === e.id); if (i >= 0) state.entries[i] = e; else state.entries.push(e); }
      state.entries.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      save(); return e;
    },
    removeEntry(id) { state.entries = state.entries.filter((e) => e.id !== id); save(); },
    toggleStep(id, v) { state.progress[id] = v; save(); },
    isDone: (id) => !!state.progress[id],
    exportJSON: () => JSON.stringify(state, null, 2),
    importJSON(text) {
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.entries)) throw new Error("Not a Cuentas Claras backup file.");
      state = { ...empty(), ...parsed, profile: { ...empty().profile, ...(parsed.profile || {}) } };
      save();
    },
    addEntries(list) { for (const e of list) { e.id = uid(); state.entries.push(e); } state.entries.sort((a, b) => (a.date || "").localeCompare(b.date || "")); save(); },
    reset() { state = empty(); save(); },
    loadDemo() {
      const y = CC.TAX.year;
      const d = (m, day) => `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const inc = (m, day, num, party, nif, base, opts = {}) => ({ type: "income", date: d(m, day), number: num, party, partyNif: nif, concept: "Consultoría", base, ivaRate: 21, irpfRate: 15, ...opts });
      const exp = (m, day, party, nif, concept, base, category, opts = {}) => ({ type: "expense", date: d(m, day), number: "", party, partyNif: nif, concept, base, ivaRate: 21, irpfRate: 0, deductiblePct: 100, category, ...opts });
      const list = [
        inc(1, 31, `${y}-001`, "Acme Ibérica SL", "B12345678", 3200),
        inc(2, 28, `${y}-002`, "Acme Ibérica SL", "B12345678", 3200),
        inc(3, 15, `${y}-003`, "Nordic Design AB", "SE556677889901", 2500, { ivaRate: 0, irpfRate: 0, noVat: true, euB2B: true }),
        inc(3, 31, `${y}-004`, "Acme Ibérica SL", "B12345678", 3200),
        inc(4, 30, `${y}-005`, "Acme Ibérica SL", "B12345678", 3400),
        inc(5, 31, `${y}-006`, "Acme Ibérica SL", "B12345678", 3400),
        inc(6, 20, `${y}-007`, "Startup Labs Inc", "US-EIN-98-7654321", 4000, { ivaRate: 0, irpfRate: 0, noVat: true }),
        exp(1, 5, "Gestoría Centro", "B87654321", "Cuota gestoría enero", 60, "gestoria"),
        exp(1, 31, "TGSS", "", "Cuota RETA enero", 80, "reta", { ivaRate: 0 }),
        exp(2, 28, "TGSS", "", "Cuota RETA febrero", 80, "reta", { ivaRate: 0 }),
        exp(3, 31, "TGSS", "", "Cuota RETA marzo", 80, "reta", { ivaRate: 0 }),
        exp(2, 10, "Apple Distribution Intl", "IE9700053D", "MacBook Pro", 2100, "equipos", { isInvestment: true, assetType: "equipos-informaticos", reverseCharge: false }),
        exp(3, 1, "Google Cloud EMEA", "IE6388047V", "Google Workspace", 72, "software", { reverseCharge: true }),
        exp(4, 3, "Movistar", "A82018474", "Fibra + móvil", 50, "telefono", { deductiblePct: 50 }),
        exp(5, 12, "Renfe", "Q2801659J", "Tren cliente Madrid", 95, "viajes", { ivaRate: 10 }),
      ];
      state.entries = [];
      this.addEntries(list);
      state.profile = { ...state.profile, name: state.profile.name || "Alex Example", nie: state.profile.nie || "X1234567L", startDate: state.profile.startDate || `${y}-01-01` };
      save();
    },
  };
})();
