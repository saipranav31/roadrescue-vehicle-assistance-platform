/**
 * Core Application Orchestrator
 * Direct Customer Login Engine, Theme Switcher & UI Router
 */

class RoadsideApp {
  constructor() {
    this.audioCtx = null;
    this.currentView = 'home';
    this.otpTimerInterval = null;
    this.theme = localStorage.getItem('roadrescue_theme') || 'dark';
  }

  init() {
    this.applyTheme(this.theme);
    
    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('lang-selector-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        wrapper.classList.remove('active');
      }
    });
    
    if (window.i18n) {
      window.i18n.applyTranslations();
      window.i18n.onChange(() => {
        this.applyTheme(this.theme);
        this.updateHeaderActions();
        if (window.store && window.store.state.userCoords) {
          this.updateLocationUI(window.store.state.currentLocationName);
        }
        if (window.ownerController && this.currentView === 'dashboard-customer') {
          window.ownerController.renderAll();
        }
      });
    }

    this.setupModals();
    this.setupAudio();

    this.navigateTo('home');

    setTimeout(() => {
      if (window.locationService && window.locationService.permissionState === 'prompt') {
        this.openGPSPromptModal();
      }
    }, 800);

    window.store.on('role:changed', (newRole) => {
      this.navigateTo(newRole);
    });

    window.store.on('request:updated', () => {
      if (window.ownerController) {
        window.ownerController.renderActiveTracking();
        window.ownerController.renderHistory();
      }
    });

    window.store.on('location:updated', (data) => {
      this.updateLocationUI(data.locationName);
    });
  }

  toggleLangDropdown(event) {
    if (event) event.stopPropagation();
    const wrapper = document.getElementById('lang-selector-wrapper');
    if (wrapper) wrapper.classList.toggle('active');
  }

  selectLanguage(langCode, labelText) {
    const wrapper = document.getElementById('lang-selector-wrapper');
    if (wrapper) wrapper.classList.remove('active');

    const labelElem = document.getElementById('lang-selected-label');
    if (labelElem) labelElem.textContent = labelText;

    localStorage.setItem('roadrescue_lang_label', labelText);

    if (window.i18n) {
      window.i18n.setLang(langCode);
    }
  }

  // --- THEME ENGINE ---
  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('roadrescue_theme', theme);

    const btnText = document.getElementById('theme-toggle-text');
    const btnIcon = document.getElementById('theme-toggle-icon');

    const sunSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

    if (btnText && btnIcon) {
      if (theme === 'dark') {
        btnText.innerText = window.i18n ? window.i18n.t('theme_light', 'Light Theme') : 'Light Theme';
        btnIcon.innerHTML = sunSvg;
      } else {
        btnText.innerText = window.i18n ? window.i18n.t('theme_dark', 'Dark Theme') : 'Dark Theme';
        btnIcon.innerHTML = moonSvg;
      }
    }

    if (window.roadsideMap) {
      window.roadsideMap.updateMapTheme(theme);
    }
  }

  toggleTheme() {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    const modeName = nextTheme === 'dark' ? (window.i18n ? window.i18n.t('theme_dark', 'Dark') : 'Dark') : (window.i18n ? window.i18n.t('theme_light', 'Light') : 'Light');
    this.showToast(`Switched to ${modeName} Theme`, 'info');
  }

  // --- PASSWORD SHOW / HIDE CONTROL ---
  togglePasswordVisibility(inputId, btnElem) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isPassword = input.getAttribute('type') === 'password';
    input.setAttribute('type', isPassword ? 'text' : 'password');

    const eyeSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const eyeOffSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

    if (btnElem) {
      btnElem.innerHTML = isPassword ? eyeOffSvg : eyeSvg;
    }
  }

  setupAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('Audio Context not available');
    }
  }

  playAlarmSound() {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.4);
    } catch (e) {}
  }

  // --- DIRECT CUSTOMER LOGIN HANDLER ---
  handleDirectCustomerLogin() {
    const email = document.getElementById('cust-login-email')?.value || '';
    const pass = document.getElementById('cust-login-pass')?.value || '';

    try {
      const customer = window.store.loginCustomerDirect(email, pass);
      this.showToast(`Welcome ${customer.name}! Logged in successfully.`, 'success');
      this.navigateTo('dashboard-customer');
    } catch (err) {
      this.showToast(err.message, 'danger');
    }
  }

  // --- LOCATION ENGINE ---
  openGPSPromptModal() {
    const modal = document.getElementById('modal-gps-prompt');
    if (modal) modal.classList.add('active');
  }

  closeGPSPromptModal() {
    const modal = document.getElementById('modal-gps-prompt');
    if (modal) modal.classList.remove('active');
  }

  requestGPSPermission() {
    this.openGPSPromptModal();
  }

  handleGPSPermissionResponse(allowed) {
    this.closeGPSPromptModal();
    const titleElem = document.getElementById('home-location-title');
    const actionBox = document.getElementById('home-location-action-box');

    if (!allowed) {
      if (window.locationService) window.locationService.permissionState = 'denied';
      if (window.store) window.store.state.locationState = 'denied';

      if (titleElem) {
        titleElem.innerHTML = `
          <div style="display:flex;align-items:center;gap:0.5rem;color:var(--emergency);font-weight:700;">
            <span>Location unavailable</span>
            <span style="font-size:0.8rem;color:var(--text-muted);font-weight:400;">(GPS Permission Denied)</span>
          </div>
        `;
      }

      if (actionBox) {
        actionBox.innerHTML = `
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-warning btn-sm" onclick="window.app.requestGPSPermission();">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Enable GPS
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.app.searchManualLocationPrompt();">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search Location
            </button>
          </div>
        `;
      }

      this.showToast('Location permission denied. Search your city/area manually.', 'warning');
      return;
    }

    if (titleElem) titleElem.innerHTML = `<em>Detecting GPS location...</em>`;

    window.locationService.requestLocationPermission(
      (locData) => {
        const detectedAddress = locData.displayTitle;
        window.store.updateUserCoords(locData.lat, locData.lng, detectedAddress);

        this.updateLocationUI(detectedAddress);
        this.showToast(`Location Detected: ${detectedAddress}`, 'success');
      },
      (err) => {
        this.handleGPSPermissionResponse(false);
      }
    );
  }

  updateLocationUI(address) {
    const titleElem = document.getElementById('home-location-title');
    const actionBox = document.getElementById('home-location-action-box');
    const contactLocElem = document.getElementById('contact-detected-location');

    const labelCurr = window.i18n ? window.i18n.t('current_location_label', 'CURRENT LOCATION') : 'CURRENT LOCATION';
    const badgeGps = window.i18n ? window.i18n.t('gps_active_badge', '✓ GPS ACTIVE') : '✓ GPS ACTIVE';
    const btnChange = window.i18n ? window.i18n.t('btn_change_location', 'Change Location') : 'Change Location';

    if (titleElem && address) {
      titleElem.innerHTML = `
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:700;">${labelCurr}</div>
          <div style="font-weight:800;font-size:1.15rem;color:var(--text-main);display:flex;align-items:center;gap:0.5rem;">
            ${address} <span class="location-detected-badge">${badgeGps}</span>
          </div>
        </div>
      `;
    }

    if (contactLocElem && address) {
      contactLocElem.innerHTML = `<strong style="color:var(--bright-blue);">${address}</strong>`;
    }

    if (actionBox) {
      actionBox.innerHTML = `
        <button class="btn btn-secondary btn-sm" onclick="window.app.searchManualLocationPrompt();">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          ${btnChange}
        </button>
      `;
    }
  }

  async searchManualLocationPrompt() {
    const query = prompt(window.i18n ? window.i18n.t('btn_search_location', 'Search City or Area Name:') : 'Search City or Area Name:');
    if (!query) return;

    const titleElem = document.getElementById('home-location-title');
    if (titleElem) titleElem.innerHTML = `<em>${window.i18n ? window.i18n.t('searching_location_api', 'Searching location API...') : 'Searching location API...'}</em>`;

    try {
      const res = await window.locationService.searchLocationQuery(query);
      window.store.updateUserCoords(res.lat, res.lng, res.formatted);
      this.showToast(`Location set to ${res.formatted}`, 'success');
    } catch (err) {
      this.showToast('Could not find location. Please try another city name.', 'danger');
      this.handleGPSPermissionResponse(false);
    }
  }

  // --- FLOATING RED SOS BUTTON ---
  triggerFloatingSOS() {
    if (!window.store.state.isCustomerLoggedIn) {
      this.showToast('Please enter your mobile number to trigger emergency SOS.', 'warning');
      this.navigateTo('login-customer');
      return;
    }

    this.playAlarmSound();
    const userLoc = window.store.state.currentLocationName || 'GPS Location Detected';
    
    const sosReq = window.store.createServiceRequest({
      serviceType: 'Breakdown Repair',
      problem: 'Emergency SOS Breakdown',
      location: { lat: window.store.state.userCoords ? window.store.state.userCoords.lat : 0, lng: window.store.state.userCoords ? window.store.state.userCoords.lng : 0, address: userLoc }
    });

    this.showToast(`EMERGENCY SOS DISPATCHED at ${userLoc}! Searching for nearby mechanics...`, 'danger');
    this.navigateTo('dashboard-customer');
  }

  navigateTo(viewId) {
    let targetView = viewId;
    if (viewId === 'owner') targetView = 'dashboard-customer';
    if (viewId === 'partner') targetView = 'dashboard-partner';
    if (viewId === 'admin') targetView = 'dashboard-admin';

    this.currentView = targetView;

    document.querySelectorAll('.view-panel').forEach(panel => {
      if (panel.id === `view-${targetView}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    this.updateHeaderActions();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (targetView === 'dashboard-customer' && window.ownerController) {
      window.ownerController.init();
    } else if (targetView === 'dashboard-partner' && window.partnerController) {
      window.partnerController.init();
    } else if (targetView === 'dashboard-admin' && window.adminController) {
      window.adminController.init();
    }
  }

  updateHeaderActions() {
    const container = document.getElementById('header-actions-container');
    if (!container) return;

    const userSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    const wrenchSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
    const sunSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    const globeSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;

    const savedLang = localStorage.getItem('roadrescue_lang');
    const savedLabel = localStorage.getItem('roadrescue_lang_label') || (savedLang === 'te' ? 'తెలుగు' : savedLang === 'hi' ? 'हिन्दी' : savedLang === 'en' ? 'English' : 'Select Language');

    const langDropdownHtml = `
      <div class="lang-selector-wrapper" id="lang-selector-wrapper">
        <button type="button" class="lang-select-btn" id="lang-select-btn" onclick="window.app.toggleLangDropdown(event);" title="Select Language">
          <span class="lang-selector-icon">${globeSvg}</span>
          <span id="lang-selected-label">${savedLabel}</span>
          <span class="lang-chevron">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </button>

        <div class="lang-dropdown-menu" id="lang-dropdown-menu">
          <div class="lang-dropdown-item" onclick="window.app.selectLanguage('en', 'English');">English</div>
          <div class="lang-dropdown-item" onclick="window.app.selectLanguage('te', 'తెలుగు');">Telugu (తెలుగు)</div>
          <div class="lang-dropdown-item" onclick="window.app.selectLanguage('hi', 'हिन्दी');">Hindi (हिन्दी)</div>
        </div>
      </div>
    `;

    const themeText = this.theme === 'dark' ? (window.i18n ? window.i18n.t('theme_light', 'Light Theme') : 'Light Theme') : (window.i18n ? window.i18n.t('theme_dark', 'Dark Theme') : 'Dark Theme');

    const themeBtnHtml = `
      <button id="theme-toggle-btn" class="theme-toggle-btn" onclick="window.app.toggleTheme();" title="Toggle Light/Dark Theme">
        <span id="theme-toggle-icon">${this.theme === 'dark' ? sunSvg : moonSvg}</span>
        <span id="theme-toggle-text">${themeText}</span>
      </button>
    `;

    const loginText = window.i18n ? window.i18n.t('nav_login_customer', 'Login as a Customer') : 'Login as a Customer';

    if (window.store.state.isCustomerLoggedIn) {
      container.innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="window.app.navigateTo('dashboard-customer')">
          ${userSvg} Dashboard (${window.store.state.currentUser ? window.store.state.currentUser.name : 'Account'})
        </button>
        <button class="btn btn-secondary btn-sm" onclick="window.store.logout();">
          Logout
        </button>
        ${langDropdownHtml}
        ${themeBtnHtml}
      `;
    } else if (window.store.state.isPartnerLoggedIn) {
      container.innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="window.app.navigateTo('dashboard-partner')">
          ${wrenchSvg} Mechanic Radar (${window.store.state.currentPartner ? window.store.state.currentPartner.name : 'Partner'})
        </button>
        <button class="btn btn-secondary btn-sm" onclick="window.store.logout();">
          Logout
        </button>
        ${langDropdownHtml}
        ${themeBtnHtml}
      `;
    } else {
      container.innerHTML = `
        <button class="btn btn-secondary btn-sm" onclick="window.app.navigateTo('login-customer');">
          ${userSvg} <span data-i18n="nav_login_customer">${loginText}</span>
        </button>
        ${langDropdownHtml}
        ${themeBtnHtml}
      `;
    }
  }

  requireCustomerLogin() {
    if (!window.store.state.isCustomerLoggedIn) {
      this.showToast('Please enter your mobile number to request assistance.', 'warning');
      this.navigateTo('login-customer');
    } else {
      this.navigateTo('dashboard-customer');
    }
  }

  handlePartnerLoginSubmit() {
    const mobile = document.getElementById('part-mobile-input')?.value || '+91 98123 45678';
    window.store.loginPartner(mobile, 'Mechanic Partner');
    this.showToast('Logged in to Partner Portal.', 'success');
  }

  scrollToSection(sectionId) {
    if (this.currentView !== 'home') {
      this.navigateTo('home');
      setTimeout(() => {
        const elem = document.getElementById(sectionId);
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const elem = document.getElementById(sectionId);
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }
  }

  setupModals() {
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    if (type === 'success') iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    if (type === 'warning') iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    if (type === 'danger')  iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--emergency)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;

    toast.innerHTML = `
      <div style="display:flex;align-items:center;">${iconSvg}</div>
      <div style="font-size:0.88rem;font-weight:600;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new RoadsideApp();
  window.app.init();
});
