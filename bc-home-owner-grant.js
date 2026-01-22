/**
 * BC Home Owner Grant
 * Reduces residential property tax
 * 2026 tax year
 */

export const BC_HOME_OWNER_GRANT_2026 = {
  // Regular grant amounts
  regular: {
    basic: 570,                    // Basic grant
    additional65Plus: 845,         // If owner 65+ or person with disability
    veteranAdditional: 845,        // For veterans
  },
  
  // Northern and rural supplement
  northern: {
    basic: 770,
    additional65Plus: 1045,
  },
  
  // Assessment value thresholds
  thresholds: {
    regular: 2200000,              // Phase-out starts at $2.2M assessed value
    reductionRate: 0.005,          // $0.50 reduction per $1,000 over threshold
  },
  
  // Northern/rural areas (by municipality code)
  northernMunicipalities: [
    // Regional districts and municipalities eligible for northern grant
    'Peace River', 'Northern Rockies', 'Fort Nelson', 'Kitimat-Stikine',
    'Central Coast', 'Skeena-Queen Charlotte', 'Stikine', 'Mount Waddington',
    'Powell River', 'Sunshine Coast', 'Comox Valley (outer islands)',
  ],
};

/**
 * Calculate BC Home Owner Grant
 */
export function calculateBCHomeOwnerGrant(property) {
  const {
    assessedValue,
    ownerAge = 0,
    isDisabled = false,
    isVeteran = false,
    isNorthern = false,
    municipality = '',
  } = property;
  
  // Determine if northern/rural
  const qualifiesForNorthern = isNorthern || 
    BC_HOME_OWNER_GRANT_2026.northernMunicipalities.some(m => 
      municipality.toLowerCase().includes(m.toLowerCase())
    );
  
  // Determine base grant amount
  let grant = 0;
  
  if (qualifiesForNorthern) {
    grant = BC_HOME_OWNER_GRANT_2026.northern.basic;
    if (ownerAge >= 65 || isDisabled || isVeteran) {
      grant = BC_HOME_OWNER_GRANT_2026.northern.additional65Plus;
    }
  } else {
    grant = BC_HOME_OWNER_GRANT_2026.regular.basic;
    if (ownerAge >= 65 || isDisabled || isVeteran) {
      grant = BC_HOME_OWNER_GRANT_2026.regular.additional65Plus;
    }
  }
  
  // Phase-out for high-value properties
  if (assessedValue > BC_HOME_OWNER_GRANT_2026.thresholds.regular) {
    const excessValue = assessedValue - BC_HOME_OWNER_GRANT_2026.thresholds.regular;
    const reduction = (excessValue / 1000) * 0.5; // $0.50 per $1,000 over threshold
    grant = Math.max(0, grant - reduction);
  }
  
  return {
    grant: Math.round(grant * 100) / 100,
    qualifiesForNorthern,
    seniorBonus: (ownerAge >= 65 || isDisabled) && grant > 0,
  };
}
