import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ExternalLink,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import StudentProfileModal from '../components/StudentProfileModal';
import './profile-page.css';

const roleDetails = {
  student: { label: 'Student', icon: GraduationCap, eyebrow: 'LEARNER PROFILE', headline: 'Your learning journey, in one place.' },
  faculty: { label: 'Faculty', icon: BookOpen, eyebrow: 'FACULTY PROFILE', headline: 'Your teaching workspace, at a glance.' },
  admin: { label: 'System Admin', icon: ShieldCheck, eyebrow: 'ADMINISTRATOR PROFILE', headline: 'Your system access and account details.' },
  college_admin: { label: 'College Admin', icon: Building2, eyebrow: 'COLLEGE ADMIN PROFILE', headline: 'Your institution workspace and account.' },
  recruiter: { label: 'Recruiter', icon: BriefcaseBusiness, eyebrow: 'RECRUITER PROFILE', headline: 'Your hiring workspace and account.' },
};

const displayValue = (value) => value || 'Not added yet';

const ProfilePage = () => {
  const { user, profile, activeCollege, fetchMe } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [showStudentEditor, setShowStudentEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', department: '', designation: '' });

  useEffect(() => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      department: profile?.department || '',
      designation: profile?.designation || '',
    });
  }, [user, profile]);

  const role = user?.role || 'student';
  const details = roleDetails[role] || roleDetails.student;
  const RoleIcon = details.icon;
  const initials = (user?.name || 'U').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const studentSkills = Array.isArray(profile?.skills) ? profile.skills : [];
  const profileSections = role === 'student'
    ? [Boolean(user?.name && user?.email), Boolean(user?.phone), Boolean(profile?.course && profile?.rollNumber), Boolean(studentSkills.length), Boolean(profile?.resumeUrl || profile?.linkedinUrl || profile?.githubUrl || profile?.portfolioUrl)]
    : role === 'faculty'
      ? [Boolean(user?.name && user?.email), Boolean(user?.phone), Boolean(profile?.department), Boolean(profile?.designation)]
      : [Boolean(user?.name && user?.email), Boolean(user?.phone), Boolean(activeCollege?.name)];
  const completion = Math.round((profileSections.filter(Boolean).length / profileSections.length) * 100);

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await API.put('/auth/profile', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        ...(role === 'faculty' ? { department: form.department.trim(), designation: form.designation.trim() } : {}),
      });
      await fetchMe();
      setIsEditing(false);
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleStudentProfileSaved = () => fetchMe();

  return (
    <div className="profile-page">
      <header className="page-header profile-page-heading">
        <div>
          <div className="page-eyebrow">ACCOUNT</div>
          <h1 className="page-title">My profile</h1>
          <p className="page-description">Your personal details and role-specific information.</p>
        </div>
        <Link className="btn btn-outline-secondary" to={role === 'college_admin' ? '/college-admin/dashboard' : `/${role}/dashboard`}>
          <RoleIcon size={16} /> Workspace <ArrowUpRight size={15} />
        </Link>
      </header>

      <section className="profile-hero" aria-label="Profile overview">
        <div className="profile-hero-main">
          <div className="profile-avatar profile-hero-avatar" aria-hidden="true">{initials}</div>
          <div className="profile-hero-copy">
            <span className="profile-eyebrow">{details.eyebrow}</span>
            <h2>{user?.name || 'Your account'}</h2>
            <div className="profile-role-line"><RoleIcon size={15} /> {details.label}{activeCollege?.name ? <><span aria-hidden="true">·</span><Building2 size={14} /> {activeCollege.name}</> : null}</div>
            <p>{details.headline}</p>
          </div>
        </div>
        <div className="profile-hero-status">
          <span className={`profile-status ${user?.isActive === false ? 'is-inactive' : ''}`}><span /> {user?.isActive === false ? 'Inactive' : 'Active account'}</span>
          <div className="profile-completion-label"><span>Profile completeness</span><strong>{completion}%</strong></div>
          <div className="progress profile-completion" role="progressbar" aria-label="Profile completeness" aria-valuenow={completion} aria-valuemin="0" aria-valuemax="100">
            <div className="progress-bar" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </section>

      <div className="row g-4 profile-content-grid">
        <div className="col-12 col-xl-8">
          <section className="card profile-section-card">
            <div className="profile-section-heading">
              <div className="profile-section-title">
                <span className="profile-section-icon"><UserRound size={18} /></span>
                <div><h2>Personal information</h2><p>Contact details for your ExamIQ account</p></div>
              </div>
              {role === 'student' ? (
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowStudentEditor(true)}><Pencil size={14} /> Edit</button>
              ) : (
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setIsEditing((editing) => !editing)}>
                  {isEditing ? <X size={14} /> : <Pencil size={14} />} {isEditing ? 'Cancel' : 'Edit'}
                </button>
              )}
            </div>

            {isEditing ? (
              <form className="profile-edit-form" onSubmit={handleSave}>
                <div className="row g-3">
                  <div className="col-12 col-md-6"><label className="form-label" htmlFor="profile-name">Full name</label><input id="profile-name" className="form-control" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={100} /></div>
                  <div className="col-12 col-md-6"><label className="form-label" htmlFor="profile-phone">Phone</label><input id="profile-phone" className="form-control" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} maxLength={30} /></div>
                  {role === 'faculty' && <>
                    <div className="col-12 col-md-6"><label className="form-label" htmlFor="profile-department">Department</label><input id="profile-department" className="form-control" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} maxLength={100} /></div>
                    <div className="col-12 col-md-6"><label className="form-label" htmlFor="profile-designation">Designation</label><input id="profile-designation" className="form-control" value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} maxLength={100} /></div>
                  </>}
                </div>
                <div className="d-flex justify-content-end mt-3"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : <><Check size={16} /> Save changes</>}</button></div>
              </form>
            ) : (
              <div className="profile-info-grid">
                <div className="profile-info-item"><Mail size={17} /><div><span>Email address</span><strong>{displayValue(user?.email)}</strong></div><span className={`profile-verified ${user?.isEmailVerified ? '' : 'is-pending'}`}>{user?.isEmailVerified ? 'Verified' : 'Pending'}</span></div>
                <div className="profile-info-item"><Phone size={17} /><div><span>Phone number</span><strong>{displayValue(user?.phone)}</strong></div>{user?.phone && <span className={`profile-verified ${user?.isPhoneVerified ? '' : 'is-pending'}`}>{user?.isPhoneVerified ? 'Verified' : 'Unverified'}</span>}</div>
                {activeCollege?.name && <div className="profile-info-item"><MapPin size={17} /><div><span>Workspace</span><strong>{activeCollege.name}</strong></div></div>}
                <div className="profile-info-item"><CalendarDays size={17} /><div><span>Member since</span><strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Account active'}</strong></div></div>
              </div>
            )}
          </section>

          <section className="card profile-section-card">
            <div className="profile-section-heading">
              <div className="profile-section-title">
                <span className="profile-section-icon"><RoleIcon size={18} /></span>
                <div><h2>{role === 'student' ? 'Academic profile' : role === 'faculty' ? 'Teaching profile' : role === 'recruiter' ? 'Hiring workspace' : 'Workspace access'}</h2><p>{role === 'student' ? 'Your education and career details' : role === 'faculty' ? 'Your academic role and department' : role === 'recruiter' ? 'Your recruiting account context' : 'Your administrative account context'}</p></div>
              </div>
              {role === 'student' && <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowStudentEditor(true)}><Pencil size={14} /> Edit details</button>}
            </div>

            {role === 'student' ? (
              <>
                <div className="profile-facts-grid">
                  <div><span>Roll number</span><strong>{displayValue(profile?.rollNumber)}</strong></div>
                  <div><span>Course</span><strong>{displayValue(profile?.course)}</strong></div>
                  <div><span>Branch</span><strong>{displayValue(profile?.branch)}</strong></div>
                  <div><span>Semester</span><strong>{displayValue(profile?.semester)}</strong></div>
                  <div><span>College</span><strong>{displayValue(profile?.college || activeCollege?.name)}</strong></div>
                  <div><span>CGPA</span><strong>{displayValue(profile?.cgpa)}</strong></div>
                </div>
                <div className="profile-subsection">
                  <h3><Sparkles size={15} /> Skills</h3>
                  {studentSkills.length ? <div className="profile-skill-list">{studentSkills.map((skill) => <span key={skill}>{skill}</span>)}</div> : <p className="profile-empty">Add skills to make your profile more useful for opportunities.</p>}
                </div>
                <div className="profile-link-list">
                  {[
                    ['Resume', profile?.resumeUrl, FileText],
                    ['LinkedIn', profile?.linkedinUrl, ExternalLink],
                    ['GitHub', profile?.githubUrl, ExternalLink],
                    ['Portfolio', profile?.portfolioUrl, ExternalLink],
                  ].filter(([, url]) => url).map(([label, url, Icon]) => <a key={label} href={url} target="_blank" rel="noreferrer"><Icon size={15} /> {label} <ArrowUpRight size={13} /></a>)}
                </div>
              </>
            ) : role === 'faculty' ? (
              <div className="profile-facts-grid">
                <div><span>Designation</span><strong>{displayValue(profile?.designation)}</strong></div>
                <div><span>Department</span><strong>{displayValue(profile?.department)}</strong></div>
                <div><span>Employee ID</span><strong>{displayValue(profile?.employeeId)}</strong></div>
                <div><span>Institution</span><strong>{displayValue(activeCollege?.name)}</strong></div>
              </div>
            ) : (
              <div className="profile-workspace-note">
                {role === 'recruiter' ? <BriefcaseBusiness size={20} /> : role === 'college_admin' ? <UsersRound size={20} /> : <ShieldCheck size={20} />}
                <div><strong>{activeCollege?.name || (role === 'admin' ? 'System-wide access' : details.label)}</strong><p>{role === 'recruiter' ? 'Manage hiring drives, candidates, and recruitment reports from your workspace.' : role === 'college_admin' ? 'Manage members, groups, courses, and analytics for your institution.' : 'Your administrator permissions are managed by the system.'}</p></div>
              </div>
            )}
          </section>
        </div>

        <aside className="col-12 col-xl-4">
          <section className="card profile-side-card">
            <div className="profile-side-heading"><span className="profile-section-icon"><BadgeCheck size={18} /></span><div><h2>Account status</h2><p>Security and access</p></div></div>
            <div className="profile-security-row"><span className="profile-security-icon"><Mail size={16} /></span><div><strong>Email verification</strong><span>{user?.isEmailVerified ? 'Your email is verified' : 'Email verification is pending'}</span></div><span className={`profile-security-dot ${user?.isEmailVerified ? 'is-ok' : ''}`} /></div>
            <div className="profile-security-row"><span className="profile-security-icon"><ShieldCheck size={16} /></span><div><strong>Account access</strong><span>{user?.isActive === false ? 'Access is currently disabled' : 'Account is enabled'}</span></div><span className={`profile-security-dot ${user?.isActive === false ? '' : 'is-ok'}`} /></div>
            <div className="profile-role-card"><RoleIcon size={17} /><div><span>Current role</span><strong>{details.label}</strong></div></div>
          </section>

          {role === 'student' && (
            <section className="card profile-side-card profile-career-card">
              <div className="profile-side-heading"><span className="profile-section-icon"><Award size={18} /></span><div><h2>Career profile</h2><p>Projects and experience</p></div></div>
              <div className="profile-career-stat"><strong>{profile?.projects?.length || 0}</strong><span>Projects</span></div>
              <div className="profile-career-stat"><strong>{profile?.experience?.length || 0}</strong><span>Experience entries</span></div>
              <button type="button" className="btn btn-outline-secondary w-100 mt-3" onClick={() => setShowStudentEditor(true)}>Update career details <ArrowUpRight size={15} /></button>
            </section>
          )}
        </aside>
      </div>

      {role === 'student' && <StudentProfileModal isOpen={showStudentEditor} onClose={() => setShowStudentEditor(false)} user={user} initialProfile={profile} onProfileSaved={handleStudentProfileSaved} />}
    </div>
  );
};

export default ProfilePage;