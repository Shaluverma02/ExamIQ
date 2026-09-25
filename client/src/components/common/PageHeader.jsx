import React from 'react';

const PageHeader = ({
  eyebrow,
  title,
  description,
  actions,
  icon: Icon,
  children,
  className = '',
}) => {
  return (
    <header className={`page-header ui-page-header ${className}`}>
      <div className="page-heading-group min-width-0">
        {Icon && <span className="page-heading-icon" aria-hidden="true"><Icon size={24} strokeWidth={1.7} /></span>}
        <div className="min-width-0">
        {eyebrow && <div className="page-eyebrow mb-2">{eyebrow}</div>}
        {title && <h1 className="page-title">{title}</h1>}
        {description && <p className="page-description">{description}</p>}
        {children}
        </div>
      </div>

      {actions && (
        <div className="page-actions d-flex flex-wrap align-items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
