import React, { useState } from 'react';
import Navbar from '../layouts/Navbar';
import Sidebar from '../layouts/Sidebar';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="vh-100 d-flex flex-column bg-body text-body overflow-hidden">
      {/* Navbar (Fixed Top) */}
      <Navbar
        onToggleMobileSidebar={() =>
          setMobileSidebarOpen((prev) => !prev)
        }
      />

      {/* Main Container Area */}
      <div className="container-fluid flex-grow-1 overflow-hidden px-3 px-md-4 py-3">
        <div className="row g-3 h-100">

          {/* Desktop Sidebar Column (Independent Scroll) */}
          <div className="col-md-3 col-lg-2 d-none d-md-block h-100">
            <div className="h-100 overflow-y-auto pe-1">
              <Sidebar />
            </div>
          </div>

          {/* Mobile Sidebar Drawer */}
          <div className="d-md-none">
            <Sidebar
              isOpen={mobileSidebarOpen}
              onClose={() => setMobileSidebarOpen(false)}
            />
          </div>

          {/* Main Content Area (Independent Scroll) */}
          <div className="col-12 col-md-9 col-lg-10 h-100 overflow-y-auto">
            <div className="card border-0 shadow-sm rounded-4 bg-card mb-4">
              <div className="card-body p-3 p-md-4">
                <Outlet />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MainLayout;