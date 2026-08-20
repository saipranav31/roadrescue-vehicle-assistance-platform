/**
 * Real Production Location Service for RoadRescue
 * Performs Real Browser GPS Geolocation & OpenStreetMap Nominatim Reverse Geocoding.
 * NO Hardcoded Addresses (e.g. Kovur, Guntur, Vijayawada, Hyderabad detected dynamically).
 */

class LocationService {
  constructor() {
    this.currentLat = null;
    this.currentLng = null;
    this.currentAddress = null;
    this.watchId = null;
    this.permissionState = 'prompt'; // 'prompt' | 'granted' | 'denied'
    this.NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
    this.NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
  }

  // --- Step 1: Request Browser GPS Geolocation ---
  requestLocationPermission(onSuccess, onError) {
    if (!("geolocation" in navigator)) {
      this.permissionState = 'denied';
      if (onError) onError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        this.permissionState = 'granted';
        this.currentLat = position.coords.latitude;
        this.currentLng = position.coords.longitude;

        // Reverse Geocode exact coordinates from Nominatim API
        const addressObj = await this.reverseGeocode(this.currentLat, this.currentLng);
        this.currentAddress = addressObj;

        // Start continuous movement watch
        this.startPositionWatch();

        if (onSuccess) onSuccess({
          lat: this.currentLat,
          lng: this.currentLng,
          address: addressObj,
          displayTitle: addressObj.formatted
        });
      },
      (error) => {
        this.permissionState = 'denied';
        console.warn('GPS Geolocation Error / Denied:', error.message);
        if (onError) onError(error.message);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  // --- Step 2: Real Reverse Geocode via OpenStreetMap Nominatim API ---
  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(`${this.NOMINATIM_URL}?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (!response.ok) throw new Error('Geocoding API network response failed');
      const data = await response.json();
      
      const addr = data.address || {};
      // Extract exact detected locality (e.g. Kovur, Guntur, Vijayawada)
      const locality = addr.suburb || addr.village || addr.town || addr.neighbourhood || addr.residential || addr.county || addr.city || 'Detected Location';
      const city = addr.city || addr.town || addr.district || addr.state_district || '';
      const state = addr.state || '';

      let formatted = locality;
      if (city && city !== locality) formatted += `, ${city}`;
      if (state && !formatted.includes(state)) formatted += `, ${state}`;

      return {
        locality: locality,
        city: city,
        state: state,
        formatted: formatted,
        displayName: data.display_name
      };
    } catch (err) {
      console.warn('Nominatim Reverse Geocode notice:', err);
      return {
        locality: `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        city: '',
        state: '',
        formatted: `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      };
    }
  }

  // --- Step 3: Forward Geocode Search (Manual Search Input) ---
  async searchLocationQuery(query) {
    try {
      const response = await fetch(`${this.NOMINATIM_SEARCH_URL}?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`);
      if (!response.ok) throw new Error('Search API failed');
      const data = await response.json();

      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const addr = item.address || {};
        const locality = addr.suburb || addr.village || addr.town || item.name || 'Center';
        const city = addr.city || addr.district || '';
        const state = addr.state || '';

        let formatted = locality;
        if (city && city !== locality) formatted += `, ${city}`;
        if (state && !formatted.includes(state)) formatted += `, ${state}`;

        this.currentLat = lat;
        this.currentLng = lng;
        this.currentAddress = { locality, city, state, formatted };
        this.permissionState = 'granted';

        return {
          lat, lng,
          formatted,
          displayName: item.display_name
        };
      }
      throw new Error('No location results found');
    } catch (err) {
      console.error('Location search error:', err);
      throw err;
    }
  }

  startPositionWatch() {
    if (this.watchId) navigator.geolocation.clearWatch(this.watchId);

    if ("geolocation" in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          this.currentLat = pos.coords.latitude;
          this.currentLng = pos.coords.longitude;
          if (window.store) {
            window.store.updateUserCoords(this.currentLat, this.currentLng);
          }
        },
        (err) => console.warn('WatchPosition notice:', err),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }
  }

  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  }
}

window.locationService = new LocationService();
