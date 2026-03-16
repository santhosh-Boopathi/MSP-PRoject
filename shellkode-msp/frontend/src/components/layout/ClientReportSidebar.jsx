import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

var TASK_ICONS = { patching: '🔧', security_audit: '🛡️', cost_report: '💰', monthly_report: '📄', ssl_renewal: '🔒', ri_renewal: '💻', vulnerability_scan: '🔍', backup_check: '💾', custom: '📌' };
var STATUS_COLORS = { pending: '#f59e0b', in_progress: '#3b82f6', completed: '#10b981', overdue: '#ef4444' };
var PRIORITY_COLORS = { low: '#4a5878', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };

export default function ClientReportSidebar(props) {
  var isOpen = props.isOpen; var onClose = props.onClose;
  var [clients, setClients] = useState([]);
  var [tasks, setTasks] = useState({});
  var [loading, setLoading] = useState(true);
  var [selectedClient, setSelectedClient] = useState(null);
  var [showAddTask, setShowAddTask] = useState(null);
  var navigate = useNavigate();

  useEffect(function() {
    if (!isOpen) return;
    setLoading(true);
    api.get('/clients?team=Cronos')
      .then(function(r) {
        setClients(r.data);
        // Fetch tasks for each client
        var promises = r.data.map(function(c) {
          return api.get('/clients/' + c._id + '/tasks').then(function(tr) { return { id: c._id, tasks: tr.data }; }).catch(function() { return { id: c._id, tasks: [] }; });
        });
        return Promise.all(promises);
      })
      .then(function(results) {
        var taskMap = {};
        results.forEach(function(r) { taskMap[r.id] = r.tasks; });
        setTasks(taskMap);
      })
      .catch(function() {})
      .finally(function() { setLoading(false); });
  }, [isOpen]);

  var getClientStatus = function(clientTasks) {
    if (!clientTasks || clientTasks.length === 0) return 'no_tasks';
    if (clientTasks.some(function(t) { return t.status === 'overdue'; })) return 'overdue';
    if (clientTasks.some(function(t) { return t.status === 'pending' && t.priority === 'critical'; })) return 'critical';
    if (clientTasks.some(function(t) { return t.status === 'pending'; })) return 'pending';
    return 'all_done';
  };

  var getClientStatusColor = function(s) {
    return { overdue: '#ef4444', critical: '#f97316', pending: '#f59e0b', all_done: '#10b981', no_tasks: '#4a5878' }[s] || '#4a5878';
  };

  var handleMarkDone = function(clientId, taskId) {
    api.put('/clients/' + clientId + '/tasks/' + taskId, { status: 'completed', completedAt: new Date().toISOString() })
      .then(function() {
        setTasks(function(prev) {
          var updated = { ...prev };
          updated[clientId] = (updated[clientId] || []).map(function(t) { return t._id === taskId ? { ...t, status: 'completed' } : t; });
          return updated;
        });
      }).catch(function() {});
  };

  if (!isOpen) return null;

  return (
    <div style={st.overlay} onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={st.panel}>
        {/* Header */}
        <div style={st.header}>
          <div>
            <h2 style={st.title}>📋 Client Report Status</h2>
            <p style={st.sub}>Pending tasks & action items for all Cronos clients</p>
          </div>
          <button onClick={onClose} style={st.closeBtn}>✕</button>
        </div>

        {/* Summary strip */}
        {!loading && (
          <div style={st.summaryStrip}>
            {[
              { label: 'Total Clients', value: clients.length, color: '#3b82f6' },
              { label: 'Overdue', value: clients.filter(function(c) { return getClientStatus(tasks[c._id]) === 'overdue'; }).length, color: '#ef4444' },
              { label: 'Pending', value: clients.filter(function(c) { var s = getClientStatus(tasks[c._id]); return s === 'pending' || s === 'critical'; }).length, color: '#f59e0b' },
              { label: 'All Done', value: clients.filter(function(c) { return getClientStatus(tasks[c._id]) === 'all_done'; }).length, color: '#10b981' },
            ].map(function(s, i) {
              return <div key={i} style={st.summaryItem}><div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div><div style={{ fontSize: 10, color: '#4a5878', marginTop: 2 }}>{s.label}</div></div>;
            })}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flexDirection: 'column', gap: 12 }}>
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <span style={{ color: '#4a5878', fontSize: 13 }}>Loading client tasks...</span>
          </div>
        ) : (
          <div style={st.clientList}>
            {clients.map(function(client) {
              var clientTasks = tasks[client._id] || [];
              var status = getClientStatus(clientTasks);
              var statusColor = getClientStatusColor(status);
              var pendingTasks = clientTasks.filter(function(t) { return t.status !== 'completed'; });
              var isExpanded = selectedClient === client._id;

              return (
                <div key={client._id} style={st.clientRow}>
                  {/* Client header */}
                  <div onClick={function() { setSelectedClient(isExpanded ? null : client._id); }} style={st.clientHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: statusColor + '18', border: '1px solid ' + statusColor + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: statusColor, flexShrink: 0 }}>
                        {client.name.slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{client.name}</div>
                        <div style={{ color: '#4a5878', fontSize: 10, marginTop: 1 }}>
                          {pendingTasks.length === 0 ? '✅ All done' : pendingTasks.length + ' task' + (pendingTasks.length > 1 ? 's' : '') + ' pending'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: statusColor + '18', color: statusColor, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                        {status === 'all_done' ? 'Done' : status === 'no_tasks' ? 'No Tasks' : status}
                      </span>
                      <span style={{ color: '#4a5878', fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Expanded task list */}
                  {isExpanded && (
                    <div style={st.taskList}>
                      {clientTasks.length === 0 ? (
                        <div style={{ padding: '14px 16px', color: '#4a5878', fontSize: 12, textAlign: 'center' }}>
                          No tasks yet.
                          <button onClick={function() { setShowAddTask(client._id); }} style={{ marginLeft: 8, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>+ Add Task</button>
                        </div>
                      ) : (
                        <>
                          {clientTasks.map(function(task) {
                            var sColor = STATUS_COLORS[task.status] || '#4a5878';
                            var pColor = PRIORITY_COLORS[task.priority] || '#4a5878';
                            return (
                              <div key={task._id} style={st.taskRow}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{TASK_ICONS[task.taskType] || '📌'}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ color: task.status === 'completed' ? '#4a5878' : '#e2e8f0', fontSize: 12, fontWeight: 500, textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>{task.title}</div>
                                    {task.description && <div style={{ color: '#4a5878', fontSize: 11, marginTop: 2 }}>{task.description}</div>}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                      <span style={{ background: sColor + '18', color: sColor, borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>{task.status.toUpperCase()}</span>
                                      <span style={{ background: pColor + '18', color: pColor, borderRadius: 4, padding: '1px 6px', fontSize: 9 }}>{task.priority}</span>
                                      {task.dueDate && <span style={{ color: new Date(task.dueDate) < new Date() ? '#ef4444' : '#4a5878', fontSize: 10 }}>Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>}
                                      {task.assignedToName && <span style={{ color: '#4a5878', fontSize: 10 }}>@{task.assignedToName.split(' ')[0]}</span>}
                                    </div>
                                  </div>
                                  {task.status !== 'completed' && (
                                    <button onClick={function() { handleMarkDone(client._id, task._id); }}
                                      style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 6, color: '#10b981', fontSize: 10, cursor: 'pointer', padding: '3px 8px', flexShrink: 0 }}>
                                      ✓ Done
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          <div style={{ padding: '8px 12px', borderTop: '1px solid #1a2540', display: 'flex', gap: 8 }}>
                            <button onClick={function() { setShowAddTask(client._id); }}
                              style={{ flex: 1, padding: '6px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 7, color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>
                              + Add Task
                            </button>
                            <button onClick={function() { navigate('/msp/cronos/clients/' + client._id); onClose(); }}
                              style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2d47', borderRadius: 7, color: '#8a9bc5', fontSize: 11, cursor: 'pointer' }}>
                              Open Client →
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddTask && (
        <AddTaskModal clientId={showAddTask} clientName={clients.find(function(c) { return c._id === showAddTask; })?.name}
          onClose={function() { setShowAddTask(null); }}
          onSaved={function(task) {
            setTasks(function(prev) {
              var updated = { ...prev };
              updated[showAddTask] = [...(updated[showAddTask] || []), task];
              return updated;
            });
            setShowAddTask(null);
          }} />
      )}
    </div>
  );
}

function AddTaskModal(props) {
  var clientId = props.clientId; var clientName = props.clientName; var onClose = props.onClose; var onSaved = props.onSaved;
  var [form, setForm] = useState({ taskType: 'patching', title: '', description: '', priority: 'medium', dueDate: '', frequencyDays: '', assignedTo: '', assignedToName: '', notes: '' });
  var [saving, setSaving] = useState(false);

  var TASK_TYPES = [{ v: 'patching', l: '🔧 EC2 Patching' }, { v: 'security_audit', l: '🛡️ Security Audit' }, { v: 'cost_report', l: '💰 Cost Report' }, { v: 'monthly_report', l: '📄 Monthly Report' }, { v: 'ssl_renewal', l: '🔒 SSL Renewal' }, { v: 'ri_renewal', l: '💻 RI Renewal' }, { v: 'vulnerability_scan', l: '🔍 Vulnerability Scan' }, { v: 'backup_check', l: '💾 Backup Check' }, { v: 'custom', l: '📌 Custom Task' }];
  var MEMBERS = [{ v: 'raghul.sasikumar@shellkode.com', l: 'Raghul' }, { v: 'santhosh.b@shellkode.com', l: 'Santhosh' }, { v: 'surya.krishna@shellkode.com', l: 'Surya' }, { v: 'gokul.a@shellkode.com', l: 'Gokul' }, { v: 'hemanath.u@shellkode.com', l: 'Hemanath' }, { v: 'pradeep.p@shellkode.com', l: 'Pradeep' }];

  var update = function(k, v) { setForm(function(f) { return { ...f, [k]: v }; }); };

  // Auto-fill title when task type changes
  var handleTypeChange = function(t) {
    var labels = { patching: 'Quarterly EC2 Patching', security_audit: 'Security Audit & Report', cost_report: 'Monthly Cost Report', monthly_report: 'Monthly Report Generation', ssl_renewal: 'SSL Certificate Renewal', ri_renewal: 'Reserved Instance Renewal', vulnerability_scan: 'Vulnerability Assessment', backup_check: 'Backup Verification Check' };
    setForm(function(f) { return { ...f, taskType: t, title: labels[t] || f.title }; });
  };

  var handleSave = function() {
    if (!form.title.trim()) return;
    setSaving(true);
    var memberName = MEMBERS.find(function(m) { return m.v === form.assignedTo; })?.l || '';
    api.post('/clients/' + clientId + '/tasks', { ...form, assignedToName: memberName, clientName: clientName })
      .then(function(r) { onSaved(r.data); })
      .catch(function() { setSaving(false); });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 18, width: '100%', maxWidth: 500, maxHeight: '88vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
          <div>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: '#f0f4ff' }}>Add Task</h3>
            <p style={{ color: '#4a5878', fontSize: 12, marginTop: 2 }}>{clientName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a5878', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={lbl}>Task Type</label>
            <select value={form.taskType} onChange={function(e) { handleTypeChange(e.target.value); }} style={sel}>
              {TASK_TYPES.map(function(t) { return <option key={t.v} value={t.v}>{t.l}</option>; })}
            </select>
          </div>
          <div>
            <label style={lbl}>Title *</label>
            <input value={form.title} onChange={function(e) { update('title', e.target.value); }} placeholder="Task title" style={inp} />
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea value={form.description} onChange={function(e) { update('description', e.target.value); }} placeholder="e.g. Patching due — last done 3 months ago" rows={2} style={{ ...inp, resize: 'vertical', fontFamily: "'Space Grotesk',sans-serif" }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Priority</label>
              <select value={form.priority} onChange={function(e) { update('priority', e.target.value); }} style={sel}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Assign To</label>
              <select value={form.assignedTo} onChange={function(e) { update('assignedTo', e.target.value); }} style={sel}>
                <option value="">Unassigned</option>
                {MEMBERS.map(function(m) { return <option key={m.v} value={m.v}>{m.l}</option>; })}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={function(e) { update('dueDate', e.target.value); }} style={inp} />
            </div>
            <div>
              <label style={lbl}>Last Done Date</label>
              <input type="date" value={form.lastDoneDate} onChange={function(e) { update('lastDoneDate', e.target.value); }} style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>Notes</label>
            <textarea value={form.notes} onChange={function(e) { update('notes', e.target.value); }} placeholder="e.g. Patching last done 3 months ago, initiate this month" rows={2} style={{ ...inp, resize: 'vertical', fontFamily: "'Space Grotesk',sans-serif" }} />
          </div>
        </div>
        <div style={{ padding: '12px 20px 20px', borderTop: '1px solid #1a2540', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2d47', borderRadius: 9, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{ padding: '9px 22px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Adding...' : '+ Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

var lbl = { display: 'block', color: '#8a9bc5', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 };
var inp = { width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2d47', borderRadius: 9, color: '#f0f4ff', fontSize: 13, outline: 'none' };
var sel = { ...inp, background: '#0d1424', cursor: 'pointer' };

var st = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' },
  panel: { width: 480, background: '#0d1424', borderLeft: '1px solid #1e2d47', display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)', animation: 'slideIn 0.3s ease', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 20px 14px', borderBottom: '1px solid #1a2540', flexShrink: 0 },
  title: { fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: '#f0f4ff', marginBottom: 2 },
  sub: { color: '#4a5878', fontSize: 12 },
  closeBtn: { background: 'none', border: 'none', color: '#4a5878', cursor: 'pointer', fontSize: 16, padding: 4 },
  summaryStrip: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid #1a2540', flexShrink: 0 },
  summaryItem: { padding: '12px', textAlign: 'center', borderRight: '1px solid #1a2540' },
  clientList: { flex: 1, overflowY: 'auto' },
  clientRow: { borderBottom: '1px solid #1a2540' },
  clientHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', transition: 'background 0.15s' },
  taskList: { background: 'rgba(0,0,0,0.15)' },
  taskRow: { padding: '10px 16px', borderBottom: '1px solid #1a2540' },
};
