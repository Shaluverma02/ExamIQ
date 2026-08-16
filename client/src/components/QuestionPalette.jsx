import React from 'react';

const QuestionPalette = ({ questions = [], currentIndex = 0, answers = [], onSelectQuestion }) => {
  return (
    <div className="glass-card p-3 rounded-3 border border-secondary shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
      <h6 className="fw-bold mb-3 text-light d-flex align-items-center justify-content-between">
        <span>Question Palette</span>
        <span className="badge bg-secondary small">{questions.length} Questions</span>
      </h6>

      {/* Palette Buttons Grid */}
      <div className="d-flex flex-wrap gap-2 mb-4" style={{ maxHeight: '280px', overflowY: 'auto' }}>
        {questions.map((q, idx) => {
          const ans = answers.find((a) => a.questionId?.toString() === q._id?.toString());

          let statusClass = 'bg-dark text-muted border border-secondary';
          if (idx === currentIndex) {
            statusClass = 'palette-current bg-primary text-white border border-primary shadow';
          } else if (ans?.isMarkedForReview) {
            statusClass = 'palette-review text-white border border-light';
          } else if (ans?.selectedOptions && ans.selectedOptions.length > 0) {
            statusClass = 'palette-answered bg-success text-white border border-success';
          } else if (ans?.isVisited) {
            statusClass = 'palette-skipped bg-danger text-white border border-danger';
          }

          return (
            <button
              key={q._id || idx}
              onClick={() => onSelectQuestion(idx)}
              className={`question-palette-btn btn btn-sm fw-bold d-flex align-items-center justify-content-center ${statusClass}`}
              style={{ width: '36px', height: '36px', borderRadius: '8px' }}
              title={`Question ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Legend / Status Indicators */}
      <div className="small border-top border-secondary pt-3 d-flex flex-column gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success rounded-circle p-2" style={{ width: '10px', height: '10px' }}></span>
          <span className="text-muted">Answered</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-danger rounded-circle p-2" style={{ width: '10px', height: '10px' }}></span>
          <span className="text-muted">Skipped / Visited</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge rounded-circle p-2" style={{ backgroundColor: '#8b5cf6', width: '10px', height: '10px' }}></span>
          <span className="text-muted">Marked for Review</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary rounded-circle p-2" style={{ width: '10px', height: '10px' }}></span>
          <span className="text-muted">Current Question</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;