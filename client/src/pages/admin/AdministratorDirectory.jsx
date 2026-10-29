import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, Users, UserPlus, Search, RefreshCw, Mail, X, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import API, { getApiErrorMessage } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import CollegeAdminForm from '../../components/CollegeAdminForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { CollegeMetric, CollegeError } from '../../components/college/CollegeUI';
import '../../styles/super-admin.css';
import '../../styles/college-management-modern.css';

export default function AdministratorDirectory() {
  const [colleges, setColleges] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const dialog = useRef(null);
  const load = async () => {
    setLoading(true); setError('');
    try {
      const [c, a] = await Promise.all([API.get('/colleges'), API.get('/admin/college-admins')]);
      setColleges(c.data.colleges || []); setAdmins(a.data.admins || []);
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (open && !dialog.current.open) dialog.current.showModal(); else if (!open && dialog.current.open) dialog.current.close(); }, [open]);

  const handleDeleteAdmin = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await API.delete(`/admin/college-admins/${deleteTarget._id}`);
      toast.success('College administrator removed successfully');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to remove administrator');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = admins.filter(a => (!collegeFilter || a.collegeId?._id === collegeFilter) && [a.userId?.name, a.userId?.email, a.collegeId?.name].some(value => value?.toLowerCase().includes(search.trim().toLowerCase())));
  const assigned = new Set(admins.filter(a => a.userId?.isActive !== false).map(a => a.collegeId?._id));
  const ready = !loading && !error;
  return <div className="workspace-page sa-dashboard">
    <PageHeader icon={ShieldCheck} eyebrow="PEOPLE & RESPONSIBILITY" title="College administrators" description="Connect each institution with the people who keep it moving." actions={<><button className="btn btn-outline-secondary" onClick={load} disabled={loading} aria-label="Refresh administrators"><RefreshCw size={16} /></button><button className="btn btn-primary" disabled={!colleges.some(c => c.isActive)} onClick={() => setOpen(true)}><UserPlus size={16} /> Add administrator</button></>} />
    {error && <CollegeError message={error} retry={load} />}
    <div className="ca-metric-grid"><CollegeMetric icon={ShieldCheck} label="Administrator assignments" note="Institution access" value={ready ? admins.length : null} tone="violet" /><CollegeMetric icon={Users} label="Active accounts" note="Enabled administrators" value={ready ? new Set(admins.filter(a => a.userId?.isActive).map(a => a.userId?._id)).size : null} /><CollegeMetric icon={Building2} label="Assigned colleges" note="With an active admin" value={ready ? colleges.filter(c => assigned.has(c._id)).length : null} tone="blue" /><CollegeMetric icon={UserPlus} label="Needs an administrator" note="Complete institution setup" value={ready ? colleges.filter(c => !assigned.has(c._id)).length : null} tone="amber" /></div>
    <section className="cm-directory"><div className="cm-directory-top"><div><h2>Administrator directory</h2><p>People, institutions and workspace access in one place.</p></div><span className="ca-tag">{filtered.length} assignments</span></div><div className="cm-filter-bar"><div className="cm-search"><Search size={18} /><input aria-label="Search administrators" placeholder="Search by name, email or institution…" value={search} onChange={e => setSearch(e.target.value)} /></div><label className="cm-status-filter"><span className="visually-hidden">Filter by college</span><select value={collegeFilter} onChange={e => setCollegeFilter(e.target.value)}><option value="">All institutions</option>{colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label></div>
      {loading ? <div className="ca-loading" role="status">Loading administrator assignments…</div> : error ? <div className="ca-empty"><p>Use Try again above to reload the directory.</p></div> : !filtered.length ? <div className="ca-empty"><ShieldCheck size={32} /><h3>{admins.length ? 'No matching administrators' : 'Put your institutions in good hands.'}</h3><p>{admins.length ? 'Try a different search or institution.' : 'Add an administrator after creating an active college.'}</p>{!colleges.length && <Link to="/admin/colleges" className="ca-text-link">Create your first college</Link>}</div> : <div className="cm-card-grid sa-directory-grid">{filtered.map(a => <article key={a._id} className="cm-college-card"><div className="cm-card-heading"><span className="ca-avatar">{a.userId?.name?.slice(0, 2).toUpperCase() || 'CA'}</span><span className={'sa-status ' + (a.userId?.isActive ? 'is-active' : '')}><span />{a.userId?.isActive ? 'Active account' : 'Inactive account'}</span></div><div className="cm-title"><h3>{a.userId?.name || 'Administrator'}</h3></div><div className="cm-contacts"><a href={'mailto:' + (a.userId?.email || '')}><Mail size={14} />{a.userId?.email || 'Email unavailable'}</a></div><div className="cm-admin-strip"><Building2 size={20} /><div><strong>{a.collegeId?.name || 'Institution unavailable'}</strong><span>{a.collegeId?.code || 'College assignment'} · {colleges.find(college => college._id === a.collegeId?._id)?.isActive ? 'Active institution' : 'Inactive institution'}</span></div></div><div className="cm-card-actions mt-3 pt-2 border-top d-flex justify-content-end"><button className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1" title="Remove administrator" aria-label={`Remove administrator ${a.userId?.name || ''}`} onClick={() => setDeleteTarget(a)}><Trash2 size={14} /> Remove Admin</button></div></article>)}</div>}
    </section>
    <dialog className="cm-editor" ref={dialog} aria-labelledby="sa-admin-form-title" onCancel={() => setOpen(false)}><div className="cm-editor-heading"><div><span className="ca-eyebrow">INSTITUTION ACCESS</span><h2 id="sa-admin-form-title">Add an administrator</h2><p>Create an account and assign it to an active institution.</p></div><button className="cm-icon-button" aria-label="Close administrator form" onClick={() => setOpen(false)}><X size={20} /></button></div>{open && <CollegeAdminForm colleges={colleges} onCancel={() => setOpen(false)} onSuccess={() => { setOpen(false); load(); }} />}</dialog>
    <ConfirmDialog isOpen={Boolean(deleteTarget)} onClose={() => { if (!deleting) setDeleteTarget(null); }} onConfirm={handleDeleteAdmin} loading={deleting} title="Remove college administrator?" confirmLabel="Remove administrator" description={deleteTarget ? `Are you sure you want to remove ${deleteTarget.userId?.name || 'this administrator'} (${deleteTarget.userId?.email || ''}) from ${deleteTarget.collegeId?.name || 'the institution'}? They will lose access to this college workspace.` : ''} />
  </div>;
}
