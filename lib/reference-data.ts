/* ============================================
   MPS Platform — Reference Data Lookups
   Source/Form/Treatment/EWC codes from
   the GM Waste Template and EPA standards
   ============================================ */

import type { ReferenceCode } from "./types";

/* ─── Source Codes (RCRA) ─── */

export const SOURCE_CODES: ReferenceCode[] = [
  // Wastes from on-going production and service processes
  { id: "src-G01", code: "G01", description: "Dip, flush or spray rinsing (solvents to clean or prepare parts)", category: "Production/Service" },
  { id: "src-G02", code: "G02", description: "Stripping and acid or caustic cleaning", category: "Production/Service" },
  { id: "src-G03", code: "G03", description: "Plating and phosphating", category: "Production/Service" },
  { id: "src-G04", code: "G04", description: "Etching (caustics or other methods to remove layers)", category: "Production/Service" },
  { id: "src-G05", code: "G05", description: "Metal forming and treatment (pickling, heat treating, punching)", category: "Production/Service" },
  { id: "src-G06", code: "G06", description: "Painting and coating (manufacturing, building, or maintenance)", category: "Production/Service" },
  { id: "src-G07", code: "G07", description: "Product and by-product processing", category: "Production/Service" },
  { id: "src-G08", code: "G08", description: "Removal of spent process liquids or catalysts", category: "Production/Service" },
  { id: "src-G09", code: "G09", description: "Other production or service-related processes", category: "Production/Service" },
  // Wastes from other intermittent events or processes
  { id: "src-G11", code: "G11", description: "Discarding off-specification, out-of-date, unused chemicals", category: "Intermittent" },
  { id: "src-G12", code: "G12", description: "Lagoon or sediment dragout and leachate collection", category: "Intermittent" },
  { id: "src-G13", code: "G13", description: "Cleaning out process equipment", category: "Intermittent" },
  { id: "src-G14", code: "G14", description: "Removal of tank sludge, sediments or slag", category: "Intermittent" },
  { id: "src-G15", code: "G15", description: "Process equipment change-out or discontinuation", category: "Intermittent" },
  { id: "src-G16", code: "G16", description: "Oil changes and filter or battery replacement", category: "Intermittent" },
  { id: "src-G17", code: "G17", description: "Subpart K laboratory waste clean-out", category: "Intermittent" },
  { id: "src-G19", code: "G19", description: "Other one-time or intermittent processes", category: "Intermittent" },
  // Residuals from pollution control and waste management
  { id: "src-G21", code: "G21", description: "Air pollution control devices (baghouse dust, ash)", category: "Pollution Control" },
  { id: "src-G22", code: "G22", description: "Laboratory analytical wastes", category: "Pollution Control" },
  { id: "src-G23", code: "G23", description: "Wastewater treatment (sludge, filter cake)", category: "Pollution Control" },
  { id: "src-G24", code: "G24", description: "Solvent or product distillation as part of production", category: "Pollution Control" },
  { id: "src-G25", code: "G25", description: "Treatment, disposal, or recycling of hazardous wastes", category: "Pollution Control" },
  { id: "src-G26", code: "G26", description: "Leachate collection (from landfill operations)", category: "Pollution Control" },
  { id: "src-G27", code: "G27", description: "Treatment or recovery of universal waste", category: "Pollution Control" },
  // Wastes from spills and accidental releases
  { id: "src-G31", code: "G31", description: "Accidental contamination of products, materials or containers", category: "Spills/Releases" },
  { id: "src-G32", code: "G32", description: "Cleanup of spill residues (infrequent, not routine)", category: "Spills/Releases" },
  { id: "src-G33", code: "G33", description: "Leak collection and floor sweeping (on-going, routine)", category: "Spills/Releases" },
  { id: "src-G39", code: "G39", description: "Other cleanup of current contamination", category: "Spills/Releases" },
  // Wastes from remediation of past contamination
  { id: "src-G41", code: "G41", description: "Closure of hazardous waste management unit under RCRA", category: "Remediation" },
  { id: "src-G42", code: "G42", description: "Corrective action at a solid waste management unit", category: "Remediation" },
  { id: "src-G43", code: "G43", description: "Cleanup under CERCLA (Superfund)", category: "Remediation" },
  { id: "src-G44", code: "G44", description: "Cleanup under state or voluntary program", category: "Remediation" },
  { id: "src-G45", code: "G45", description: "Cleanup under other federal authority", category: "Remediation" },
  { id: "src-G49", code: "G49", description: "Other cleanup of past contamination", category: "Remediation" },
  // Wastes from other non-routine events
  { id: "src-G51", code: "G51", description: "Materials inherently waste-like per 40 CFR 261.2(d)", category: "Non-Routine" },
  { id: "src-G61", code: "G61", description: "Discarded commercial chemical products (P or U listed)", category: "Non-Routine" },
  { id: "src-G62", code: "G62", description: "Discarded commercial chemical products — acute (P listed)", category: "Non-Routine" },
  { id: "src-G76", code: "G76", description: "Other source not covered above", category: "Non-Routine" },
  { id: "src-G77", code: "G77", description: "Unknown source", category: "Non-Routine" },
];

/* ─── Form Codes (Waste Form) ─── */

export const FORM_CODES: ReferenceCode[] = [
  // Mixed media / debris / devices
  { id: "form-W001", code: "W001", description: "Lab packs (not containing acute hazardous waste)", category: "Mixed Media/Debris" },
  { id: "form-W002", code: "W002", description: "Contaminated debris (paper, clothing, rags, wood)", category: "Mixed Media/Debris" },
  { id: "form-W004", code: "W004", description: "Lab packs containing acute hazardous waste", category: "Mixed Media/Debris" },
  { id: "form-W005", code: "W005", description: "Waste pharmaceuticals managed as hazardous waste", category: "Mixed Media/Debris" },
  { id: "form-W006", code: "W006", description: "Airbag waste (modules or inflators)", category: "Mixed Media/Debris" },
  { id: "form-W301", code: "W301", description: "Contaminated soil (usually from spill cleanup)", category: "Mixed Media/Debris" },
  { id: "form-W309", code: "W309", description: "Batteries, battery parts, cores, casings", category: "Mixed Media/Debris" },
  { id: "form-W310", code: "W310", description: "Filters, solid adsorbents, ion exchange resins, spent carbon", category: "Mixed Media/Debris" },
  { id: "form-W320", code: "W320", description: "Electrical devices (lamps, thermostats, CRTs)", category: "Mixed Media/Debris" },
  { id: "form-W512", code: "W512", description: "Sediment or lagoon dragout, drilling or other muds", category: "Mixed Media/Debris" },
  { id: "form-W801", code: "W801", description: "Compressed gases", category: "Mixed Media/Debris" },
  // Inorganic liquids
  { id: "form-W101", code: "W101", description: "Very dilute aqueous waste (>99% water)", category: "Inorganic Liquids" },
  { id: "form-W103", code: "W103", description: "Spent concentrated acid (5% or more)", category: "Inorganic Liquids" },
  { id: "form-W105", code: "W105", description: "Acidic aqueous wastes less than 5% acid", category: "Inorganic Liquids" },
  { id: "form-W107", code: "W107", description: "Aqueous waste containing cyanides", category: "Inorganic Liquids" },
  { id: "form-W110", code: "W110", description: "Caustic aqueous waste without cyanides (pH >12.5)", category: "Inorganic Liquids" },
  { id: "form-W113", code: "W113", description: "Other aqueous waste or wastewaters", category: "Inorganic Liquids" },
  { id: "form-W117", code: "W117", description: "Waste liquid mercury (metallic)", category: "Inorganic Liquids" },
  { id: "form-W119", code: "W119", description: "Other inorganic liquid", category: "Inorganic Liquids" },
  // Organic liquids
  { id: "form-W200", code: "W200", description: "Still bottoms in liquid form", category: "Organic Liquids" },
  { id: "form-W202", code: "W202", description: "Concentrated halogenated solvent", category: "Organic Liquids" },
  { id: "form-W203", code: "W203", description: "Concentrated non-halogenated solvent", category: "Organic Liquids" },
  { id: "form-W204", code: "W204", description: "Concentrated mixed solvent", category: "Organic Liquids" },
  { id: "form-W205", code: "W205", description: "Oil-water emulsion or mixture", category: "Organic Liquids" },
  { id: "form-W206", code: "W206", description: "Waste oil managed as hazardous waste", category: "Organic Liquids" },
  { id: "form-W209", code: "W209", description: "Paint, ink, lacquer, or varnish (fluid)", category: "Organic Liquids" },
  { id: "form-W210", code: "W210", description: "Reactive or polymerizable organic liquids", category: "Organic Liquids" },
  { id: "form-W211", code: "W211", description: "Paint thinner or petroleum distillates", category: "Organic Liquids" },
  { id: "form-W219", code: "W219", description: "Other organic liquid", category: "Organic Liquids" },
  // Sludges
  { id: "form-W303", code: "W303", description: "Organic sludge", category: "Sludges" },
  { id: "form-W304", code: "W304", description: "Inorganic sludge", category: "Sludges" },
  { id: "form-W307", code: "W307", description: "Mixed organic/inorganic sludge", category: "Sludges" },
  { id: "form-W312", code: "W312", description: "Ash,ite residue,ite slag", category: "Sludges" },
  { id: "form-W316", code: "W316", description: "Other sludge", category: "Sludges" },
  { id: "form-W319", code: "W319", description: "Other inorganic solid", category: "Sludges" },
  // Solids
  { id: "form-W401", code: "W401", description: "Calcium sulfate (gypsum)", category: "Solids" },
  { id: "form-W403", code: "W403", description: "Metal scale, filings, or scrap", category: "Solids" },
  { id: "form-W405", code: "W405", description: "Organic solids", category: "Solids" },
  { id: "form-W406", code: "W406", description: "Inorganic solids", category: "Solids" },
];

/* ─── Treatment Codes (Hazardous Waste) ─── */

export const TREATMENT_CODES: ReferenceCode[] = [
  // Reclamation and recovery
  { id: "tc-H010", code: "H010", description: "Metals recovery (retorting, smelting, chemical)", category: "Recovery" },
  { id: "tc-H011", code: "H011", description: "Mercury recovery (retorting, bulb/lamp crushing)", category: "Recovery" },
  { id: "tc-H015", code: "H015", description: "Deployment/deactivation of airbag waste + metals recovery", category: "Recovery" },
  { id: "tc-H020", code: "H020", description: "Solvents recovery", category: "Recovery" },
  { id: "tc-H039", code: "H039", description: "Other recovery/reclamation for reuse", category: "Recovery" },
  { id: "tc-H050", code: "H050", description: "Energy recovery at this site; used as fuel", category: "Recovery" },
  { id: "tc-H061", code: "H061", description: "Fuel blending prior to energy recovery at another site", category: "Recovery" },
  // Destruction or treatment
  { id: "tc-H040", code: "H040", description: "Incineration; thermal destruction other than fuel", category: "Destruction/Treatment" },
  { id: "tc-H041", code: "H041", description: "Open burning/open detonation (Subpart X)", category: "Destruction/Treatment" },
  { id: "tc-H042", code: "H042", description: "Thermal desorption (organic contaminants from soil/sludge)", category: "Destruction/Treatment" },
  { id: "tc-H070", code: "H070", description: "Chemical treatment (reduction/destruction/oxidation)", category: "Destruction/Treatment" },
  { id: "tc-H081", code: "H081", description: "Biological treatment", category: "Destruction/Treatment" },
  { id: "tc-H090", code: "H090", description: "Polymerization (LDR standard)", category: "Destruction/Treatment" },
  { id: "tc-H100", code: "H100", description: "Physical treatment only (adsorption/separation/stripping)", category: "Destruction/Treatment" },
  { id: "tc-H110", code: "H110", description: "Stabilization prior to land disposal", category: "Destruction/Treatment" },
  { id: "tc-H113", code: "H113", description: "Stabilization to remove hazardous characteristics", category: "Destruction/Treatment" },
  { id: "tc-H120", code: "H120", description: "Combination of chemical, biological, physical treatment", category: "Destruction/Treatment" },
  { id: "tc-H121", code: "H121", description: "Neutralization only", category: "Destruction/Treatment" },
  { id: "tc-H122", code: "H122", description: "Evaporation", category: "Destruction/Treatment" },
  { id: "tc-H129", code: "H129", description: "Other treatment (not including on-site disposal)", category: "Destruction/Treatment" },
  // Disposal
  { id: "tc-H130", code: "H130", description: "Surface impoundment closed as landfill", category: "Disposal" },
  { id: "tc-H131", code: "H131", description: "Land treatment or application", category: "Disposal" },
  { id: "tc-H132", code: "H132", description: "Landfill (with prior treatment/stabilization)", category: "Disposal" },
  { id: "tc-H134", code: "H134", description: "Deepwell or underground injection", category: "Disposal" },
  { id: "tc-H136", code: "H136", description: "Discharge to sewer/POTW", category: "Disposal" },
  { id: "tc-H137", code: "H137", description: "Discharge to NPDES permit", category: "Disposal" },
  // Transfer
  { id: "tc-H141", code: "H141", description: "Transfer to another TSD for treatment/disposal", category: "Transfer" },
];

/* ─── EWC Codes (European Waste Catalogue — top 50 relevant) ─── */

export const EWC_CODES: ReferenceCode[] = [
  { id: "ewc-08-01-11", code: "08 01 11*", description: "Waste paint and varnish containing organic solvents or other hazardous substances", category: "Paint/Varnish" },
  { id: "ewc-08-01-12", code: "08 01 12", description: "Waste paint and varnish (not 08 01 11)", category: "Paint/Varnish" },
  { id: "ewc-08-01-13", code: "08 01 13*", description: "Sludges from paint or varnish containing organic solvents", category: "Paint/Varnish" },
  { id: "ewc-08-01-14", code: "08 01 14", description: "Sludges from paint or varnish (not 08 01 13)", category: "Paint/Varnish" },
  { id: "ewc-08-01-17", code: "08 01 17*", description: "Wastes from paint or varnish removal containing organic solvents", category: "Paint/Varnish" },
  { id: "ewc-07-01-01", code: "07 01 01*", description: "Aqueous washing liquids and mother liquors", category: "Organic Chemical" },
  { id: "ewc-07-01-04", code: "07 01 04*", description: "Other organic solvents, washing liquids and mother liquors", category: "Organic Chemical" },
  { id: "ewc-13-01-10", code: "13 01 10*", description: "Mineral based non-chlorinated hydraulic oils", category: "Oil Wastes" },
  { id: "ewc-13-02-05", code: "13 02 05*", description: "Mineral-based non-chlorinated engine, gear and lubricating oils", category: "Oil Wastes" },
  { id: "ewc-13-05-01", code: "13 05 01*", description: "Solids from grit chambers and oil/water separators", category: "Oil Wastes" },
  { id: "ewc-13-05-02", code: "13 05 02*", description: "Sludges from oil/water separators", category: "Oil Wastes" },
  { id: "ewc-13-05-03", code: "13 05 03*", description: "Interceptor sludges", category: "Oil Wastes" },
  { id: "ewc-15-01-01", code: "15 01 01", description: "Paper and cardboard packaging", category: "Packaging" },
  { id: "ewc-15-01-02", code: "15 01 02", description: "Plastic packaging", category: "Packaging" },
  { id: "ewc-15-01-03", code: "15 01 03", description: "Wooden packaging", category: "Packaging" },
  { id: "ewc-15-01-04", code: "15 01 04", description: "Metallic packaging", category: "Packaging" },
  { id: "ewc-15-01-10", code: "15 01 10*", description: "Packaging containing residues of hazardous substances", category: "Packaging" },
  { id: "ewc-15-02-02", code: "15 02 02*", description: "Absorbents, filter materials, wiping cloths (contaminated)", category: "Packaging" },
  { id: "ewc-16-01-03", code: "16 01 03", description: "End-of-life tyres", category: "Vehicle/Equipment" },
  { id: "ewc-16-02-13", code: "16 02 13*", description: "Discarded equipment containing hazardous components", category: "Vehicle/Equipment" },
  { id: "ewc-16-02-14", code: "16 02 14", description: "Discarded equipment (not 16 02 09 to 16 02 13)", category: "Vehicle/Equipment" },
  { id: "ewc-16-06-01", code: "16 06 01*", description: "Lead batteries", category: "Batteries" },
  { id: "ewc-16-06-02", code: "16 06 02*", description: "Ni-Cd batteries", category: "Batteries" },
  { id: "ewc-17-01-01", code: "17 01 01", description: "Concrete", category: "C&D Waste" },
  { id: "ewc-17-01-07", code: "17 01 07", description: "Mixtures of concrete, bricks, tiles and ceramics", category: "C&D Waste" },
  { id: "ewc-17-02-01", code: "17 02 01", description: "Wood", category: "C&D Waste" },
  { id: "ewc-17-04-05", code: "17 04 05", description: "Iron and steel", category: "C&D Waste" },
  { id: "ewc-17-09-04", code: "17 09 04", description: "Mixed construction and demolition wastes", category: "C&D Waste" },
  { id: "ewc-19-08-05", code: "19 08 05", description: "Sludges from treatment of urban waste water", category: "WWT" },
  { id: "ewc-19-08-12", code: "19 08 12", description: "Sludges from biological treatment of industrial waste water", category: "WWT" },
  { id: "ewc-20-01-01", code: "20 01 01", description: "Paper and cardboard", category: "Municipal" },
  { id: "ewc-20-01-21", code: "20 01 21*", description: "Fluorescent tubes and other mercury-containing waste", category: "Municipal" },
  { id: "ewc-20-01-33", code: "20 01 33*", description: "Batteries (16 06 01*, 16 06 02*, 16 06 03*)", category: "Municipal" },
  { id: "ewc-20-01-35", code: "20 01 35*", description: "Discarded electrical and electronic equipment (hazardous)", category: "Municipal" },
  { id: "ewc-20-01-36", code: "20 01 36", description: "Discarded electrical and electronic equipment (non-hazardous)", category: "Municipal" },
  { id: "ewc-20-01-39", code: "20 01 39", description: "Plastics", category: "Municipal" },
  { id: "ewc-20-01-40", code: "20 01 40", description: "Metals", category: "Municipal" },
  { id: "ewc-20-02-01", code: "20 02 01", description: "Biodegradable waste", category: "Municipal" },
  { id: "ewc-20-03-01", code: "20 03 01", description: "Mixed municipal waste", category: "Municipal" },
  { id: "ewc-20-03-07", code: "20 03 07", description: "Bulky waste", category: "Municipal" },
];

/* ─── TRI Waste Codes (GM-specific) ─── */

export const TRI_WASTE_CODES: ReferenceCode[] = [
  { id: "tri-M20", code: "M20", description: "Other recycling" },
  { id: "tri-M26", code: "M26", description: "Reuse as an ingredient or feedstock" },
  { id: "tri-M50", code: "M50", description: "Incineration/thermal treatment" },
  { id: "tri-M54", code: "M54", description: "Incineration/insignificant fuel value" },
  { id: "tri-M56", code: "M56", description: "Fuel blending/energy recovery" },
  { id: "tri-M64", code: "M64", description: "Other landfills" },
  { id: "tri-M65", code: "M65", description: "RCRA Subtitle C landfills" },
  { id: "tri-M66", code: "M66", description: "Other land disposal" },
  { id: "tri-M73", code: "M73", description: "Land treatment" },
  { id: "tri-M79", code: "M79", description: "Other off-site management" },
  { id: "tri-M90", code: "M90", description: "Other off-site transfers" },
  { id: "tri-M93", code: "M93", description: "Transfer to recycler" },
  { id: "tri-M94", code: "M94", description: "Transfer to waste broker" },
  { id: "tri-M95", code: "M95", description: "Transfer to municipal solid waste facility" },
  { id: "tri-M99", code: "M99", description: "Other off-site transfer" },
];

/* ─── Container Types ─── */

export const CONTAINER_TYPES = [
  "2yd Front Load",
  "30CY Roll Off",
  "35CY Self Contained Compactor",
  "42CY Compactor",
  "55gal Drum",
  "275gal Tote",
  "330 Gal Tote",
  "Box Truck",
  "Trailer",
  "Vac Truck",
  "Tanker",
  "Portable tanks",
  "Dump truck",
  "Metal drums, barrels, kegs",
  "Fiberboard or plastic drums, barrels, kegs",
  "Metal boxes, cartons, cases (including roll-offs)",
  "Other",
] as const;

/* ─── Units ─── */

export const SHIPMENT_UNITS = ["Ton", "Drum", "Lb", "Load", "Each", "Gal", "Tote", "CYB", "Pail", "DM"] as const;

/* ─── Lookup helpers ─── */

export function getSourceCodeDescription(code: string): string | undefined {
  return SOURCE_CODES.find((c) => c.code === code)?.description;
}

export function getFormCodeDescription(code: string): string | undefined {
  return FORM_CODES.find((c) => c.code === code)?.description;
}

export function getTreatmentCodeDescription(code: string): string | undefined {
  return TREATMENT_CODES.find((c) => c.code === code)?.description;
}

export function getEwcCodeDescription(code: string): string | undefined {
  return EWC_CODES.find((c) => c.code === code)?.description;
}

export function getTriWasteCodeDescription(code: string): string | undefined {
  return TRI_WASTE_CODES.find((c) => c.code === code)?.description;
}
