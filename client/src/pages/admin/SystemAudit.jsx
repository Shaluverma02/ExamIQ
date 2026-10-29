import React, { useContext, useEffect, useState } from 'react';
import { Activity, Clock, Download, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react';
import API, { getApiErrorMessage } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import { CollegeMetric, CollegeError } from '../../components/college/CollegeUI';
import { downloadCSV } from '../../utils/exportCSV';
import '../../styles/super-admin.css';
import '../../styles/college-management-modern.css';

export default function SystemAudit() {
  const { activeCollege, role: workspaceRole } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try { const response = await API.get('/admin/audit-logs'); setLogs(response.data.logs || []); }
    catch (e) { setError(getApiErrorMessage(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [activeCollege?._id]);
  const filtered = logs.filter(log => (!role || (log.role || log.userId?.role) === role) && [log.userId?.name, log.userId?.email, log.action, log.resource, log.ipAddress].some(value => String(value || '').toLowerCase().includes(search.trim().toLowerCase())));
  const roles = [...new Set(logs.map(log => log.role || log.userId?.role).filter(Boolean))];
  const ready = !loading && !error;
  const exportLogs = () => downloadCSV(filtered.map(log => ({ Time: new Date(log.createdAt).toISOString(), User: log.userId?.name || 'System', Role: log.role || log.userId?.role || '', Action: log.action, Resource: log.resource, IP: log.ipAddress || '' })), 'audit-events.csv');
  return <div className={workspaceRole === 'admin' ? 'workspace-page sa-dashboard' : 'workspace-page'}><PageHeader icon={ShieldCheck} eyebrow="SECURITY & ACCOUNTABILITY" title="Audit trail" description={'Review the latest recorded activity · ' + (activeCollege?.name || 'Across the platform')} actions={<><button className="btn btn-outline-secondary" onClick={load} disabled={loading}><RefreshCw size={15} /> Refresh</button><button className="btn btn-primary" onClick={exportLogs} disabled={loading || !!error || !filtered.length}><Download size={15} /> Export events</button></>} />
    {error && <CollegeError message={error} retry={load} />}
    <div className="ca-metric-grid"><CollegeMetric icon={Activity} label="Recent events" note="Latest 100 records" value={ready ? logs.length : null} tone="violet" /><CollegeMetric icon={Users} label="Recorded people" note="In the loaded history" value={ready ? new Set(logs.map(log => log.userId?._id).filter(Boolean)).size : null} /><CollegeMetric icon={ShieldCheck} label="Action types" note="In the loaded history" value={ready ? new Set(logs.map(log => log.action).filter(Boolean)).size : null} tone="blue" /><CollegeMetric icon={Clock} label="Last 24 hours" note="In the loaded history" value={ready ? logs.filter(log => Date.now() - new Date(log.createdAt).getTime() < 86400000).length : null} tone="amber" /></div>
    <section className="cm-directory"><div className="cm-directory-top"><div><h2>Activity history</h2><p>A traceable record of access and administrative actions.</p></div><span className="ca-tag">{filtered.length} visible events</span></div><div className="cm-filter-bar"><div className="cm-search"><Search size={18} /><input aria-label="Search audit events" placeholder="Search people, actions, resources or IP addresses…" value={search} onChange={e => setSearch(e.target.value)} /></div><label className="cm-status-filter"><span className="visually-hidden">Filter events by role</span><select value={role} onChange={e => setRole(e.target.value)}><option value="">All roles</option>{roles.map(value => <option key={value} value={value}>{value === 'admin' ? 'Super Admin' : value.replace('_', ' ')}</option>)}</select></label></div>
      {loading ? <div className="ca-loading" role="status">Retrieving audit events…</div> : error ? <div className="ca-empty"><p>Use Try again above to reload events.</p></div> : !filtered.length ? <div className="ca-empty"><ShieldCheck size={32} /><h3>{logs.length ? 'No events match your filters' : 'Your activity history starts here.'}</h3><p>Recorded actions will appear here as people work in the system.</p></div> : <div className="table-responsive sa-college-table sa-audit-table"><table className="table align-middle mb-0"><thead><tr><th>Person</th><th>Action</th><th>Resource</th><th>IP address</th><th>Recorded at</th></tr></thead><tbody>{filtered.map(log => <tr key={log._id}><td><div className="sa-college-name"><span className="ca-avatar"><Activity size={16} /></span><div><strong>{log.userId?.name || 'System / Anonymous'}</strong><span>{(log.role || log.userId?.role || 'system').replace('_', ' ')}</span></div></div></td><td><span className="sa-event-action">{log.action}</span></td><td><span className="ca-tag">{log.resource || 'Not recorded'}</span></td><td className="font-monospace">{log.ipAddress || 'Not recorded'}</td><td className="text-nowrap">{new Date(log.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
