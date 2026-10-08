import React, { useEffect, useState } from 'react';
import { Building2, KeyRound, Mail, Phone, Plus, ShieldCheck, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import CollegeAdminForm from '../../components/CollegeAdminForm';


const CollegeAdminManagement = () => {
  const [colleges, setColleges] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [collegeResponse, adminResponse] = await Promise.all([
        API.get('/colleges'),
        API.get('/admin/college-admins'),
      ]);
      setColleges(collegeResponse.data?.colleges || []);
      setAdmins(adminResponse.data?.admins || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load college admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="workspace-page management-page">
      <PageHeader
        icon={ShieldCheck}
        eyebrow="Super Admin"
        title="College Admins"
        description="Create institution administrators who can run their own college workspace and manage faculty operations."
        actions={<Button variant="outline-primary" onClick={loadData} loading={loading}>Refresh</Button>}
      />

      <div className="workspace-summary" aria-label="Administrator overview">
        <div className="workspace-summary-item"><Building2 size={18} /><strong>{loading ? '—' : colleges.length}</strong> institutions</div>
        <div className="workspace-summary-item"><ShieldCheck size={18} /><strong>{loading ? '—' : admins.length}</strong> college administrators</div>
      </div>

      <div className="row g-4 align-items-start">
        <div className="col-12 col-xl-5">
          <div className="card">
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <span className="icon-box"><UserPlus size={21} /></span>
                <div><h5 className="mb-1">Add college admin</h5><p className="text-muted small mb-0">Assign one admin to one institution.</p></div>
              </div>
              <CollegeAdminForm colleges={colleges} onSuccess={loadData}/>

            </div>
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div className="card">
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-3 mb-4"><span className="icon-box"><ShieldCheck size={21} /></span><div><h5 className="mb-1">Active college admins</h5><p className="text-muted small mb-0">Admins created by the super admin hierarchy.</p></div></div>
              {loading ? <div className="loading-panel"><div className="spinner-border text-primary" role="status" /></div> : admins.length === 0 ? <EmptyState title="No college admins yet" description="Create the first college administrator from the form." /> : <div className="vstack gap-2">{admins.map((membership) => <div className="action-card" key={membership._id}><span className="icon-box"><Building2 size={19} /></span><span className="min-width-0"><strong className="d-block text-truncate">{membership.userId?.name || 'College admin'}</strong><span className="small text-muted d-block text-truncate">{membership.userId?.email}</span><span className="small text-primary d-block text-truncate">{membership.collegeId?.name || 'College'}</span></span></div>)}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeAdminManagement;
