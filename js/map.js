/**
 * Interactive Mapping & GPS Simulation Engine powered by Leaflet.js
 * Supports Dynamic Theme Tiles (Dark / Light) & Clean SVG Markers
 */

class RoadsideMapManager {
  constructor() {
    this.map = null;
    this.tileLayer = null;
    this.markers = {};
    this.routePolyline = null;
    this.animInterval = null;
    this.currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  }

  getTileUrl(theme) {
    return theme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  }

  initMap(elementId, center = [37.7749, -122.4194], zoom = 14) {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const container = document.getElementById(elementId);
    if (!container) return;

    this.map = L.map(elementId, {
      center: center,
      zoom: zoom,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    this.currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    this.tileLayer = L.tileLayer(this.getTileUrl(this.currentTheme), {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    return this.map;
  }

  updateMapTheme(theme) {
    this.currentTheme = theme;
    if (this.map && this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
      this.tileLayer = L.tileLayer(this.getTileUrl(theme), {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(this.map);
    }
  }

  setUserMarker(lat, lng, popupText = "Breakdown Location") {
    if (this.markers.user && this.map) {
      this.map.removeLayer(this.markers.user);
    }

    const carSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7c-.7 0-1.3.3-1.8.7C4.3 8.6 3 10 3 10s-2.7.6-4.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;

    const icon = L.divIcon({
      className: 'custom-marker-wrapper',
      html: `<div class="custom-marker marker-user" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">${carSvg}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    if (this.map) {
      this.markers.user = L.marker([lat, lng], { icon: icon })
        .addTo(this.map)
        .bindPopup(`<b>${popupText}</b>`);
    }
  }

  setMechanicMarker(id, lat, lng, name, isTow = false) {
    if (this.markers[id] && this.map) {
      this.map.removeLayer(this.markers[id]);
    }

    const iconClass = isTow ? 'marker-tow' : 'marker-mechanic';
    const svgIcon = isTow
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;

    const icon = L.divIcon({
      className: 'custom-marker-wrapper',
      html: `<div class="custom-marker ${iconClass}" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">${svgIcon}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    if (this.map) {
      this.markers[id] = L.marker([lat, lng], { icon: icon })
        .addTo(this.map)
        .bindPopup(`<b>${name}</b><br><span style="color:#10b981;font-size:12px;">● Verified Partner</span>`);
    }
  }

  plotRoute(startLat, startLng, endLat, endLng) {
    if (!this.map) return;
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
    }

    const latLngs = [
      [startLat, startLng],
      [(startLat + endLat) / 2 + 0.002, (startLng + endLng) / 2 - 0.002],
      [endLat, endLng]
    ];

    this.routePolyline = L.polyline(latLngs, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.8,
      dashArray: '8, 12'
    }).addTo(this.map);

    this.map.fitBounds(this.routePolyline.getBounds(), { padding: [40, 40] });
  }

  simulateMechanicDispatch(mechanicId, startLat, startLng, targetLat, targetLng, onComplete) {
    if (this.animInterval) clearInterval(this.animInterval);

    let progress = 0;
    const steps = 60;
    const dLat = (targetLat - startLat) / steps;
    const dLng = (targetLng - startLng) / steps;

    let curLat = startLat;
    let curLng = startLng;

    this.animInterval = setInterval(() => {
      progress++;
      curLat += dLat;
      curLng += dLng;

      if (this.markers[mechanicId]) {
        this.markers[mechanicId].setLatLng([curLat, curLng]);
      }

      if (progress >= steps) {
        clearInterval(this.animInterval);
        this.animInterval = null;
        if (onComplete) onComplete();
      }
    }, 100);
  }

  clearMap() {
    if (this.animInterval) clearInterval(this.animInterval);
    Object.keys(this.markers).forEach(k => {
      if (this.markers[k] && this.map) this.map.removeLayer(this.markers[k]);
    });
    this.markers = {};
    if (this.routePolyline && this.map) {
      this.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }
  }
}

window.roadsideMap = new RoadsideMapManager();
