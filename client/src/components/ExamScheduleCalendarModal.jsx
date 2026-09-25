import React, { useState } from 'react';
import { Calendar, Clock, BookOpen, Layers, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

const ExamScheduleCalendarModal = ({ isOpen, onClose, assignments = [] }) => {
  if (!isOpen) return null;

  // Group assignments by date
  const sorted = [...assignments].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content card text-body border-info shadow-lg rounded-3 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-body-tertiary border-bottom border px-4 py-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 bg-info bg-opacity-20 text-info rounded-circle d-flex align-items-center justify-content-center">
                <Calendar size={22} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-body m-0">
                  Interactive Exam Schedule Calendar & Timeline
                </h5>
                <p className="text-muted small m-0">Timeline view of scheduled proctored assessments across all groups</p>
              </div>
            </div>

            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>

          {/* Body */}
          <div className="modal-body p-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            {sorted.length === 0 ? (
              <div className="text-center py-5 text-muted">No scheduled exam assignments found.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {sorted.map((item) => {
                  const exam = item.examId || {};
                  const isPublished = item.status === 'published';
                  return (
                    <div
                      key={item._id}
                      className={`p-3 rounded-3 border ${
                        isPublished ? 'bg-body-tertiary border-info' : 'bg-body-tertiary border'
                      } d-flex justify-content-between align-items-center flex-wrap gap-3`}
                    >
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className={`badge ${isPublished ? 'bg-info text-dark' : 'bg-warning text-dark'}`}>
                            {item.status?.toUpperCase() || 'SCHEDULED'}
                          </span>
                          <span className="text-muted small">Duration: {item.duration || exam.duration || 60} mins</span>
                        </div>
                        <h6 className="fw-bold text-body m-0">{item.title || exam.title}</h6>
                        <div className="text-muted small mt-1 d-flex align-items-center gap-2">
                          <Layers size={14} className="text-primary" />
                          <span>Groups: {item.groupIds?.map((g) => g.name || g.code).join(', ') || 'Individual'}</span>
                        </div>
                      </div>

                      <div className="text-end">
                        <div className="fw-bold text-warning small d-flex align-items-center gap-1 justify-content-end">
                          <Calendar size={14} /> {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                        </div>
                        <span className="text-muted small">Attempts Allowed: {item.attemptsAllowed}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-top border px-4 py-3 justify-content-end">
            <button className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose}>
              Close Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamScheduleCalendarModal;
