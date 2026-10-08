import React, { useState } from 'react';
import { toast } from 'react-toastify';
import API from '../services/api';
import Button from './common/Button';
export default function CollegeAdminForm({ colleges = [], defaultCollegeId = '', onSuccess, onCancel }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', collegeId: defaultCollegeId });
  const [saving, setSaving] = useState(false);
  const update = (field, value) => setForm(previous => ({ ...previous, [field]: value }));
  const submit = async event => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6 || !form.collegeId) { toast.warning('Enter administrator details and select a college. Password must have at least 6 characters.'); return; }
    try {
      setSaving(true);
      const response = await API.post('/admin/college-admins', form);
      toast.success('College admin created successfully');
      setForm({ name: '', email: '', password: '', phone: '', collegeId: defaultCollegeId });
      onSuccess?.(response.data.user);
    } catch (error) { toast.error(error.response?.data?.message || 'Unable to create college admin'); }
    finally { setSaving(false); }
  };
  return <form onSubmit={submit} className="vstack gap-3">
    <div><label htmlFor="new-college-admin-college" className="form-label">College *</label><select id="new-college-admin-college" className="form-select" required value={form.collegeId} disabled={saving} onChange={event => update('collegeId', event.target.value)}><option value="">Select college</option>{colleges.filter(college => college.isActive !== false).map(college => <option key={college._id} value={college._id}>{college.name} ({college.code})</option>)}</select></div>
    <div><label htmlFor="new-college-admin-name" className="form-label">Full name *</label><input id="new-college-admin-name" className="form-control" required autoComplete="name" disabled={saving} value={form.name} onChange={event => update('name', event.target.value)}/></div>
    <div><label htmlFor="new-college-admin-email" className="form-label">Email *</label><input id="new-college-admin-email" type="email" className="form-control" required autoComplete="username" disabled={saving} value={form.email} onChange={event => update('email', event.target.value)}/></div>
    <div><label htmlFor="new-college-admin-password" className="form-label">Temporary password *</label><input id="new-college-admin-password" type="password" className="form-control" required minLength={6} autoComplete="new-password" disabled={saving} value={form.password} onChange={event => update('password', event.target.value)}/></div>
    <div><label htmlFor="new-college-admin-phone" className="form-label">Phone</label><input id="new-college-admin-phone" type="tel" className="form-control" autoComplete="tel" disabled={saving} value={form.phone} onChange={event => update('phone', event.target.value)}/></div>
    <p className="small text-muted mb-0">This administrator will have access to the selected college’s workspace.</p>
    <div className="d-flex justify-content-end gap-2">{onCancel && <Button variant="secondary" disabled={saving} onClick={onCancel}>Cancel</Button>}<Button type="submit" loading={saving} disabled={!colleges.some(college => college.isActive !== false)}>Create college admin</Button></div>
  </form>;
}
