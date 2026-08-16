import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { ShieldCheck, Activity } from 'lucide-react';

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/audit-logs');
      setLogs(res.data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Header Section */}
      <div className="mb-4 pb-2 border-bottom">
        <h3 className="fw-bold m-0 d-flex align-items-center gap-2 text-body">
          <ShieldCheck className="text-danger" size={26} /> Security Audit Trail
        </h3>
        <p className="text-secondary small mt-1 mb-0">
          Real-time system events, administrative changes, and IP audit logging.
        </p>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Retrieving security logs...</span>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 bg-body-tertiary overflow-hidden">
          <div className="table-responsive m-0">
            <table className="table table-hover align-middle m-0" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr className="text-secondary text-uppercase fs-7 border-bottom">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Resource</th>
                  <th className="py-3 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-secondary">
                      No audit logs logged yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td className="text-secondary px-3 py-3">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="fw-semibold text-body px-3 py-3">
                        {log.userId?.name || 'System / Anon'}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`badge ${log.role === 'admin'
                              ? 'bg-danger'
                              : log.role === 'faculty'
                                ? 'bg-warning text-dark'
                                : 'bg-primary'
                            }`}
                        >
                          {log.role}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <strong className="text-info">{log.action}</strong>
                      </td>
                      <td className="px-3 py-3">
                        <span className="badge bg-secondary">{log.resource}</span>
                      </td>
                      <td className="font-monospace text-secondary px-3 py-3">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;