import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Activity, ShieldAlert, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import NewShift from './pages/NewShift';
import EditShift from './pages/EditShift';
import ShiftDetails from './pages/ShiftDetails';
import Login from './pages/Login';

function App() {
  const location = useLocation();
  const [auth, setAuth] = useState({
    isAuthenticated: !!localStorage.getItem('token'),
    isAdmin: localStorage.getItem('isAdmin') === 'true',
    isPrimaryAdmin: localStorage.getItem('isPrimaryAdmin') === 'true',
    userId: localStorage.getItem('userId'),
    username: ''
  });

  // Re-check auth on route change
  useEffect(() => {
    setAuth({
      isAuthenticated: !!localStorage.getItem('token'),
      isAdmin: localStorage.getItem('isAdmin') === 'true',
      isPrimaryAdmin: localStorage.getItem('isPrimaryAdmin') === 'true',
      userId: localStorage.getItem('userId'),
      username: '' // Username isn't strictly necessary for the global state here yet
    });
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isPrimaryAdmin');
    localStorage.removeItem('userId');
    setAuth({ isAuthenticated: false, isAdmin: false, isPrimaryAdmin: false, userId: null, username: '' });
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, adminOnly: false },
    { name: 'New Handover', path: '/new', icon: Activity, adminOnly: false },
    { name: 'Admin Config', path: '/admin', icon: Settings, adminOnly: true },
  ];

  if (!auth.isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login setAuth={setAuth} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

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

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {navLinks.map((link) => {
              if (link.adminOnly && !auth.isAdmin) return null;
              
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
            
            <button 
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s',
                marginLeft: '1rem'
              }}
              className="hover-bg-surface"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container" style={{ marginTop: '2rem' }}>
        <Routes>
          <Route path="/" element={<Dashboard userAuth={auth} />} />
          <Route path="/new" element={<NewShift userAuth={auth} />} />
          
          {/* Protected Admin Route */}
          <Route path="/admin" element={auth.isAdmin ? <Admin userAuth={auth} /> : <Navigate to="/" replace />} />
          
          <Route path="/shifts/:id" element={<ShiftDetails userAuth={auth} />} />
          <Route path="/shifts/:id/edit" element={<EditShift userAuth={auth} />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
