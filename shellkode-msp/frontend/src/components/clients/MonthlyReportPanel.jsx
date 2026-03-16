import React, { useState, useCallback } from 'react';
import api from '../../utils/api';

function buildMonths() {
  var list = [];
  for (var i = 0; i < 12; i++) {
    var d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    list.push({
      value: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'),
      label: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    });
  }
  return list;
}

var MONTHS = buildMonths();

export default function MonthlyReportPanel(props) {
  var clientId = props.clientId;
  var clientName = props.clientName;

  var [selectedMonth, setSelectedMonth] = useState(MONTHS[0].value);
  var [generating, setGenerating] = useState(false);
  var [loadingServices, setLoadingServices] = useState(false);
  var [servicesChange, setServicesChange] = useState(null);

  var selectedLabel = MONTHS.find(function(m) { return m.value === selectedMonth; })?.label || MONTHS[0].label;

  var handleMonthChange = function(e) {
    setSelectedMonth(e.target.value);
  };

  var loadServicesChange = function() {
    setLoadingServices(true);
    api.get('/aws/services-change/' + clientId)
      .then(function(r) { setServicesChange(r.data); })
      .catch(function() { setServicesChange({ hasData: false, message: 'Could not fetch service changes. Ensure Cost Explorer access (ce:GetCostAndUsage permission).' }); })
      .finally(function() { setLoadingServices(false); });
  };

  var generateReport = function() {
    setGenerating(true);
    api.get('/activity?clientId=' + clientId + '&limit=200')
      .then(function(r) { buildAndDownload(r.data || [], servicesChange, selectedLabel); })
      .catch(function() { buildAndDownload([], null, selectedLabel); })
      .finally(function() { setGenerating(false); });
  };

  var buildAndDownload = function(activities, svc, monthLabel) {
    var secActs = activities.filter(function(a) { return a.category === 'security'; });
    var costActs = activities.filter(function(a) { return a.category === 'cost'; });
    var patchActs = activities.filter(function(a) { return a.category === 'patching'; });
    var noteActs = activities.filter(function(a) { return a.category === 'note'; });

    var actRows = activities.slice(0, 30).map(function(a) {
      return '<tr><td>' + new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + '</td>'
        + '<td><span class="cat cat-' + a.category + '">' + a.category + '</span></td>'
        + '<td>' + (a.action || '') + '</td>'
        + '<td>' + (a.details || '') + '</td>'
        + '<td>' + (a.performedByName || a.performedBy || 'System') + '</td></tr>';
    }).join('');

    var svcRows = '';
    if (svc && svc.hasData) {
      (svc.added || []).forEach(function(s) { svcRows += '<tr><td>' + s.service + '</td><td class="green">✅ NEW this month</td><td>' + s.cost + '</td></tr>'; });
      (svc.removed || []).forEach(function(s) { svcRows += '<tr><td>' + s.service + '</td><td class="red">❌ REMOVED this month</td><td>' + s.lastCost + ' (was)</td></tr>'; });
      (svc.increased || []).forEach(function(s) { svcRows += '<tr><td>' + s.service + '</td><td class="orange">⬆️ COST INCREASED</td><td>' + s.currentCost + ' (was ' + s.lastCost + ', +' + s.change + ')</td></tr>'; });
    }

    var css = '*{margin:0;padding:0;box-sizing:border-box}body{font-family:Segoe UI,Arial,sans-serif;background:#f8fafc;color:#1e293b;padding:30px}'
      + '.header{background:linear-gradient(135deg,#1e40af,#0891b2);color:white;padding:28px;border-radius:12px;margin-bottom:24px}'
      + '.header h1{font-size:24px;margin-bottom:4px}.header p{opacity:.85;font-size:13px;margin-top:4px}'
      + '.section{margin-bottom:28px}.section-title{font-size:16px;font-weight:700;color:#1e293b;padding-bottom:8px;border-bottom:2px solid #e2e8f0;margin-bottom:14px}'
      + 'table{width:100%;border-collapse:collapse;background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);margin-bottom:14px}'
      + 'th{background:#1e40af;color:white;padding:10px 14px;text-align:left;font-size:12px}td{padding:9px 14px;border-bottom:1px solid #f1f5f9;font-size:13px}'
      + '.cat{padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}'
      + '.cat-security{background:#fef2f2;color:#dc2626}.cat-cost{background:#fffbeb;color:#d97706}.cat-patching{background:#f0fdf4;color:#16a34a}'
      + '.cat-note{background:#eff6ff;color:#2563eb}.cat-credentials{background:#f5f3ff;color:#7c3aed}.cat-ssl{background:#ecfdf5;color:#059669}'
      + '.cat-client{background:#fff7ed;color:#c2410c}.cat-alert{background:#fef2f2;color:#dc2626}'
      + '.green{color:#16a34a;font-weight:700}.red{color:#dc2626;font-weight:700}.orange{color:#d97706;font-weight:700}'
      + '.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}'
      + '.summary-card{background:white;border-radius:10px;padding:18px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.06)}'
      + '.summary-card .value{font-size:32px;font-weight:800}.summary-card .label{font-size:12px;color:#64748b;margin-top:4px}'
      + '.footer{text-align:center;margin-top:30px;padding:20px;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0}';

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Monthly Report - ' + clientName + ' - ' + monthLabel + '</title><style>' + css + '</style></head><body>';
    html += '<div class="header"><h1>Monthly Operations Report — ' + monthLabel + '</h1>';
    html += '<p>Client: <strong>' + clientName + '</strong> | Team Cronos | ShellKode Technologies</p>';
    html += '<p>Generated: ' + new Date().toLocaleString('en-IN') + '</p></div>';

    // Summary cards
    html += '<div class="summary-grid">';
    html += '<div class="summary-card"><div class="value" style="color:#2563eb">' + secActs.length + '</div><div class="label">Security Scans</div></div>';
    html += '<div class="summary-card"><div class="value" style="color:#d97706">' + costActs.length + '</div><div class="label">Cost Reviews</div></div>';
    html += '<div class="summary-card"><div class="value" style="color:#16a34a">' + patchActs.length + '</div><div class="label">Patch Cycles</div></div>';
    html += '<div class="summary-card"><div class="value" style="color:#7c3aed">' + noteActs.length + '</div><div class="label">Notes/Updates</div></div>';
    html += '</div>';

    // AWS Service Changes
    if (svcRows) {
      html += '<div class="section"><div class="section-title">☁️ AWS Service Changes — ' + monthLabel + '</div>';
      html += '<table><thead><tr><th>Service</th><th>Change</th><th>Cost Impact</th></tr></thead><tbody>' + svcRows + '</tbody></table></div>';
    }

    // Activity log
    html += '<div class="section"><div class="section-title">📋 All Actions This Month (' + activities.length + ' total)</div>';
    if (activities.length > 0) {
      html += '<table><thead><tr><th>Date</th><th>Category</th><th>Action</th><th>Details</th><th>By</th></tr></thead><tbody>' + actRows + '</tbody></table>';
    } else {
      html += '<p style="color:#64748b;padding:16px;background:white;border-radius:8px;margin-top:8px">No activity recorded for this period. Actions are logged when you run scans, save credentials, or add notes.</p>';
    }
    html += '</div>';

    // Summary table
    html += '<div class="section"><div class="section-title">📊 Activity Summary</div>';
    html += '<table><thead><tr><th>Activity Type</th><th>Count</th><th>Status</th></tr></thead><tbody>';
    html += '<tr><td>Security Audits</td><td>' + secActs.length + '</td><td>' + (secActs.length > 0 ? '✅ Done' : '⚠️ Not done') + '</td></tr>';
    html += '<tr><td>Cost Analysis</td><td>' + costActs.length + '</td><td>' + (costActs.length > 0 ? '✅ Done' : '⚠️ Not done') + '</td></tr>';
    html += '<tr><td>EC2 Patching</td><td>' + patchActs.length + '</td><td>' + (patchActs.length > 0 ? '✅ Done' : '⚠️ Not done') + '</td></tr>';
    html += '<tr><td>Notes & Updates</td><td>' + noteActs.length + '</td><td>' + (noteActs.length > 0 ? '✅ Recorded' : 'None') + '</td></tr>';
    html += '</tbody></table></div>';

    html += '<div class="footer">ShellKode MSP Portal · Team Cronos · ' + monthLabel + ' · ' + clientName + ' · Confidential</div></body></html>';

    var b = new Blob([html], { type: 'text/html' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'Monthly_Report_' + clientName.replace(/\s+/g, '_') + '_' + selectedMonth + '.html';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>📄 Monthly Reports</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>Select a month and download a complete HTML report with all activities, AWS changes, and actions performed</p>
      </div>

      {/* Generate */}
      <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h3 style={{ color: '#f0f4ff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📅 Select Month & Download</h3>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ flex: '0 0 260px' }}>
            <label style={{ display: 'block', color: '#8a9bc5', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              style={{ width: '100%', padding: '11px 14px', background: '#0d1424', border: '1px solid #3b82f6', borderRadius: 10, color: '#f0f4ff', fontSize: 14, outline: 'none', cursor: 'pointer', appearance: 'auto' }}>
              {MONTHS.map(function(m) {
                return <option key={m.value} value={m.value}>{m.label}</option>;
              })}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ color: '#4a5878', fontSize: 12, marginBottom: 4 }}>Selected month:</div>
            <div style={{ color: '#60a5fa', fontSize: 16, fontWeight: 700 }}>{selectedLabel}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 18 }}>
          {['✅ All Actions Performed', '✅ Security Audit Summary', '✅ AWS Cost Analysis', '✅ Services Added/Removed', '✅ Patching Status', '✅ Notes & Updates', '✅ Activity Timeline', '✅ Credential Changes'].map(function(item, i) {
            return <div key={i} style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: 8, padding: '8px 12px', color: '#94a3b8', fontSize: 12 }}>{item}</div>;
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={generateReport} disabled={generating}
            style={{ padding: '11px 28px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: generating ? 0.7 : 1 }}>
            {generating ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</> : '📄 Download HTML Report — ' + selectedLabel}
          </button>
        </div>
      </div>

      {/* AWS Service Changes */}
      <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h3 style={{ color: '#f0f4ff', fontSize: 15, fontWeight: 600, marginBottom: 3 }}>☁️ AWS Service Changes</h3>
            <p style={{ color: '#4a5878', fontSize: 12 }}>Services added, removed, or increased this month vs last month — from AWS Cost Explorer</p>
          </div>
          <button onClick={loadServicesChange} disabled={loadingServices}
            style={{ padding: '8px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 9, color: '#60a5fa', fontSize: 13, cursor: 'pointer', opacity: loadingServices ? 0.7 : 1 }}>
            {loadingServices ? '🔄 Loading...' : '🔄 Fetch from AWS'}
          </button>
        </div>

        {!servicesChange && !loadingServices && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#4a5878', fontSize: 13, background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
            Click "Fetch from AWS" to see which AWS services were added, removed, or had cost increases this month vs last month
          </div>
        )}

        {loadingServices && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 24, color: '#8a9bc5', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
            Fetching service data from AWS Cost Explorer...
          </div>
        )}

        {servicesChange && !servicesChange.hasData && (
          <div style={{ padding: 20, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, color: '#fbbf24', fontSize: 13 }}>
            ⚠️ {servicesChange.message || 'No service change data available'}
          </div>
        )}

        {servicesChange && servicesChange.hasData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ color: '#4a5878', fontSize: 12 }}>
              Comparing <strong style={{ color: '#60a5fa' }}>{servicesChange.thisMonth}</strong> vs <strong style={{ color: '#8b5cf6' }}>{servicesChange.lastMonth}</strong>
            </div>

            {(servicesChange.added || []).length > 0 && (
              <div>
                <div style={{ color: '#10b981', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>✅ New Services This Month ({servicesChange.added.length})</div>
                {servicesChange.added.map(function(s, i) {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, marginBottom: 6 }}>
                      <div style={{ color: '#e2e8f0', fontSize: 13 }}>{s.service}</div>
                      <div style={{ color: '#10b981', fontSize: 13, fontWeight: 700 }}>{s.cost} <span style={{ color: '#4a5878', fontSize: 11, fontWeight: 400 }}>this month</span></div>
                    </div>
                  );
                })}
              </div>
            )}

            {(servicesChange.removed || []).length > 0 && (
              <div>
                <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>❌ Services Removed This Month ({servicesChange.removed.length})</div>
                {servicesChange.removed.map(function(s, i) {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, marginBottom: 6 }}>
                      <div style={{ color: '#e2e8f0', fontSize: 13 }}>{s.service}</div>
                      <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 700 }}>{s.lastCost} <span style={{ color: '#4a5878', fontSize: 11, fontWeight: 400 }}>last month</span></div>
                    </div>
                  );
                })}
              </div>
            )}

            {(servicesChange.increased || []).length > 0 && (
              <div>
                <div style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>⬆️ Significant Cost Increases ({servicesChange.increased.length})</div>
                {servicesChange.increased.map(function(s, i) {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, marginBottom: 6 }}>
                      <div>
                        <div style={{ color: '#e2e8f0', fontSize: 13 }}>{s.service}</div>
                        <div style={{ color: '#4a5878', fontSize: 11, marginTop: 2 }}>Was {s.lastCost} → Now {s.currentCost}</div>
                      </div>
                      <div style={{ color: '#f59e0b', fontSize: 14, fontWeight: 700 }}>+{s.change}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {(servicesChange.added || []).length === 0 && (servicesChange.removed || []).length === 0 && (servicesChange.increased || []).length === 0 && (
              <div style={{ padding: 16, background: 'rgba(16,185,129,0.05)', borderRadius: 10, color: '#10b981', fontSize: 13 }}>
                ✅ No significant service changes detected — costs are stable this month
              </div>
            )}
          </div>
        )}
      </div>

      {/* Previous reports */}
      <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: '1px solid #1a2540', color: '#8a9bc5', fontSize: 13, fontWeight: 600 }}>📁 Quick Download — Previous Months</div>
        {MONTHS.map(function(m, i) {
          return (
            <div key={m.value} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: i < MONTHS.length - 1 ? '1px solid #1a2540' : 'none', transition: 'background 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📄</span>
                <span style={{ color: '#e2e8f0', fontSize: 13 }}>{m.label} — {clientName}</span>
              </div>
              <button
                onClick={function() {
                  setSelectedMonth(m.value);
                  setTimeout(function() { generateReport(); }, 50);
                }}
                style={{ padding: '6px 14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, color: '#60a5fa', fontSize: 12, cursor: 'pointer' }}>
                Download
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
