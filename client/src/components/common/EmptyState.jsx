import React from 'react';
import { FolderOpen } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No Data Found',
  description = 'There are no items to display at this moment.',
  actionLabel = '',
  onAction = null,
  className = '',
}) => {
  return (
    <div className={`card text-center py-5 px-4 d-flex flex-column align-items-center justify-content-center border-0 shadow-sm ${className}`}>
      <div className="rounded-circle p-3 mb-3 bg-secondary text-muted border">
        <Icon size={36} />
      </div>
      <h5 className="fw-bold mb-1">{title}</h5>
      <p className="text-muted small mb-4 lh-base" style={{ maxWidth: 400 }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;