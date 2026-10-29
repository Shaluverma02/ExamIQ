import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, Building2, GraduationCap, Layers, Users, BarChart3 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import useCollegeOverview from '../../hooks/useCollegeOverview';
import { CollegeMetric, CollegePanel, CollegeError, CollegeLoading } from '../../components/college/CollegeUI';

const actions = [
  ['People & access', 'Manage faculty, students and account access.', '/college-admin/users', Users],
  ['Groups & batches', 'Build rosters and organize your students.', '/college-admin/groups', Layers],
  ['Academic setup', 'Keep courses and subject categories connected.', '/college-admin/categories', BookOpen],
  ['Performance insights', 'Explore assessment participation and outcomes.', '/college-admin/analytics', BarChart3],
  ['Institution settings', 'Keep contact details and registration up to date.', '/college-admin/settings', Building2],
  ['College activity', 'Review recorded access and administrative actions.', '/college-admin/audit-logs', Layers],
];

export default function CollegeOverview() {
  const { user, activeCollege } = useContext(AuthContext);
  const { analytics, groups, users, loading, error, reload } = useCollegeOverview();
  const a = analytics || {};
  return <div className="workspace-page ca-overview">
    <section className="ca-hero">
      <div className="ca-hero-copy"><span className="ca-eyebrow"><span className="ca-live-dot" /> COLLEGE ADMINISTRATION</span><h1>Your college.<br /><span>Moving forward.</span></h1><p>Welcome back, {user?.name?.split(' ')[0] || 'Administrator'}. Bring your people, academics and assessments together.</p><Link className="ca-hero-button" to="/college-admin/users">Manage your people <ArrowUpRight size={18} /></Link></div>
      <div className="ca-institution"><span className="ca-institution-icon"><Building2 size={36} strokeWidth={1.2} /></span><span className="ca-eyebrow">YOUR INSTITUTION</span><h2>{activeCollege?.name || 'College workspace'}</h2><div className="ca-institution-foot"><span>{activeCollege?.code || 'College Admin'}</span><span><span className="ca-live-dot" /> Connected workspace</span></div></div>
    </section>
    {error && <CollegeError message={error} retry={reload} />}
    <div className="ca-metric-grid" aria-busy={loading}>
      <CollegeMetric icon={GraduationCap} label="Students" value={loading ? null : a.totalStudents} note="College members" />
      <CollegeMetric icon={Users} label="Faculty" value={loading ? null : a.totalFaculty} note="Teaching team" tone="blue" />
      <CollegeMetric icon={Layers} label="Groups & batches" value={loading ? null : groups.length} note="Learning communities" tone="amber" />
      <CollegeMetric icon={BookOpen} label="Assessments" value={loading ? null : a.totalExams} note="Created in your college" tone="violet" />
    </div>
    <div className="ca-dashboard-grid">
      <CollegePanel title="Your next move" description="A simpler way to run your institution." className="ca-actions-panel"><div className="ca-action-grid">{actions.map(([title, description, to, Icon], index) => <Link key={to} className="ca-action" to={to}><span className="ca-action-index">0{index + 1}</span><span className="ca-icon"><Icon size={22} /></span><h3>{title}</h3><p>{description}</p><ArrowUpRight className="ca-action-arrow" size={19} /></Link>)}</div></CollegePanel>
      <CollegePanel title="Assessment pulse" description="Performance across your college.">{loading ? <CollegeLoading /> : <><div className="ca-score"><span>Average score</span><strong>{Math.round(a.averagePercentage || 0)}<small>%</small></strong></div><div className="ca-progress" role="progressbar" aria-label="Average assessment score" aria-valuenow={a.averagePercentage || 0} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.min(100, Math.max(0, a.averagePercentage || 0))}%` }} /></div><div className="ca-pulse-row"><span>Evaluated attempts</span><strong>{a.totalAttempts || 0}</strong></div><div className="ca-pulse-row"><span>Pass rate</span><strong>{Math.round(a.passPercentage || 0)}%</strong></div><Link className="ca-text-link" to="/college-admin/analytics">Explore insights <ArrowRight size={16} /></Link></>}</CollegePanel>
    </div>
    <CollegePanel title="Recently joined" description="The newest people in your college." action={<Link className="ca-text-link" to="/college-admin/users">View directory <ArrowRight size={16} /></Link>}>
      {loading ? <CollegeLoading /> : !users.length ? <div className="ca-empty"><Users size={28} /><h3>Your community starts here</h3><p>College members will appear as they join.</p></div> : <div className="ca-member-grid">{users.map(person => <div className="ca-member" key={person._id}><span className="ca-avatar">{person.name?.slice(0, 2).toUpperCase()}</span><div><strong>{person.name}</strong><span>{person.email}</span></div><span className="ca-tag">{person.role.replace('_', ' ')}</span></div>)}</div>}
    </CollegePanel>
  </div>;
}
