/*
 * Cuentas Claras — tax parameters and content.
 * Every number that changes by year lives here, so updating the app for a new
 * tax year means editing this file only. Values marked `verify: true` were
 * pending official confirmation when written (Nov 2026): check the BOE / AEAT.
 */
window.CC = window.CC || {};

CC.TAX = {
  year: 2026,

  // ---- Seguridad Social: RETA (autónomos), sistema de cotización por ingresos reales ----
  reta: {
    // Contribution rate incl. contingencias comunes, profesionales, cese, FP and MEI.
    rate: 0.315, // 31.3 % + MEI 0.9 % in 2026 (31.4 % in 2025)
    verify: true,
    note: "2026 table: the 2025 brackets were kept (prorrogados) for 2026. Check the latest Orden de cotización.",
    // Monthly net yield (rendimiento neto / 12) → minimum and maximum base.
    tramos: [
      { table: "Reducida", from: 0,       to: 670,     baseMin: 653.59,  baseMax: 718.94 },
      { table: "Reducida", from: 670,     to: 900,     baseMin: 718.95,  baseMax: 900 },
      { table: "Reducida", from: 900,     to: 1166.70, baseMin: 849.67,  baseMax: 1166.70 },
      { table: "General",  from: 1166.70, to: 1300,    baseMin: 950.98,  baseMax: 1300 },
      { table: "General",  from: 1300,    to: 1500,    baseMin: 960.78,  baseMax: 1500 },
      { table: "General",  from: 1500,    to: 1700,    baseMin: 960.78,  baseMax: 1700 },
      { table: "General",  from: 1700,    to: 1850,    baseMin: 1143.79, baseMax: 4909.50 },
      { table: "General",  from: 1850,    to: 2030,    baseMin: 1209.15, baseMax: 4909.50 },
      { table: "General",  from: 2030,    to: 2330,    baseMin: 1274.51, baseMax: 4909.50 },
      { table: "General",  from: 2330,    to: 2760,    baseMin: 1356.21, baseMax: 4909.50 },
      { table: "General",  from: 2760,    to: 3190,    baseMin: 1437.91, baseMax: 4909.50 },
      { table: "General",  from: 3190,    to: 3620,    baseMin: 1519.61, baseMax: 4909.50 },
      { table: "General",  from: 3620,    to: 4050,    baseMin: 1601.31, baseMax: 4909.50 },
      { table: "General",  from: 4050,    to: 6000,    baseMin: 1732.03, baseMax: 4909.50 },
      { table: "General",  from: 6000,    to: Infinity, baseMin: 1928.10, baseMax: 4909.50 },
    ],
    tarifaPlana: { monthly: 80, months: 12, extraMonthsIfBelowSMI: 12 },
    // When computing the RETA yield, Social Security lets you deduct 7 % (3 % for societarios)
    // as "gastos genéricos" on top of your net profit.
    genericDeduction: 0.07,
    genericDeductionSocietario: 0.03,
    baseMinSocietario: 1000, // autónomo societario: minimum base in the first year in practice ~1.000 €
  },

  // ---- IRPF ----
  irpf: {
    minimoPersonal: 5550,
    minimoOver65: 1150,
    minimoOver75: 1400,
    minimoDescendientes: [2400, 2700, 4000, 4500],
    minimoDescendienteUnder3: 2800,
    // State half of the general scale (escala estatal).
    stateScale: [
      { upTo: 12450, rate: 0.095 },
      { upTo: 20200, rate: 0.12 },
      { upTo: 35200, rate: 0.15 },
      { upTo: 60000, rate: 0.185 },
      { upTo: 300000, rate: 0.225 },
      { upTo: Infinity, rate: 0.245 },
    ],
    // Regional half. "generic" mirrors the state scale (the historic default).
    regionalScales: {
      generic: {
        label: "Generic (same as state scale)",
        scale: [
          { upTo: 12450, rate: 0.095 }, { upTo: 20200, rate: 0.12 }, { upTo: 35200, rate: 0.15 },
          { upTo: 60000, rate: 0.185 }, { upTo: Infinity, rate: 0.225 },
        ],
      },
      madrid: {
        label: "Comunidad de Madrid",
        verify: true,
        scale: [
          { upTo: 13362.22, rate: 0.085 }, { upTo: 19004.63, rate: 0.107 }, { upTo: 35425.68, rate: 0.128 },
          { upTo: 57320.40, rate: 0.174 }, { upTo: Infinity, rate: 0.205 },
        ],
      },
      cataluna: {
        label: "Catalunya",
        verify: true,
        scale: [
          { upTo: 12450, rate: 0.105 }, { upTo: 17707.20, rate: 0.12 }, { upTo: 21000, rate: 0.14 },
          { upTo: 33007.20, rate: 0.15 }, { upTo: 53407.20, rate: 0.188 }, { upTo: 90000, rate: 0.215 },
          { upTo: 120000, rate: 0.235 }, { upTo: 175000, rate: 0.245 }, { upTo: Infinity, rate: 0.255 },
        ],
      },
      andalucia: {
        label: "Andalucía",
        verify: true,
        scale: [
          { upTo: 13000, rate: 0.095 }, { upTo: 21100, rate: 0.12 }, { upTo: 35200, rate: 0.15 },
          { upTo: 60000, rate: 0.185 }, { upTo: Infinity, rate: 0.225 },
        ],
      },
      valencia: {
        label: "Comunitat Valenciana",
        verify: true,
        scale: [
          { upTo: 12000, rate: 0.09 }, { upTo: 22000, rate: 0.12 }, { upTo: 32000, rate: 0.15 },
          { upTo: 42000, rate: 0.175 }, { upTo: 52000, rate: 0.20 }, { upTo: 62000, rate: 0.225 },
          { upTo: 72000, rate: 0.25 }, { upTo: 100000, rate: 0.265 }, { upTo: 150000, rate: 0.275 },
          { upTo: 200000, rate: 0.295 }, { upTo: Infinity, rate: 0.305 },
        ],
      },
    },
    // Savings scale (dividends, interest, gains) — state + regional combined.
    savingsScale: [
      { upTo: 6000, rate: 0.19 }, { upTo: 50000, rate: 0.21 }, { upTo: 200000, rate: 0.23 },
      { upTo: 300000, rate: 0.27 }, { upTo: Infinity, rate: 0.30 },
    ],
    // Estimación directa simplificada: provisions + hard-to-justify expenses.
    gastosDificilJustificacion: { 2023: 0.07, 2024: 0.07, 2025: 0.07, 2026: 0.05, cap: 2000, verify: true },
    // Art. 32.2.3 LIRPF: low-income autónomos (otras rentas ≤ 6.500 €).
    reduccionBajosRendimientos: { full: 1620, lower: 8000, upper: 12000, slope: 0.405, maxOtherIncome: 6500 },
    retencionGeneral: 0.15,
    retencionNuevos: 0.07, // first year of activity + the two following years
    pagoFraccionado130: 0.20,
    retencionAdministrador: 0.35,
    retencionAdministradorPequena: 0.19, // company turnover < 100.000 €
  },

  iva: { general: 0.21, reducido: 0.10, superreducido: 0.04, exento: 0 },

  // ---- Impuesto sobre Sociedades (Ley 7/2024, phased in) ----
  sociedades: {
    verify: true,
    general: 0.25,
    nuevaCreacion: { rate: 0.15, years: 2, note: "First tax period with positive base and the next one." },
    // Microempresa: turnover < 1 M€ — two brackets.
    micro: { 2025: [0.21, 0.22], 2026: [0.19, 0.21], 2027: [0.17, 0.20], firstBracket: 50000 },
    // Empresa de reducida dimensión (turnover < 10 M€, not micro).
    erd: { 2025: 0.24, 2026: 0.23, 2027: 0.22, 2028: 0.21, 2029: 0.20 },
    capitalMinimo: 1,
    capitalNoteRegime: "With capital below 3.000 € the SL must allocate 20 % of profit to legal reserve and partners are jointly liable up to 3.000 € on liquidation.",
  },

  thresholds: {
    modelo347: 3005.06,
    modelo720: 50000,
    beckhamCap: 600000,
    beckhamRate: 0.24,
    verifactuAutonomos: "1 July 2027",
    verifactuSociedades: "1 January 2027",
  },
};

/* ------------------------------------------------------------------ */
/*  Roadmaps                                                           */
/* ------------------------------------------------------------------ */
// Each step: id, title, why, how (list), docs (what you bring), forms, link, tag.
CC.ROADMAPS = {
  foundation: {
    title: "0 · Foundation for any expat",
    intro: "Before Hacienda or Social Security will register you, you need an identity in the Spanish system. These steps are the same for an autónomo and for an S.L. partner.",
    steps: [
      { id: "f-nie", title: "NIE number (and TIE / EU registration certificate)",
        why: "The NIE is your tax ID (it doubles as your NIF). EU citizens get the green Certificado de Registro de Ciudadano de la UE; non‑EU citizens get the TIE card tied to a residence/work authorisation that allows self-employment.",
        how: ["Book a cita previa at the Oficina de Extranjería or the Policía Nacional (\"Certificados UE\" or \"Toma de huellas\").",
              "Pay tasa modelo 790 código 012 at a bank before the appointment.",
              "Non-EU: you need an authorisation for cuenta propia (self-employment) or a visa such as the digital nomad / entrepreneur visa (Ley de Startups) before you can register as autónomo."],
        docs: ["Passport + copy", "Form EX-15 (NIE) or EX-18 (EU registration)", "Paid modelo 790-012", "Proof of reason (contract, business plan, health insurance + funds for EU registration)"],
        link: "https://sede.administracionespublicas.gob.es/icpplus/index.html", tag: "Extranjería" },
      { id: "f-padron", title: "Empadronamiento (town hall registration)",
        why: "Proof of address used by Extranjería, the bank, the health system and to fix your tax residence region (which decides the regional half of your IRPF).",
        how: ["Request a cita at your Ayuntamiento.", "Bring rental contract or the owner's authorisation + copy of their ID.", "Ask for a volante/certificado de empadronamiento — keep a recent copy (< 3 months)."],
        docs: ["Passport/NIE", "Rental contract or escritura", "Form from the Ayuntamiento"], tag: "Ayuntamiento" },
      { id: "f-ssnum", title: "Número de afiliación a la Seguridad Social (NUSS)",
        why: "Needed before you can register in the RETA. If you ever worked in Spain you already have one.",
        how: ["Apply online via Import@ss (\"Asignación de número de Seguridad Social\") or at a TGSS office.", "Form TA.1 if done in person."],
        docs: ["NIE/TIE", "Passport", "Form TA.1"], link: "https://portal.seg-social.gob.es/wps/portal/importass/importass", tag: "Seguridad Social" },
      { id: "f-bank", title: "Spanish bank account (IBAN ES)",
        why: "The TGSS charges your cuota by direct debit to a Spanish/SEPA account, and Hacienda refunds go there. Use a separate account for the business — it makes the libros and any inspection far easier.",
        how: ["Open a resident account once you have NIE + padrón (non-resident accounts cost more).", "A SEPA account in another EU country is legally valid, but many offices still ask for a Spanish IBAN."],
        docs: ["NIE/TIE", "Passport", "Padrón", "Proof of activity/income"], tag: "Bank" },
      { id: "f-cert", title: "Certificado digital (FNMT) or Cl@ve",
        why: "Every model (036, 303, 130, renta) is filed online. A certificado digital is the strongest option and is required for most company procedures. Cl@ve PIN/Permanente works for personal filings.",
        how: ["FNMT \"Persona física\": request code online → identity check at an AEAT/SS office (or with the FNMT video-ID app) → download on the same computer.",
              "Cl@ve: register at an AEAT office or by video call with your NIE.",
              "Back up the certificate (.pfx) with a strong password."],
        docs: ["NIE/TIE + passport", "Request code from FNMT"], link: "https://www.sede.fnmt.gob.es/certificados/persona-fisica", tag: "Identity" },
      { id: "f-dehu", title: "Activate electronic notifications (DEHú / DEH)",
        why: "Autónomos and companies receive official notifications electronically. A notification counts as delivered 10 days after it is made available, whether you open it or not — missing one is how most expats get fined.",
        how: ["Log in to DEHú with your certificate and add an email alert.", "Check it monthly even if you use a gestoría."],
        link: "https://dehu.redsara.es", tag: "Identity" },
      { id: "f-residency", title: "Decide your tax residency and the Beckham option",
        why: "You are tax resident if you spend > 183 days in Spain in a calendar year, or your main business/economic interests or your spouse and minor children are here. Residents pay IRPF on worldwide income.",
        how: ["If you moved this year and were not resident in Spain in the previous 5 years, check the special impatriate regime (Beckham law, modelo 149) — since 2023 it also covers entrepreneurs with an ENISA-certified innovative activity and highly qualified professionals for startups.",
              "Deadline: 6 months from your Social Security registration.",
              "Check the double taxation treaty with your home country to avoid paying twice in your exit year."],
        forms: ["149", "151"], tag: "Expat" },
    ],
  },
  autonomo: {
    title: "1 · Alta como autónomo",
    intro: "Registration order matters: Hacienda first (alta censal), Social Security the same day or earlier (you can register in the RETA up to 60 days before the start date).",
    steps: [
      { id: "a-iae", title: "Pick your epígrafe IAE and CNAE",
        why: "The epígrafe decides your VAT regime, whether clients must withhold IRPF (professionals in section 2 of the IAE: yes; business activities in section 1: generally no) and which retention applies.",
        how: ["Professionals (consultants, developers, designers, translators…) → IAE section 2 → you invoice with 15 % IRPF (7 % first three years) to Spanish businesses.",
              "Business activities (shop, e‑commerce, hospitality) → section 1 → usually no retention, possibly recargo de equivalencia in retail.",
              "You can register several epígrafes."], tag: "Hacienda" },
      { id: "a-036", title: "Alta censal — modelo 036",
        why: "Registers your activity with the AEAT. The simplified 037 has been integrated into the 036.",
        how: ["File online with certificado/Cl@ve: \"Declaración censal de alta\".",
              "Choose: estimación directa simplificada (IRPF), régimen general de IVA, start date, address of activity.",
              "Tick ROI (Registro de Operadores Intracomunitarios) if you will invoice EU businesses or buy from EU suppliers — without ROI you cannot invoice them without Spanish VAT.",
              "Declare whether you will withhold (alquiler of an office → modelo 115, employees/professionals → modelo 111)."],
        docs: ["Certificado digital", "NIE", "Activity address / referencia catastral if you rent premises"], forms: ["036"],
        link: "https://sede.agenciatributaria.gob.es/Sede/censos-nif-domicilio-fiscal/presentar-declaraciones-censales.html", tag: "Hacienda" },
      { id: "a-reta", title: "Alta en el RETA (Import@ss)",
        why: "Social Security registration. Your monthly cuota depends on your forecast net yield (sistema de ingresos reales) and is regularised later.",
        how: ["Import@ss → \"Alta como autónomo\". Choose the tramo matching your forecast monthly net yield.",
              "Apply for the tarifa plana (80 €/month, 12 months, extendable 12 more if your yield is below the SMI) if you were not autónomo in the last 2 years (3 if you used it before).",
              "Choose a mutua colaboradora for incapacidad temporal and contingencias profesionales.",
              "You can change your base up to 6 times per year."],
        docs: ["NUSS", "NIE", "IBAN", "036 already filed (or same day)"], forms: ["TA.0521"],
        link: "https://portal.seg-social.gob.es/wps/portal/importass/importass/tramites/altaAutonomos", tag: "Seguridad Social" },
      { id: "a-licencia", title: "Town hall licence (only with premises)",
        why: "If you open a shop, studio or office open to the public you need a licencia de apertura or declaración responsable. Working from home as a professional usually does not need one.",
        how: ["Check your Ayuntamiento's procedure — many cities use a declaración responsable + tasa.", "Hospitality and food need additional sanitary registrations."], tag: "Ayuntamiento" },
      { id: "a-factura", title: "Set up invoicing that complies",
        why: "Invoices must meet RD 1619/2012. From 2027 your invoicing software must comply with Verifactu.",
        how: ["Mandatory fields: number + series, date, your name/NIF/address, client name/NIF/address, description, base, VAT rate + amount, IRPF retention if any, total.",
              "Correlative numbering per series (e.g. 2026-001). Rectifying invoices in their own series (R-2026-001).",
              "EU B2B: 0 % VAT with text \"Inversión del sujeto pasivo – art. 196 Directiva 2006/112/CE\" + client VAT number verified in VIES.",
              "Non-EU clients for services: \"Operación no sujeta – art. 69 LIVA\".",
              `Verifactu: compliant software becomes mandatory for autónomos from ${CC.TAX.thresholds.verifactuAutonomos}.`],
        tag: "Daily" },
      { id: "a-libros", title: "Keep the libros registro",
        why: "Estimación directa simplificada requires: libro de ingresos, libro de gastos, libro de bienes de inversión, and VAT books (facturas emitidas / recibidas). Use the Libros tab of this app.",
        how: ["Record each invoice the day you issue or receive it.", "Keep the PDFs for 4 years (6 years for commercial purposes, longer for assets)."], tag: "Daily" },
      { id: "a-trimestral", title: "Quarterly filings (1–20 Apr, Jul, Oct; 1–30 Jan)",
        why: "Every quarter: modelo 303 (VAT) and modelo 130 (IRPF advance, 20 % of the accumulated profit). Skip 130 if ≥ 70 % of your income already had IRPF withheld by clients.",
        how: ["Use the Quarterly calculator tab.", "Also 111 if you withheld on professional invoices/salaries, 115 if you rent an office, 349 if you had EU operations."],
        forms: ["303", "130", "111", "115", "349"], tag: "Recurring" },
      { id: "a-anual", title: "Annual filings (January–June)",
        why: "January: 390 (VAT annual summary), 190/180 if you withheld. February: 347 if you exceeded 3.005,06 € with one client/supplier. March: 720/721 for foreign assets. April–June: declaración de la renta (modelo 100).",
        forms: ["390", "190", "180", "347", "720", "721", "100"], tag: "Recurring" },
    ],
  },
  sl: {
    title: "2 · From autónomo to Sociedad Limitada",
    intro: "Rule of thumb: an S.L. starts to pay off when your net profit is consistently above ~45.000–60.000 €/year, you want to retain earnings in the company, or you need limited liability. Use the Autónomo vs S.L. calculator to see your own break-even.",
    steps: [
      { id: "s-name", title: "Certificación negativa de denominación (Registro Mercantil Central)",
        why: "Reserves the company name. Valid for 6 months (3 months to use at the notary).",
        how: ["Request online at rmc.es with up to 5 name options.", "Cost ~16 €. Arrives in 1–3 days."],
        link: "https://www.rmc.es", tag: "Registro" },
      { id: "s-circe", title: "Choose: notary route or CIRCE (PAE / DUE)",
        why: "CIRCE creates the company electronically with standard by-laws in ~1 week and lower notary fees. A custom notary route is better for multiple partners with a shareholders' agreement.",
        how: ["PAE (Punto de Atención al Emprendedor) can file the DUE for you, free.", "Ley Crea y Crece: minimum share capital is now 1 €."], tag: "Registro" },
      { id: "s-capital", title: "Deposit the share capital",
        why: "The notary needs the bank certificate of the deposit (or a declaration of contribution with capital ≥ 3.000 € in kind/cash).",
        how: ["Open an account in the name of the company \"en constitución\".", `Below 3.000 € capital: ${CC.TAX.sociedades.capitalNoteRegime}`], tag: "Bank" },
      { id: "s-nif", title: "NIF provisional (modelo 036)",
        why: "The company needs its own tax ID before it operates. The notary/gestoría usually requests it.", forms: ["036"], tag: "Hacienda" },
      { id: "s-escritura", title: "Escritura pública at the notary",
        why: "Signed by all partners with NIE. Includes estatutos, administrator appointment (administrador único / solidarios / mancomunados) and the declaración de titularidad real.",
        how: ["Foreign partners without NIE cannot sign — get it first.", "Bring the certificación negativa, bank certificate and passports."], tag: "Notary" },
      { id: "s-itp", title: "Impuesto de Actos Jurídicos Documentados",
        why: "Company formation is exempt from operaciones societarias but must still be declared (modelo 600) in many regions within 30 days.", forms: ["600"], tag: "Region" },
      { id: "s-rm", title: "Inscripción en el Registro Mercantil provincial",
        why: "The company gets legal personality once registered. Then request the NIF definitivo.", tag: "Registro" },
      { id: "s-036", title: "Alta censal of the S.L. + IAE",
        why: "036 for the company: activity, VAT regime, ROI, and whether it will withhold (salaries to the administrator → modelo 111).", forms: ["036"], tag: "Hacienda" },
      { id: "s-societario", title: "Autónomo societario (RETA)",
        why: `If you control ≥ 25 % (or ≥ 33 % working in the company, or 50 % with family) and you are an administrator, you stay in the RETA as autónomo societario. Minimum base in practice ≈ ${CC.TAX.reta.baseMinSocietario} €/month. The cuota can be paid by the company and is a deductible expense for the S.L. but taxable income in kind (retribución en especie) for you.`,
        how: ["Change your RETA registration (\"variación de datos\"), do not de-register and re-register.", "Close your personal activity in a new 036 (baja) if the business moves entirely to the S.L."], tag: "Seguridad Social" },
      { id: "s-libros", title: "Books and annual obligations of an S.L.",
        why: "An S.L. must keep full accounting under the Plan General Contable (PGC PYMES).",
        how: ["Libro Diario + Libro de Inventarios y Cuentas Anuales: legalise them at the Registro Mercantil within 4 months of the year end.",
              "Cuentas anuales: approved by the junta within 6 months, deposited at the Registro Mercantil within 1 month after approval.",
              "Impuesto sobre Sociedades: modelo 200 in July (25 days after the 6 months following year end); pagos fraccionados modelo 202 in April, October, December.",
              "Administrator salary: payroll with retention (35 %, or 19 % if company turnover < 100.000 €) → modelo 111 quarterly, 190 annually.",
              "Dividends: 19 % retention → modelo 123/193."],
        forms: ["200", "202", "111", "190", "123", "193", "303", "390", "347"], tag: "Recurring" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Fiscal calendar (autónomo + S.L.)                                  */
/* ------------------------------------------------------------------ */
CC.CALENDAR = [
  { when: "1–30 January", who: "both", items: ["303 Q4 + 390 (VAT annual summary)", "130 Q4 (autónomo)", "111 / 115 Q4 + 190 / 180 annual", "349 Q4"] },
  { when: "1–28 February", who: "both", items: ["347 (third parties > 3.005,06 €)"] },
  { when: "1–31 March", who: "both", items: ["720 foreign assets > 50.000 € (bank accounts, securities, real estate)", "721 crypto held abroad > 50.000 €"] },
  { when: "Early April – 30 June", who: "autonomo", items: ["Renta (modelo 100) — direct debit deadline ~25 June", "Patrimonio (714) if applicable"] },
  { when: "1–20 April", who: "both", items: ["303 Q1", "130 Q1 (autónomo)", "111 / 115 Q1", "202 first payment (S.L.)"] },
  { when: "By 30 April", who: "sl", items: ["Legalise libros oficiales at Registro Mercantil"] },
  { when: "By 30 June", who: "sl", items: ["Junta general approves cuentas anuales"] },
  { when: "1–20 July", who: "both", items: ["303 Q2", "130 Q2", "111 / 115 Q2"] },
  { when: "1–25 July", who: "sl", items: ["Impuesto sobre Sociedades — modelo 200", "Deposit cuentas anuales at Registro Mercantil (within 1 month of approval)"] },
  { when: "1–20 October", who: "both", items: ["303 Q3", "130 Q3", "111 / 115 Q3", "202 second payment (S.L.)"] },
  { when: "November", who: "autonomo", items: ["Second instalment of the renta if you split the payment (60 % / 40 %)"] },
  { when: "1–20 December", who: "sl", items: ["202 third payment"] },
  { when: "Any time", who: "both", items: ["Notify changes (address, activity, ROI) with 036 within 1 month", "Change RETA base up to 6 times per year", "Check DEHú notifications"] },
];

/* ------------------------------------------------------------------ */
/*  Forms index (modelos) with official links                          */
/* ------------------------------------------------------------------ */
const AEAT = "https://sede.agenciatributaria.gob.es";
CC.FORMS = [
  { code: "036", name: "Declaración censal (alta, modificación, baja)", who: "both", url: `${AEAT}/Sede/procedimientoini/G322.shtml` },
  { code: "100", name: "IRPF — Declaración de la renta", who: "autonomo", url: `${AEAT}/Sede/Renta.html` },
  { code: "130", name: "IRPF pago fraccionado — estimación directa", who: "autonomo", url: `${AEAT}/Sede/procedimientoini/G601.shtml` },
  { code: "303", name: "IVA autoliquidación trimestral", who: "both", url: `${AEAT}/Sede/procedimientoini/G414.shtml` },
  { code: "390", name: "IVA resumen anual", who: "both", url: `${AEAT}/Sede/procedimientoini/G412.shtml` },
  { code: "349", name: "Operaciones intracomunitarias", who: "both", url: `${AEAT}/Sede/procedimientoini/GI28.shtml` },
  { code: "347", name: "Operaciones con terceros > 3.005,06 €", who: "both", url: `${AEAT}/Sede/procedimientoini/GI27.shtml` },
  { code: "111", name: "Retenciones trabajo / profesionales (trimestral)", who: "both", url: `${AEAT}/Sede/procedimientoini/GH01.shtml` },
  { code: "190", name: "Retenciones trabajo / profesionales (resumen anual)", who: "both", url: `${AEAT}/Sede/procedimientoini/GI10.shtml` },
  { code: "115", name: "Retenciones alquiler de locales (trimestral)", who: "both", url: `${AEAT}/Sede/procedimientoini/GH02.shtml` },
  { code: "180", name: "Retenciones alquiler (resumen anual)", who: "both", url: `${AEAT}/Sede/procedimientoini/GI03.shtml` },
  { code: "720", name: "Bienes y derechos en el extranjero", who: "both", url: `${AEAT}/Sede/procedimientoini/GI34.shtml` },
  { code: "721", name: "Monedas virtuales en el extranjero", who: "both", url: `${AEAT}/Sede/procedimientoini/GI58.shtml` },
  { code: "149", name: "Régimen especial impatriados (Beckham) — opción", who: "both", url: `${AEAT}/Sede/procedimientoini/G811.shtml` },
  { code: "151", name: "Renta — régimen de impatriados", who: "both", url: `${AEAT}/Sede/procedimientoini/G605.shtml` },
  { code: "200", name: "Impuesto sobre Sociedades", who: "sl", url: `${AEAT}/Sede/procedimientoini/G201.shtml` },
  { code: "202", name: "Sociedades — pagos fraccionados", who: "sl", url: `${AEAT}/Sede/procedimientoini/G203.shtml` },
  { code: "123", name: "Retenciones capital mobiliario (dividendos) trimestral", who: "sl", url: `${AEAT}/Sede/procedimientoini/GH03.shtml` },
  { code: "193", name: "Retenciones capital mobiliario resumen anual", who: "sl", url: `${AEAT}/Sede/procedimientoini/GI13.shtml` },
];
CC.FORMS_NOTE = "Links point to the official AEAT Sede. The AEAT occasionally reorganises its URLs — if a link 404s, search the modelo number on sede.agenciatributaria.gob.es.";

/* ------------------------------------------------------------------ */
/*  Renta checklist                                                     */
/* ------------------------------------------------------------------ */
CC.RENTA_CHECKLIST = [
  { group: "Access", items: [
    "Certificado digital, Cl@ve or número de referencia (from casilla 505 of last year's renta + NIE + IBAN)",
    "IBAN for refund / direct debit (Spanish or SEPA)",
  ]},
  { group: "Activity (autónomo) — apartado E1, estimación directa", items: [
    "Libro registro de ingresos (all invoices issued in the year)",
    "Libro registro de gastos (all deductible invoices and tickets)",
    "Libro registro de bienes de inversión + amortisation table",
    "Four modelos 130 filed (amounts paid are deducted in the renta)",
    "Certificates of retenciones from your clients (or your 190 data in datos fiscales)",
    "RETA cuotas paid in the year (certificado de cotizaciones from Import@ss) — fully deductible",
    "Supplies if you work from home: % of the home used × 30 % of water, electricity, gas, internet",
    "Professional insurance, mutua, colegio profesional fees, gestoría fees",
  ]},
  { group: "Personal & family", items: [
    "Datos fiscales download from Renta WEB (pre-filled data — check every line)",
    "Rental contract + NIF of landlord (some regions give a deduction for rent)",
    "Referencia catastral of your home (and of any other property you own)",
    "Mortgage certificate for homes bought before 2013 (transitional deduction)",
    "Children: birth certificates / NIEs; daycare costs (deducción por maternidad)",
    "Donations to NGOs (certificate)",
    "Pension plan contributions (plan de pensiones / plan de autónomos — limit 5.750 € via plan de empleo simplificado)",
  ]},
  { group: "Foreign income & assets (expats)", items: [
    "Foreign salaries, pensions, dividends or interest + foreign tax paid (for deducción por doble imposición internacional)",
    "Rental income from property in your home country",
    "Sale of foreign shares / crypto (capital gains)",
    "Modelo 720 / 721 filed if foreign assets > 50.000 € per category",
    "If you opted for Beckham: file modelo 151, not 100",
  ]},
];

/* ------------------------------------------------------------------ */
/*  Expense guide                                                       */
/* ------------------------------------------------------------------ */
CC.EXPENSES = [
  { item: "RETA cuota", irpf: "100 %", iva: "—", note: "Deductible in the year paid. Not a VAT invoice." },
  { item: "Gestoría / asesoría", irpf: "100 %", iva: "100 %", note: "" },
  { item: "Software, SaaS, domains, hosting", irpf: "100 %", iva: "100 %*", note: "*Foreign SaaS: reverse charge — declare in 303 as both devengado and deducible." },
  { item: "Office rent (local)", irpf: "100 %", iva: "100 %", note: "Withhold 19 % IRPF on the rent (modelo 115) unless the landlord is exempt." },
  { item: "Home office supplies", irpf: "30 % × % of home used", iva: "No", note: "Only if the home is declared as activity address in the 036. Rent/IBI/community: % of m² used." },
  { item: "Mobile & internet", irpf: "Business use %", iva: "Business use %", note: "Keep a separate line if you can." },
  { item: "Computer, equipment", irpf: "Amortisation (or 100 % if ≤ 300 €)", iva: "100 %", note: "Libertad de amortización for small assets ≤ 300 € up to 25.000 €/year." },
  { item: "Car", irpf: "Only if exclusively for the activity", iva: "50 % presumed", note: "Hacienda rarely accepts IRPF deduction except taxis, delivery, sales reps, driving schools." },
  { item: "Meals (manutención)", irpf: "26,67 €/day Spain · 48,08 € abroad", iva: "Only with full invoice", note: "Paid electronically, in a restaurant, on a working day, away from your home municipality." },
  { item: "Travel & hotels", irpf: "100 %", iva: "100 % with invoice", note: "Must relate to the activity." },
  { item: "Training & books", irpf: "100 % if related", iva: "100 %", note: "" },
  { item: "Health insurance", irpf: "Up to 500 €/person/year", iva: "Exempt", note: "You, spouse and children under 25 living with you." },
  { item: "Clothing, gym, personal", irpf: "No", iva: "No", note: "Unless it is a uniform/PPE." },
];

/* ------------------------------------------------------------------ */
/*  Glossary                                                            */
/* ------------------------------------------------------------------ */
CC.GLOSSARY = [
  ["AEAT / Hacienda", "Agencia Estatal de Administración Tributaria — the tax agency."],
  ["TGSS", "Tesorería General de la Seguridad Social — collects the RETA cuota."],
  ["RETA", "Régimen Especial de Trabajadores Autónomos — the self-employed Social Security scheme."],
  ["NIE / NIF", "Número de Identidad de Extranjero; for foreigners it works as the tax number (NIF)."],
  ["Estimación directa simplificada", "Default IRPF regime for autónomos with turnover < 600.000 €: tax on real income − real expenses, plus a flat 5 % / 7 % for hard-to-justify expenses (max 2.000 €)."],
  ["Rendimiento neto", "Net yield: income − deductible expenses. Base for IRPF and for the RETA tramo."],
  ["Retención", "IRPF your Spanish business clients withhold from your invoice (15 %, or 7 % in the first 3 years) and pay to Hacienda on your behalf."],
  ["Pago fraccionado", "Advance payment of income tax (modelo 130 for autónomos, 202 for companies)."],
  ["Base imponible", "Taxable base (net amount before VAT)."],
  ["IVA soportado / repercutido", "VAT you paid on purchases / VAT you charged on sales. 303 = repercutido − soportado."],
  ["Inversión del sujeto pasivo", "Reverse charge — the buyer declares the VAT (EU B2B, some construction)."],
  ["ROI / VIES", "Registro de Operadores Intracomunitarios — the EU VAT registration. VIES is the EU database where clients check you."],
  ["Gestoría / Asesoría", "Firm that files your taxes. Typical fee 40–80 €/month autónomo, 120–250 €/month S.L."],
  ["Autónomo societario", "Partner-administrator of a company who must be in the RETA."],
  ["Verifactu", "Anti-fraud invoicing-software standard (RD 1007/2023). Invoices carry a QR and can be sent to the AEAT in real time."],
  ["Cuentas anuales", "Annual accounts of an S.L.: balance sheet, P&L, notes (memoria)."],
];
