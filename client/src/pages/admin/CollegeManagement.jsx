import React, { useEffect, useMemo, useState, useContext, useRef } from 'react';
import { toast } from 'react-toastify';
import { Building2, CheckCircle2, Globe2, Mail, Phone, Plus, UserPlus, Trash2, RefreshCw, Save, Search, XCircle, Pencil, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import API from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import { CollegeMetric, CollegeError } from '../../components/college/CollegeUI';
import '../../styles/super-admin.css';
import '../../styles/college-management-modern.css';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CollegeAdminForm from '../../components/CollegeAdminForm';
import { AuthContext } from '../../context/AuthContext';

const emptyForm = {
  name: '',
  code: '',
  domain: '',
  logoUrl: '',
  address: '',
  contactEmail: '',
  contactPhone: '',
  isActive: true,
};

const normalizeCode = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

const CollegeManagement = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const editorRef = useRef(null);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [adminTarget, setAdminTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusBusy, setStatusBusy] = useState(null);
  const { activeCollege, fetchMe } = useContext(AuthContext);

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    const dialog = editorRef.current;
    if (showEditor && !dialog.open) dialog.showModal();
    else if (!showEditor && dialog.open) dialog.close();
  }, [showEditor]);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/colleges');
      setColleges(res.data.colleges || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load colleges');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const active = colleges.filter((college) => college.isActive !== false).length;
    return { active, total: colleges.length };
  }, [colleges]);

  const filteredColleges = useMemo(() => {
    const query = search.trim().toLowerCase();
    return colleges.filter(college => statusFilter === 'all' || (statusFilter === 'active' ? college.isActive !== false : statusFilter === 'inactive' ? college.isActive === false : !college.admins?.length)).filter((college) =>
      [college.name, college.code, college.domain, college.contactEmail]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [colleges, search, statusFilter]);

  const resetForm = () => {
    setShowEditor(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const editCollege = (college) => {
    setShowEditor(true);
    setEditingId(college._id);
    setForm({
      name: college.name || '',
      code: college.code || '',
      domain: college.domain || '',
      logoUrl: college.logoUrl || '',
      address: college.address || '',
      contactEmail: college.contactEmail || '',
      contactPhone: college.contactPhone || '',
      isActive: college.isActive !== false,
    });
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: field === 'code' ? normalizeCode(value) : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.code.trim()) {
      toast.warning('College name and code are required');
      return;
    }


    try {
      setSaving(true);
      if (editingId) {
        await API.put(`/colleges/${editingId}`, form);
        toast.success('College updated successfully');
      } else {
        await API.post('/colleges', form);
        toast.success('College created successfully');
      }
      resetForm();
      fetchColleges();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to save college');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (college) => {
    try {
      setStatusBusy(college._id);
      await API.put(`/colleges/${college._id}`, { isActive: college.isActive === false });
      toast.success('College status updated');
      fetchColleges();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to update status');
    } finally { setStatusBusy(null); }
  };

  const deleteCollege = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await API.delete('/colleges/' + deleteTarget._id);
      if (String(activeCollege?._id) === String(deleteTarget._id)) {
        localStorage.removeItem('activeCollege');
        await fetchMe();
      }
      if (editingId === deleteTarget._id) resetForm();
      setDeleteTarget(null);
      toast.success('College removed. Academic records are preserved.');
      await fetchColleges();
    } catch (error) { toast.error(error.response?.data?.message || 'Unable to delete college'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="workspace-page sa-dashboard cm-page">
      <PageHeader icon={Building2} eyebrow="INSTITUTION NETWORK" title="College management" description="A clear home for every institution, administrator and workspace." actions={<><button className="btn btn-outline-secondary" disabled={loading} onClick={fetchColleges} aria-label="Refresh colleges"><RefreshCw size={16} /></button><button className="btn btn-primary" onClick={() => { resetForm(); setShowEditor(true); }}><Plus size={16} /> Add college</button></>} />
      {error && <CollegeError message={error} retry={fetchColleges} />}
      <div className="ca-metric-grid" aria-busy={loading}>
        <CollegeMetric icon={Building2} label="Registered colleges" note="Institution network" value={loading || error ? null : stats.total} tone="violet" />
        <CollegeMetric icon={CheckCircle2} label="Active workspaces" note="Ready to operate" value={loading || error ? null : stats.active} />
        <CollegeMetric icon={ShieldCheck} label="Needs an administrator" note="Complete workspace setup" value={loading || error ? null : colleges.filter(college => !college.admins?.length).length} tone="amber" />
      </div>
      <section className="cm-directory">
        <div className="cm-directory-top"><div><h2>Your institutions <span>{loading ? '—' : colleges.length}</span></h2><p>Manage access and keep every college connected.</p></div><button className="btn btn-outline-primary" disabled={loading || !colleges.some(college => college.isActive !== false)} onClick={() => setAdminTarget({ _id: '' })}><UserPlus size={16} /> Add administrator</button></div>
        <div className="cm-filter-bar"><div className="cm-search"><Search size={18} /><input aria-label="Search colleges" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search institutions, codes or contact emails…" /></div><label className="cm-status-filter"><SlidersHorizontal size={16} /><span className="visually-hidden">Filter colleges</span><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All institutions</option><option value="active">Active colleges</option><option value="inactive">Inactive colleges</option><option value="unassigned">Needs administrator</option></select></label></div>
        {loading ? <div className="ca-loading" role="status"><span className="spinner-border spinner-border-sm" /> Loading your institutions…</div> : error ? <div className="ca-empty"><Building2 size={30} /><h3>Institution data is unavailable</h3><p>Use Try again above to reload your colleges.</p></div> : !filteredColleges.length ? <div className="cm-empty"><span className="cm-building-icon"><Building2 size={35} /></span><h3>{colleges.length ? 'No institutions match your filters' : 'Your network starts here.'}</h3><p>{colleges.length ? 'Try a different search or show all institutions.' : 'Add your first college, then connect its administrator.'}</p>{colleges.length ? <button className="btn btn-outline-primary" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Clear filters</button> : <button className="btn btn-primary" onClick={() => { resetForm(); setShowEditor(true); }}><Plus size={16} /> Add your first college</button>}</div> : <><div className="cm-results-label">Showing {filteredColleges.length} of {colleges.length} institutions</div><div className="cm-card-grid">{filteredColleges.map(college => <article className="cm-college-card" key={college._id}>
          <div className="cm-card-heading"><span className="cm-building-icon">{college.logoUrl ? <img src={college.logoUrl} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <Building2 size={25} />}</span><span className={'sa-status ' + (college.isActive !== false ? 'is-active' : '')}><span />{college.isActive !== false ? 'Active' : 'Inactive'}</span></div>
          <div className="cm-title"><h3>{college.name}</h3><span className="ca-tag">{college.code}</span></div>
          <div className="cm-contacts">{college.domain && <span><Globe2 size={14} />{college.domain}</span>}{college.contactEmail && <a href={'mailto:' + college.contactEmail}><Mail size={14} />{college.contactEmail}</a>}{college.contactPhone && <a href={'tel:' + college.contactPhone}><Phone size={14} />{college.contactPhone}</a>}{!college.domain && !college.contactEmail && !college.contactPhone && <span>Contact details not added yet</span>}</div>
          <div className="cm-admin-strip"><span className="cm-admin-icon"><ShieldCheck size={18} /></span><div><strong>{college.admins?.length ? college.admins.map(admin => admin.name).join(', ') : 'Administrator not assigned'}</strong><span>{college.admins?.length ? college.admins.length + ' college administrator' + (college.admins.length > 1 ? 's' : '') : 'Add an administrator to complete setup'}</span></div></div>
          <div className="cm-card-actions"><button className="btn btn-outline-secondary" onClick={() => editCollege(college)}><Pencil size={14} /> Edit details</button><button className="btn btn-primary" disabled={college.isActive === false} onClick={() => setAdminTarget(college)}><UserPlus size={14} /> Add admin</button><div className="cm-secondary-actions"><button className="cm-icon-button" aria-label={(college.isActive === false ? 'Activate ' : 'Disable ') + college.name} title={college.isActive === false ? 'Activate college' : 'Disable college'} disabled={Boolean(statusBusy)} onClick={() => toggleStatus(college)}>{statusBusy === college._id ? <span className="spinner-border spinner-border-sm" /> : college.isActive === false ? <CheckCircle2 size={17} /> : <XCircle size={17} />}</button><button className="cm-icon-button is-danger" title="Delete college" aria-label={'Delete ' + college.name} onClick={() => setDeleteTarget(college)}><Trash2 size={17} /></button></div></div>
        </article>)}</div></>}
      </section>
      <dialog ref={editorRef} className="cm-editor" aria-labelledby="cm-editor-title" onCancel={event => { if (saving) event.preventDefault(); else resetForm(); }}>
        <div className="cm-editor-heading"><div><span className="ca-eyebrow">INSTITUTION DETAILS</span><h2 id="cm-editor-title">{editingId ? 'Edit college' : 'Add a new college'}</h2><p>{editingId ? 'Keep your institution details up to date.' : 'Create a workspace for your institution. Assign an administrator after saving.'}</p></div><button type="button" className="cm-icon-button" disabled={saving} aria-label="Close college form" onClick={resetForm}><XCircle size={21} /></button></div>
        <fieldset disabled={saving} className="cm-form-fieldset">
              <form onSubmit={handleSubmit} className="cm-form-grid">
                <div className="college-form-section-title">
                  <Building2 size={17} />
                  <span>Institute details</span>
                </div>
                <div>
                  <label className="form-label small fw-semibold" htmlFor="cm-name">College Name <span className="text-danger">*</span></label>
                  <input className="form-control" id="cm-name" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Example Institute of Technology" autoComplete="organization" required />
                </div>
                <div>
                  <label className="form-label small fw-semibold" htmlFor="cm-code">College Code <span className="text-danger">*</span></label>
                  <input className="form-control text-uppercase" id="cm-code" value={form.code} onChange={(e) => updateField('code', e.target.value)} placeholder="EIT" disabled={Boolean(editingId)} maxLength={12} required />
                  <div className="form-text">Short unique code used for college identity.</div>
                </div>
                <div>
                  <label className="form-label small fw-semibold" htmlFor="cm-domain">Domain</label>
                  <input className="form-control" id="cm-domain" value={form.domain} onChange={(e) => updateField('domain', e.target.value)} placeholder="college.edu" autoComplete="url" />
                </div>
                <div>
                  <label className="form-label small fw-semibold" htmlFor="cm-logoUrl">Logo URL</label>
                  <input className="form-control" type="url" id="cm-logoUrl" value={form.logoUrl} onChange={(e) => updateField('logoUrl', e.target.value)} placeholder="https://..." />
                </div>
                <div className="cm-wide">
                  <label className="form-label small fw-semibold" htmlFor="cm-address">Address</label>
                  <textarea className="form-control" rows="2" id="cm-address" value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Campus address" />
                </div>
                <div className="row g-2 cm-wide">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold" htmlFor="cm-contactEmail">Email</label>
                    <input className="form-control" type="email" id="cm-contactEmail" value={form.contactEmail} onChange={(e) => updateField('contactEmail', e.target.value)} placeholder="office@college.edu" autoComplete="email" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold" htmlFor="cm-contactPhone">Phone</label>
                    <input className="form-control" type="tel" id="cm-contactPhone" value={form.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" />
                  </div>
                </div>

                <div className="border rounded-4 p-3 bg-light-subtle">
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} id="collegeActive" />
                    <label className="form-check-label fw-semibold" htmlFor="collegeActive">College active</label>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary rounded-pill fw-bold d-flex justify-content-center align-items-center gap-2" disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : editingId ? <Save size={16} /> : <Plus size={16} />}
                  {editingId ? 'Save Changes' : 'Create College'}
                </button>
              </form>
        </fieldset>
      </dialog>
      <ConfirmDialog isOpen={Boolean(deleteTarget)} onClose={() => { if (!deleting) setDeleteTarget(null); }} onConfirm={deleteCollege} loading={deleting} title="Delete college?" confirmLabel="Delete college" description={deleteTarget ? 'Remove ' + deleteTarget.name + ' and stop access to its workspace? Academic records will be preserved. Ongoing exams must finish first.' : ''} />
      {adminTarget && <div className="modal fade show d-block cm-admin-modal" role="dialog" aria-modal="true" aria-labelledby="add-college-admin-title"><div className="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div className="modal-content"><div className="modal-header"><h2 className="modal-title h5" id="add-college-admin-title">Add college administrator</h2></div><div className="modal-body p-4"><CollegeAdminForm colleges={colleges} defaultCollegeId={adminTarget._id} onCancel={() => setAdminTarget(null)} onSuccess={() => { setAdminTarget(null); fetchColleges(); }} /></div></div></div></div>}
    </div>
  );
};

export default CollegeManagement;
