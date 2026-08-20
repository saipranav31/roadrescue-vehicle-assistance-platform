/**
 * Production Central State Store for RoadRescue Platform
 * Supports Direct Customer Login & Backend MSG91 Integration
 */

class AppStore {
  constructor() {
    this.STORAGE_KEY = 'ROADRESCUE_MSG91_PROD_V2';
    this.listeners = {};
    this.state = this.loadState();
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  loadState() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error('Error loading state:', e); }
    }
    return this.getInitialState();
  }

  saveState() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    this.emit('state:changed', this.state);
  }

  getInitialState() {
    return {
      currentRole: 'home',
      isCustomerLoggedIn: false,
      isPartnerLoggedIn: false,
      locationState: 'prompt',
      userCoords: null,
      currentLocationName: 'Detecting Location...',
      
      currentUser: null,
      vehicles: [],
      partners: [],
      requests: [],
      activeRequestId: null,
      activeReqId: null,

      vehicleCategories: [
        { id: 'bike', name: 'Bike', icon: '' },
        { id: 'car', name: 'Car', icon: '' },
        { id: 'truck', name: 'Truck', icon: '' },
        { id: 'auto', name: 'Auto', icon: '' },
        { id: 'ev', name: 'Electric Vehicle', icon: '' }
      ],

      problemOptions: {
        bike: ['Flat Tyre', 'Battery Dead', 'Engine Not Starting', 'Chain Problem', 'Brake Issue', 'Fuel Empty', 'Clutch Issue', 'Accident', 'Other'],
        car: ['Flat Tyre', 'Battery Dead', 'Engine Failure', 'Fuel Empty', 'Towing Required', 'Overheating', 'Brake Failure', 'Accident', 'Other'],
        auto: ['Flat Tyre', 'Battery Dead', 'Engine Fault', 'Brake Failure', 'Fuel Empty', 'Accident', 'Other'],
        truck: ['Heavy Hydraulic Fault', 'Brake Air Pressure', 'Clutch Failure', 'Engine Breakdown', 'Flat Tyre', 'Towing', 'Other'],
        ev: ['High-Voltage Battery Drained', 'Motor Controller Error', 'Charging Cable Failure', 'EV System Breakdown', 'Tyre Damage', 'Other']
      },

      petrolPumps: [
        { id: 'pump-01', name: 'Indian Oil Petrol Station', distance: '0.8 km', phone: '+91 1800-22-4344', address: 'Nearest Highway Outlet' },
        { id: 'pump-02', name: 'HP Fuel Center', distance: '1.2 km', phone: '+91 1800-233-3555', address: 'Main Road Station' },
        { id: 'pump-03', name: 'Bharat Petroleum', distance: '1.5 km', phone: '+91 1800-22-4000', address: 'Express Highway Plaza' }
      ]
    };
  }

  // --- DIRECT CUSTOMER LOGIN (Email & Password - Instant session without OTP) ---
  loginCustomerDirect(email, password) {
    if (!email || !email.trim()) throw new Error('Please enter a valid email address.');
    if (!password || !password.trim()) throw new Error('Please enter your password.');

    const namePart = email.split('@')[0] || 'Customer';
    const fullName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const detectedLoc = this.state.currentLocationName || 'GPS Location Detected';

    const customer = {
      id: 'cust-' + Math.floor(1000 + Math.random() * 9000),
      name: fullName,
      email: email.trim(),
      location: detectedLoc
    };

    this.state.isCustomerLoggedIn = true;
    this.state.currentUser = customer;
    this.state.currentRole = 'owner';
    this.state.vehicles = this.state.vehicles || [];
    this.state.requests = this.state.requests || [];

    this.saveState();
    this.emit('auth:customer', customer);
    this.emit('role:changed', 'owner');

    return customer;
  }

  // --- MSG91 OTP BACKEND INTEGRATION ENDPOINTS (Saved for future use) ---
  async sendRealOtp(phone, name) {
    if (!phone || !phone.trim()) throw new Error('Please enter a valid 10-digit mobile number.');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    const response = await fetch('http://localhost:5000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: cleanPhone, full_name: name })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to dispatch MSG91 OTP.');
    }

    if (data.reqId) {
      this.state.activeReqId = data.reqId;
      this.saveState();
    }

    return {
      success: true,
      phone: cleanPhone,
      message: data.message,
      reqId: data.reqId
    };
  }

  async verifyRealOtp(phone, enteredOtp) {
    if (!enteredOtp || enteredOtp.trim().length !== 6) {
      throw new Error('Please enter the 6-digit OTP code received via SMS.');
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const reqId = this.state.activeReqId;

    const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: cleanPhone, otp: enteredOtp.trim(), reqId: reqId })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Invalid OTP code. Please check the SMS received on your phone.');
    }

    const detectedLoc = this.state.currentLocationName || 'GPS Location Detected';

    const customer = data.customer || {
      id: 'cust-' + Math.floor(1000 + Math.random() * 9000),
      name: 'Customer',
      phone: cleanPhone,
      location: detectedLoc
    };

    customer.location = detectedLoc;

    this.state.isCustomerLoggedIn = true;
    this.state.currentUser = customer;
    this.state.vehicles = [];
    this.state.requests = [];
    this.state.currentRole = 'owner';
    this.state.activeReqId = null;

    this.saveState();
    this.emit('auth:customer', customer);
    this.emit('role:changed', 'owner');

    return customer;
  }

  updateUserCoords(lat, lng, locationName) {
    this.state.userCoords = { lat, lng };
    if (locationName) {
      this.state.currentLocationName = locationName;
      if (this.state.currentUser) {
        this.state.currentUser.location = locationName;
      }
    }
    this.saveState();
    this.emit('location:updated', { lat, lng, locationName: this.state.currentLocationName });
  }

  getDiagnosticQuestions(problem) {
    if (problem.includes('Engine') || problem.includes('Won\'t Start') || problem.includes('Not Starting')) {
      return [
        { id: 'q1', text: 'Is there fuel in the tank?', options: ['Yes, fuel is available', 'No, fuel is empty', 'Uncertain'] },
        { id: 'q2', text: 'Does the self-start make any sound?', options: ['Clicking sound', 'Complete silence', 'Normal cranking sound'] },
        { id: 'q3', text: 'Are dashboard lights turning on?', options: ['Yes, bright', 'Flickering / Dim', 'No lights at all'] },
        { id: 'q4', text: 'Did this happen suddenly or gradually?', options: ['Suddenly while driving', 'Gradually over days', 'Stood parked overnight'] }
      ];
    }
    if (problem.includes('Flat Tyre')) {
      return [
        { id: 'q1', text: 'Is the tyre tubeless or tube-type?', options: ['Tubeless', 'Tube-type', 'Not sure'] },
        { id: 'q2', text: 'Is a spare wheel available?', options: ['Yes, spare available', 'No spare wheel'] },
        { id: 'q3', text: 'Is there visible damage or nail stuck?', options: ['Nail visible', 'Sidewall cut / burst', 'Air leaking slowly'] }
      ];
    }
    if (problem.includes('Battery')) {
      return [
        { id: 'q1', text: 'Are headlights or horn working?', options: ['Weak / Dim horn', 'Completely dead', 'Working normally'] },
        { id: 'q2', text: 'When was the battery last replaced?', options: ['Less than 1 year', 'More than 2 years', 'Unknown'] }
      ];
    }
    return [
      { id: 'q1', text: 'Did the issue occur while driving?', options: ['Yes, on the road', 'No, while parked'] },
      { id: 'q2', text: 'Is the vehicle safe to move to the side?', options: ['Yes, parked safely', 'No, blocking lane'] }
    ];
  }

  generateDiagnosticSummary(problem, answers) {
    let summary = `Probable Diagnosis for ${problem}: `;
    const qAnswers = Object.values(answers).join('; ');
    if (qAnswers.includes('silence') || qAnswers.includes('Dim') || qAnswers.includes('No lights')) {
      summary += `Battery Voltage Drop / Electrical Grounding Issue. (${qAnswers})`;
    } else if (qAnswers.includes('empty')) {
      summary += `Fuel Depletion / Fuel Line Blockage. (${qAnswers})`;
    } else {
      summary += `Mechanical Inspection Required. (${qAnswers})`;
    }
    return summary;
  }

  addVehicle(vehicleData) {
    const newVehicle = {
      id: 'veh-' + Date.now(),
      category: vehicleData.category || 'bike',
      make: vehicleData.make,
      model: vehicleData.model,
      licensePlate: vehicleData.licensePlate,
      fuel: vehicleData.fuel || 'Petrol'
    };
    this.state.vehicles.push(newVehicle);
    if (!this.state.currentUser.activeVehicleId) {
      this.state.currentUser.activeVehicleId = newVehicle.id;
    }
    this.saveState();
    this.emit('vehicles:updated', this.state.vehicles);
    return newVehicle;
  }

  createServiceRequest(requestData) {
    const vehicle = this.state.vehicles.find(v => v.id === this.state.currentUser.activeVehicleId) || this.state.vehicles[0] || { make: 'Vehicle', model: '', licensePlate: '' };
    const userLoc = this.state.currentLocationName || 'GPS Location Detected';

    const newRequest = {
      id: 'req-' + Math.floor(1000 + Math.random() * 9000),
      userId: this.state.currentUser ? this.state.currentUser.id : 'anon',
      userName: this.state.currentUser ? this.state.currentUser.name : 'Customer',
      userPhone: this.state.currentUser ? this.state.currentUser.phone : '',
      vehicle: `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`.trim(),
      serviceType: requestData.serviceType || 'Emergency Breakdown',
      problem: requestData.problem || 'Breakdown',
      diagnosticSummary: requestData.diagnosticSummary || 'On-site diagnosis requested.',
      location: requestData.location || { lat: this.state.userCoords ? this.state.userCoords.lat : 0, lng: this.state.userCoords ? this.state.userCoords.lng : 0, address: userLoc },
      status: 'searching',
      partnerId: null,
      partnerName: null,
      partnerPhone: null,
      pricingEstimate: 'Price will be shared after request acceptance',
      createdAt: new Date().toISOString(),
      chatMessages: []
    };

    this.state.requests.unshift(newRequest);
    this.state.activeRequestId = newRequest.id;
    this.saveState();
    this.emit('request:broadcasted', newRequest);
    return newRequest;
  }

  logout() {
    this.state.isCustomerLoggedIn = false;
    this.state.isPartnerLoggedIn = false;
    this.state.currentUser = null;
    this.state.currentRole = 'home';
    this.saveState();
    this.emit('role:changed', 'home');
  }

  setRole(role) {
    this.state.currentRole = role;
    this.saveState();
    this.emit('role:changed', role);
  }
}

window.store = new AppStore();
