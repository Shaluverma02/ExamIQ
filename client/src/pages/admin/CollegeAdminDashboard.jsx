import React, { useContext } from 'react';
import { ArrowRight, BookOpen, ClipboardList, FileCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { AuthContext } from '../../context/AuthContext';

const COLLEGE_ADMIN_ACCENT = '#8B5FBF';

const items = [
  {
    title: 'Faculty and students',
    description: 'Review people in your college workspace.',
    href: '/college-admin/users',
    icon: Users,
    accent: COLLEGE_ADMIN_ACCENT,
  },
  {
    title: 'Groups and batches',
    description: 'Organize students before assigning assessments.',
    href: '/college-admin/groups',
    icon: ClipboardList,
    accent: '#2C4A9B',
  },
  {
    title: 'Courses and categories',
    description: 'Maintain the academic structure used by your college teams.',
    href: '/college-admin/categories',
    icon: BookOpen,
    accent: '#2C7A7B',
  },
  {
    title: 'College analytics',
    description: 'Review assessment activity and outcomes for your institution.',
    href: '/college-admin/analytics',
    icon: FileCheck,
    accent: '#C8862E',
  },
];

const CollegeAdminDashboard = () => {
  const { activeCollege } = useContext(AuthContext);
  return (
  <div className="workspace-page management-page">
    <PageHeader
      icon={BookOpen}
      eyebrow="College Admin Workspace"
      title={activeCollege?.name || 'Your college workspace'}
      description="Manage faculty, students, batches, assessments, and results inside your assigned institution."
    />
    <section className="management-intro">
      <span className="section-label">College operations</span>
      <h2 className="mt-2 mb-0">Your institution, connected.</h2>
      <p>Start with your people and batches, then review how your students are performing.</p>
    </section>
    <div className="row g-3">
      {items.map(({ title, description, href, icon: Icon, accent }) => (
        <div className="col-12 col-md-6" key={href}>
          <Link to={href} className="action-card text-decoration-none h-100">
            <span
              className="icon-box"
            >
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
  </div>
  );
};

export default CollegeAdminDashboard;
