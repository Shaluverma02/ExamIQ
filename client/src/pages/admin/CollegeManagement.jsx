import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Building2, CheckCircle2, Globe2, Mail, Phone, Plus, RefreshCw, Save, Search, XCircle } from 'lucide-react';
import API from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';

const emptyForm = {
  name: '',
  code: '',
  domain: '',
  logoUrl: '',
  address: '',
  contactEmail: '',
  contactPhone: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
  isActive: true,
  settings: {
    allowSelfRegistration: true,
    requireInviteCode: false,
  },
};

const normalizeCode = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

const CollegeManagement = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [createdAdmin, setCreatedAdmin] = useState(null);

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const res = await API.get('/colleges');
      setColleges(res.data.colleges || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load colleges');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const active = colleges.filter((college) => college.isActive !== false).length;
    const publicRegistration = colleges.filter((college) => college.settings?.allowSelfRegistration !== false).length;
    return { active, publicRegistration, total: colleges.length };
  }, [colleges]);

  const filteredColleges = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return colleges;
    return colleges.filter((college) =>
      [college.name, college.code, college.domain, college.contactEmail]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [colleges, search]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const editCollege = (college) => {
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
      settings: {
        allowSelfRegistration: college.settings?.allowSelfRegistration !== false,
        requireInviteCode: college.settings?.requireInviteCode === true,
      },
    });
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: field === 'code' ? normalizeCode(value) : value }));
  };

  const updateSetting = (field, value) => {
    setForm((prev) => ({
      ...prev,
      settings: { ...prev.settings, [field]: value },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.warning('College name and code are required');
      return;
    }
    if (!editingId && (!form.adminName.trim() || !form.adminEmail.trim() || form.adminPassword.length < 6)) {
      toast.warning('College Admin name, email, and a 6+ character password are required');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await API.put(`/colleges/${editingId}`, form);
        toast.success('College updated successfully');
      } else {
        const response = await API.post('/colleges', form);
        setCreatedAdmin(response.data?.collegeAdmin || null);
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
      await API.put(`/colleges/${college._id}`, { isActive: college.isActive === false });
      toast.success('College status updated');
      fetchColleges();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to update status');
    }
  };

  return (
    <div className="college-management-page workspace-page management-page">
      <PageHeader icon={Building2} eyebrow="Institutions" title="College management"
        description="Manage institution workspaces, registration, and administrator access."
        actions={<button className="btn btn-outline-secondary" onClick={fetchColleges} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>} />

      <div className="row g-3">
        {[
          ['Total Colleges', stats.total, 'All institutions registered in ExamIQ'],
          ['Active Colleges', stats.active, 'Can operate inside the platform'],
          ['Open Registration', stats.publicRegistration, 'Visible on student/faculty signup'],
        ].map(([label, value, hint]) => (
          <div className="col-12 col-md-4" key={label}>
            <StatCard icon={label === 'Total Colleges' ? Building2 : label === 'Active Colleges' ? CheckCircle2 : Globe2} label={label} value={value} trend={hint} loading={loading} />
          </div>
        ))}
      </div>

      <div className="college-management-grid">
        <div className="college-form-panel">
          <div className="card border-0 shadow-sm college-form-card">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h5 className="fw-bold mb-0">{editingId ? 'Edit College' : 'Add College'}</h5>
                {editingId && (
                  <button type="button" className="btn btn-sm btn-light rounded-pill" onClick={resetForm}>Cancel</button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="college-form-grid">
                <div className="college-form-section-title">
                  <Building2 size={17} />
                  <span>Institute details</span>
                </div>
                <div>
                  <label className="form-label small fw-semibold">College Name <span className="text-danger">*</span></label>
                  <input className="form-control" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Example Institute of Technology" autoComplete="organization" required />
                </div>
                <div>
                  <label className="form-label small fw-semibold">College Code <span className="text-danger">*</span></label>
                  <input className="form-control text-uppercase" value={form.code} onChange={(e) => updateField('code', e.target.value)} placeholder="EIT" disabled={Boolean(editingId)} maxLength={12} required />
                  <div className="form-text">Short unique code used for college identity.</div>
                </div>
                <div>
                  <label className="form-label small fw-semibold">Domain</label>
                  <input className="form-control" value={form.domain} onChange={(e) => updateField('domain', e.target.value)} placeholder="college.edu" autoComplete="url" />
                </div>
                <div>
                  <label className="form-label small fw-semibold">Logo URL</label>
                  <input className="form-control" type="url" value={form.logoUrl} onChange={(e) => updateField('logoUrl', e.target.value)} placeholder="https://..." />
                </div>
                <div className="college-form-wide-field">
                  <label className="form-label small fw-semibold">Address</label>
                  <textarea className="form-control" rows="2" value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Campus address" />
                </div>
                <div className="row g-2 college-form-wide-field">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Email</label>
                    <input className="form-control" type="email" value={form.contactEmail} onChange={(e) => updateField('contactEmail', e.target.value)} placeholder="office@college.edu" autoComplete="email" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Phone</label>
                    <input className="form-control" type="tel" value={form.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" />
                  </div>
                </div>

                {!editingId && (
                  <div className="border rounded-4 p-3 bg-primary-subtle college-form-wide-field">
                    <div className="d-flex align-items-center gap-2 mb-1"><Mail size={17} /><div className="fw-bold">College Admin access</div></div>
                    <div className="small text-muted mb-3">These credentials will be used by the college administrator to sign in.</div>
                    <div className="row g-2">
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Admin Name *</label>
                        <input className="form-control" required value={form.adminName} onChange={(e) => updateField('adminName', e.target.value)} placeholder="Placement Head" autoComplete="name" />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Admin Email *</label>
                        <input className="form-control" type="email" required value={form.adminEmail} onChange={(e) => updateField('adminEmail', e.target.value)} placeholder="admin@college.edu" autoComplete="username" />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Password *</label>
                        <input className="form-control" type="password" minLength={6} required value={form.adminPassword} onChange={(e) => updateField('adminPassword', e.target.value)} placeholder="Minimum 6 characters" autoComplete="new-password" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="border rounded-4 p-3 bg-light-subtle">
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} id="collegeActive" />
                    <label className="form-check-label fw-semibold" htmlFor="collegeActive">College active</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" checked={form.settings.allowSelfRegistration} onChange={(e) => updateSetting('allowSelfRegistration', e.target.checked)} id="collegeSelfRegistration" />
                    <label className="form-check-label fw-semibold" htmlFor="collegeSelfRegistration">Show on registration page</label>
                  </div>
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" checked={form.settings.requireInviteCode} onChange={(e) => updateSetting('requireInviteCode', e.target.checked)} id="collegeInvite" />
                    <label className="form-check-label fw-semibold" htmlFor="collegeInvite">Require invite code later</label>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary rounded-pill fw-bold d-flex justify-content-center align-items-center gap-2" disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : editingId ? <Save size={16} /> : <Plus size={16} />}
                  {editingId ? 'Save Changes' : 'Create College'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="college-list-panel">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="input-group mb-3">
                <span className="input-group-text bg-white"><Search size={16} /></span>
                <input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, code, domain, or contact email" />
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-3" />
                  <p className="text-muted mb-0">Loading colleges...</p>
                </div>
              ) : filteredColleges.length === 0 ? (
                <div className="text-center py-5 border rounded-4 bg-light-subtle">
                  <Building2 className="text-muted mb-3" size={42} />
                  <h5 className="fw-bold">No colleges found</h5>
                  <p className="text-muted mb-0">Create the first college from the form.</p>
                </div>
              ) : (
                <div className="vstack gap-3">
                  {filteredColleges.map((college) => (
                    <div key={college._id} className="border rounded-4 p-3 p-md-4 bg-white college-list-item">
                      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                        <div className="d-flex gap-3 min-width-0 college-list-main">
                          <div className="rounded-4 bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 52, height: 52 }}>
                            {college.logoUrl ? <img src={college.logoUrl} alt="" className="w-100 h-100 rounded-4 object-fit-cover" /> : <Building2 size={24} />}
                          </div>
                          <div className="min-width-0">
                            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                              <h5 className="fw-bold mb-0 text-truncate college-name">{college.name}</h5>
                              <span className="badge text-bg-light border">{college.code}</span>
                              <span className={`badge ${college.isActive === false ? 'text-bg-danger' : 'text-bg-success'}`}>
                                {college.isActive === false ? 'Inactive' : 'Active'}
                              </span>
                              <span className={`badge ${college.settings?.allowSelfRegistration === false ? 'text-bg-secondary' : 'text-bg-info'}`}>
                                {college.settings?.allowSelfRegistration === false ? 'Private Signup' : 'Public Signup'}
                              </span>
                            </div>
                            <div className="small text-muted vstack gap-1">
                              {college.domain && <span className="d-flex align-items-center gap-2"><Globe2 size={14} /> {college.domain}</span>}
                              {college.contactEmail && <span className="d-flex align-items-center gap-2"><Mail size={14} /> {college.contactEmail}</span>}
                              {college.contactPhone && <span className="d-flex align-items-center gap-2"><Phone size={14} /> {college.contactPhone}</span>}
                              {college.address && <span>{college.address}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-start gap-2 flex-shrink-0 college-actions">
                          <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => editCollege(college)}>Edit</button>
                          <button className={`btn btn-sm rounded-pill d-flex align-items-center gap-1 ${college.isActive === false ? 'btn-outline-success' : 'btn-outline-danger'}`} onClick={() => toggleStatus(college)}>
                            {college.isActive === false ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            {college.isActive === false ? 'Activate' : 'Disable'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {createdAdmin && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title fw-bold">College created</h5><button type="button" className="btn-close" onClick={() => setCreatedAdmin(null)} /></div>
              <div className="modal-body">
                <p className="text-muted small">Share these login credentials securely with the College Admin.</p>
                <div className="border rounded-3 p-3 bg-light-subtle">
                  <div><span className="text-muted small d-block">Email</span><strong>{createdAdmin.email}</strong></div>
                  <div className="mt-3"><span className="text-muted small d-block">Temporary password</span><strong>{createdAdmin.password}</strong></div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-primary" onClick={() => setCreatedAdmin(null)}>Done</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeManagement;
