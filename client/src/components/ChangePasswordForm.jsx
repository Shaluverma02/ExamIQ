import React, { useContext, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';
import Input from './common/Input';
import Button from './common/Button';

const emptyForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function ChangePasswordForm() {
  const { changePassword } = useContext(AuthContext);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const update = field => event => {
    setForm(current => ({ ...current, [field]: event.target.value }));
    setErrors({});
    setMessage('');
  };
  const submit = async event => {
    event.preventDefault();
    if (saving) return;
    const invalid = {};
    if (!form.currentPassword) invalid.currentPassword = 'Enter your current password.';
    if (form.newPassword.length < 6 || form.newPassword.length > 72 || new TextEncoder().encode(form.newPassword).length > 72) invalid.newPassword = 'Use 6 to 72 characters (up to 72 bytes).';
    else if (form.newPassword === form.currentPassword) invalid.newPassword = 'Choose a different password.';
    if (form.confirmPassword !== form.newPassword) invalid.confirmPassword = 'Passwords do not match.';
    setErrors(invalid);
    setMessage('');
    if (Object.keys(invalid).length) return;
    setSaving(true);
    try {
      const result = await changePassword(form);
      setForm(emptyForm);
      setMessage(result || 'Password changed successfully.');
    } catch (error) {
      setErrors({ submit: getApiErrorMessage(error, 'Could not change your password. Please try again.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card profile-section-card">
      <div className="profile-section-heading">
        <div className="profile-section-title">
          <span className="profile-section-icon"><LockKeyhole size={18} /></span>
          <div><h2>Change password</h2><p>Verify your current password to update your account.</p></div>
        </div>
      </div>
      <form onSubmit={submit} aria-busy={saving}>
        {errors.submit && <div className="alert alert-danger small" role="alert">{errors.submit}</div>}
        {message && <div className="alert alert-success small" role="status">{message}</div>}
        <Input label="Current password" type="password" autoComplete="current-password" value={form.currentPassword} onChange={update('currentPassword')} error={errors.currentPassword} required disabled={saving} />
        <div className="row">
          <div className="col-12 col-md-6"><Input label="New password" type="password" autoComplete="new-password" value={form.newPassword} onChange={update('newPassword')} error={errors.newPassword} required minLength={6} maxLength={72} disabled={saving} /></div>
          <div className="col-12 col-md-6"><Input label="Confirm new password" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={update('confirmPassword')} error={errors.confirmPassword} required maxLength={72} disabled={saving} /></div>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <span className="small text-secondary">Use 6–72 characters. Other sessions will be signed out.</span>
          <Button type="submit" loading={saving}><LockKeyhole size={16} /> Change password</Button>
        </div>
      </form>
    </section>
  );
}
