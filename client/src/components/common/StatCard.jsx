import React from 'react';

const StatCard = ({ icon: Icon, label, value, trend, trendType = 'neutral', loading = false, className = '' }) => {
  const trendClass =
    trendType === 'positive' ? 'text-success' : trendType === 'negative' ? 'text-danger' : 'text-muted';

  return (
    <div className={`card stat-card ui-stat-card h-100 ${className}`} aria-busy={loading}>
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div className="min-width-0">
          <div className="stat-label mb-3">{label}</div>
          <div className={`stat-value ${loading ? 'stat-value-loading' : ''}`} aria-label={loading ? `Loading ${label}` : `${label}: ${value}`}>{loading ? <span aria-hidden="true">—</span> : value}</div>
          {trend && (
            <div className={`stat-trend mt-2 ${trendClass}`}>
              {trend}
            </div>
          )}
        </div>

        {Icon && (
          <div className="icon-box flex-shrink-0">
            <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
