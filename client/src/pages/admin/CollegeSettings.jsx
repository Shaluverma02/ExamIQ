import React, { useContext, useEffect, useState } from 'react';
import { Building2, Save, Settings } from 'lucide-react';
import API, { getApiErrorMessage } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { CollegePanel, CollegeError } from '../../components/college/CollegeUI';
import { toast } from 'react-toastify';

export default function CollegeSettings() {
  const { activeCollege, fetchMe } = useContext(AuthContext);
  const [college, setCollege] = useState(null), [form, setForm] = useState({}), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try { const res = await API.get('/colleges/current'); setCollege(res.data.college); setForm(Object.fromEntries(['domain', 'logoUrl', 'address', 'contactEmail', 'contactPhone'].map(field => [field, res.data.college[field] || '']))); setForm(previous => ({ ...previous, allowSelfRegistration: res.data.college.settings?.allowSelfRegistration !== false })); }
    catch (e) { setError(getApiErrorMessage(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [activeCollege?._id]);
  const save = async event => {
    event.preventDefault(); if (saving || !college) return;
    setSaving(true); setError('');
    try {
      const { allowSelfRegistration, ...details } = form;
      await API.put('/colleges/' + college._id, { ...details, settings: { ...college.settings, allowSelfRegistration } });
      toast.success('College settings updated.'); await fetchMe();
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setSaving(false); }
  };
  return <div className="workspace-page"><PageHeader icon={Settings} eyebrow="INSTITUTION SETTINGS" title="Your college, connected." description="Maintain contact details, branding and student self-registration." />{error && <CollegeError message={error} retry={load} />}{loading ? <div className="ca-loading" role="status">Loading institution settings…</div> : college && <CollegePanel title={college.name} description={'College code: ' + college.code}><form onSubmit={save}><div className="row">{[['domain','Website domain','text'],['logoUrl','Logo URL','url'],['contactEmail','Contact email','email'],['contactPhone','Contact phone','tel']].map(([field,label,type]) => <div key={field} className="col-12 col-md-6"><Input label={label} type={type} value={form[field] || ''} disabled={saving} onChange={e => setForm(previous => ({ ...previous, [field]: e.target.value }))} /></div>)}</div><Input label="Campus address" value={form.address || ''} disabled={saving} onChange={e => setForm(previous => ({ ...previous, address: e.target.value }))} /><label className="form-check form-switch mb-4"><input type="checkbox" className="form-check-input" checked={Boolean(form.allowSelfRegistration)} disabled={saving} onChange={e => setForm(previous => ({ ...previous, allowSelfRegistration: e.target.checked }))} /><span className="form-check-label">Allow student self-registration</span></label><div className="d-flex justify-content-end"><Button type="submit" loading={saving}><Save size={16} /> Save institution settings</Button></div></form></CollegePanel>}<div className="ca-note"><Building2 size={20} /><p>College identity and activation remain with Super Admin. Your changes apply only to your assigned institution.</p></div></div>;
}
