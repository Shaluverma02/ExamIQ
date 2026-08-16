import React from 'react';

const StatCard = ({ icon: Icon, label, value, trend, trendType = 'neutral', className = '' }) => {
  return (
    <div className={`card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3 h-100 ${className}`}>
      {Icon && (
        <div
          className="rounded-3 p-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            color: 'var(--primary-color)',
            width: 52,
            height: 52,
          }}
        >
          <Icon size={24} />
        </div>
      )}

      <div className="flex-grow-1">
        <div className="text-muted fw-semibold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
          {label}
        </div>
        <h3 className="fw-bold m-0 mt-1 text-primary" style={{ fontSize: '1.5rem' }}>
          {value}
        </h3>
        {trend && (
          <div
            className={`small mt-1 fw-semibold d-flex align-items-center gap-1 ${trendType === 'positive' ? 'text-success' : trendType === 'negative' ? 'text-danger' : 'text-muted'
              }`}
            style={{ fontSize: '0.75rem' }}
          >
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;