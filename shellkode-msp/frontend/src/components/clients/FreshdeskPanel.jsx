import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../utils/api';

const STATUS_COLORS = {
  open: '#3b82f6', resolved: '#10b981', closed: '#4a5878',
  customer_action_pending: '#f59e0b', shellkode_action_pending: '#ef4444', pending: '#8b5cf6'
};

const STATUS_LABELS = {
  open: 'Open', resolved: 'Resolved', closed: 'Closed',
  customer_action_pending: 'Customer Action Pending', shellkode_action_pending: 'ShellKode Action Pending', pending: 'Pending'
};

export default function FreshdeskPanel({ clientId, clientName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/freshdesk/tickets')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>;
  if (!data) return null;

  const pieData = [
    { name: 'Open', value: data.summary.open, color: '#3b82f6' },
    { name: 'Resolved', value: data.summary.resolved, color: '#10b981' },
    { name: 'Closed', value: data.summary.closed, color: '#4a5878' },
    { name: 'Customer Pending', value: data.summary.customerActionPending, color: '#f59e0b' },
    { name: 'ShellKode Pending', value: data.summary.shellkodeActionPending, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const priorityColors = { Urgent: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#3b82f6' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>🎫 FreshDesk Tickets</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>Team Cronos · All clients · Live ticket status from FreshDesk</p>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} style={{ background: '#111827', border: `1px solid ${STATUS_COLORS[key]}33`, borderRadius: 12, padding: '16px 14px' }}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: STATUS_COLORS[key] }}>
              {data.summary[key === 'customer_action_pending' ? 'customerActionPending' : key === 'shellkode_action_pending' ? 'shellkodeActionPending' : key] ?? 0}
            </div>
            <div style={{ fontSize: 11, color: '#4a5878', marginTop: 4, lineHeight: 1.3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Status pie chart */}
        <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, padding: 20 }}>
          <div style={{ color: '#8a9bc5', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Ticket Status Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3} innerRadius={40}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 8, color: '#f0f4ff' }} />
              <Legend iconType="circle" formatter={(val) => <span style={{ color: '#8a9bc5', fontSize: 11 }}>{val}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly trend */}
        <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, padding: 20 }}>
          <div style={{ color: '#8a9bc5', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Weekly Ticket Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.trend}>
              <XAxis dataKey="week" tick={{ fill: '#4a5878', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4a5878', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 8, color: '#f0f4ff' }} />
              <Bar dataKey="opened" name="Opened" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="closed" name="Closed" fill="#4a5878" radius={[4, 4, 0, 0]} />
              <Legend formatter={(val) => <span style={{ color: '#8a9bc5', fontSize: 11 }}>{val}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* By Priority */}
      <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <div style={{ color: '#8a9bc5', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Tickets by Priority</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {data.byPriority.map((p, i) => (
            <div key={i} style={{ flex: 1, minWidth: 100, textAlign: 'center' }}>
              <div style={{ height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginBottom: 6 }}>
                <div style={{ background: priorityColors[p.priority] || '#3b82f6', borderRadius: '6px 6px 0 0', width: '100%', height: `${(p.count / Math.max(...data.byPriority.map(x => x.count))) * 70}px`, minHeight: 8, transition: 'height 0.5s ease' }} />
              </div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, color: priorityColors[p.priority] || '#3b82f6' }}>{p.count}</div>
              <div style={{ fontSize: 12, color: '#4a5878' }}>{p.priority}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-client table */}
      <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540', color: '#8a9bc5', fontSize: 13, fontWeight: 600 }}>
          Tickets by Client
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0d1424' }}>
              {['Client', 'Open', 'Resolved', 'Closed', 'Total'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#4a5878', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.byClient.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1a2540', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '10px 14px', color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{c.client}</td>
                <td style={{ padding: '10px 14px', color: '#3b82f6', fontWeight: 700 }}>{c.open}</td>
                <td style={{ padding: '10px 14px', color: '#10b981', fontWeight: 700 }}>{c.resolved}</td>
                <td style={{ padding: '10px 14px', color: '#4a5878' }}>{c.closed}</td>
                <td style={{ padding: '10px 14px', color: '#8a9bc5', fontWeight: 600 }}>{c.open + c.resolved + c.closed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent tickets */}
      <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540', color: '#8a9bc5', fontSize: 13, fontWeight: 600 }}>Recent Tickets</div>
        {data.recentTickets.map((t, i) => (
          <div key={i} style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#4a5878', flexShrink: 0 }}>{t.id}</span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{t.subject}</div>
              <div style={{ color: '#4a5878', fontSize: 11, marginTop: 2 }}>{t.client} · {t.assignee}</div>
            </div>
            <span className={`badge badge-${t.priority === 'Urgent' ? 'critical' : t.priority === 'High' ? 'high' : t.priority === 'Medium' ? 'medium' : 'low'}`} style={{ fontSize: 10 }}>
              {t.priority}
            </span>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
              background: STATUS_COLORS[t.status] + '22', color: STATUS_COLORS[t.status], border: `1px solid ${STATUS_COLORS[t.status]}44`
            }}>
              {STATUS_LABELS[t.status] || t.status}
            </span>
            <span style={{ color: '#4a5878', fontSize: 11, flexShrink: 0 }}>{t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
