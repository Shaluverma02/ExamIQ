import React from 'react';
import { FolderOpen } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'Nothing here yet',
  description = 'Items will appear here when they are available.',
  actionLabel = '',
  onAction = null,
  className = '',
}) => {
  return (
    <div className={`card app-empty-state text-center py-5 px-4 d-flex flex-column align-items-center justify-content-center ${className}`}>
      <div className="icon-box mb-3">
        <Icon size={26} aria-hidden="true" />
      </div>
      <h2 className="h5 fw-bold mb-2">{title}</h2>
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
