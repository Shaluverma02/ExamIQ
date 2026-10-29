import React, { useContext, useEffect, useRef, useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API, { getApiErrorMessage } from '../services/api';
import Input from './common/Input';
import Button from './common/Button';
import { toast } from 'react-toastify';
import '../styles/college-management-modern.css';

const empty = { name: '', email: '', password: '', phone: '', department: '', designation: '', employeeId: '' };
export default function AddFaculty({ onCreated }) {
  const { activeCollege } = useContext(AuthContext);
  const [open, setOpen] = useState(false), [form, setForm] = useState(empty), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const dialog = useRef(null);
  useEffect(() => { if (open && !dialog.current.open) dialog.current.showModal(); else if (!open && dialog.current.open) dialog.current.close(); }, [open]);
  const close = () => { if (saving) return; setOpen(false); setForm(empty); setError(''); };
  const submit = async event => {
    event.preventDefault(); if (saving) return;
    setSaving(true); setError('');
    try {
      await API.post('/admin/faculty', { ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() });
      setOpen(false); setForm(empty); toast.success('Faculty created. Share the login details with the faculty member.'); onCreated?.();
    } catch (err) { setError(getApiErrorMessage(err)); }
    finally { setSaving(false); }
  };
  return <><button className="btn btn-primary" disabled={!activeCollege?._id} onClick={() => setOpen(true)}><UserPlus size={16} /> Add faculty</button><dialog ref={dialog} className="cm-editor" aria-labelledby="add-faculty-title" onCancel={e => { e.preventDefault(); close(); }}><div className="cm-editor-heading"><div><span className="ca-eyebrow">{activeCollege?.name}</span><h2 id="add-faculty-title">Add a faculty member</h2><p>Create a teaching account in this college. Faculty can change their temporary password after signing in.</p></div><button className="cm-icon-button" disabled={saving} aria-label="Close faculty form" onClick={close}><X size={20} /></button></div><form onSubmit={submit}>{error && <div className="alert alert-danger small" role="alert">{error}</div>}<div className="row">{[['name', 'Full name', 'text', true], ['email', 'Email address', 'email', true], ['password', 'Temporary password', 'password', true], ['phone', 'Phone', 'tel', false], ['department', 'Department', 'text', false], ['designation', 'Designation', 'text', false], ['employeeId', 'Employee ID', 'text', false]].map(([field, label, type, required]) => <div className="col-12 col-md-6" key={field}><Input label={label} type={type} required={required} value={form[field]} onChange={e => setForm(previous => ({ ...previous, [field]: e.target.value }))} disabled={saving} minLength={field === 'password' ? 6 : undefined} maxLength={field === 'password' ? 72 : 120} autoComplete={field === 'password' ? 'new-password' : 'off'} /></div>)}</div><div className="d-flex justify-content-end gap-2"><Button variant="outline-secondary" disabled={saving} onClick={close}>Cancel</Button><Button type="submit" loading={saving}>Create faculty account</Button></div></form></dialog></>;
}
