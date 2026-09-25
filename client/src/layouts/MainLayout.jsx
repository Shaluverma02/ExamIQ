import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../layouts/Navbar';
import Sidebar from '../layouts/Sidebar';
import { AuthContext } from '../context/AuthContext';

const MainLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { role, user } = useContext(AuthContext);
  const closeSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  useEffect(() => { setMobileSidebarOpen(false); }, [pathname]);

  return (
    <div className="app-shell app-shell-auth" data-workspace={role || user?.role || 'student'}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className="app-sidebar-slot"><Sidebar /></div>
      <Sidebar isOpen={mobileSidebarOpen} onClose={closeSidebar} />
      <div className="app-workspace">
        <Navbar mobileSidebarOpen={mobileSidebarOpen}
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)} />
        <main id="main-content" className="app-main app-content" tabIndex={-1}>
          <div className="page-shell"><Outlet /></div>
          <footer className="workspace-footer"><span>ExamiQ <span aria-hidden="true">/</span> Assessment workspace</span><span>Learn. Practice. Progress.</span></footer>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
