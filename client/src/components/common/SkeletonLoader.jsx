import React from 'react';

const SkeletonLoader = ({ count = 3, type = 'card' }) => {
  if (type === 'table') {
    return (
      <div className="d-flex flex-column gap-2 py-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-3 bg-secondary border animate-pulse"
            style={{ height: 48, opacity: 0.65 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="row g-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="col-12 col-md-4">
          <div
            className="card border-0 shadow-sm animate-pulse"
            style={{ height: 130, opacity: 0.65, backgroundColor: 'var(--bg-secondary)' }}
          />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;