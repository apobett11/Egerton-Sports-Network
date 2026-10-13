export interface CountyPickupInfo {
  county: string;
  subCounties: string[];
  pickupStations: string[];
}

export const DEFAULT_COUNTY_PICKUP_DATA: CountyPickupInfo[] = [
  {
    county: 'Nakuru',
    subCounties: ['Njoro', 'Nakuru Town East', 'Nakuru Town West', 'Naivasha', 'Gilgil', 'Molo', 'Rongai', 'Subukia'],
    pickupStations: [
      'Egerton Main Campus Gate 3 Sports Hub & Main Pitch Depot',
      'Nakuru CBD Afraha Stadium Main Entrance Depot',
      'Naivasha Town Sports Point & Courier Station',
      'Njoro Town Central Collection Station'
    ]
  },
  {
    county: 'Nairobi',
    subCounties: ['CBD / Starehe', 'Westlands', 'Kilimani / Dagoretti', 'Langata', 'Kasarani', 'Roysambu', 'Embakasi'],
    pickupStations: [
      'Nairobi CBD Gill House Sports Hub (Tom Mboya St)',
      'Westlands Sarit Centre Collection Hub',
      'Kilimani Sports Arena Depot (Argwings Kodhek Rd)',
      'Kasarani Sports Stadium VIP Gate Collection Station'
    ]
  },
  {
    county: 'Uasin Gishu',
    subCounties: ['Eldoret Town', 'Kesses', 'Ainabkoi', 'Kapseret', 'Soy', 'Turbo'],
    pickupStations: [
      'Eldoret Town Kipchoge Keino Stadium Depot',
      'Moi University Main Campus Student Centre Hub',
      'Eldoret Sports Club Front Desk Station'
    ]
  },
  {
    county: 'Kiambu',
    subCounties: ['Thika', 'Ruiru', 'Kikuyu', 'Kiambu Town', 'Juja', 'Limuru'],
    pickupStations: [
      'Thika Stadium Sports Office Collection Point',
      'Ruiru Junction Express Pickup Hub',
      'Juja JKUAT Gate 1 Courier Depot'
    ]
  },
  {
    county: 'Kisumu',
    subCounties: ['Kisumu Central', 'Kisumu East', 'Kisumu West', 'Seme', 'Nyando'],
    pickupStations: [
      'Moi Stadium Kisumu VIP Entrance Depot',
      'Mega Plaza Sports Desk & Collection Station'
    ]
  },
  {
    county: 'Mombasa',
    subCounties: ['Mvita', 'Nyali', 'Changamwe', 'Kisauni', 'Likoni'],
    pickupStations: [
      'Mombasa Sports Club Main Pavilion Depot',
      'Nyali Centre Ground Floor Pickup Station'
    ]
  },
  {
    county: 'Machakos',
    subCounties: ['Machakos Town', 'Mavoko / Syokimau', 'Kangundo', 'Matungulu'],
    pickupStations: [
      'Machakos Kenyatta Stadium Sports Depot',
      'Syokimau Gateway Mall Pickup Station'
    ]
  }
];

const PICKUP_STATIONS_STORAGE_KEY = 'egerscore_county_pickup_stations';

export const getStoredCountyPickupData = (): CountyPickupInfo[] => {
  try {
    const raw = localStorage.getItem(PICKUP_STATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse county pickup data', e);
  }
  return DEFAULT_COUNTY_PICKUP_DATA;
};

export const saveStoredCountyPickupData = (data: CountyPickupInfo[]): void => {
  try {
    localStorage.setItem(PICKUP_STATIONS_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('pickup_stations_updated', { detail: data }));
  } catch (e) {
    console.error('Failed to save county pickup data', e);
  }
};

/**
 * Admin action: Add a new pickup station to a specific county
 */
export const adminAddPickupStation = (countyName: string, stationName: string): CountyPickupInfo[] => {
  const current = getStoredCountyPickupData();
  const trimmedStation = stationName.trim();
  if (!trimmedStation) return current;

  const existingIndex = current.findIndex(c => c.county.toLowerCase() === countyName.toLowerCase());
  let updated: CountyPickupInfo[];

  if (existingIndex >= 0) {
    const target = current[existingIndex];
    if (!target.pickupStations.includes(trimmedStation)) {
      const updatedCounty = {
        ...target,
        pickupStations: [...target.pickupStations, trimmedStation]
      };
      updated = [...current];
      updated[existingIndex] = updatedCounty;
    } else {
      updated = current;
    }
  } else {
    updated = [
      ...current,
      {
        county: countyName,
        subCounties: ['Central', 'East', 'West'],
        pickupStations: [trimmedStation]
      }
    ];
  }

  saveStoredCountyPickupData(updated);
  return updated;
};
