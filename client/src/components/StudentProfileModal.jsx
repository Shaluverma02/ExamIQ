import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import './student-profile-modal.css';
import {
  X,
  BookOpen,
  Code2,
  Briefcase,
  FolderGit2,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  GraduationCap,
  Link as LinkIcon,
} from 'lucide-react';

const StudentProfileModal = ({ isOpen, onClose, user, initialProfile, onProfileSaved }) => {
  const [activeTab, setActiveTab] = useState('academic'); // 'academic' | 'skills' | 'projects' | 'experience' | 'links'
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    college: '',
    course: '',
    branch: '',
    semester: '',
    rollNumber: '',
    cgpa: '',
    skillsStr: '',
    projects: [],
    experience: [],
    resumeUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
  });

  useEffect(() => {
    if (user || initialProfile) {
      setFormData({
        name: user?.name || '',
        phone: user?.phone || '',
        college: initialProfile?.college || '',
        course: initialProfile?.course || '',
        branch: initialProfile?.branch || '',
        semester: initialProfile?.semester || '',
        rollNumber: initialProfile?.rollNumber || '',
        cgpa: initialProfile?.cgpa || '',
        skillsStr: Array.isArray(initialProfile?.skills) ? initialProfile.skills.join(', ') : '',
        projects: initialProfile?.projects || [],
        experience: initialProfile?.experience || [],
        resumeUrl: initialProfile?.resumeUrl || '',
        linkedinUrl: initialProfile?.linkedinUrl || '',
        githubUrl: initialProfile?.githubUrl || '',
        portfolioUrl: initialProfile?.portfolioUrl || '',
      });
    }
  }, [user, initialProfile, isOpen]);

  if (!isOpen) return null;

  // Calculate section completions
  const secAcademic = Boolean(formData.rollNumber && formData.college && formData.course);
  const secSkills = Boolean(formData.skillsStr && formData.skillsStr.trim().length > 0);
  const secProjects = Boolean(formData.projects && formData.projects.length > 0);
  const secExp = Boolean(formData.experience && formData.experience.length > 0);
  const secLinks = Boolean(formData.resumeUrl || formData.linkedinUrl || formData.githubUrl || formData.portfolioUrl);

  const completedCount = [secAcademic, secSkills, secProjects, secExp, secLinks].filter(Boolean).length;
  const progressPercentage = completedCount * 20;
  const sectionDetails = {
    academic: { title: 'Academic details', description: 'Add your contact information and education background.', icon: BookOpen },
    skills: { title: 'Skills & technologies', description: 'Highlight the tools and technologies you work with.', icon: Code2 },
    projects: { title: 'Projects & portfolio', description: 'Showcase projects that demonstrate your experience.', icon: FolderGit2 },
    experience: { title: 'Work experience', description: 'Include internships and other relevant experience.', icon: Briefcase },
    links: { title: 'Resume & links', description: 'Help people discover your resume and professional profiles.', icon: LinkIcon },
  };
  const activeSection = sectionDetails[activeTab];
  const ActiveSectionIcon = activeSection.icon;

  // Project handlers
  const handleAddProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, { title: '', description: '', techStack: '', githubUrl: '', liveUrl: '' }],
    }));
  };

  const handleUpdateProject = (idx, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.projects];
      updated[idx][field] = value;
      return { ...prev, projects: updated };
    });
  };

  const handleRemoveProject = (idx) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx),
    }));
  };

  // Experience handlers
  const handleAddExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [...prev.experience, { company: '', role: '', duration: '', description: '' }],
    }));
  };

  const handleUpdateExperience = (idx, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.experience];
      updated[idx][field] = value;
      return { ...prev, experience: updated };
    });
  };

  const handleRemoveExperience = (idx) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await API.put('/auth/profile', formData);
      toast.success('Student profile updated successfully!');
      if (onProfileSaved) onProfileSaved(res.data.user, res.data.profile);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal fade show d-block spm-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-profile-modal-title"
      tabIndex="-1"
      style={{ zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable spm-dialog">
        <div className="modal-content spm-content">
          <div className="modal-header spm-header">
            <div className="spm-heading">
              <span className="spm-brand-icon"><GraduationCap size={23} /></span>
              <div>
                <span className="spm-eyebrow">STUDENT PROFILE</span>
                <h2 className="modal-title" id="student-profile-modal-title">Edit your profile</h2>
                <p>Build a profile that reflects your education and experience.</p>
              </div>
            </div>
            <button type="button" className="spm-close" onClick={onClose} aria-label="Close profile editor">
              <X size={19} />
            </button>
          </div>

          <div className="spm-progress-panel">
            <div className="spm-progress-copy">
              <div>
                <strong>Profile completeness</strong>
                <span>{completedCount} of 5 sections filled</span>
              </div>
              <span className="spm-progress-value">{progressPercentage}%</span>
            </div>
            <div className="progress spm-progress" role="progressbar" aria-label="Profile completeness" aria-valuenow={progressPercentage} aria-valuemin="0" aria-valuemax="100">
              <div className="progress-bar" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>

          <div className="spm-tabs" role="tablist" aria-label="Profile sections">
            <button
              type="button"
              id="student-profile-tab-academic"
              role="tab"
              aria-selected={activeTab === 'academic'}
              aria-controls="student-profile-tab-panel"
              className={`spm-tab ${activeTab === 'academic' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('academic')}
            >
              <BookOpen size={16} /><span>Academic</span>{secAcademic && <CheckCircle2 size={15} className="spm-tab-check" />}
            </button>
            <button
              type="button"
              id="student-profile-tab-skills"
              role="tab"
              aria-selected={activeTab === 'skills'}
              aria-controls="student-profile-tab-panel"
              className={`spm-tab ${activeTab === 'skills' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('skills')}
            >
              <Code2 size={16} /><span>Skills</span>{secSkills && <CheckCircle2 size={15} className="spm-tab-check" />}
            </button>
            <button
              type="button"
              id="student-profile-tab-projects"
              role="tab"
              aria-selected={activeTab === 'projects'}
              aria-controls="student-profile-tab-panel"
              className={`spm-tab ${activeTab === 'projects' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              <FolderGit2 size={16} /><span>Projects</span>{secProjects && <CheckCircle2 size={15} className="spm-tab-check" />}
            </button>
            <button
              type="button"
              id="student-profile-tab-experience"
              role="tab"
              aria-selected={activeTab === 'experience'}
              aria-controls="student-profile-tab-panel"
              className={`spm-tab ${activeTab === 'experience' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('experience')}
            >
              <Briefcase size={16} /><span>Experience</span>{secExp && <CheckCircle2 size={15} className="spm-tab-check" />}
            </button>
            <button
              type="button"
              id="student-profile-tab-links"
              role="tab"
              aria-selected={activeTab === 'links'}
              aria-controls="student-profile-tab-panel"
              className={`spm-tab ${activeTab === 'links' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('links')}
            >
              <LinkIcon size={16} /><span>Resume & links</span>{secLinks && <CheckCircle2 size={15} className="spm-tab-check" />}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="spm-form">
            <div className="modal-body spm-body">
              <div className="spm-section-heading">
                <div>
                  <span className="spm-step-label">SECTION {['academic', 'skills', 'projects', 'experience', 'links'].indexOf(activeTab) + 1} OF 5</span>
                  <h3>{activeSection.title}</h3>
                  <p>{activeSection.description}</p>
                </div>
                <span className="spm-section-icon"><ActiveSectionIcon size={21} /></span>
              </div>

              <div
                id="student-profile-tab-panel"
                role="tabpanel"
                aria-labelledby={`student-profile-tab-${activeTab}`}
                className="spm-tab-panel"
              >
                {/* Tab 1: Academic Info */}
                {activeTab === 'academic' && (
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small">Full Name</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small">Phone Number</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small">College / Institute</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        value={formData.college}
                        onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                        placeholder="e.g. ABC Institute of Technology"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small">Degree / Course</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        placeholder="e.g. B.Tech Computer Science"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small">Branch</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        placeholder="CSE / IT / ECE"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small">Semester</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        placeholder="e.g. 6th"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small">Roll / Enrollment No.</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        value={formData.rollNumber}
                        onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                        placeholder="2100450100"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small">CGPA / Aggregate %</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        value={formData.cgpa}
                        onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                        placeholder="8.5 / 85%"
                      />
                    </div>
                  </div>
                )}

              {/* Tab 2: Technical Skills */}
              {activeTab === 'skills' && (
                <div>
                  <label className="form-label text-secondary small fw-bold">
                    Technical & Programming Skills (Comma-separated)
                  </label>
                  <textarea
                    rows={4}
                    className="form-control bg-body-tertiary border text-body mb-3"
                    placeholder="JavaScript, React, Node.js, Python, SQL, C++, HTML/CSS, Git, Docker"
                    value={formData.skillsStr}
                    onChange={(e) => setFormData({ ...formData, skillsStr: e.target.value })}
                  />

                  <div className="small text-muted mb-2">Preview Skill Badges:</div>
                  <div className="d-flex flex-wrap gap-2 p-3 bg-body-tertiary rounded-3 border">
                    {formData.skillsStr
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean).length === 0 ? (
                      <span className="text-muted small">No skills entered yet.</span>
                    ) : (
                      formData.skillsStr
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((sk, idx) => (
                          <span key={idx} className="badge bg-primary bg-opacity-20 text-primary border-primary px-3 py-1">
                            {sk}
                          </span>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Projects & Portfolio */}
              {activeTab === 'projects' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="small text-secondary">Showcase your technical projects to recruiters</span>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-pill d-flex align-items-center gap-1"
                      onClick={handleAddProject}
                    >
                      <Plus size={15} /> Add Project
                    </button>
                  </div>

                  {formData.projects.length === 0 ? (
                    <div className="text-center py-4 border-dashed border rounded-3 text-muted">
                      No projects added yet. Click "+ Add Project" to showcase your work.
                    </div>
                  ) : (
                    formData.projects.map((proj, pIdx) => (
                      <div key={pIdx} className="card p-3 mb-3 border rounded-3 position-relative">
                        <button
                          type="button"
                          className="btn btn-sm text-danger position-absolute top-0 end-0 m-2"
                          onClick={() => handleRemoveProject(pIdx)}
                          title="Remove project"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="row g-2 me-4">
                          <div className="col-12 col-md-6">
                            <input
                              type="text"
                              className="form-control form-control-sm bg-body-tertiary border text-body"
                              placeholder="Project Title (e.g. AI Code Evaluator)"
                              value={proj.title}
                              onChange={(e) => handleUpdateProject(pIdx, 'title', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-md-6">
                            <input
                              type="text"
                              className="form-control form-control-sm bg-body-tertiary border text-body"
                              placeholder="Tech Stack (e.g. React, Node.js, MongoDB)"
                              value={proj.techStack}
                              onChange={(e) => handleUpdateProject(pIdx, 'techStack', e.target.value)}
                            />
                          </div>
                          <div className="col-12">
                            <textarea
                              rows={2}
                              className="form-control form-control-sm bg-body-tertiary border text-body"
                              placeholder="Brief description of key features and architecture..."
                              value={proj.description}
                              onChange={(e) => handleUpdateProject(pIdx, 'description', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-md-6">
                            <input
                              type="url"
                              className="form-control form-control-sm bg-body-tertiary border text-body"
                              placeholder="GitHub Repository URL"
                              value={proj.githubUrl}
                              onChange={(e) => handleUpdateProject(pIdx, 'githubUrl', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-md-6">
                            <input
                              type="url"
                              className="form-control form-control-sm bg-body-tertiary border text-body"
                              placeholder="Live Project URL"
                              value={proj.liveUrl}
                              onChange={(e) => handleUpdateProject(pIdx, 'liveUrl', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Work Experience */}
              {activeTab === 'experience' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="small text-secondary">Add internship or work experience</span>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-pill d-flex align-items-center gap-1"
                      onClick={handleAddExperience}
                    >
                      <Plus size={15} /> Add Experience
                    </button>
                  </div>

                  {formData.experience.length === 0 ? (
                    <div className="text-center py-4 border-dashed border rounded-3 text-muted">
                      No experience added yet. Click "+ Add Experience" to record internships.
                    </div>
                  ) : (
                    formData.experience.map((exp, eIdx) => (
                      <div key={eIdx} className="card p-3 mb-3 border rounded-3 position-relative">
                        <button
                          type="button"
                          className="btn btn-sm text-danger position-absolute top-0 end-0 m-2"
                          onClick={() => handleRemoveExperience(eIdx)}
                          title="Remove experience"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="row g-2 me-4">
                          <div className="col-12 col-md-4">
                            <input
                              type="text"
                              className="form-control form-control-sm bg-body-tertiary border text-body"
                              placeholder="Company Name (e.g. TCS)"
                              value={exp.company}
                              onChange={(e) => handleUpdateExperience(eIdx, 'company', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-md-4">
                            <input
                              type="text"
                              className="form-control form-control-sm bg-body-tertiary border text-body"
                              placeholder="Role (e.g. Frontend Intern)"
                              value={exp.role}
                              onChange={(e) => handleUpdateExperience(eIdx, 'role', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-md-4">
                            <input
                              type="text"
                              className="form-control form-control-sm bg-body-tertiary border text-body"
                              placeholder="Duration (e.g. Jun 2025 - Aug 2025)"
                              value={exp.duration}
                              onChange={(e) => handleUpdateExperience(eIdx, 'duration', e.target.value)}
                            />
                          </div>
                          <div className="col-12">
                            <textarea
                              rows={2}
                              className="form-control form-control-sm bg-body-tertiary border text-body"
                              placeholder="Key responsibilities and contributions..."
                              value={exp.description}
                              onChange={(e) => handleUpdateExperience(eIdx, 'description', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 5: Resume & Social Links */}
              {activeTab === 'links' && (
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label text-secondary small">Resume PDF Link (Google Drive / Cloudinary)</label>
                    <input
                      type="url"
                      className="form-control bg-body-tertiary border text-body"
                      placeholder="https://drive.google.com/file/d/..."
                      value={formData.resumeUrl}
                      onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      className="form-control bg-body-tertiary border text-body"
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small">GitHub Profile URL</label>
                    <input
                      type="url"
                      className="form-control bg-body-tertiary border text-body"
                      placeholder="https://github.com/username"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label text-secondary small">Personal Portfolio Website</label>
                    <input
                      type="url"
                      className="form-control bg-body-tertiary border text-body"
                      placeholder="https://myportfolio.com"
                      value={formData.portfolioUrl}
                      onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                    />
                  </div>
                </div>
              )}
              </div>
            </div>

            <div className="modal-footer spm-footer">
              <span className="spm-footer-note">Your profile details help personalize your ExamIQ experience.</span>
              <div className="spm-footer-actions">
                <button type="button" className="btn spm-cancel-button" onClick={onClose}>
                  Cancel
                </button>

                <button type="submit" className="btn spm-save-button" disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;
