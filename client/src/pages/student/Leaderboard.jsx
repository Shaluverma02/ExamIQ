import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Trophy, Award, Search, User, Zap, Target, ShieldCheck, Flame, Medal, Sparkles, Filter } from 'lucide-react';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [exams, setExams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilters();
    fetchLeaderboard();
  }, []);

  const fetchFilters = async () => {
    try {
      const [exRes, grpRes] = await Promise.all([
        API.get('/exams?status=published'),
        API.get('/groups').catch(() => ({ data: { groups: [] } })),
      ]);
      setExams(exRes.data.exams || []);
      setGroups(grpRes.data.groups || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaderboard = async (examId = selectedExam, groupId = selectedGroup) => {
    try {
      setLoading(true);
      const params = {};
      if (examId) params.examId = examId;
      if (groupId) params.groupId = groupId;

      const res = await API.get('/leaderboard', { params });
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExamChange = (e) => {
    const val = e.target.value;
    setSelectedExam(val);
    fetchLeaderboard(val, selectedGroup);
  };

  const handleGroupChange = (e) => {
    const val = e.target.value;
    setSelectedGroup(val);
    fetchLeaderboard(selectedExam, val);
  };

  // Helper to compute candidate badges
  const getBadges = (row) => {
    const badges = [];
    if (row.percentage >= 90) {
      badges.push({ name: '🎯 MCQ Master', color: 'bg-primary text-white' });
    }
    if (row.totalScore >= 80) {
      badges.push({ name: '⚡ Lightning Coder', color: 'bg-warning text-dark' });
    }
    if (row.status === 'Pass') {
      badges.push({ name: '🛡️ Cheat-Free', color: 'bg-success text-white' });
    }
    if (row.rank <= 3) {
      badges.push({ name: '🔥 7-Day Streak', color: 'bg-danger text-white' });
    }
    return badges;
  };

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold text-light m-0 d-flex align-items-center gap-2">
            <Trophy className="text-warning animate-bounce" size={28} /> Gamified Global Leaderboard
          </h3>
          <p className="text-muted small m-0 mt-1">Real-time candidate rankings, accuracy ratings, & earnable achievement badges</p>
        </div>

        {/* Filters */}
        <div className="d-flex gap-2 flex-wrap">
          <div style={{ width: 180 }}>
            <select
              className="form-select bg-secondary text-light border-secondary small fw-semibold"
              value={selectedGroup}
              onChange={handleGroupChange}
            >
              <option value="">All Groups</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div style={{ width: 220 }}>
            <select
              className="form-select bg-secondary text-light border-secondary small fw-semibold"
              value={selectedExam}
              onChange={handleExamChange}
            >
              <option value="">All Published Exams</option>
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>{ex.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Top 3 Champions Podium Cards */}
      {!loading && leaderboard.length >= 3 && (
        <div className="row g-3 mb-4 align-items-end justify-content-center">
          {/* 2nd Place */}
          {top2 && (
            <div className="col-12 col-md-4">
              <div className="glass-card p-4 text-center border-secondary position-relative">
                <div className="position-absolute top-0 start-50 translate-middle badge bg-secondary px-3 py-2 fs-6 rounded-pill border">
                  🥈 2nd Place
                </div>
                <div className="pt-3">
                  <div className="p-3 bg-secondary rounded-circle d-inline-block mb-2 border">
                    <User size={36} className="text-light" />
                  </div>
                  <h5 className="fw-bold text-light mb-1">{top2.studentName}</h5>
                  <span className="text-muted small d-block mb-2">{top2.studentEmail}</span>
                  <div className="fw-extrabold text-warning fs-4 mb-2">{top2.totalScore} PTS</div>
                  <span className="badge bg-info">{top2.percentage}% Accuracy</span>
                </div>
              </div>
            </div>
          )}

          {/* 1st Place Champion */}
          {top1 && (
            <div className="col-12 col-md-4">
              <div className="glass-card p-4 text-center border-warning bg-warning bg-opacity-10 position-relative shadow-lg transform-scale">
                <div className="position-absolute top-0 start-50 translate-middle badge bg-warning text-dark px-4 py-2 fs-5 rounded-pill border border-warning shadow">
                  🏆 1st Champion
                </div>
                <div className="pt-4">
                  <div className="p-4 bg-warning bg-opacity-20 text-warning rounded-circle d-inline-block mb-2 border border-warning animate-bounce">
                    <Trophy size={48} />
                  </div>
                  <h4 className="fw-extrabold text-light mb-1">{top1.studentName}</h4>
                  <span className="text-muted small d-block mb-3">{top1.studentEmail}</span>

                  <div className="display-6 fw-extrabold text-warning mb-2">{top1.totalScore} PTS</div>
                  <div className="d-flex justify-content-center gap-1 flex-wrap">
                    <span className="badge bg-warning text-dark">⚡ Lightning Coder</span>
                    <span className="badge bg-success">🎯 100% Pass</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div className="col-12 col-md-4">
              <div className="glass-card p-4 text-center border-secondary position-relative">
                <div className="position-absolute top-0 start-50 translate-middle badge bg-danger px-3 py-2 fs-6 rounded-pill border">
                  🥉 3rd Place
                </div>
                <div className="pt-3">
                  <div className="p-3 bg-danger bg-opacity-20 text-danger rounded-circle d-inline-block mb-2 border border-danger">
                    <User size={36} />
                  </div>
                  <h5 className="fw-bold text-light mb-1">{top3.studentName}</h5>
                  <span className="text-muted small d-block mb-2">{top3.studentEmail}</span>
                  <div className="fw-extrabold text-warning fs-4 mb-2">{top3.totalScore} PTS</div>
                  <span className="badge bg-info">{top3.percentage}% Accuracy</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Leaderboard Table */}
      {loading ? (
        <div className="text-center py-5 text-light">Calculating real-time candidate rankings...</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-5 glass-card text-muted">No completed attempts recorded for leaderboard yet.</div>
      ) : (
        <div className="glass-card p-0 overflow-hidden border border-secondary shadow-lg rounded-4">
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle m-0" style={{ fontSize: '0.9rem' }}>
              <thead>
                <tr className="text-muted small text-uppercase border-bottom border-secondary">
                  <th className="px-4 py-3" style={{ width: 90 }}>Rank</th>
                  <th className="py-3">Candidate</th>
                  <th className="py-3">Assessment Title</th>
                  <th className="py-3">Score</th>
                  <th className="py-3">Accuracy %</th>
                  <th className="py-3">Earned Badges</th>
                  <th className="pe-4 py-3 text-end">Result</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row) => {
                  const candidateBadges = getBadges(row);
                  return (
                    <tr key={row.rank}>
                      <td className="px-4">
                        {row.rank === 1 ? (
                          <span className="badge bg-warning text-dark font-monospace fs-6">🥇 1st</span>
                        ) : row.rank === 2 ? (
                          <span className="badge bg-secondary font-monospace fs-6">🥈 2nd</span>
                        ) : row.rank === 3 ? (
                          <span className="badge bg-danger font-monospace fs-6">🥉 3rd</span>
                        ) : (
                          <span className="fw-bold text-muted font-monospace ps-2">#{row.rank}</span>
                        )}
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-primary bg-opacity-20 text-primary p-2 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                            <User size={18} />
                          </div>
                          <div>
                            <div className="fw-bold text-light">{row.studentName}</div>
                            <div className="text-secondary small">{row.studentEmail}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="text-light small">{row.examTitle}</span>
                      </td>

                      <td>
                        <strong className="text-warning font-monospace fs-6">{row.totalScore} PTS</strong>
                      </td>

                      <td>
                        <strong className="text-info font-monospace">{row.percentage}%</strong>
                      </td>

                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {candidateBadges.map((b, i) => (
                            <span key={i} className={`badge ${b.color} small`}>
                              {b.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="pe-4 text-end">
                        <span className={`badge ${row.status === 'Pass' ? 'bg-success' : 'bg-danger'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
