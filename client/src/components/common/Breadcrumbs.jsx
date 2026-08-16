import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="breadcrumb" className="mb-4">
      <ol className="breadcrumb bg-transparent p-0 m-0 small align-items-center">
        <li className="breadcrumb-item">
          <Link to="/" className="text-muted text-decoration-none d-inline-flex align-items-center gap-1 transition-all hover-primary">
            <Home size={15} /> <span>Home</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={index}
              className={`breadcrumb-item d-flex align-items-center ${isLast ? 'active fw-bold text-primary' : ''}`}
              aria-current={isLast ? 'page' : undefined}
            >
              <ChevronRight size={13} className="text-muted mx-2 flex-shrink-0" />
              {isLast || !item.path ? (
                <span className={isLast ? 'text-dark font-weight-semibold' : 'text-muted'}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.path} className="text-muted text-decoration-none transition-all hover-primary">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;