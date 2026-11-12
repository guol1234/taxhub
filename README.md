# Cuentas Claras

A tax toolkit for expats who are self-employed in Spain. It covers the whole path, from getting a NIE to working as an **autónomo** to setting up a **Sociedad Limitada**. You keep your own libros registro, compute the quarterly models and estimate your declaración de la renta, then download the documents you need for each step.

It is a static web app: plain HTML, CSS and JavaScript, with no build step and no backend. Everything you enter stays in your browser (`localStorage`).

## Features

| Section | What it does |
|---|---|
| **Roadmap** | Step-by-step checklists in three parts: the expat foundation (NIE/TIE, padrón, NUSS, bank, certificado digital, DEHú, residency and the Beckham option), going autónomo (IAE, 036, RETA, tarifa plana, invoicing, libros, Verifactu) and moving to an S.L. (RMC, CIRCE, capital, notary, Registro Mercantil, autónomo societario, annual accounts). Progress is saved. |
| **Libros registro** | Records issued and received invoices: VAT, IRPF retention, % business use, reverse charge, EU B2B and assets with amortisation. Exports the libro de ingresos, libro de gastos and libro de bienes de inversión as CSV (Spanish Excel format). |
| **Quarterly 303 / 130** | Builds the VAT return and the IRPF advance from your libros, box by box. Handles reverse charge, EU sales (349), non-taxable exports and the 70 % retention exemption. |
| **Renta & documents** | Estimates the modelo 100 with the state and regional scales, gastos de difícil justificación, the art. 32.2.3 reduction and the mínimo personal y familiar. Generates: the apartado E1 summary (PDF), the renta checklist (PDF), the three libros (CSV), the modelo 347 list (CSV), the quarterly worksheets (PDF), the deductible-expenses guide (PDF) and a tax calendar (.ics). |
| **Cuota autónomo** | RETA cuota under the income-based system, with all tramos, tarifa plana and autónomo societario. |
| **Autónomo vs S.L.** | Side-by-side net income, Impuesto sobre Sociedades (micro / new-company rates), salary + dividends, and a break-even chart. |
| **Invoice generator** | Invoices that meet RD 1619/2012, with the correct legal wording for Spanish, EU (reverse charge) and non-EU clients. Saves as PDF and can record the invoice in the libro in one click. |
| **Tax calendar** | Every deadline for autónomos and S.L.s, exportable to Google, Outlook or Apple calendars. |
| **Expat guide** | Residency, the Beckham regime, modelos 720/721, double taxation, A1 certificates and foreign IBANs. |

## Run it

Open `index.html` in any modern browser. That's all — it works offline from the file system.

```bash
git clone https://github.com/guol1234/taxhub.git
```

## Publish on GitHub Pages

The repository is [guol1234/taxhub](https://github.com/guol1234/taxhub). To publish it as a website, go to **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**. The site will appear at `https://guol1234.github.io/taxhub/`.

## Updating for a new tax year

All yearly figures live in [`js/data.js`](js/data.js) (`CC.TAX`): RETA tramos and rate, IRPF scales, the gastos de difícil justificación percentage, Impuesto sobre Sociedades rates and thresholds. Values that were still pending official confirmation when written are flagged with `verify: true`, and the UI shows them with a **verify** badge.

## Project structure

```
index.html        App shell
css/styles.css    Styles (light + dark)
js/data.js        Tax parameters, roadmaps, calendar, forms index, checklists, glossary
js/calc.js        Pure calculation engine (RETA, IRPF, 303, 130, IS, comparison)
js/store.js       localStorage persistence, backup/restore, demo data
js/docs.js        CSV / ICS / printable PDF generators
js/app.js         Screens and routing
```

## Limitations

- The renta estimate does not include regional deductions, joint filing, rental income or foreign tax credits. Renta WEB adds these from your datos fiscales.
- The regional IRPF scales included are Madrid, Catalunya, Andalucía and Valencia, plus a generic scale. Add your own in `data.js`.
- Estimación directa simplificada only (not módulos / estimación objetiva).
- This is a working tool to prepare and check your own filings. It does not replace professional advice for complex cases such as inspections, inheritances or cross-border restructurings.

## Licence

MIT
