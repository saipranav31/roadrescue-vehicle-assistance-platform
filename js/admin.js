/**
 * Admin Operations Control Center Controller
 * Clean SVG icons and zero emojis
 */

class AdminPortalController {
  constructor() {}

  init() {
    this.renderKPIs();
    this.renderCommandMap();
    this.renderPartnerVerificationQueue();
    this.renderServiceCategories();
    this.renderDisputes();
    this.renderCharts();
  }

  renderKPIs() {
    const kpis = window.store.state.kpis || { totalRequests: 142, avgResponseTime: '12 min', completionRate: '99.2%', totalRevenue: '₹1,48,500' };
    const container = document.getElementById('admin-kpi-container');
    if (!container) return;

    container.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-icon-wrapper kpi-icon-blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div class="kpi-details">
          <div class="kpi-val">${kpis.totalRequests}</div>
          <div class="kpi-title">Total Assistance Requests</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon-wrapper kpi-icon-amber">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="kpi-details">
          <div class="kpi-val" style="color:var(--warning);">${kpis.avgResponseTime}</div>
          <div class="kpi-title">Avg Dispatch Time</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon-wrapper kpi-icon-green">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        </div>
        <div class="kpi-details">
          <div class="kpi-val" style="color:var(--success);">${kpis.completionRate}</div>
          <div class="kpi-title">Completion Rate</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon-wrapper kpi-icon-purple">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        </div>
        <div class="kpi-details">
          <div class="kpi-val" style="color:#a78bfa;">${kpis.totalRevenue}</div>
          <div class="kpi-title">Gross Platform Revenue</div>
        </div>
      </div>
    `;
  }

  renderCommandMap() {
    const mapElem = document.getElementById('admin-command-map');
    if (!mapElem) return;

    setTimeout(() => {
      window.roadsideMap.initMap('admin-command-map', [17.3850, 78.4867], 12);

      // Plot all partners
      (window.store.state.partners || []).forEach(p => {
        if (p.location) {
          window.roadsideMap.setMechanicMarker(p.id, p.location.lat, p.location.lng, `${p.name} (${p.company})`, (p.services || []).includes('Towing'));
        }
      });

      // Plot active requests
      (window.store.state.requests || []).forEach(r => {
        if (r.status !== 'completed' && r.status !== 'cancelled' && r.location) {
          window.roadsideMap.setUserMarker(r.location.lat, r.location.lng, `EMERGENCY #${r.id}: ${r.serviceType} (${r.userName})`);
        }
      });
    }, 100);
  }

  renderPartnerVerificationQueue() {
    const tableBody = document.getElementById('admin-partner-table-body');
    if (!tableBody) return;

    const partners = window.store.state.partners || [];

    tableBody.innerHTML = partners.map(p => `
      <tr>
        <td>
          <div style="font-weight:700;">${p.name}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);">${p.company}</div>
        </td>
        <td>${p.phone}</td>
        <td>${(p.services || []).join(', ')}</td>
        <td>
          <span class="badge ${p.verificationStatus === 'verified' ? 'badge-success' : (p.verificationStatus === 'pending' ? 'badge-warning' : 'badge-danger')}">
            ${p.verificationStatus}
          </span>
        </td>
        <td>
          ${p.verificationStatus === 'pending' ? `
            <button class="btn btn-success btn-sm" onclick="window.adminController.verifyPartner('${p.id}', true)">Approve</button>
            <button class="btn btn-danger btn-sm" onclick="window.adminController.verifyPartner('${p.id}', false)">Reject</button>
          ` : `
            <button class="btn btn-secondary btn-sm" onclick="window.adminController.verifyPartner('${p.id}', ${p.verificationStatus !== 'verified'})">
              ${p.verificationStatus === 'verified' ? 'Suspend' : 'Re-Approve'}
            </button>
          `}
        </td>
      </tr>
    `).join('');
  }

  verifyPartner(partnerId, approve) {
    window.store.verifyPartner(partnerId, approve);
    window.app.showToast(`Partner status updated to ${approve ? 'VERIFIED' : 'REJECTED/SUSPENDED'}`, approve ? 'success' : 'danger');
    this.renderPartnerVerificationQueue();
  }

  renderServiceCategories() {
    const container = document.getElementById('admin-categories-list');
    if (!container) return;

    const categories = window.store.state.serviceCategories || [
      { name: 'Breakdown Repair', baseFee: 299, description: 'On-site mechanical diagnostics' },
      { name: 'Flat Tyre Repair', baseFee: 199, description: 'Puncture plugin & spare wheel fitment' },
      { name: 'Battery Jump Start', baseFee: 249, description: 'Booster cable jumpstart & battery check' },
      { name: 'Fuel Delivery', baseFee: 149, description: 'Emergency fuel transport' },
      { name: 'Towing Service', baseFee: 599, description: 'Flatbed towing transport' }
    ];

    container.innerHTML = categories.map(c => `
      <div class="glass-card" style="margin-bottom:0.75rem;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div style="color:var(--primary);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div>
            <strong>${c.name}</strong>
            <div style="font-size:0.8rem;color:var(--text-muted);">${c.description}</div>
          </div>
        </div>
        <div style="font-weight:700;color:var(--warning);font-size:1.1rem;">
          ₹${c.baseFee} Base
        </div>
      </div>
    `).join('');
  }

  renderDisputes() {
    const container = document.getElementById('admin-disputes-list');
    if (!container) return;

    const disputes = window.store.state.disputes || [];

    if (disputes.length === 0) {
      container.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--text-muted);">No open customer disputes.</div>`;
      return;
    }

    container.innerHTML = disputes.map(d => `
      <div class="glass-card" style="margin-bottom:1rem;border-left:4px solid var(--emergency);">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="badge ${d.status === 'open' ? 'badge-danger' : 'badge-success'}">${d.status}</span>
          <span style="font-size:0.78rem;color:var(--text-muted);">${new Date(d.createdAt).toLocaleDateString()}</span>
        </div>
        <div style="margin:0.5rem 0;">
          <strong>Issue: ${d.issue}</strong>
          <div style="font-size:0.82rem;color:var(--text-muted);">User: ${d.user} • Partner: ${d.partner}</div>
        </div>
        ${d.status === 'open' ? `
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem;">
            <button class="btn btn-success btn-sm" onclick="window.adminController.resolveDispute('${d.id}', 'Refunded 50% to User')">Issue Refund</button>
            <button class="btn btn-secondary btn-sm" onclick="window.adminController.resolveDispute('${d.id}', 'Warned Partner')">Dismiss & Warn</button>
          </div>
        ` : `
          <div style="font-size:0.8rem;color:var(--success);font-weight:600;">Resolution: ${d.resolution}</div>
        `}
      </div>
    `).join('');
  }

  resolveDispute(disputeId, action) {
    window.store.resolveDispute(disputeId, action);
    window.app.showToast(`Dispute resolved: ${action}`, 'success');
    this.renderDisputes();
  }

  renderCharts() {
    const chartContainer1 = document.getElementById('admin-chart-volume');
    if (chartContainer1) {
      const data = [12, 19, 25, 38, 42, 30, 24, 18];
      const labels = ['8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'];
      const max = 50;

      const bars = data.map((val, idx) => {
        const heightPct = (val / max) * 100;
        return `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:0.3rem;">
            <div style="width:100%;height:140px;display:flex;align-items:flex-end;background:rgba(255,255,255,0.03);border-radius:4px;padding:2px;">
              <div style="width:100%;height:${heightPct}%;background:linear-gradient(180deg, var(--warning), #d97706);border-radius:3px;" title="${val} requests"></div>
            </div>
            <span style="font-size:0.7rem;color:var(--text-muted);">${labels[idx]}</span>
          </div>
        `;
      }).join('');

      chartContainer1.innerHTML = `
        <div style="display:flex;align-items:flex-end;gap:0.75rem;height:180px;padding-top:1rem;">
          ${bars}
        </div>
      `;
    }
  }
}

window.adminController = new AdminPortalController();
