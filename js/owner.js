/**
 * Customer Portal Controller
 * Preserves Real Detected Location Across Session & Manages Clean Vehicle List
 */

class OwnerController {
  constructor() {
    this.selectedVehicleCat = 'bike';
    this.selectedProblem = 'Flat Tyre';
    this.currentDiagnosticAnswers = {};
    this.generatedDiagnosticSummary = '';
  }

  init() {
    this.renderWelcomeHeader();
    this.renderVehiclesList();
    this.renderBookingWizard();
    this.renderActiveTracking();
    this.renderHistory();
  }

  getCategorySvg(catId) {
    switch (catId) {
      case 'bike':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h2l3 6.5"/><path d="M12 17.5V14l-3-4 4-4 2 4h4"/></svg>`;
      case 'car':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7c-.7 0-1.3.3-1.8.7C4.3 8.6 3 10 3 10s-2.7.6-4.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;
      case 'truck':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
      case 'auto':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7c-.7 0-1.3.3-1.8.7C4.3 8.6 3 10 3 10s-2.7.6-4.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;
      case 'ev':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
      default:
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7c-.7 0-1.3.3-1.8.7C4.3 8.6 3 10 3 10s-2.7.6-4.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;
    }
  }

  getProblemIconSvg(prob) {
    if (prob.includes('Fuel')) return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="15" y2="22"/><rect x="4" y="9" width="10" height="13" rx="1"/><path d="M6 9V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5"/><path d="M14 9h4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1"/></svg>`;
    if (prob.includes('Tyre')) return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>`;
    if (prob.includes('Battery')) return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
  }

  renderAll() {
    this.renderWelcomeHeader();
    this.renderVehiclesList();
    this.renderBookingWizard();
    this.renderActiveTracking();
    this.renderHistory();
  }

  renderWelcomeHeader() {
    const container = document.getElementById('owner-dashboard-welcome');
    if (!container) return;

    const user = window.store.state.currentUser;
    if (!user) return;

    const detectedLoc = window.store.state.currentLocationName || user.location || 'GPS Location Detected';
    const welcomeStr = window.i18n ? window.i18n.t('dashboard_welcome', 'Welcome') : 'Welcome';
    const gpsActiveStr = window.i18n ? window.i18n.t('gps_active_badge', '✓ GPS ACTIVE') : '✓ GPS ACTIVE';

    container.innerHTML = `
      <div class="glass-panel" style="padding:1.5rem;margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:700;letter-spacing:0.04em;">CUSTOMER DASHBOARD</div>
          <h2 style="font-size:1.6rem;margin-top:0.1rem;">${welcomeStr}, ${user.name}</h2>
          <div style="font-size:0.9rem;color:var(--bright-blue);font-weight:600;margin-top:0.25rem;display:flex;align-items:center;gap:0.4rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${detectedLoc} <span class="location-detected-badge" style="font-size:0.75rem;padding:0.15rem 0.55rem;">${gpsActiveStr}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderVehiclesList() {
    const container = document.getElementById('customer-vehicles-list');
    if (!container) return;

    const vehicles = window.store.state.vehicles;
    const noVehiclesTitle = window.i18n ? window.i18n.t('no_vehicles_msg', 'No vehicles added yet') : 'No vehicles added yet';
    const addVehicleBtn = window.i18n ? window.i18n.t('btn_add_vehicle', '+ Add Vehicle') : '+ Add Vehicle';

    if (vehicles.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:1.75rem;background:var(--bg-surface);border:1px dashed var(--border-subtle);border-radius:var(--radius-md);color:var(--text-muted);">
          <div style="color:var(--primary);display:flex;justify-content:center;margin-bottom:0.5rem;">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7c-.7 0-1.3.3-1.8.7C4.3 8.6 3 10 3 10s-2.7.6-4.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
          </div>
          <div style="font-weight:700;font-size:0.98rem;color:var(--text-main);">${noVehiclesTitle}</div>
          <div style="font-size:0.85rem;margin-bottom:1.15rem;color:var(--text-muted);">Add your vehicle to request fast roadside assistance.</div>
          <button class="btn btn-primary btn-sm" onclick="window.ownerController.openAddVehicleModal();">
            ${addVehicleBtn}
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid-3">
        ${vehicles.map(v => `
          <div class="glass-card" style="border-color:${window.store.state.currentUser?.activeVehicleId === v.id ? 'var(--primary)' : 'var(--border-subtle)'};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;">
              <div style="color:var(--primary);">${this.getCategorySvg(v.category)}</div>
              <span class="badge badge-primary" style="text-transform:uppercase;">${v.licensePlate}</span>
            </div>
            <div style="font-weight:800;font-size:1.05rem;">${v.make} ${v.model}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${v.category.toUpperCase()} • ${v.fuel || 'Petrol'}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  openAddVehicleModal() {
    const modal = document.getElementById('modal-add-vehicle');
    if (modal) modal.classList.add('active');
  }

  submitAddVehicle() {
    const category = document.getElementById('v-category')?.value || 'bike';
    const make = document.getElementById('v-make')?.value || '';
    const model = document.getElementById('v-model')?.value || '';
    const plate = document.getElementById('v-plate')?.value || '';

    if (!make || !plate) {
      window.app.showToast('Please enter Make and License Plate number.', 'warning');
      return;
    }

    window.store.addVehicle({ category, make, model, licensePlate: plate.toUpperCase() });
    document.getElementById('modal-add-vehicle')?.classList.remove('active');

    this.renderVehiclesList();
    this.renderBookingWizard();
    window.app.showToast(`Vehicle ${make} ${model} saved successfully!`, 'success');
  }

  renderBookingWizard() {
    const container = document.getElementById('owner-booking-wizard-container');
    if (!container) return;

    const categories = window.store.state.vehicleCategories;
    const problems = window.store.state.problemOptions[this.selectedVehicleCat] || window.store.state.problemOptions['bike'];

    const step1Title = window.i18n ? window.i18n.t('wizard_step1_title', '1. Select Vehicle for Assistance') : '1. Select Vehicle for Assistance';
    const step2Title = window.i18n ? window.i18n.t('wizard_step2_title', '2. Select Breakdown Issue') : '2. Select Breakdown Issue';
    const btnDiagnostic = window.i18n ? window.i18n.t('btn_continue_diagnostic', 'Smart Diagnostic Assistant') : 'Smart Diagnostic Assistant';
    const btnRequest = window.i18n ? window.i18n.t('btn_request_now', 'Confirm Assistance Request') : 'Confirm Assistance Request';

    container.innerHTML = `
      <div class="glass-panel" style="padding:1.75rem;">
        <h3 style="margin-bottom:1rem;">${step1Title}</h3>
        
        <!-- Vehicle Category Cards -->
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1.5rem;">
          ${categories.map(cat => {
            const catKey = 'cat_' + cat.id;
            const catName = window.i18n ? window.i18n.t(catKey, cat.name) : cat.name;
            return `
            <div class="glass-card" 
                 onclick="window.ownerController.selectVehicleCategory('${cat.id}')"
                 style="flex:1;min-width:110px;text-align:center;padding:0.9rem 0.5rem;cursor:pointer;border:${this.selectedVehicleCat === cat.id ? '2px solid var(--primary)' : '1px solid var(--border-subtle)'};background:${this.selectedVehicleCat === cat.id ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-surface)'}">
              <div style="display:flex;justify-content:center;margin-bottom:0.4rem;color:${this.selectedVehicleCat === cat.id ? 'var(--primary)' : 'var(--text-muted)'}">${this.getCategorySvg(cat.id)}</div>
              <div style="font-weight:700;font-size:0.88rem;color:${this.selectedVehicleCat === cat.id ? 'var(--primary)' : 'var(--text-main)'}">${catName}</div>
            </div>
          `;}).join('')}
        </div>

        <h3 style="margin-bottom:1rem;">${step2Title}</h3>
        <!-- Problem Selection Chips -->
        <div style="display:flex;flex-wrap:wrap;gap:0.6rem;margin-bottom:1.5rem;">
          ${problems.map(prob => {
            let probKey = 'issue_engine';
            if (prob.includes('Battery')) probKey = 'issue_battery';
            if (prob.includes('Fuel')) probKey = 'issue_fuel';
            if (prob.includes('Tyre')) probKey = 'issue_tyre';
            const probName = window.i18n ? window.i18n.t(probKey, prob) : prob;
            return `
            <button class="btn ${this.selectedProblem === prob ? 'btn-primary' : 'btn-secondary'}"
                    onclick="window.ownerController.selectProblem('${prob}')" style="font-size:0.88rem;padding:0.45rem 1rem;display:inline-flex;align-items:center;gap:0.4rem;">
              ${this.getProblemIconSvg(prob)}
              <span>${probName}</span>
            </button>
          `;}).join('')}
        </div>

        <!-- Smart Suggestions Box for Fuel Empty -->
        <div id="smart-petrol-pump-box"></div>

        <!-- Smart Diagnostic Summary Badge if Available -->
        ${this.generatedDiagnosticSummary ? `
          <div style="background:rgba(37,99,235,0.12);border:1px solid var(--primary);padding:0.85rem 1rem;border-radius:var(--radius-sm);margin-bottom:1.25rem;">
            <div style="font-size:0.75rem;color:var(--bright-blue);font-weight:800;letter-spacing:0.04em;display:flex;align-items:center;gap:0.35rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>
              SMART DIAGNOSTIC SUMMARY
            </div>
            <div style="font-size:0.9rem;font-weight:700;margin-top:0.2rem;">${this.generatedDiagnosticSummary}</div>
          </div>
        ` : ''}

        <div style="margin-top:1.25rem;display:flex;gap:0.75rem;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="window.ownerController.openSmartDiagnosticModal();" style="flex:1;min-width:200px;display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>
            ${btnDiagnostic}
          </button>

          <button class="btn btn-danger btn-lg" onclick="window.ownerController.submitEmergencyRequest();" style="flex:2;min-width:260px;display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            ${btnRequest}
          </button>
        </div>
      </div>
    `;

    this.renderSmartPetrolPumps();
  }

  selectVehicleCategory(catId) {
    this.selectedVehicleCat = catId;
    const problems = window.store.state.problemOptions[catId];
    this.selectedProblem = problems[0];
    this.renderBookingWizard();
  }

  selectProblem(problemName) {
    this.selectedProblem = problemName;
    this.renderBookingWizard();
  }

  renderSmartPetrolPumps() {
    const container = document.getElementById('smart-petrol-pump-box');
    if (!container) return;

    if (this.selectedProblem !== 'Fuel Empty') {
      container.innerHTML = '';
      return;
    }

    const pumps = window.store.state.petrolPumps;
    const title = window.i18n ? window.i18n.t('petrol_pump_title', 'Nearest Petrol Stations') : 'Nearest Petrol Stations';
    const sub = window.i18n ? window.i18n.t('petrol_pump_subtitle', 'Nearest open fuel stations near your location') : 'Nearest open fuel stations near your location';

    container.innerHTML = `
      <div class="petrol-pump-card">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
          <div style="color:var(--warning);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="15" y2="22"/><rect x="4" y="9" width="10" height="13" rx="1"/><path d="M6 9V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5"/><path d="M14 9h4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1"/></svg>
          </div>
          <div>
            <div style="font-weight:800;color:var(--warning);font-size:1.05rem;">${title}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${sub}</div>
          </div>
        </div>

        ${pumps.map(pump => `
          <div class="petrol-pump-item">
            <div>
              <div style="font-weight:700;font-size:0.95rem;">${pump.name}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);">📍 ${pump.address} • <strong>${pump.distance} away</strong></div>
            </div>
            <div style="display:flex;gap:0.4rem;">
              <a href="https://maps.google.com/?q=${encodeURIComponent(pump.name + ' ' + pump.address)}" target="_blank" class="btn btn-secondary btn-sm">Navigate</a>
              <a href="tel:${pump.phone}" class="btn btn-success btn-sm">Call</a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  openSmartDiagnosticModal() {
    const questions = window.store.getDiagnosticQuestions(this.selectedProblem);
    const body = document.getElementById('diagnostic-modal-body');

    if (body) {
      body.innerHTML = `
        <div style="font-size:0.9rem;color:var(--text-muted);margin-bottom:1rem;">
          Answer a few quick questions to help the mechanic diagnose your <strong>${this.selectedProblem}</strong> issue before arriving.
        </div>

        ${questions.map((q, idx) => `
          <div class="form-group" style="margin-bottom:1.25rem;">
            <label class="form-label" style="font-weight:700;">${idx + 1}. ${q.text}</label>
            <div style="display:flex;flex-direction:column;gap:0.4rem;">
              ${q.options.map(opt => `
                <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.88rem;cursor:pointer;background:rgba(255,255,255,0.04);padding:0.4rem 0.75rem;border-radius:6px;">
                  <input type="radio" name="${q.id}" value="${opt}" onchange="window.ownerController.currentDiagnosticAnswers['${q.id}'] = '${opt}'">
                  <span>${opt}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
      `;
    }

    const modal = document.getElementById('modal-diagnostic');
    if (modal) modal.classList.add('active');
  }

  confirmDiagnosticSummary() {
    this.generatedDiagnosticSummary = window.store.generateDiagnosticSummary(this.selectedProblem, this.currentDiagnosticAnswers);
    document.getElementById('modal-diagnostic')?.classList.remove('active');
    this.renderBookingWizard();
    window.app.showToast('Diagnostic Summary attached to request!', 'success');
  }

  submitEmergencyRequest() {
    const user = window.store.state.currentUser;
    if (!user) {
      window.app.showToast('Please verify your mobile number to request assistance.', 'warning');
      window.app.navigateTo('login-customer');
      return;
    }

    const loc = window.store.state.currentLocationName || 'GPS Location Detected';

    const req = window.store.createServiceRequest({
      serviceType: this.selectedProblem,
      problem: this.selectedProblem,
      diagnosticSummary: this.generatedDiagnosticSummary || 'On-site breakdown diagnostic requested.',
      location: {
        lat: window.store.state.userCoords ? window.store.state.userCoords.lat : 0,
        lng: window.store.state.userCoords ? window.store.state.userCoords.lng : 0,
        address: loc
      }
    });

    window.app.playAlarmSound();
    window.app.showToast(`Searching for nearby mechanics... Request dispatched.`, 'info');

    this.renderBookingWizard();
    this.renderActiveTracking();
  }

  renderActiveTracking() {
    const container = document.getElementById('owner-tracking-container');
    if (!container) return;

    const activeReq = window.store.state.requests.find(r => r.id === window.store.state.activeRequestId);
    const noReqMsg = window.i18n ? window.i18n.t('no_active_request', 'No active emergency request.') : 'No active emergency request.';
    const statusBroadcastMsg = window.i18n ? window.i18n.t('status_broadcasting', 'Broadcasting request to nearby mechanics...') : 'Broadcasting request to nearby mechanics...';

    if (!activeReq) {
      container.innerHTML = `
        <div class="glass-panel" style="padding:1.5rem;text-align:center;color:var(--text-muted);">
          ${noReqMsg}
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="glass-panel" style="padding:1.5rem;border-color:var(--warning);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <span class="badge badge-warning">${statusBroadcastMsg}</span>
          <span style="font-size:0.85rem;color:var(--text-muted);">Estimates shared upon acceptance</span>
        </div>

        <div style="margin-bottom:1.25rem;">
          <div style="font-weight:800;font-size:1.1rem;">${activeReq.serviceType} — ${activeReq.vehicle}</div>
          <div style="font-size:0.88rem;color:var(--text-main);">📍 ${activeReq.location.address}</div>
          ${activeReq.diagnosticSummary ? `
            <div style="font-size:0.82rem;color:var(--primary);margin-top:0.3rem;font-weight:600;">Diagnostic Summary: ${activeReq.diagnosticSummary}</div>
          ` : ''}
        </div>

        <div style="text-align:center;padding:1.5rem;background:rgba(245,158,11,0.1);border-radius:var(--radius-md);border:1px dashed var(--warning);">
          <div style="color:var(--warning);display:flex;justify-content:center;margin-bottom:0.5rem;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20v-12"/><path d="M22 20V4"/></svg>
          </div>
          <h4 style="color:var(--warning);">${statusBroadcastMsg}</h4>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-top:0.25rem;">Connecting with real mechanics in your vicinity via backend API.</p>
        </div>

        <!-- Interactive Tracking Map -->
        <div id="owner-active-map" class="map-container" style="height:260px;margin-top:1.25rem;"></div>
      </div>
    `;

    setTimeout(() => {
      if (window.store.state.userCoords) {
        window.roadsideMap.initMap('owner-active-map', window.store.state.userCoords.lat, window.store.state.userCoords.lng);
      }
    }, 150);
  }

  renderHistory() {
    const container = document.getElementById('owner-history-list');
    const section = document.getElementById('customer-history-section');
    if (!container || !section) return;

    const completed = window.store.state.requests.filter(r => r.status === 'completed');

    if (completed.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    container.innerHTML = `
      <div class="glass-panel table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Date & ID</th>
              <th>Vehicle</th>
              <th>Problem</th>
              <th>Mechanic</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            ${completed.map(req => `
              <tr>
                <td><strong>${req.id}</strong><br><span style="font-size:0.75rem;color:var(--text-muted);">${new Date(req.createdAt).toLocaleDateString()}</span></td>
                <td>${req.vehicle}</td>
                <td>${req.serviceType}</td>
                <td>${req.partnerName || 'Mechanic'}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="window.ownerController.viewInvoice('${req.id}')">View Invoice</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

window.ownerController = new OwnerController();
