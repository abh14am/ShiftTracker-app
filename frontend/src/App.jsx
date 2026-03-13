import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, ShieldAlert, LayoutDashboard, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import NewShift from './pages/NewShift';
import EditShift from './pages/EditShift';
import ShiftDetails from './pages/ShiftDetails';

function App() {
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'New Handover', path: '/new', icon: Activity },
    { name: 'Admin Config', path: '/admin', icon: Settings },
  ];

  return (
    <div className="min-h-screen pb-12">
      {/* Navigation Header */}
      <nav className="glass-panel" style={{ borderRadius: '0', borderTop: 'none', borderLeft: 'none', borderRight: 'none', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--accent-primary)', padding: '0.5rem', borderRadius: '12px' }}>
              <ShieldAlert size={24} color="white" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
              ShiftTracker
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || 
                              (link.path !== '/' && location.pathname.startsWith(link.path));
              
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                  className={isActive ? '' : 'hover-bg-surface'}
                >
                  <Icon size={18} />
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container" style={{ marginTop: '2rem' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<NewShift />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/shifts/:id" element={<ShiftDetails />} />
          <Route path="/shifts/:id/edit" element={<EditShift />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
