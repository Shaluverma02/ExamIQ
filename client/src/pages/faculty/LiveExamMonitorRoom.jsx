import '../../styles/faculty.css';
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { toast } from 'react-toastify';
import { ShieldAlert, Camera, Clock, UserCheck, AlertTriangle, RefreshCw, XOctagon } from 'lucide-react';

const LiveExamMonitorRoom = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [monitorData, setMonitorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchLiveMonitor();
      const interval = setInterval(fetchLiveMonitor, 5000); // Polling every 5 seconds
      return () => clearInterval(interval);
    }
  }, [selectedExamId]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await API.get('/exams');
      const pubExams = (res.data.exams || []).filter((e) => e.status === 'published');
      setExams(pubExams);
      if (pubExams.length > 0) {
        setSelectedExamId(pubExams[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveMonitor = async () => {
    if (!selectedExamId) return;
    try {
      setRefreshing(true);
      const res = await API.get(`/assessments/${selectedExamId}/live-monitor`);
      setMonitorData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleForceTerminate = async (attemptId, studentName) => {
    if (!window.confirm(`Are you sure you want to force terminate & submit ${studentName}'s exam attempt?`)) return;
    try {
      await API.post(`/assessments/${selectedExamId}/terminate-student`, {
        attemptId,
        reason: 'Faculty Force Terminated from Live Monitor',
      });
      toast.success(`Exam attempt for ${studentName} terminated`);
      fetchLiveMonitor();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to terminate attempt');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold text-body m-0 d-flex align-items-center gap-2">
            <Camera className="text-warning animate-pulse" size={26} /> Faculty Live Monitoring Room
          </h3>
          <p className="text-secondary small m-0">Real-time classroom proctoring grid showing active student timers, violations, and live feeds.</p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm rounded-pill font-monospace d-flex align-items-center gap-2"
          onClick={fetchLiveMonitor}
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? 'spinner-border spinner-border-sm' : ''} /> Refresh Live Feed
        </button>
      </div>

      {/* Control Card */}
      <div className="card p-4 rounded-3 border mb-4 ">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-8">
            <label className="form-label text-body fw-semibold small">Select Active Published Assessment</label>
            <select
              className="form-select bg-body-tertiary text-body border"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              disabled={loading}
            >
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.title} (Duration: {ex.duration} mins)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Real-time Grid */}
      {monitorData && (
        <div>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-4">
              <div className="card p-3 rounded-3 border text-center">
                <h3 className="fw-bold text-primary m-0">{monitorData.activeCount}</h3>
                <div className="text-muted extra-small">Students Actively Taking Test</div>
              </div>
            </div>
            <div className="col-6 col-md-4">
              <div className="card p-3 rounded-3 border text-center">
                <h3 className="fw-bold text-success m-0">{monitorData.submittedCount}</h3>
                <div className="text-muted extra-small">Completed Submissions</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card p-3 rounded-3 border text-center">
                <h3 className="fw-bold text-warning m-0">5s</h3>
                <div className="text-muted extra-small">Auto Refresh Interval</div>
              </div>
            </div>
          </div>

          <div className="row g-3">
            {monitorData.students?.map((std) => (
              <div key={std.attemptId} className="col-12 col-md-6 col-lg-4">
                <div className={`card p-4 rounded-3 border h-100 ${std.warningsCount >= 2 ? 'border-danger' : 'border'}`}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge ${std.status === 'started' ? 'bg-success' : 'bg-secondary'} font-monospace extra-small`}>
                        {std.status.toUpperCase()}
                      </span>
                      <span className="badge bg-danger font-monospace extra-small">
                        {std.warningsCount}/3 Warnings
                      </span>
                    </div>

                    {std.status === 'started' && (
                      <button
                        className="btn btn-outline-danger btn-sm py-1 px-2 extra-small rounded-pill"
                        onClick={() => handleForceTerminate(std.attemptId, std.studentName)}
                      >
                        <XOctagon size={12} /> Force Submit
                      </button>
                    )}
                  </div>

                  <h6 className="fw-bold text-body mb-1">{std.studentName}</h6>
                  <div className="text-muted extra-small font-monospace mb-3">{std.studentEmail} | Roll: {std.studentRoll}</div>

                  {/* Snapshot Feed */}
                  <div className="position-relative bg-body-tertiary rounded border mb-2 overflow-hidden text-center d-flex align-items-center justify-content-center" style={{ height: 130 }}>
                    {std.latestSnapshot ? (
                      <img src={std.latestSnapshot} alt="Webcam Feed" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="text-muted extra-small">
                        <Camera size={24} className="mb-1" />
                        <div>No snapshot logged</div>
                      </div>
                    )}
                  </div>

                  <div className="d-flex justify-content-between text-muted extra-small font-monospace mt-2">
                    <span>MCQ: {std.answeredCount}</span>
                    <span>Coding: {std.codingCount}</span>
                    <span>Time: {Math.floor(std.remainingSeconds / 60)}m</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveExamMonitorRoom;
