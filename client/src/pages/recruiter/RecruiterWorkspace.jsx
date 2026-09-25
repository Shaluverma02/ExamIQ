import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, Download, Plus, Search, Settings2, Target, Users } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import API from '../../services/api';

const pageConfig = {
  '/recruiter/drives': {
    eyebrow: 'Hiring Drives',
    title: 'Run structured hiring drives',
    description: 'Create an assessment brief, choose eligible batches, and move candidates through your screening pipeline.',
    icon: BriefcaseBusiness,
  },
  '/recruiter/talent': {
    eyebrow: 'Talent Pool',
    title: 'Review candidate talent',
    description: 'Search candidates by skill, score, and readiness before creating your interview shortlist.',
    icon: Users,
  },
  '/recruiter/rules': {
    eyebrow: 'Cutoff Rules',
    title: 'Define eligibility rules',
    description: 'Set transparent academic and assessment criteria for every hiring drive.',
    icon: Target,
  },
  '/recruiter/reports': {
    eyebrow: 'Recruiter Reports',
    title: 'Export hiring insights',
    description: 'Keep a clear record of scores, shortlist decisions, and assessment quality signals.',
    icon: Download,
  },
};

const RecruiterWorkspace = () => {
  const { pathname } = useLocation();
  const config = pageConfig[pathname] || pageConfig['/recruiter/drives'];
  const Icon = config.icon;
  const [query, setQuery] = useState('');
  const [created, setCreated] = useState(false);
  const [minimumScore, setMinimumScore] = useState(70);
  const [minimumCgpa, setMinimumCgpa] = useState(7);
  const [requiredSkill, setRequiredSkill] = useState('');
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [driveName, setDriveName] = useState('');
  const [assessmentType, setAssessmentType] = useState('coding');
  const [batch, setBatch] = useState('All eligible batches');
  const [brief, setBrief] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [drives, setDrives] = useState([]);
  const [reports, setReports] = useState({});

  useEffect(() => {
    const request = pathname === '/recruiter/talent'
      ? API.get('/recruiter/candidates').then((response) => setCandidates(response.data.candidates || []))
      : pathname === '/recruiter/reports'
        ? API.get('/recruiter/reports').then((response) => setReports(response.data.reports || {}))
        : API.get('/recruiter/drives').then((response) => setDrives(response.data.drives || []));
    request.catch((error) => console.error(error));
  }, [pathname]);

  const filteredCandidates = candidates.filter((candidate) => `${candidate.name} ${(candidate.skills || []).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const saveDrive = async () => {
    try {
      const response = await API.post('/recruiter/drives', { name: driveName || 'New hiring drive', assessmentType, batch, brief, status: 'draft' });
      setDrives((current) => [response.data.drive, ...current]);
      setCreated(true);
    } catch (error) {
      console.error(error);
    }
  };
  const saveRules = async () => {
    if (!selectedDriveId) return;
    try {
      await API.put(`/recruiter/drives/${selectedDriveId}`, { eligibility: { minimumScore: Number(minimumScore), minimumCgpa: Number(minimumCgpa), requiredSkill } });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="workspace-page">
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={(
          <Link to="/recruiter/dashboard" className="btn btn-outline-secondary">
            <ArrowLeft size={16} /> Dashboard
          </Link>
        )}
      />

      {pathname === '/recruiter/drives' && (
        <div className="row g-4">
          <div className="col-12 col-xl-7">
            <div className="card h-100">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <span className="icon-box"><Icon size={21} /></span>
                  <div><h5 className="fw-bold mb-1">New hiring drive</h5><p className="text-muted small mb-0">Set up the first screening round.</p></div>
                </div>
                <div className="row g-3">
                  <div className="col-12"><label className="form-label small fw-semibold">Drive name *</label><input className="form-control" placeholder="Frontend Engineer 2026" value={driveName} onChange={(event) => setDriveName(event.target.value)} required /></div>
                  <div className="col-12 col-md-6"><label className="form-label small fw-semibold">Assessment type</label><select className="form-select" value={assessmentType} onChange={(event) => setAssessmentType(event.target.value)}><option value="coding">Coding challenge</option><option value="mcq">MCQ screening</option><option value="combined">Combined assessment</option></select></div>
                  <div className="col-12 col-md-6"><label className="form-label small fw-semibold">Candidate batch</label><select className="form-select" value={batch} onChange={(event) => setBatch(event.target.value)}><option>Demo Institute · 2026</option><option>All eligible batches</option></select></div>
                  <div className="col-12"><label className="form-label small fw-semibold">Drive brief *</label><textarea className="form-control" rows="3" placeholder="Describe the role and screening expectations." value={brief} onChange={(event) => setBrief(event.target.value)} required /></div>
                </div>
                <button type="button" className="btn btn-primary mt-4" onClick={saveDrive}><Plus size={16} /> {created ? 'Drive saved' : 'Save drive'}</button>
              </div>
            </div>
          </div>
          <div className="col-12 col-xl-5"><div className="card h-100"><div className="card-body p-4"><div className="section-label mb-2">Active pipeline</div><h5 className="fw-bold mb-3">Current drives</h5>{drives.length === 0 ? <p className="text-muted small">No hiring drives created yet.</p> : drives.map((drive) => <div className="d-flex align-items-center gap-3 border-bottom py-3" key={drive._id}><span className="icon-box" style={{ width: 36, height: 36 }}><BriefcaseBusiness size={16} /></span><div className="min-width-0"><strong className="d-block text-truncate">{drive.name}</strong><span className="small text-muted">{drive.batch || 'All eligible batches'} · {drive.status}</span></div><ArrowRight size={16} className="ms-auto text-muted" /></div>)}</div></div></div>
        </div>
      )}

      {pathname === '/recruiter/talent' && (
        <div className="card"><div className="card-body p-4"><div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4"><div><div className="section-label mb-2">Candidate directory</div><h5 className="fw-bold mb-1">Shortlist talent</h5><p className="text-muted small mb-0">Showing candidates from active college drives.</p></div><div className="position-relative" style={{ width: 'min(100%, 280px)' }}><Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" /><input className="form-control ps-5" placeholder="Search candidate" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="table-responsive"><table className="table align-middle"><thead><tr className="small text-muted"><th>Candidate</th><th>Skills</th><th>Score</th><th>Status</th><th /></tr></thead><tbody>{filteredCandidates.map((candidate) => <tr key={candidate.id}><td><strong>{candidate.name}</strong><span className="d-block small text-muted">{candidate.college}</span></td><td className="small">{(candidate.skills || []).join(', ') || 'No skills added'}</td><td className="fw-bold">{candidate.score}%</td><td><span className={`badge ${candidate.resultStatus === 'Pass' ? 'bg-success' : 'bg-warning text-dark'}`}>{candidate.resultStatus}</span></td><td className="text-end"><button type="button" className="btn btn-sm btn-outline-primary">Review</button></td></tr>)}</tbody></table></div></div></div>
      )}

      {pathname === '/recruiter/rules' && (
        <div className="row g-4"><div className="col-12 col-lg-7"><div className="card"><div className="card-body p-4"><div className="d-flex align-items-center gap-3 mb-4"><span className="icon-box"><Settings2 size={21} /></span><div><h5 className="fw-bold mb-1">Eligibility policy</h5><p className="text-muted small mb-0">Candidates must meet every active rule.</p></div></div><label className="form-label small fw-semibold">Hiring drive</label><select className="form-select mb-3" value={selectedDriveId} onChange={(event) => setSelectedDriveId(event.target.value)}><option value="">Select a drive</option>{drives.map((drive) => <option key={drive._id} value={drive._id}>{drive.name}</option>)}</select><label className="form-label small fw-semibold">Minimum assessment score: {minimumScore}%</label><input type="range" className="form-range" min="40" max="95" value={minimumScore} onChange={(event) => setMinimumScore(event.target.value)} /><div className="row g-3 mt-2"><div className="col-md-6"><label className="form-label small fw-semibold">Minimum CGPA</label><input className="form-control" type="number" min="0" max="10" step="0.1" value={minimumCgpa} onChange={(event) => setMinimumCgpa(event.target.value)} /></div><div className="col-md-6"><label className="form-label small fw-semibold">Required skill</label><input className="form-control" placeholder="JavaScript" value={requiredSkill} onChange={(event) => setRequiredSkill(event.target.value)} /></div></div><button type="button" className="btn btn-primary mt-4" onClick={saveRules} disabled={!selectedDriveId}><CheckCircle2 size={16} /> Save rules</button></div></div></div><div className="col-12 col-lg-5"><div className="card"><div className="card-body p-4"><div className="section-label mb-2">Policy preview</div><h5 className="fw-bold mb-3">Ready for publishing</h5>{['Assessment score ≥ ' + minimumScore + '%', 'CGPA ≥ ' + minimumCgpa, requiredSkill ? 'Required skill: ' + requiredSkill : 'Required skill match'].map((rule) => <div className="d-flex align-items-center gap-2 border-bottom py-3" key={rule}><CheckCircle2 size={17} className="text-success" /><span className="small">{rule}</span></div>)}</div></div></div></div>
      )}

      {pathname === '/recruiter/reports' && (
        <div className="row g-3">{[['Assessment quality', `${reports.averageScore || 0}%`, 'Average score across active drives'], ['Shortlist conversion', `${reports.shortlistConversion || 0}%`, 'Candidates moved to interviews'], ['Review queue', reports.reviewQueue || 0, 'Profiles awaiting recruiter review']].map(([title, value, detail]) => <div className="col-12 col-md-4" key={title}><div className="card h-100"><div className="card-body p-4"><div className="section-label mb-2">{title}</div><div className="display-6 fw-bold mb-2">{value}</div><p className="small text-muted mb-0">{detail}</p></div></div></div>)}<div className="col-12"><div className="card"><div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"><div><h5 className="fw-bold mb-1">Hiring activity export</h5><p className="text-muted small mb-0">Download a snapshot of candidates and drive outcomes.</p></div><button type="button" className="btn btn-primary"><Download size={16} /> Export report</button></div></div></div></div>
      )}
    </div>
  );
};

export default RecruiterWorkspace;
