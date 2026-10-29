import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, ArrowUpRight, BookOpen, Building2, GraduationCap, Plus, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import API, { getApiErrorMessage } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { CollegeMetric, CollegePanel, CollegeError } from '../../components/college/CollegeUI';
import '../../styles/super-admin.css';

const actions = [
  ['College management', 'Create institutions and manage their workspace access.', '/admin/colleges', Building2],
  ['College administrators', 'Connect the right administrators to each institution.', '/admin/college-admins', ShieldCheck],
  ['People & access', 'Review members, roles and account permissions.', '/admin/users', Users],
  ['Audit trail', 'Review administrative activity and security events.', '/admin/audit-logs', Activity],
];

export default function SuperAdminOverview() {
  const { user, activeCollege } = useContext(AuthContext);
  const [state, setState] = useState({ colleges: [], users: [], userCount: 0, analytics: null, loading: true, error: '' });
  const latest = useRef(0);
  const reload = useCallback(async () => {
    const requestId = ++latest.current;
    setState(previous => ({ ...previous, loading: true, error: '' }));
    try {
      const [colleges, users, analytics] = await Promise.all([API.get('/colleges'), API.get('/admin/users?limit=6'), API.get('/admin/analytics')]);
      if (requestId !== latest.current) return;
      setState({ colleges: colleges.data.colleges || [], users: users.data.users || [], userCount: users.data.count || 0, analytics: analytics.data.analytics, loading: false, error: '' });
    } catch (error) {
      if (requestId !== latest.current) return;
      setState(previous => ({ ...previous, loading: false, error: getApiErrorMessage(error, 'Unable to load the administrator overview.') }));
    }
  }, [activeCollege?._id]);
  useEffect(() => { reload(); return () => { latest.current += 1; }; }, [reload]);
  const { colleges, users, userCount, analytics, loading, error } = state;
  const activeColleges = colleges.filter(college => college.isActive).length;
  const a = analytics || {};
  const scope = a.college?.name || 'Across the platform';
  const available = !loading && !error;
  const passRate = Math.min(100, Math.max(0, Math.round(a.passPercentage || 0)));
  const averageScore = Math.min(100, Math.max(0, Math.round(a.averagePercentage || 0)));

  return <div className="workspace-page sa-dashboard">
    <div className="sa-toolbar"><div><span className="ca-eyebrow">ADMINISTRATION / OVERVIEW</span><p>Welcome back, {user?.name?.split(' ')[0] || 'Administrator'}.</p></div><button className="btn btn-outline-secondary" onClick={reload} disabled={loading}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh overview</button></div>
    <section className="ca-hero">
      <div className="ca-hero-copy"><span className="ca-eyebrow"><ShieldCheck size={14} /> SUPER ADMIN WORKSPACE</span><h1>One platform.<br /><span>Every institution.</span></h1><p>Keep your colleges, administrators and assessment operations connected, from one place.</p><Link className="ca-hero-button" to="/admin/colleges"><Plus size={17} /> Manage colleges <ArrowUpRight size={17} /></Link></div>
      <div className="ca-institution"><span className="ca-institution-icon"><Building2 size={34} strokeWidth={1.3} /></span><span className="ca-eyebrow">YOUR INSTITUTION NETWORK</span><h2>{available ? colleges.length : '—'} <small>registered {colleges.length === 1 ? 'college' : 'colleges'}</small></h2><div className="ca-institution-foot"><span>{available ? `${activeColleges} active` : 'Loading institutions'}</span><span>{available ? `${colleges.length - activeColleges} inactive` : 'Please wait'}</span></div></div>
    </section>
    {error && <CollegeError message={error} retry={reload} />}
    <div className="ca-metric-grid" aria-busy={loading}>
      <CollegeMetric icon={Building2} label="Colleges" note="Your institution network" value={available ? colleges.length : null} tone="violet" />
      <CollegeMetric icon={GraduationCap} label="Registered students" note="Current reporting scope" value={available ? a.totalStudents : null} />
      <CollegeMetric icon={Users} label="Faculty members" note="Current reporting scope" value={available ? a.totalFaculty : null} tone="blue" />
      <CollegeMetric icon={BookOpen} label="Assessments" note="Current reporting scope" value={available ? a.totalExams : null} tone="amber" />
    </div>
    <div className="sa-scope"><span className="ca-live-dot" /><span>People and assessment statistics: <strong>{scope}</strong></span></div>
    <div className="ca-dashboard-grid">
      <CollegePanel title="Run the essentials" description="A direct path to your most important tasks."><div className="ca-action-grid">{actions.map(([title, description, to, Icon], index) => <Link key={to} className="ca-action" to={to}><span className="ca-action-index">0{index + 1}</span><span className="ca-icon"><Icon size={22} /></span><h3>{title}</h3><p>{description}</p><ArrowUpRight size={19} className="ca-action-arrow" /></Link>)}</div></CollegePanel>
      <CollegePanel title="Assessment pulse" description="Participation and outcomes in the reporting scope.">
        <div className="ca-score"><span>Average score</span><strong>{available ? averageScore : '—'}<small>%</small></strong></div>
        <div className="ca-progress" role="progressbar" aria-label="Average score" aria-valuenow={averageScore} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${available ? averageScore : 0}%` }} /></div>
        <div className="ca-pulse-row"><span>Evaluated attempts</span><strong>{available ? a.totalAttempts || 0 : '—'}</strong></div>
        <div className="ca-pulse-row"><span>Pass rate</span><strong>{available ? `${passRate}%` : '—'}</strong></div>
        <div className="ca-pulse-row"><span>Registered people</span><strong>{available ? userCount : '—'}</strong></div>
        <Link to="/admin/analytics" className="ca-text-link">Explore analytics <ArrowRight size={16} /></Link>
      </CollegePanel>
    </div>
    <CollegePanel title="Your colleges" description="The latest institutions in your network." action={<Link to="/admin/colleges" className="ca-text-link">View all colleges <ArrowRight size={16} /></Link>}>
      {loading ? <div className="ca-loading" role="status"><span className="spinner-border spinner-border-sm" /> Loading institutions…</div> : error ? <p className="text-secondary small">Institution details are unavailable. Use Try again above to reload.</p> : !colleges.length ? <div className="sa-empty-network"><span className="ca-icon"><Building2 size={25} /></span><div><h3>A new network starts with one college.</h3><p>Add your first institution, then appoint a college administrator.</p></div><Link to="/admin/colleges" className="btn btn-primary"><Plus size={16} /> Add a college</Link></div> : <div className="table-responsive sa-college-table"><table className="table align-middle mb-0"><thead><tr><th>Institution</th><th>College code</th><th>Administrators</th><th>Status</th><th><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{colleges.slice(0, 5).map(college => <tr key={college._id}><td><div className="sa-college-name"><span className="ca-avatar"><Building2 size={18} /></span><div><strong>{college.name}</strong><span>{college.domain || college.contactEmail || 'Institution workspace'}</span></div></div></td><td><span className="ca-tag">{college.code}</span></td><td>{college.admins?.length || 0} assigned</td><td><span className={`sa-status ${college.isActive ? 'is-active' : ''}`}><span />{college.isActive ? 'Active' : 'Inactive'}</span></td><td><Link to="/admin/colleges" aria-label={`Manage ${college.name}`} className="sa-row-link"><ArrowUpRight size={18} /></Link></td></tr>)}</tbody></table></div>}
    </CollegePanel>
    <CollegePanel title="Recently joined" description={`Latest members · ${scope}`} action={<Link to="/admin/users" className="ca-text-link">View people <ArrowRight size={16} /></Link>}>
      {loading ? <div className="ca-loading" role="status">Loading members…</div> : error ? <p className="text-secondary small">Member details are unavailable.</p> : !users.length ? <div className="ca-empty"><Users size={27} /><h3>Your community is ready to grow</h3><p>Registered members will appear here.</p></div> : <div className="ca-member-grid">{users.map(person => <div className="ca-member" key={person._id}><span className="ca-avatar">{person.name?.slice(0, 2).toUpperCase()}</span><div><strong>{person.name}</strong><span>{person.email}</span></div><span className="ca-tag">{person.role === 'admin' ? 'Super Admin' : person.role?.replace('_', ' ')}</span></div>)}</div>}
    </CollegePanel>
  </div>;
}
