/**
 * Mileage Log Module - CRA-Compliant Trip Tracking System
 * Tracks vehicle trips for business and personal use with CRA compliance features
 * @module mileage-log
 */

/**
 * Creates a new trip entry
 * @param {string} date - Trip date in YYYY-MM-DD format
 * @param {number} startKm - Starting odometer reading
 * @param {number} endKm - Ending odometer reading
 * @param {string} destination - Trip destination
 * @param {string} purpose - Purpose of trip
 * @param {boolean} isBusinessTrip - Whether trip is for business
 * @returns {Object} Trip object
 * @throws {Error} If validation fails
 */
export function addTrip(date, startKm, endKm, destination, purpose, isBusinessTrip) {
  // Validate inputs
  if (!date || typeof date !== 'string') {
    throw new Error('Date is required and must be a string');
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }

  if (typeof startKm !== 'number' || startKm < 0) {
    throw new Error('Start odometer must be a non-negative number');
  }

  if (typeof endKm !== 'number' || endKm < 0) {
    throw new Error('End odometer must be a non-negative number');
  }

  if (endKm < startKm) {
    throw new Error('End odometer cannot be less than start odometer');
  }

  if (!destination || typeof destination !== 'string') {
    throw new Error('Destination is required and must be a string');
  }

  if (!purpose || typeof purpose !== 'string') {
    throw new Error('Purpose is required and must be a string');
  }

  if (typeof isBusinessTrip !== 'boolean') {
    throw new Error('isBusinessTrip must be a boolean');
  }

  const distance = parseFloat((endKm - startKm).toFixed(2));

  return {
    date,
    startKm,
    endKm,
    destination,
    purpose,
    isBusinessTrip,
    distance
  };
}

/**
 * Calculates business use percentage from trips
 * @param {Array<Object>} trips - Array of trip objects
 * @returns {number} Business percentage (0-100) rounded to 2 decimal places
 * @throws {Error} If trips is not an array
 */
export function calculateBusinessPercentage(trips) {
  if (!Array.isArray(trips)) {
    throw new Error('Trips must be an array');
  }

  if (trips.length === 0) {
    return 0;
  }

  const totalDistance = trips.reduce((sum, trip) => sum + trip.distance, 0);
  
  if (totalDistance === 0) {
    return 0;
  }

  const businessDistance = trips
    .filter(trip => trip.isBusinessTrip)
    .reduce((sum, trip) => sum + trip.distance, 0);

  const percentage = (businessDistance / totalDistance) * 100;
  return parseFloat(percentage.toFixed(2));
}

/**
 * Exports trip log as CSV format
 * @param {Array<Object>} trips - Array of trip objects
 * @returns {string} CSV formatted string
 * @throws {Error} If trips is not an array
 */
export function exportLogAsCSV(trips) {
  if (!Array.isArray(trips)) {
    throw new Error('Trips must be an array');
  }

  const headers = 'Date,Start Odometer (km),End Odometer (km),Distance (km),Destination,Purpose,Type\n';
  
  const rows = trips.map(trip => {
    const type = trip.isBusinessTrip ? 'Business' : 'Personal';
    return `${trip.date},${trip.startKm},${trip.endKm},${trip.distance},${trip.destination},${trip.purpose},${type}`;
  }).join('\n');

  return headers + rows;
}

/**
 * Exports trip log as printable text format with summary
 * @param {Array<Object>} trips - Array of trip objects
 * @returns {string} Formatted text log
 * @throws {Error} If trips is not an array
 */
export function exportLogAsText(trips) {
  if (!Array.isArray(trips)) {
    throw new Error('Trips must be an array');
  }

  if (trips.length === 0) {
    return 'MILEAGE LOG\n' +
           '===========\n' +
           'No trips recorded.\n';
  }

  let output = 'MILEAGE LOG - CRA COMPLIANT\n';
  output += '============================\n\n';

  trips.forEach((trip, index) => {
    output += `Trip ${index + 1}:\n`;
    output += `  Date:        ${trip.date}\n`;
    output += `  Start:       ${trip.startKm} km\n`;
    output += `  End:         ${trip.endKm} km\n`;
    output += `  Distance:    ${trip.distance} km\n`;
    output += `  Destination: ${trip.destination}\n`;
    output += `  Purpose:     ${trip.purpose}\n`;
    output += `  Type:        ${trip.isBusinessTrip ? 'Business' : 'Personal'}\n`;
    output += '\n';
  });

  // Add summary
  const totalDistance = trips.reduce((sum, trip) => sum + trip.distance, 0);
  const businessDistance = trips
    .filter(trip => trip.isBusinessTrip)
    .reduce((sum, trip) => sum + trip.distance, 0);
  const personalDistance = totalDistance - businessDistance;
  const businessPercentage = calculateBusinessPercentage(trips);

  output += 'SUMMARY\n';
  output += '-------\n';
  output += `Total Trips:       ${trips.length}\n`;
  output += `Total Distance:    ${totalDistance.toFixed(2)} km\n`;
  output += `Business Distance: ${businessDistance.toFixed(2)} km\n`;
  output += `Personal Distance: ${personalDistance.toFixed(2)} km\n`;
  output += `Business Use:      ${businessPercentage}%\n`;

  return output;
}

/**
 * Validates if business use meets CRA 90% threshold
 * @param {number} percentage - Business use percentage
 * @returns {Object} Validation result with status and message
 * @throws {Error} If percentage is not a number or out of range
 */
export function validateBusinessUse(percentage) {
  if (typeof percentage !== 'number') {
    throw new Error('Percentage must be a number');
  }

  if (percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }

  const CRA_THRESHOLD = 90;
  const meetsThreshold = percentage >= CRA_THRESHOLD;

  return {
    meetsThreshold,
    percentage,
    threshold: CRA_THRESHOLD,
    message: meetsThreshold
      ? `Business use of ${percentage}% meets CRA 90% threshold for 100% ITC claim`
      : `Business use of ${percentage}% does not meet CRA 90% threshold (requires ${CRA_THRESHOLD}%)`
  };
}

/**
 * Generates annual summary statistics
 * @param {Array<Object>} trips - Array of trip objects
 * @returns {Object} Annual summary with statistics
 */
export function getAnnualSummary(trips) {
  if (!Array.isArray(trips)) {
    throw new Error('Trips must be an array');
  }

  const businessTrips = trips.filter(trip => trip.isBusinessTrip);
  const personalTrips = trips.filter(trip => !trip.isBusinessTrip);

  const totalDistance = trips.reduce((sum, trip) => sum + trip.distance, 0);
  const businessDistance = businessTrips.reduce((sum, trip) => sum + trip.distance, 0);
  const personalDistance = personalTrips.reduce((sum, trip) => sum + trip.distance, 0);
  const businessPercentage = calculateBusinessPercentage(trips);

  return {
    totalTrips: trips.length,
    businessTrips: businessTrips.length,
    personalTrips: personalTrips.length,
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    businessDistance: parseFloat(businessDistance.toFixed(2)),
    personalDistance: parseFloat(personalDistance.toFixed(2)),
    businessPercentage,
    meetsThreshold: businessPercentage >= 90
  };
}

/**
 * Extracts representative period (e.g., 3-month sample) from trips
 * @param {Array<Object>} trips - Array of trip objects
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array<Object>} Filtered trips within period
 */
export function getRepresentativePeriod(trips, startDate, endDate) {
  if (!Array.isArray(trips)) {
    throw new Error('Trips must be an array');
  }

  if (!startDate || !endDate) {
    throw new Error('Start and end dates are required');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }

  if (end < start) {
    throw new Error('End date cannot be before start date');
  }

  return trips.filter(trip => {
    const tripDate = new Date(trip.date);
    return tripDate >= start && tripDate <= end;
  });
}
