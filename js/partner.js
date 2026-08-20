/**
 * Mechanic Partner Portal Controller
 * Handles Online/Busy/Offline Status Switch, Dispatch Radar,
 * Start OTP Verification & Complete OTP Security Entry.
 */

class PartnerController {
  constructor() {}

  init() {
    this.renderHeader();
    this.renderEarnings();
    this.renderRadarAlerts();
    this.renderActiveDispatchJob();
    this.renderHistory();
  }

  setStatus(status) {
    window.store.state.currentPartner.status = status;
    window.store.saveState();
    this.renderHeader();
    window.app.showToast(`Mechanic status set to ${status.toUpperCase()}`, status === 'online' ? 'success' : 'warning');
  }

  renderHeader() {
    const container = document.getElementById('partner-profile-header');
    if (!container) return;

    const partner = window.store.state.currentPartner;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="color:var(--primary);background:rgba(37,99,235,0.12);padding:0.75rem;border-radius:var(--radius-md);">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div>
            <h2 style="font-size:1.4rem;">${partner.name}</h2>
            <div style="font-size:0.85rem;color:var(--text-muted);">${partner.company} • ${partner.phone}</div>
            <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.3rem;">
              <span class="badge badge-success">✓ VERIFIED MECHANIC</span>
              <span class="badge ${partner.status === 'online' ? 'badge-success' : partner.status === 'busy' ? 'badge-warning' : 'badge-danger'}">
                STATUS: ${partner.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div style="text-align:right;">
          <div style="font-size:0.8rem;color:var(--text-muted);font-weight:700;">RATING</div>
          <div style="font-weight:800;font-size:1.5rem;color:var(--warning);">${partner.rating} / 5.0</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${partner.jobsCompleted} Rescues Completed</div>
        </div>
      </div>
    `;
  }

  renderEarnings() {
    const container = document.getElementById('partner-earnings-grid');
    if (!container) return;

    const partner = window.store.state.currentPartner;

    container.innerHTML = `
      <div class="grid-3">
        <div class="glass-panel" style="padding:1.25rem;text-align:center;">
          <div style="font-size:0.8rem;color:var(--text-muted);font-weight:700;">TODAY'S EARNINGS</div>
          <div style="font-size:1.8rem;font-weight:800;color:var(--success);margin-top:0.25rem;">₹${partner.totalEarnings}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">Direct UPI Settlement</div>
        </div>
        <div class="glass-panel" style="padding:1.25rem;text-align:center;">
          <div style="font-size:0.8rem;color:var(--text-muted);font-weight:700;">ACCEPTANCE RATE</div>
          <div style="font-size:1.8rem;font-weight:800;color:var(--primary);margin-top:0.25rem;">98.5%</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">Fast Radar Response</div>
        </div>
        <div class="glass-panel" style="padding:1.25rem;text-align:center;">
          <div style="font-size:0.8rem;color:var(--text-muted);font-weight:700;">COMPLETED JOBS</div>
          <div style="font-size:1.8rem;font-weight:800;color:var(--warning);margin-top:0.25rem;">${partner.jobsCompleted}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">Total Rescues</div>
        </div>
      </div>
    `;
  }

  renderRadarAlerts() {
    const container = document.getElementById('partner-radar-container');
    if (!container) return;

    const partner = window.store.state.currentPartner;
    const searchingRequests = window.store.state.requests.filter(r => r.status === 'searching');

    if (partner.status !== 'online') {
      container.innerHTML = `
        <div class="glass-panel" style="padding:1.25rem;text-align:center;color:var(--text-muted);">
          You are currently <strong>${partner.status.toUpperCase()}</strong>. Switch to Online to receive incoming emergency dispatches.
        </div>
      `;
      return;
    }

    if (searchingRequests.length === 0) {
      container.innerHTML = `
        <div class="glass-panel" style="padding:1.25rem;text-align:center;color:var(--text-muted);">
          Listening for emergency breakdown radar signals... No pending requests nearby.
        </div>
      `;
      return;
    }

    container.innerHTML = searchingRequests.map(req => `
      <div class="glass-panel" style="padding:1.5rem;border-color:var(--warning);margin-bottom:1rem;background:rgba(245,158,11,0.08);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
          <span class="badge ${req.priority === 'HIGH' ? 'badge-danger' : 'badge-warning'}">
            ${req.priority} PRIORITY EMERGENCY
          </span>
          <span style="font-size:0.85rem;color:var(--warning);font-weight:700;">90s Broadcast Timer</span>
        </div>

        <div style="margin-bottom:1rem;">
          <div style="font-size:1.2rem;font-weight:800;">${req.serviceType} (${req.problem || 'Breakdown'})</div>
          <div style="font-size:0.9rem;color:var(--text-muted);">Customer: <strong>${req.userName}</strong> • Vehicle: ${req.vehicle}</div>
          <div style="font-size:0.9rem;color:var(--success);font-weight:700;margin-top:0.25rem;">📍 ${req.location.address} (2.3 km away)</div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(15,23,42,0.8);padding:0.85rem 1rem;border-radius:var(--radius-sm);margin-bottom:1rem;">
          <div>
            <div style="font-size:0.75rem;color:var(--text-muted);">TOTAL BILL</div>
            <div style="font-weight:800;font-size:1.1rem;color:var(--warning);">₹${req.costRupees}</div>
          </div>
          <div>
            <div style="font-size:0.75rem;color:var(--text-muted);">PLATFORM FEE</div>
            <div style="font-weight:700;font-size:0.9rem;color:var(--text-muted);">₹${req.platformFee || 20}</div>
          </div>
          <div>
            <div style="font-size:0.75rem;color:var(--text-muted);">YOUR EARNING</div>
            <div style="font-weight:800;font-size:1.2rem;color:var(--success);">₹${req.mechanicEarning || 330}</div>
          </div>
        </div>

        <div style="display:flex;gap:0.75rem;">
          <button class="btn btn-secondary" onclick="window.partnerController.declineRequest('${req.id}')" style="flex:1;">
            Decline
          </button>
          <button class="btn btn-primary" onclick="window.partnerController.acceptRequest('${req.id}')" style="flex:2;font-size:1rem;">
            ACCEPT DISPATCH NOW
          </button>
        </div>
      </div>
    `).join('');
  }

  acceptRequest(requestId) {
    const partner = window.store.state.currentPartner;
    window.store.acceptBroadcastedRequest(requestId, partner.id);
    partner.status = 'busy';
    window.store.saveState();

    window.app.playAlarmSound();
    window.app.showToast('Emergency Dispatch Accepted! Drive safely to customer location.', 'success');

    this.renderHeader();
    this.renderRadarAlerts();
    this.renderActiveDispatchJob();
  }

  declineRequest(requestId) {
    window.app.showToast('Dispatch declined.', 'info');
  }

  renderActiveDispatchJob() {
    const container = document.getElementById('partner-active-job-container');
    if (!container) return;

    const partner = window.store.state.currentPartner;
    const activeJob = window.store.state.requests.find(r => r.partnerId === partner.id && r.status !== 'completed');

    if (!activeJob) {
      container.innerHTML = `
        <div class="glass-panel" style="padding:1.25rem;text-align:center;color:var(--text-muted);">
          No active dispatch in progress.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="glass-panel" style="padding:1.5rem;border-color:var(--warning);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <div>
            <span class="badge badge-primary">ACTIVE DISPATCH: ${activeJob.status.toUpperCase()}</span>
          </div>
          <div>
            <a href="tel:${activeJob.userPhone}" class="btn btn-success btn-sm">Call Customer (${activeJob.userName})</a>
          </div>
        </div>

        <div style="margin-bottom:1rem;">
          <div style="font-weight:800;font-size:1.15rem;">${activeJob.serviceType} — ${activeJob.vehicle}</div>
          <div style="font-size:0.9rem;color:var(--text-main);">📍 Breakdown Location: ${activeJob.location.address}</div>
        </div>

        <!-- 2-STEP OTP SECURITY VERIFICATION FOR MECHANIC -->
        <div class="glass-panel" style="padding:1rem;background:rgba(15,23,42,0.9);margin-bottom:1.25rem;">
          <h4 style="margin-bottom:0.5rem;color:var(--warning);">Security OTP Verification Controls</h4>
          <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.85rem;">Ask customer for their OTP code to verify service arrival & completion.</p>

          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
            ${!activeJob.isStarted ? `
              <button class="btn btn-warning" onclick="window.partnerController.promptStartOtp('${activeJob.id}');">
                Enter Customer Start OTP to Begin Repair
              </button>
            ` : `
              <span class="badge badge-success" style="padding:0.5rem 1rem;font-size:0.9rem;">✓ SERVICE STARTED (VERIFIED)</span>
            `}

            ${activeJob.isStarted && !activeJob.isCompleted ? `
              <button class="btn btn-success" onclick="window.partnerController.promptCompleteOtp('${activeJob.id}');">
                Enter Complete OTP to Finish Repair
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Live Chat with Customer -->
        <div class="glass-panel" style="padding:1rem;margin-bottom:1.25rem;">
          <h4 style="margin-bottom:0.5rem;">Live Chat with ${activeJob.userName}</h4>
          <div style="max-height:140px;overflow-y:auto;display:flex;flex-direction:column;gap:0.4rem;margin-bottom:0.75rem;">
            ${(activeJob.chatMessages || []).map(m => `
              <div style="align-self:${m.sender === 'mechanic' ? 'flex-end' : 'flex-start'};background:${m.sender === 'mechanic' ? 'var(--warning)' : 'rgba(255,255,255,0.1)'};padding:0.4rem 0.75rem;border-radius:10px;font-size:0.85rem;color:${m.sender === 'mechanic' ? '#000' : '#fff'}">
                ${m.text}
              </div>
            `).join('')}
          </div>
          <div style="display:flex;gap:0.5rem;">
            <input type="text" id="partner-chat-input" class="form-control" placeholder="Reply to customer..." onkeypress="if(event.key==='Enter') window.partnerController.sendChat('${activeJob.id}');">
            <button class="btn btn-warning btn-sm" onclick="window.partnerController.sendChat('${activeJob.id}');">Reply</button>
          </div>
        </div>

        <!-- Navigation Map -->
        <div id="partner-nav-map" class="map-container" style="height:260px;"></div>
      </div>
    `;

    setTimeout(() => {
      window.roadsideMap.initMap('partner-nav-map', 17.3912, 78.4910);
      window.roadsideMap.plotRoute(17.3912, 78.4910, window.store.state.userCoords.lat, window.store.state.userCoords.lng);
    }, 150);
  }

  promptStartOtp(requestId) {
    const entered = prompt('Ask Customer for their 4-Digit START OTP (Demo OTP is 8821):', '8821');
    if (entered) {
      const valid = window.store.verifyStartOtp(requestId, entered.trim());
      if (valid) {
        window.app.showToast('Start OTP Verified! Service timer started.', 'success');
        this.renderActiveDispatchJob();
      } else {
        window.app.showToast('Invalid OTP code. Please check with customer.', 'danger');
      }
    }
  }

  promptCompleteOtp(requestId) {
    const entered = prompt('Ask Customer for their 4-Digit COMPLETE OTP (Demo OTP is 9922):', '9922');
    if (entered) {
      const valid = window.store.verifyCompleteOtp(requestId, entered.trim());
      if (valid) {
        window.app.showToast('Complete OTP Verified! Job marked completed. Awaiting UPI settlement.', 'success');
        this.renderActiveDispatchJob();
      } else {
        window.app.showToast('Invalid OTP code. Please check with customer.', 'danger');
      }
    }
  }

  sendChat(requestId) {
    const input = document.getElementById('partner-chat-input');
    if (input && input.value.trim()) {
      window.store.addChatMessage(requestId, 'mechanic', input.value.trim());
      input.value = '';
      this.renderActiveDispatchJob();
    }
  }

  renderHistory() {
    const container = document.getElementById('partner-job-history');
    if (!container) return;

    const partner = window.store.state.currentPartner;
    const jobs = window.store.state.requests.filter(r => r.partnerId === partner.id && r.status === 'completed');

    if (jobs.length === 0) {
      container.innerHTML = `<div class="glass-panel" style="padding:1rem;color:var(--text-muted);text-align:center;">No completed job logs yet.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="glass-panel table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Total Bill</th>
              <th>Settlement</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${jobs.map(j => `
              <tr>
                <td><strong>${j.id}</strong></td>
                <td>${j.userName} (${j.userPhone})</td>
                <td>${j.serviceType}</td>
                <td>₹${j.costRupees}</td>
                <td style="font-weight:800;color:var(--success);">₹${j.mechanicEarning || 330} (Paid via UPI)</td>
                <td><span class="badge badge-success">✓ COMPLETED</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

window.partnerController = new PartnerController();
