import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, BriefcaseBusiness, ClipboardCheck, FileSpreadsheet, Target, Users } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import API from '../../services/api';
import StatCard from '../../components/common/StatCard';

const recruiterCards = [
  {
    title: 'Hiring drives',
    description: 'Create coding challenges and hackathons across colleges with custom cutoffs and drive rules.',
    href: '/recruiter/drives',
    icon: BriefcaseBusiness,
    accent: '#2C4A9B',
  },
  {
    title: 'Talent pool',
    description: 'Shortlist candidates, review academic filters, and track eligibility across batches.',
    href: '/recruiter/talent',
    icon: Users,
    accent: '#2C7A7B',
  },
  {
    title: 'Cutoff rules',
    description: 'Set CGPA, passing marks, and challenge thresholds before publishing the drive.',
    href: '/recruiter/rules',
    icon: Target,
    accent: '#8B5FBF',
  },
  {
    title: 'Reports',
    description: 'Review code quality, plagiarism, shortlisted candidates, and interview-ready exports.',
    href: '/recruiter/reports',
    icon: FileSpreadsheet,
    accent: '#C8862E',
  },
];

const RecruiterDashboard = () => {
  const [overview, setOverview] = useState({ metrics: {}, drives: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/recruiter/overview')
      .then((response) => setOverview(response.data))
      .catch(() => setError('Unable to load hiring activity. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    { label: 'Active drives', value: overview.metrics.activeDrives || 0 },
    { label: 'Shortlisted', value: overview.metrics.shortlisted || 0 },
    { label: 'Plagiarism alerts', value: overview.metrics.plagiarismAlerts || 0 },
    { label: 'Avg. score', value: `${overview.metrics.averageScore || 0}%` },
  ];

  return (
  <div className="workspace-page management-page">
    <PageHeader
      icon={BriefcaseBusiness}
      eyebrow="Hiring Workspace"
      title="Hiring overview"
      description="Plan pair coding challenges, screen candidates, and export shortlisted talent for your next interview round."
      actions={(
        <Link to="/recruiter/drives" className="btn btn-primary">
          <ClipboardCheck size={16} /> Launch drive
        </Link>
      )}
    />
    {error && <div className="alert alert-danger mb-0" role="alert">{error}</div>}

    <div className="row g-3 mb-4">
      {metrics.map((metric) => (
        <div className="col-12 col-sm-6 col-xl-3" key={metric.label}>
          <StatCard label={metric.label} value={error ? '—' : metric.value} loading={loading} icon={metric.label === 'Active drives' ? BriefcaseBusiness : metric.label === 'Shortlisted' ? Users : metric.label === 'Avg. score' ? BarChart3 : Target} />
        </div>
      ))}
    </div>

    <div className="row g-3">
      {recruiterCards.map(({ title, description, href, icon: Icon, accent }) => (
        <div className="col-12 col-md-6" key={href}>
          <Link to={href} className="action-card text-decoration-none h-100">
            <span className="icon-box">
              <Icon size={21} />
            </span>
            <span className="min-width-0">
              <strong className="d-block mb-1 text-body">{title}</strong>
              <span className="small text-muted d-block">{description}</span>
            </span>
            <ArrowRight size={17} className="ms-auto text-muted" />
          </Link>
        </div>
      ))}
    </div>

    <div className="card mt-4">
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
          <div>
            <div className="section-label mb-1">Insights</div>
            <h5 className="fw-bold mb-0">Hiring performance snapshot</h5>
          </div>
          <Link to="/recruiter/reports" className="btn btn-outline-primary btn-sm">
            <BarChart3 size={15} /> Reports
          </Link>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="border rounded-4 p-3 h-100">
              <div className="small text-muted mb-1">Average coding score</div>
              <div className="fw-bold fs-4">{overview.metrics.averageScore || 0}%</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="border rounded-4 p-3 h-100">
              <div className="small text-muted mb-1">Students above cutoff</div>
              <div className="fw-bold fs-4">{overview.metrics.shortlisted || 0}</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="border rounded-4 p-3 h-100">
              <div className="small text-muted mb-1">Total hiring drives</div>
              <div className="fw-bold fs-4">{loading || error ? '—' : overview.metrics.totalDrives || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default RecruiterDashboard;
