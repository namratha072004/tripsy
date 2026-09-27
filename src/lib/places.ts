// Home city → nearest airport (IATA). Used for fare lookups. Unknown cities get
// null and show "cost estimate unavailable" rather than a guess.
const CITY_AIRPORTS: Record<string, string> = {
  mumbai: "BOM", bombay: "BOM", "navi mumbai": "BOM", thane: "BOM",
  delhi: "DEL", "new delhi": "DEL", gurgaon: "DEL", gurugram: "DEL", noida: "DEL",
  bangalore: "BLR", bengaluru: "BLR",
  chennai: "MAA", madras: "MAA",
  hyderabad: "HYD", secunderabad: "HYD",
  kolkata: "CCU", calcutta: "CCU",
  pune: "PNQ",
  ahmedabad: "AMD",
  kochi: "COK", cochin: "COK",
  goa: "GOI",
  jaipur: "JAI",
  lucknow: "LKO",
  chandigarh: "IXC",
  indore: "IDR",
  coimbatore: "CJB",
  nagpur: "NAG",
  bhubaneswar: "BBI",
  guwahati: "GAU",
  thiruvananthapuram: "TRV", trivandrum: "TRV",
  visakhapatnam: "VTZ", vizag: "VTZ",
  mangalore: "IXE", mangaluru: "IXE",
};

export function airportFor(city: string): string | null {
  return CITY_AIRPORTS[city.trim().toLowerCase()] ?? null;
}

export const DESTINATION_TYPES = [
  { id: "beach", label: "Beach" },
  { id: "mountains", label: "Mountains" },
  { id: "nature", label: "Green and quiet" },
  { id: "heritage", label: "Forts and history" },
  { id: "city", label: "City and food" },
  { id: "adventure", label: "Adventure" },
] as const;

export interface Destination {
  name: string;
  airport: string; // nearest commercial airport
  types: string[];
  country?: string; // set for international destinations (needs a passport)
}

// Starting catalog of candidate destinations. Scored against everyone's
// preferences; the top 3 become the options the group compares.
export const DESTINATIONS: Destination[] = [
  { name: "Goa", airport: "GOI", types: ["beach", "city"] },
  { name: "Gokarna", airport: "GOI", types: ["beach", "nature"] },
  { name: "Andaman (Havelock)", airport: "IXZ", types: ["beach", "adventure"] },
  { name: "Pondicherry", airport: "MAA", types: ["beach", "heritage", "city"] },
  { name: "Varkala", airport: "TRV", types: ["beach", "nature"] },
  { name: "Manali", airport: "KUU", types: ["mountains", "adventure"] },
  { name: "Leh–Ladakh", airport: "IXL", types: ["mountains", "adventure"] },
  { name: "Darjeeling", airport: "IXB", types: ["mountains", "nature"] },
  { name: "Rishikesh", airport: "DED", types: ["adventure", "nature", "mountains"] },
  { name: "Coorg", airport: "IXE", types: ["nature"] },
  { name: "Munnar", airport: "COK", types: ["nature", "mountains"] },
  { name: "Udaipur", airport: "UDR", types: ["heritage", "city"] },
  { name: "Jaipur", airport: "JAI", types: ["heritage", "city"] },
  { name: "Hampi", airport: "VDY", types: ["heritage", "adventure"] },
  { name: "Varanasi", airport: "VNS", types: ["heritage", "city"] },

  // International, short-haul from India
  { name: "Bali", airport: "DPS", types: ["beach", "nature", "adventure"], country: "Indonesia" },
  { name: "Phuket", airport: "HKT", types: ["beach", "adventure"], country: "Thailand" },
  { name: "Bangkok", airport: "BKK", types: ["city", "heritage"], country: "Thailand" },
  { name: "Da Nang and Hoi An", airport: "DAD", types: ["beach", "heritage", "city"], country: "Vietnam" },
  { name: "Dubai", airport: "DXB", types: ["city", "adventure"], country: "UAE" },
  { name: "Singapore", airport: "SIN", types: ["city"], country: "Singapore" },
  { name: "Langkawi", airport: "LGK", types: ["beach", "nature"], country: "Malaysia" },
  { name: "Maldives", airport: "MLE", types: ["beach"], country: "Maldives" },
  { name: "Sri Lanka (Kandy and Ella)", airport: "CMB", types: ["nature", "heritage", "mountains"], country: "Sri Lanka" },
  { name: "Pokhara", airport: "KTM", types: ["mountains", "adventure", "nature"], country: "Nepal" },
  { name: "Bhutan (Paro and Thimphu)", airport: "PBH", types: ["mountains", "heritage", "nature"], country: "Bhutan" },
];
