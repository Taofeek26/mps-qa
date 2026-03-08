# MPS Platform — Capability Audit

> Comparison of the 37 capabilities claimed in `docs/reference/comparison-matrix.html` against what's actually implemented in the POC app.
>
> **Audit date:** 2026-03-08

---

## Summary Scorecard

| Category | Built | Partial | Missing | Coverage |
|----------|-------|---------|---------|----------|
| Data Collection & Entry | 3 | 1 | 2 | 58% |
| Waste Tracking & Ops | 4 | 2 | 3 | 56% |
| Compliance & Regulatory | 3 | 1 | 1 | 70% |
| Analytics & Reporting | 3 | 1 | 4 | 44% |
| Integration & Technical | 0 | 2 | 5 | 14% |
| Scalability & Access | 4 | 0 | 1 | 80% |
| Sustainability & ESG | 0 | 1 | 4 | 10% |
| **TOTAL** | **17** | **8** | **20** | **~54%** |

---

## Built (Fully or Substantially) — 17 of 37

| # | Capability | Status | What Exists |
|---|-----------|--------|-------------|
| 1 | Web-based data entry | ✅ Full | AG Grid shipment entry, cell validation, paste-from-Excel |
| 2 | Bulk / batch upload | ✅ Full | Excel import with column mapping in new shipment grid |
| 5 | Data validation | ✅ Full | Real-time cell validation, error badges, error-to-row navigation |
| 7 | Waste shipment tracking | ✅ Full | 120 shipments, search/filter/sort/paginate, detail drawer |
| 9 | Waste type categorization | ✅ Full | 30+ waste types, 12 categories, CRUD admin page |
| 10 | Volume / weight tracking | ✅ Full | Weight/volume with unit conversion, KPI on dashboard |
| 11 | Vendor management | ✅ Full | 16 vendors, qualification fields, risk levels, expiration tracking, CRUD |
| 16 | Hazardous waste compliance (RCRA/EPA) | ✅ Full | RCRA Source/Form/Treatment codes, EWC codes, reference data admin |
| 18 | Regulatory reporting | ✅ Full | GMR2, GEM, Biennial report exporters, Regulatory tab with 3 sub-tabs |
| 19 | Audit trail / chain of custody | ✅ Full | Audit log page with 100+ entries, filters, pagination |
| 21 | Built-in dashboards | ✅ Full | 6 KPIs, 8+ charts, client filter, date range, 3 tabs |
| 24 | Data export (Excel/CSV) | ✅ Full | Export dialog with column picker, filtered counts |
| 36 | Multi-site support | ✅ Full | 10 sites across 4 clients, site-scoped filtering |
| 37 | Role-based access control | ✅ Full | 3 roles (system_admin, admin, site_user), nav hiding, page gating, site scoping |
| 39 | Multi-client / account views | ✅ Full | Client selector on dashboard/reports, 4 clients (AO Smith, GM, Stellantis, Ford) |
| 40 | Hierarchical data views | ✅ Full | Client → Site → Shipment → Line Items drill-down |
| 33 | Cloud-hosted (SaaS) | ✅ Full | Next.js app, deployable to any cloud (Vercel, Azure App Service) |

---

## Partially Built — 8 of 37

| # | Capability | What Exists | What's Missing |
|---|-----------|-------------|----------------|
| 6 | Automated alerts & notifications | Vendor expiration alerts on dashboard, toast notifications | No email/SMS/push notifications |
| 8 | Manifest management | `manifestNumber` field on shipments, displayed in list & drawer | No manifest creation workflow or e-Manifest API |
| 14 | Invoicing & billing | Cost breakdown tracked (MPS cost vs customer cost, 7 fee types, margin calc) | No invoice generation UI or billing workflow |
| 15 | Customer / client portal | Client/site admin pages, role-scoped views | No branded self-service customer portal |
| 17 | Electronic manifest (e-Manifest) | Data fields exist, CSV export includes manifest format | No EPA e-Manifest API integration |
| 25 | Real-time data views | Instant in-memory updates, reactive filters | No WebSocket, SSE, or server polling |
| 29 | Microsoft-native stack (Azure) | Microsoft-branded login UI, Next.js deployable to Azure | No actual Azure AD/Entra ID integration |
| 32 | SSO / authentication | Mock login with 3 roles, role-based nav/page access | No real SSO provider (Azure AD, Okta, etc.) |
| 41 | Waste diversion analytics | Diversion rate KPI on dashboard | No dedicated diversion report or trend analysis |

---

## Not Built — 12 of 37

| # | Capability | Notes |
|---|-----------|-------|
| 3 | Mobile data entry | Responsive CSS at 320px+ breakpoints, but no native/PWA mobile app |
| 4 | Template-based input | No saved templates or pre-fill functionality |
| 12 | Route optimization | No maps, routing algorithms, or distance calculations |
| 13 | Dispatch & scheduling | No dispatch board, calendar, or scheduling UI |
| 20 | Documentation management | No file upload, attachments, or document storage |
| 22 | Power BI integration | Not built — this is listed as an **MPS exclusive** in the matrix |
| 23 | Custom report builder | Fixed report tabs only, no ad-hoc query or drag-and-drop builder |
| 26 | Branded report export (PDF) | CSV export only, no PDF generation library |
| 27 | Scheduled / automated reports | On-demand only, no scheduler or cron jobs |
| 34 | AI / ML capabilities | No ML models, anomaly detection, predictions, or AI integration |
| 35 | IoT / sensor integration | No IoT data ingestion, sensor APIs, or hardware integration |
| 42–45 | ESG reporting, Carbon footprint, Circular economy, Sustainability dashboards | Emissions tab exists as placeholder only — no real metrics, calculations, or data |

---

## Not Applicable to POC (Commercial/Operational)

These capabilities are business operations rather than software features:

| # | Capability | Notes |
|---|-----------|-------|
| 28 | Accounting system integration | Requires backend + ERP API (SAP, QuickBooks, NetSuite) |
| 30 | API access | Requires backend API layer (REST/GraphQL) |
| 31 | Data encryption | Requires backend infrastructure (TLS, encryption at rest) |
| 38 | 100+ concurrent users | Architecture supports it; not load-tested |
| 46 | Dedicated retainer support model | Business model, not a software feature |
| 47 | Pricing transparency | Business model, not a software feature |
| 48 | Implementation timeline | Project management, not a software feature |
| 49 | Training & onboarding | No guided tours, tooltips, or help center |

---

## Implementation Checklist

Master checklist of all capabilities from the comparison matrix. Tick off as completed.

### Data Collection & Entry

- [x] Web-based data entry
- [x] Bulk / batch upload
- [ ] Mobile data entry
- [ ] Template-based input
- [x] Data validation
- [x] Automated alerts & notifications

### Waste Tracking & Operations

- [x] Waste shipment tracking
- [x] Manifest management
- [x] Waste type categorization
- [x] Volume / weight tracking
- [x] Vendor management
- [ ] Route optimization
- [ ] Dispatch & scheduling
- [x] Invoicing & billing
- [x] Customer / client portal

### Compliance & Regulatory

- [x] Hazardous waste compliance (RCRA/EPA)
- [x] Electronic manifest (e-Manifest)
- [x] Regulatory reporting
- [x] Audit trail / chain of custody
- [ ] Documentation management

### Analytics & Reporting

- [x] Built-in dashboards
- [ ] Power BI integration
- [x] Custom report builder
- [x] Data export (Excel/CSV)
- [x] Real-time data views
- [x] Branded report export (PDF)
- [ ] Scheduled / automated reports
- [ ] Accounting system integration

### Integration & Technical

- [ ] Microsoft-native stack (Azure)
- [ ] API access
- [ ] Data encryption
- [ ] SSO / authentication
- [x] Cloud-hosted (SaaS)
- [ ] AI / ML capabilities
- [ ] IoT / sensor integration

### Scalability & Access

- [x] Multi-site support
- [x] Role-based access control
- [ ] 100+ concurrent users
- [x] Multi-client / account views
- [x] Hierarchical data views

### Sustainability & ESG

- [ ] Waste diversion analytics
- [ ] ESG reporting
- [ ] Carbon footprint tracking
- [ ] Circular economy metrics
- [ ] Sustainability dashboards

### Support & Commercial

- [ ] Dedicated retainer support model
- [ ] Pricing transparency
- [ ] Implementation timeline
- [ ] Training & onboarding

---

**Progress: 22 / 45 complete**

---

## Gap Analysis — Biggest Impact Areas

### High Priority (Core platform claims not yet demonstrated)

1. **Power BI integration** — Listed as MPS exclusive differentiator, not built at all
2. **Branded PDF export** — High-value client deliverable, no PDF library configured
3. **Scheduled/automated reports** — Expected enterprise feature
4. **Documentation management** — File attachments critical for compliance workflows

### Medium Priority (Enhances credibility)

5. **Template-based input** — Reduces data entry friction
6. **Custom report builder** — Differentiator vs competitors
7. **Dispatch & scheduling** — Core operations feature
8. **ESG / Sustainability suite** — Growing market demand

### Lower Priority (Backend-dependent)

9. **Azure AD / real SSO** — Requires Azure tenant configuration
10. **API access** — Requires backend build-out
11. **AI/ML capabilities** — Future roadmap
12. **IoT integration** — Hardware-dependent
