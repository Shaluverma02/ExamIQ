import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Activity, RefreshCw, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/admin/audit-logs');
      setLogs(res.data.logs || []);
    } catch (e) {
      console.error(e);
      setError('Unable to load audit events. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-page management-page">
      <PageHeader
        icon={ShieldCheck}
        eyebrow="Security"
        title="Audit Trail"
        description="Review administrative changes, access events, and protected actions for the active college workspace."
        actions={<button className="btn btn-outline-primary" onClick={fetchLogs} disabled={loading}><RefreshCw size={16} /> Refresh</button>}
      />
      {error && <div className="alert alert-danger mb-0" role="alert">{error}</div>}

      <div className="card">
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
            <div className="d-flex align-items-center gap-3">
              <span className="icon-box"><ShieldCheck size={22} /></span>
              <div>
                <h5 className="fw-bold mb-1">Recent security events</h5>
                <p className="text-muted mb-0 small">{logs.length} events found</p>
              </div>
            </div>
            <span className="badge bg-secondary"><Activity size={13} /> Activity history</span>
          </div>

          {loading ? (
            <div className="loading-panel"><div className="spinner-border text-primary mb-3" /><p className="text-muted mb-0">Retrieving audit logs...</p></div>
          ) : logs.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No audit logs yet" description="Security activity will appear here once users start working in the system." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td className="text-muted text-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="fw-semibold">{log.userId?.name || 'System / Anonymous'}</td>
                      <td><span className={`badge ${log.role === 'admin' ? 'bg-danger' : log.role === 'faculty' ? 'bg-warning text-dark' : 'bg-primary'}`}>{log.role}</span></td>
                      <td><strong className="text-info">{log.action}</strong></td>
                      <td><span className="badge bg-secondary">{log.resource}</span></td>
                      <td className="font-monospace text-muted">{log.ipAddress || 'Not recorded'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;
