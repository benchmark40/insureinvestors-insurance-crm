/**
 * Controlled vocabularies for the property/building intake dropdowns.
 *
 * Ported from the legacy stack so values stay consistent across apps:
 *   - apiOptions.js (onboarding_app)         → property use codes, construction
 *                                               types, roof codes, use→type map
 *   - propertyHelpers.js (broker dashboard)  → electrical/plumbing/hvac/alarm
 *   - ServiceRequests/constants.js           → building condition
 *
 * A few lists had no canonical legacy source (tenant type, building exterior,
 * roof covering material) — those are sensible defaults, marked NEW below, and
 * safe to edit. Every dropdown is rendered tolerant of off-list values via
 * `ensureOpt`, so RealEstateAPI enrichment values always show even if they
 * aren't an exact option.
 */

// ── systems (broker dashboard propertyHelpers.js) ──────────────────────────
export const ELECTRICAL_OPTIONS = [
  "Circuit Breaker",
  "Fuse Box",
  "Mixed",
  "Other",
];

export const PLUMBING_OPTIONS = [
  "Copper",
  "PVC",
  "PEX",
  "Galvanized",
  "Cast Iron",
  "Mixed",
  "Other",
];

export const HVAC_OPTIONS = [
  "Central Air",
  "Window Units",
  "Split System",
  "Heat Pump",
  "Boiler",
  "Other",
];

// Burglar & fire alarm both use the same protection scale.
export const ALARM_OPTIONS = ["None", "Local Alarm", "Monitored", "Both"];

// ── condition (ServiceRequests/constants.js) ───────────────────────────────
export const CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Poor"];

// ── NEW: building exterior material (no canonical legacy list) ─────────────
export const EXTERIOR_OPTIONS = [
  "Brick",
  "Stucco",
  "Vinyl Siding",
  "Wood",
  "Metal",
  "Stone",
  "Fiber Cement (Hardie)",
  "Concrete Block",
  "EIFS",
  "Aluminum",
  "Composite",
  "Mixed",
  "Other",
];

// ── NEW: tenant type (legacy stored this as free text) ─────────────────────
export const TENANT_TYPE_OPTIONS = [
  "Residential",
  "Commercial - Office",
  "Commercial - Retail",
  "Restaurant / Food Service",
  "Medical",
  "Industrial / Warehouse",
  "Mixed Use",
  "Owner Occupied",
  "Vacant",
  "Government / Municipal",
  "Non-Profit",
  "Group Home / Assisted Living",
  "Student Housing",
  "Short-Term Rental",
  "Other",
];

// ── NEW: roof covering material (legacy reused roof shapes here) ───────────
export const ROOF_COVERING_OPTIONS = [
  "Asphalt Shingle",
  "Architectural Shingle",
  "Wood Shake",
  "Metal",
  "Standing Seam Metal",
  "Clay Tile",
  "Concrete Tile",
  "Slate",
  "Built-Up (BUR)",
  "Modified Bitumen",
  "TPO",
  "EPDM (Rubber)",
  "PVC Membrane",
  "Rolled Roofing",
  "Other",
];

// ── construction types (apiOptions.js real_estate_api_construction_types) ──
export const CONSTRUCTION_TYPE_OPTIONS = [
  "Adobe",
  "Arched/Dome",
  "Brick, Concrete",
  "Concrete Blocks",
  "Frame",
  "Heavy Frame",
  "Steel Frame",
  "Wood Frame",
  "Metal Frames",
  "Light Frame",
  "Pole Frame",
  "Wood",
  "Masonry/Concrete Masonry Units (CMUs)",
  "Brick",
  "Stone",
  "Tilt-up Concrete",
  "Manufactured",
  "Mixed",
  "Log",
  "Steel & Concrete",
  "Unknown",
];

// ── roof types / shapes (apiOptions.js real_estate_api_roof_codes) ─────────
export const ROOF_TYPE_OPTIONS = [
  "Gable",
  "Hip",
  "Gable/Hip",
  "Flat",
  "Mansard",
  "Gambrel",
  "Gambrel/Mansard",
  "Shed",
  "Pitched",
  "Arched",
  "A-Frame",
  "Barrel",
  "Pyramid",
  "Butterfly",
  "Dormer",
  "Monitor",
  "Barn",
  "Canopy",
  "Frame",
  "Complex/Custom",
  "Contemporary",
  "Bubble",
  "Swiss Chalet/Alpine",
  "Sawtooth",
  "Cathedral/Clerestory",
  "Geodesic / Dome",
  "Wood Truss",
  "Steel Frm/Truss",
  "Bowstring Truss",
  "Rigid Frm Bar Jt",
  "Prestress Concrete",
  "Reinforced Concrete",
  "Other",
];

// ── coarse property type buckets (apiOptions.js property_type_mappings) ────
export const PROPERTY_TYPE_OPTIONS = [
  "Single Family Residential",
  "Multi-Family",
  "Condo",
  "Mobile Home",
  "Office",
  "Storefront Retail",
  "Services",
  "Food & Beverage",
  "Lodging",
  "Storage Facilities",
  "Farms",
  "Entertainment and Leisure",
  "Parking and Transit",
  "Education",
  "Land",
  "Other",
];

/**
 * RealEstateAPI property-use → coarse type. Ported verbatim from
 * apiOptions.js `property_type_mappings` (types trimmed). Used to derive
 * `propertyType` from an enriched `propertyUse`.
 */
const PROPERTY_TYPE_MAPPINGS: { type: string; use: string[] }[] = [
  {
    type: "Multi-Family",
    use: [
      "DUPLEX (2 UNITS, ANY COMBINATION)",
      "GARDEN APT, COURT APT (5+ UNITS)",
      "HIGH-RISE APARTMENTS",
      "APARTMENT HOUSE (100+ UNITS)",
      "APARTMENTS (GENERIC)",
      "APARTMENT HOUSE (5+ UNITS)",
      "MULTI-FAMILY DWELLINGS (GENERIC, ANY COMBINATION)",
      "QUADPLEX (4 UNITS, ANY COMBINATION)",
      "RESIDENTIAL INCOME (GENERAL/MULTI-FAMILY)",
      "TRIPLEX (3 UNITS, ANY COMBINATION)",
    ],
  },
  {
    type: "Single Family Residential",
    use: [
      "SINGLE FAMILY RESIDENTIAL",
      "PATIO HOME",
      "RESIDENTIAL (GENERAL/SINGLE)",
      "ROW HOUSE",
      "RURAL RESIDENCE",
      "SINGLE FAMILY RESIDENCE",
      "TOWNHOUSE",
      "DUPLEX",
      "QUADPLEX",
      "TRIPLEX",
    ],
  },
  {
    type: "Land",
    use: [
      "VACANT LAND",
      "ZERO LOT LINE (RESIDENTIAL)",
      "AGRICULTURAL (UNIMPROVED) - VACANT LAND",
      "MULTI-FAMILY - VACANT LAND",
      "RESIDENTIAL - VACANT LAND",
      "VACANT LAND - EXEMPT",
      "TINY HOUSE",
      "VACANT LAND - DESTROYED/UNINHABITABLE IMPROVEMENT",
      "VACANT LAND - UNSPECIFIED IMPROVEMENT",
    ],
  },
  { type: "Condo", use: ["CLUSTER HOME", "CONDOMINIUM"] },
  {
    type: "Mobile Home",
    use: ["MANUFACTURED, MODULAR, PRE-FABRICATED HOMES", "MOBILE HOME"],
  },
  {
    type: "Office",
    use: [
      "COMMERCIAL OFFICE (GENERAL)",
      "STORE/OFFICE (MIXED USE)",
      "OFFICE BUILDING",
      "OFFICE BUILDING (MULTI-STORY)",
      "COMMERCIAL OFFICE/RESIDENTIAL (MIXED USE)",
      "SKYSCRAPER/HIGH-RISE (COMMERCIAL OFFICES)",
    ],
  },
  {
    type: "Storage Facilities",
    use: [
      "MINI-WAREHOUSE, STORAGE",
      "WAREHOUSE, STORAGE",
      "RESIDENTIAL STORAGE SPACE",
    ],
  },
  {
    type: "Food & Beverage",
    use: [
      "BAKERY",
      "BAR, TAVERN",
      "DRIVE-THRU RESTAURANT, FAST FOOD",
      "RESTAURANT",
      "GROCERY, SUPERMARKET",
      "NIGHTCLUB (COCKTAIL LOUNGE)",
      "TAKE-OUT RESTAURANT (FOOD PREPARATION)",
      "DISTILLERY, BREWERY, BOTTLING",
      "ROADSIDE MARKET",
    ],
  },
  {
    type: "Storefront Retail",
    use: [
      "CONVENIENCE STORE (7-11)",
      "APPLIANCE STORE (CIRCUIT CITY, GOODS BUYS, BEST BUY)",
      "VEHICLE SALES, VEHICLE RENTALS",
      "DEPARTMENT STORE (APPAREL, HOUSEHOLD GOODS, FURNITURE)",
      "LIQUOR STORE",
      "NEIGHBORHOOD: SHOPPING CENTER, STRIP CENTER, ENTERPRISE ZONE",
      "NURSERY, GREENHOUSE, FLORIST (RETAIL, WHOLESALE)",
      "RETAIL STORES (PERSONAL SERVICES, PHOTOGRAPHY, TRAVEL)",
      "REGIONAL: SHOPPING CENTER, MALL (W/ANCHOR)",
      "COMMUNITY: SHOPPING CENTER, MINI-MALL",
      "STORES & APARTMENTS",
      "STORE, RETAIL OUTLET",
      "WHOLESALE OUTLET, DISCOUNT STORE (FRANCHISE)",
      "HISTORICAL RETAIL",
      "CANNABIS DISPENSARY",
    ],
  },
  {
    type: "Services",
    use: [
      "AUTO REPAIR, GARAGE",
      "DENTAL BUILDING",
      "DRUG STORE, PHARMACY",
      "DRY CLEANER",
      "KENNEL",
      "LAUNDROMAT (SELF-SERVICE)",
      "PRINTER - RETAIL (PIP, QWIKCOPY, ETC)",
      "DAY CARE, PRE-SCHOOL (COMMERCIAL)",
      "PROFESSIONAL BUILDING (LEGAL, INSURANCE, REAL ESTATE, BUSINESS)",
      "GAS STATION",
      "SERVICE STATION W/CONVENIENCE STORE (FOOD MART)",
      "SERVICE STATION (FULL SERVICE)",
      "TRUCK STOP (FUEL AND DINER)",
      "SERVICE SHOP (TV, RADIO, ELECTRIC, PLUMBING)",
      "VETERINARY, ANIMAL HOSPITAL",
      "CAR WASH",
      "DUMP SITE",
      "GYM, HEALTH SPA",
      "MARINA, BOAT SLIPS, YACHT CLUB, BOAT LANDING",
      "MEDICAL CLINIC",
      "PET BOARDING & GROOMING",
      "CAR WASH - AUTOMATED",
      "BARBER/HAIR SALON",
    ],
  },
  {
    type: "Lodging",
    use: [
      "BED & BREAKFAST",
      "HOTEL/MOTEL",
      "HOTEL-RESORT",
      "HOTEL",
      "MOTEL",
      "HISTORICAL TRANSIENT LODGING (HOTEL, MOTEL)",
    ],
  },
  {
    type: "Farms",
    use: [
      "DAIRY FARM",
      "FARM, CROPS",
      "FEEDLOTS",
      "FARM (IRRIGATED OR DRY)",
      "HORTICULTURE, ORNAMENTAL (AGRICULTURAL)",
      "IRRIGATION, FLOOD CONTROL",
      "LIVESTOCK, ANIMALS",
      "MISCELLANEOUS STRUCTURES - RANCH, FARM FIXTURES",
      "ORCHARD (FRUIT, NUT)",
      "ORCHARDS, GROVES",
      "PASTURE",
      "POULTRY FARM (CHICKEN, TURKEY, FISH, BEES, RABBITS)",
      "RANCH",
      "RANGE LAND (GRAZING)",
      "AGRICULTURAL/RURAL (GENERAL)",
      "TIMBERLAND, FOREST, TREES",
      "VINEYARD",
      "WELL SITE (AGRICULTURAL)",
      "BARNDOMINIUM",
      "CROPS (HARVESTED)",
      "CANNABIS GROW FACILITY",
      "LIVESTOCK (ANIMALS, FISH, BIRDS, ETC.)",
    ],
  },
  {
    type: "Entertainment and Leisure",
    use: [
      "CASINO",
      "WINERY",
      "ARCADES (AMUSEMENT)",
      "ARENA, CONVENTION CENTER",
      "AUDITORIUM",
      "OUTDOOR RECREATION: BEACH, MOUNTAIN, DESERT",
      "POOL HALL, BILLIARD PARLOR",
      "BOWLING ALLEY",
      "COUNTRY CLUB",
      "CLUBS, LODGES, PROFESSIONAL ASSOCIATIONS",
      "COMMUNITY CENTER (EXEMPT)",
      "DANCE HALL",
      "DRIVE-IN THEATER",
      "FAIRGROUNDS",
      "FISH CAMPS, GAME CLUB TARGET SHOOTING",
      "DRIVING RANGE (GOLF)",
      "GO-CARTS, MINIATURE GOLF, WATER SLIDES",
      "GOLF COURSE",
      "SPORTS COMPLEX",
      "HISTORICAL PARK, SITE, MISC.",
      "HISTORICAL RECREATION, ENTERTAINMENT",
      "MUSEUM, LIBRARY, ART GALLERY (RECREATIONAL)",
      "PARK, PLAYGROUND, PICNIC AREA",
      "PUBLIC SWIMMING POOL",
      "AMUSEMENT PARK, TOURIST ATTRACTION",
      "RACQUET COURT, TENNIS COURT",
      "RECREATIONAL CENTER",
      "RECREATIONAL/ENTERTAINMENT (GENERAL)",
      "SKATING RINK, ICE SKATING, ROLLER SKATING",
      "STADIUM",
      "ZOO",
      "RACE TRACK (AUTO, DOG, HORSE)",
      "THEATER (MOVIE)",
    ],
  },
  {
    type: "Parking and Transit",
    use: [
      "PARKING GARAGE, PARKING STRUCTURE",
      "BUS TERMINAL",
      "TRANSPORTATION (AIR, RAIL, BUS)",
      "HARBOR & MARINE TRANSPORTATION",
      "AIRPORT & RELATED",
      "RESIDENTIAL PARKING GARAGE",
      "TRANSPORTATION (GENERAL)",
      "PARKING LOT",
    ],
  },
  {
    type: "Education",
    use: [
      "DAY CARE, PRE-SCHOOL (COMMERCIAL)",
      "PAROCHIAL SCHOOL, PRIVATE SCHOOL",
      "PUBLIC SCHOOL (ADMINISTRATION, CAMPUS, DORMS, INSTRUCTION)",
      "COLLEGES, UNIVERSITY - PUBLIC",
    ],
  },
];

// RealEstateAPI property-use labels (apiOptions.js real_estate_api_property_use_codes).
// Deduped, "UNKNOWN" dropped — used both as the propertyUsage dropdown and to
// canonicalize enriched values.
export const PROPERTY_USE_OPTIONS: string[] = Array.from(
  new Set(
    [
      "DAIRY FARM", "DESERT OR BARREN LAND", "FARM, CROPS", "FEEDLOTS",
      "FARM (IRRIGATED OR DRY)", "HORTICULTURE, ORNAMENTAL (AGRICULTURAL)",
      "IRRIGATION, FLOOD CONTROL", "LIVESTOCK, ANIMALS",
      "MISCELLANEOUS STRUCTURES - RANCH, FARM FIXTURES", "ORCHARD (FRUIT, NUT)",
      "ORCHARDS, GROVES", "PASTURE",
      "POULTRY FARM (CHICKEN, TURKEY, FISH, BEES, RABBITS)", "RANCH",
      "RESERVOIR, WATER SUPPLY", "RURAL IMPROVED / NON-RESIDENTIAL",
      "RANGE LAND (GRAZING)", "AGRICULTURAL/RURAL (GENERAL)", "TRUCK CROPS",
      "TIMBERLAND, FOREST, TREES", "VINEYARD", "WELL SITE (AGRICULTURAL)",
      "WILDLIFE (REFUGE)", "CONVENIENCE STORE (7-11)",
      "APPLIANCE STORE (CIRCUIT CITY, GOODS BUYS, BEST BUY)",
      "AUTO REPAIR, GARAGE", "VEHICLE SALES, VEHICLE RENTALS (AUTO/TRUCK/RV/BOAT/ETC)",
      "BAKERY", "BAR, TAVERN",
      "COMMERCIAL BUILDING, MAIL ORDER, SHOW ROOM (NON-AUTO), WAREHOUSE",
      "BED & BREAKFAST", "CASINO",
      "CEMETERY, FUNERAL HOME, MORTUARY (COMMERCIAL)",
      "COMMON AREA (COMMERCIAL, NOT SHOPPING CENTER)", "COMMERCIAL (GENERAL)",
      "COMMERCIAL OFFICE (GENERAL)", "CONVENIENCE STORE (W/FUEL PUMP)",
      "COMMERCIAL CONDOMINIUM (NOT OFFICES)", "CONDOMINIUM OFFICES",
      "STORE/OFFICE (MIXED USE)",
      "DEPARTMENT STORE (APPAREL, HOUSEHOLD GOODS, FURNITURE)", "DENTAL BUILDING",
      "DEPARTMENT STORE (MULTI-STORY)",
      "GARDEN CENTER, HOME IMPROVEMENT (DO-IT-YOURSELF)", "DRUG STORE, PHARMACY",
      "DRIVE-THRU RESTAURANT, FAST FOOD", "DRY CLEANER", "RESTAURANT",
      "FARM SUPPLY & EQUIPMENT (COMMERCIAL)", "FINANCIAL BUILDING",
      "GROCERY, SUPERMARKET", "HOSPITAL - PRIVATE", "HOTEL/MOTEL",
      "HOTEL-RESORT", "HOTEL", "KENNEL", "LAUNDROMAT (SELF-SERVICE)",
      "LIQUOR STORE", "MOBILE COMMERCIAL UNITS", "MEDICAL BUILDING",
      "MIXED USE (COMMERCIAL/INDUSTRIAL)", "MOBILE HOME PARK, TRAILER PARK",
      "MOTEL", "COMMERCIAL MULTI-PARCEL MISCELLANEOUS", "COMMERCIAL MISCELLANEOUS",
      "NIGHTCLUB (COCKTAIL LOUNGE)",
      "NEIGHBORHOOD: SHOPPING CENTER, STRIP CENTER, ENTERPRISE ZONE",
      "NURSERY, GREENHOUSE, FLORIST (RETAIL, WHOLESALE)", "OFFICE BUILDING",
      "OFFICE BUILDING (MULTI-STORY)", "COMMERCIAL OFFICE/RESIDENTIAL (MIXED USE)",
      "PARKING GARAGE, PARKING STRUCTURE", "PRINTER - RETAIL (PIP, QWIKCOPY, ETC)",
      "PARKING LOT", "DAY CARE, PRE-SCHOOL (COMMERCIAL)",
      "PROFESSIONAL BUILDING (MULTI-STORY)",
      "PROFESSIONAL BUILDING (LEGAL, INSURANCE, REAL ESTATE, BUSINESS)",
      "RETAIL STORES (PERSONAL SERVICES, PHOTOGRAPHY, TRAVEL)",
      "REGIONAL: SHOPPING CENTER, MALL (W/ANCHOR)", "GAS STATION",
      "SINGLE FAMILY RESIDENTIAL", "SHOPPING CENTER COMMON AREA (PARKING ETC)",
      "COMMUNITY: SHOPPING CENTER, MINI-MALL",
      "SKYSCRAPER/HIGH-RISE (COMMERCIAL OFFICES)",
      "SERVICE STATION W/CONVENIENCE STORE (FOOD MART)",
      "SERVICE STATION (FULL SERVICE)", "STORES & APARTMENTS",
      "STORE, RETAIL OUTLET", "TAKE-OUT RESTAURANT (FOOD PREPARATION)",
      "TRUCK STOP (FUEL AND DINER)", "SERVICE SHOP (TV, RADIO, ELECTRIC, PLUMBING)",
      "VETERINARY, ANIMAL HOSPITAL", "CAR WASH",
      "WHOLESALE OUTLET, DISCOUNT STORE (FRANCHISE)", "ASSEMBLY (LIGHT INDUSTRIAL)",
      "BULK STORAGE, TANKS (GASOLINE, FUEL, ETC)", "CANNERY",
      "CONSTRUCTION/CONTRACTING SERVICES (INDUSTRIAL)", "CHEMICAL",
      "COMMON AREA (INDUSTRIAL)", "CONDOMINIUMS (INDUSTRIAL)", "COLD STORAGE",
      "DISTILLERY, BREWERY, BOTTLING", "DUMP SITE",
      "FACTORY (APPAREL, TEXTILE, LEATHER, MEDIUM MFG)", "FOOD PROCESSING",
      "FOUNDRY, INDUSTRIAL PLANT (METAL, RUBBER, PLASTIC)",
      "FOOD PACKING, PACKING PLANT (FRUIT, VEGETABLE, MEAT, DAIRY)",
      "GRAIN ELEVATOR", "HEAVY INDUSTRIAL (GENERAL)", "HEAVY MANUFACTURING",
      "INDUSTRIAL (GENERAL)", "INDUSTRIAL PARK", "LABOR CAMPS (INDUSTRIAL)",
      "LIGHT INDUSTRIAL (10% IMPROVED OFFICE SPACE; MACHINE SHOP)",
      "INDUSTRIAL LOFT BUILDING, LOFT BUILDING", "LUMBERYARD, BUILDING MATERIALS",
      "LUMBER & WOOD PRODUCT MFG (INCLUDING FURNITURE)",
      "MARINE FACILITY/BOARD REPAIRS (SMALL CRAFT, SAILBOAT)",
      "MANUFACTURING (LIGHT)", "MILL (FEED, GRAIN, PAPER, LUMBER, TEXTILE, PULP",
      "MINING, MINERAL, QUARRIES", "INDUSTRIAL MISCELLANEOUS",
      "MULTI-TENANT INDUSTRIAL BUILDING", "PAPER PRODUCT MFG & RELATED PRODUCTS",
      "REFINERY, PETROLEUM PRODUCTS", "PRINTING * PUBLISHING (LIGHT INDUSTRIAL)",
      "PROCESSING PLANT (MINERALS, CEMENT, ROCK, GRAVEL, GLASS, CLAY)",
      "MINI-WAREHOUSE, STORAGE", "QUARRIES (SAND, GRAVEL, ROCK)",
      "R&D FACILITY, LABORATORY, RESEARCH FACILITY, COSMETICS, PHARMACEUTICAL",
      "RECYCLING (METAL, PAPER, GLASS)",
      "SHIPYARD - BUILT OR REPAIRED (SEAGOING VESSELS)",
      "SLAUGHTER HOUSE, STOCKYARD",
      "STORAGE YARD (JUNK, AUTO WRECKING, SALVAGE)",
      "STORAGE YARD, OPEN STORAGE (LIGHT EQUIPMENT, MATERIAL)", "SUGAR REFINERY",
      "WAREHOUSE, STORAGE", "WINERY",
      "WASTE DISPOSAL, SEWAGE (PROCESSING, DISPOSAL, STORAGE, TREATMENT)",
      "AIRPORT & RELATED", "ARCADES (AMUSEMENT)", "ARENA, CONVENTION CENTER",
      "AUDITORIUM", "OUTDOOR RECREATION: BEACH, MOUNTAIN, DESERT",
      "POOL HALL, BILLIARD PARLOR", "BOWLING ALLEY", "BUS TERMINAL",
      "COMMERCIAL AUTO TRANSPORTATION/STORAGE", "COUNTRY CLUB",
      "CHARITABLE ORGANIZATION, FRATERNAL",
      "CLUBS, LODGES, PROFESSIONAL ASSOCIATIONS", "COMMUNITY CENTER (EXEMPT)",
      "COMMUNICATIONS", "CAMPGROUND, RV PARK",
      "COLLEGE, UNIVERSITY, VOCATIONAL SCHOOL - PRIVATE", "DANCE HALL",
      "DISTRIBUTION WAREHOUSE (REGIONAL)", "DRIVE-IN THEATER",
      "FAIRGROUNDS", "FISH CAMPS, GAME CLUB TARGET SHOOTING",
      "DRIVING RANGE (GOLF)", "TRANSPORTATION (GENERAL)",
      "GO-CARTS, MINIATURE GOLD, WATER SLIDES", "GOLF COURSE",
      "GYM, HEALTH SPA", "HISTORICAL TRANSIENT LODGING (HOTEL, MOTEL)",
      "HARBOR & MARINE TRANSPORTATION", "MARINA, BOAT SLIPS, YACHT CLUB, BOAT LANDING",
      "MEDICAL CLINIC", "MUSEUM, LIBRARY, ART GALLERY (RECREATIONAL)",
      "PARK, PLAYGROUND, PICNIC AREA", "PUBLIC SWIMMING POOL",
      "AMUSEMENT PARK, TOURIST ATTRACTION", "PAROCHIAL SCHOOL, PRIVATE SCHOOL",
      "RACQUET COURT, TENNIS COURT", "RECREATIONAL CENTER",
      "RECREATIONAL/ENTERTAINMENT (GENERAL)",
      "RELIGIOUS, CHURCH, WORSHIP (SYNAGOGUE, TEMPLE, PARSONAGE)",
      "RIDING STABLE, TRAILS", "HOMES (RETIRED, HANDICAP, REST, CONVALESCENT, NURSING)",
      "PUBLIC SCHOOL (ADMINISTRATION, CAMPUS, DORMS, INSTRUCTION)",
      "SKATING RINK, ICE SKATING, ROLLER SKATING", "SPORTS COMPLEX", "STADIUM",
      "THEATER (MOVIE)", "TRANSPORTATION (AIR, RAIL, BUS)",
      "RACE TRACK (AUTO, DOG, HORSE)", "TRUCK TERMINAL (MOTOR FREIGHT)",
      "COLLEGES, UNIVERSITY - PUBLIC", "ZOO",
      "GARDEN APT, COURT APT (5+ UNITS)", "HIGH-RISE APARTMENTS",
      "APARTMENT HOUSE (100+ UNITS)", "APARTMENTS (GENERIC)",
      "APARTMENT HOUSE (5+ UNITS)", "BOARDING/ROOMING HOUSE, APT HOTEL",
      "BUNGALOW (RESIDENTIAL)", "CLUSTER HOME", "COMMON AREA (RESIDENTIAL)",
      "CONDOMINIUM", "COOPERATIVE", "DORMITORY, GROUP QUARTERS (RESIDENTIAL)",
      "DUPLEX (2 UNITS, ANY COMBINATION)", "FRATERNITY HOUSE, SORORITY HOUSE",
      "MANUFACTURED, MODULAR, PRE-FABRICATED HOMES",
      "MULTI-FAMILY DWELLINGS (GENERIC, ANY COMBINATION)", "MOBILE HOME",
      "RESIDENTIAL MULTI-PARCEL MISCELLANEOUS", "MISCELLANEOUS (RESIDENTIAL)",
      "PATIO HOME", "PLANNED UNIT DEVELOPMENT (PUD)",
      "QUADPLEX (4 UNITS, ANY COMBINATION)",
      "CONDOMINIUM DEVELOPMENT (ASSOCIATION ASSESSMENT)",
      "RESIDENTIAL (GENERAL/SINGLE)", "RESIDENTIAL INCOME (GENERAL/MULTI-FAMILY)",
      "ROW HOUSE", "RURAL RESIDENCE", "SEASONAL, CABIN, VACATION RESIDENCE",
      "SINGLE FAMILY RESIDENCE", "TOWNHOUSE", "TIMESHARE",
      "TRIPLEX (3 UNITS, ANY COMBINATION)", "VACANT LAND",
      "ZERO LOT LINE (RESIDENTIAL)", "VACANT COMMERCIAL",
      "INDUSTRIAL - VACANT LAND", "MULTI-FAMILY - VACANT LAND",
      "RECREATIONAL - VACANT LAND", "RESIDENTIAL - VACANT LAND",
      "UNDER CONSTRUCTION", "SPORTS COMPLEX", "PET BOARDING & GROOMING",
      "RESIDENTIAL PARKING GARAGE", "CONDOMINIUM BUILDING (RESIDENTIAL)",
      "BARNDOMINIUM", "TINY HOUSE", "RESIDENTIAL STORAGE SPACE", "ROADSIDE MARKET",
      "CANNABIS GROW FACILITY", "GARDEN HOME", "CAR WASH - AUTOMATED",
      "CANNABIS DISPENSARY", "RECREATIONAL VEHICLES / TRAVEL TRAILERS",
      "COOPERATIVE BUILDING (RESIDENTIAL)", "BARBER/HAIR SALON",
      "LIVESTOCK (ANIMALS, FISH, BIRDS, ETC.)",
    ].map((s) => s.trim()),
  ),
);

/** Prepend `currentVal` to a list if it isn't already present (case-sensitive),
 * so a dropdown can always display an off-list / enriched value. */
export function ensureOpt(
  currentVal: string | null | undefined,
  opts: readonly string[],
): string[] {
  if (!currentVal) return [...opts];
  if (opts.includes(currentVal)) return [...opts];
  return [currentVal, ...opts];
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Map RealEstateAPI's property-use string onto our two building fields:
 * `propertyUsage` (canonical use label) and a coarse `propertyType` bucket.
 * Returns dropdown-valid values where possible so enriched data lands on a
 * real option.
 */
export function mapPropertyUse(raw: string | undefined): {
  propertyUsage: string;
  propertyType: string;
} {
  if (!raw) return { propertyUsage: "", propertyType: "" };
  const norm = raw.trim().toUpperCase();

  const canonicalUsage =
    PROPERTY_USE_OPTIONS.find((l) => l.toUpperCase() === norm) ?? titleCase(raw);

  let propertyType = "";
  for (const m of PROPERTY_TYPE_MAPPINGS) {
    if (m.use.some((u) => u.toUpperCase() === norm)) {
      propertyType = m.type;
      break;
    }
  }

  return { propertyUsage: canonicalUsage, propertyType };
}
