import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('Application render failed:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body px-3">
        <div className="card p-4" style={{ width: 'min(100%, 440px)' }} role="alert">
          <h1 className="h5">We could not display this page</h1>
          <p className="text-secondary">Please reload to get the latest version. If this continues, contact your institution administrator.</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reload page</button>
          <a className="btn btn-link mt-2" href="/">Return to home</a>
        </div>
      </div>
    );
  }
}
