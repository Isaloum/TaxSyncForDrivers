/**
 * Mileage Log Module - CRA-Compliant Trip Tracking System
 * Tracks vehicle trips for business and personal use with CRA compliance features
 * @module mileage-log
 */

/**
 * Mileage Log Manager
 * CRA-compliant trip tracking for vehicle expense deductions
 */
export class MileageLog {
  constructor() {
    this.trips = this.loadTrips();
  }

  /**
   * Add a new trip
   */
  addTrip(trip) {
    const {
      date,
      destination,
      purpose,
      startOdometer,
      endOdometer,
      isBusinessTrip = true,
      clientName = '',
      notes = '',
    } = trip;

    // Validation
    if (!date || !destination || !purpose) {
      throw new Error('Date, destination, and purpose are required');
    }

    if (endOdometer <= startOdometer) {
      throw new Error('End odometer must be greater than start odometer');
    }

    const distance = endOdometer - startOdometer;

    const newTrip = {
      id: `trip-${Date.now()}`,
      date: new Date(date).toISOString().split('T')[0],
      destination,
      purpose,
      startOdometer,
      endOdometer,
      distance,
      isBusinessTrip,
      clientName,
      notes,
      createdAt: new Date().toISOString(),
    };

    this.trips.push(newTrip);
    this.saveTrips();
    return newTrip;
  }

  /**
   * Get last odometer reading
   */
  getLastOdometerReading() {
    if (this.trips.length === 0) return 0;

    const sortedTrips = [...this.trips].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    return sortedTrips[0].endOdometer;
  }

  /**
   * Get trips by date range
   */
  getTripsByDateRange(startDate, endDate) {
    return this.trips.filter(trip => {
      const tripDate = new Date(trip.date);
      return tripDate >= new Date(startDate) && tripDate <= new Date(endDate);
    });
  }

  /**
   * Calculate daily summary
   */
  getDailySummary(date) {
    const dayTrips = this.trips.filter(trip => trip.date === date);

    const businessKm = dayTrips
      .filter(t => t.isBusinessTrip)
      .reduce((sum, t) => sum + t.distance, 0);

    const personalKm = dayTrips
      .filter(t => !t.isBusinessTrip)
      .reduce((sum, t) => sum + t.distance, 0);

    const totalKm = businessKm + personalKm;
    const businessPercent = totalKm > 0 ? (businessKm / totalKm) * 100 : 0;

    return {
      date,
      businessKm,
      personalKm,
      totalKm,
      businessPercent: Math.round(businessPercent * 100) / 100,
      tripCount: dayTrips.length,
    };
  }

  /**
   * Calculate period summary
   */
  getPeriodSummary(startDate, endDate) {
    const periodTrips = this.getTripsByDateRange(startDate, endDate);

    const businessKm = periodTrips
      .filter(t => t.isBusinessTrip)
      .reduce((sum, t) => sum + t.distance, 0);

    const personalKm = periodTrips
      .filter(t => !t.isBusinessTrip)
      .reduce((sum, t) => sum + t.distance, 0);

    const totalKm = businessKm + personalKm;
    const businessPercent = totalKm > 0 ? (businessKm / totalKm) * 100 : 0;

    return {
      startDate,
      endDate,
      businessKm,
      personalKm,
      totalKm,
      businessPercent: Math.round(businessPercent * 100) / 100,
      tripCount: periodTrips.length,
      businessTripCount: periodTrips.filter(t => t.isBusinessTrip).length,
      personalTripCount: periodTrips.filter(t => !t.isBusinessTrip).length,
    };
  }

  /**
   * Export to CRA-compliant CSV
   */
  exportToCSV(startDate, endDate) {
    const trips = this.getTripsByDateRange(startDate, endDate);
    const summary = this.getPeriodSummary(startDate, endDate);

    // CSV Header
    const headers = [
      'Date',
      'Destination',
      'Purpose',
      'Start Odometer (km)',
      'End Odometer (km)',
      'Distance (km)',
      'Business/Personal',
      'Client/Passenger',
      'Notes',
    ];

    // CSV Rows
    const rows = trips.map(trip => [
      trip.date,
      trip.destination,
      trip.purpose,
      trip.startOdometer,
      trip.endOdometer,
      trip.distance,
      trip.isBusinessTrip ? 'Business' : 'Personal',
      trip.clientName || '',
      trip.notes || '',
    ]);

    // Summary Footer
    const summaryRows = [
      [''],
      ['SUMMARY'],
      ['Period', `${startDate} to ${endDate}`],
      ['Total Business Kilometers', summary.businessKm],
      ['Total Personal Kilometers', summary.personalKm],
      ['Total Kilometers', summary.totalKm],
      ['Business Use Percentage', `${summary.businessPercent}%`],
      ['Total Trips', summary.tripCount],
      ['Business Trips', summary.businessTripCount],
      ['Personal Trips', summary.personalTripCount],
    ];

    // Combine all rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ...summaryRows.map(row => row.join(',')),
    ].join('\n');

    return {
      csvContent,
      filename: `Mileage_Log_${startDate}_to_${endDate}.csv`,
      summary,
    };
  }

  /**
   * Check if business use exceeds CRA threshold
   */
  checkBusinessUseThreshold(startDate, endDate) {
    const summary = this.getPeriodSummary(startDate, endDate);
    const CRA_THRESHOLD = 90;

    if (summary.businessPercent > CRA_THRESHOLD) {
      return {
        exceedsThreshold: true,
        businessPercent: summary.businessPercent,
        threshold: CRA_THRESHOLD,
        warning: `Your business use (${summary.businessPercent}%) exceeds the ${CRA_THRESHOLD}% CRA scrutiny threshold. Consider logging more personal trips or be prepared to provide detailed documentation for audit.`,
      };
    }

    return {
      exceedsThreshold: false,
      businessPercent: summary.businessPercent,
      threshold: CRA_THRESHOLD,
    };
  }

  /**
   * Update trip
   */
  updateTrip(tripId, updates) {
    const index = this.trips.findIndex(t => t.id === tripId);
    if (index === -1) throw new Error('Trip not found');

    this.trips[index] = { ...this.trips[index], ...updates };
    this.saveTrips();
    return this.trips[index];
  }

  /**
   * Delete trip
   */
  deleteTrip(tripId) {
    const index = this.trips.findIndex(t => t.id === tripId);
    if (index === -1) throw new Error('Trip not found');

    this.trips.splice(index, 1);
    this.saveTrips();
  }

  /**
   * Save trips to localStorage
   */
  saveTrips() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('taxsync_mileage_log', JSON.stringify(this.trips));
    }
  }

  /**
   * Load trips from localStorage
   */
  loadTrips() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('taxsync_mileage_log');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  }
}

// Legacy functional API for backward compatibility
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
