import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Activity, ShieldAlert, LayoutDashboard, Settings, LogOut, User, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import NewShift from './pages/NewShift';
import EditShift from './pages/EditShift';
import ShiftDetails from './pages/ShiftDetails';
import Login from './pages/Login';

function App() {
  const location = useLocation();
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const isAuth = !!(token && token !== 'null' && token !== 'undefined' && token !== '');
    


    return {
      isAuthenticated: isAuth,
      isAdmin: localStorage.getItem('isAdmin') === 'true',
      isPrimaryAdmin: localStorage.getItem('isPrimaryAdmin') === 'true',
      userId: localStorage.getItem('userId'),
      username: localStorage.getItem('username') || ''
    };
  });

  // Share diagnostic info to window for easy console debugging
  useEffect(() => {
    window.__AUTH_DEBUG__ = { 
      token: !!localStorage.getItem('token'),
      storage: { ...localStorage },
      state: { ...auth } 
    };
    console.log("App Auth State Updated:", auth);
  }, [auth]);


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isPrimaryAdmin');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
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
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: '4.5rem', gap: '2rem' }}>
          
          {/* Logo (Far Left) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--accent-primary)', padding: '0.5rem', borderRadius: '12px' }}>
              <ShieldAlert size={22} color="white" />
            </div>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
              ShiftTracker
            </span>
          </div>

          {/* Nav Links (Center/Left) */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: '1rem' }}>
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
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    background: isActive ? 'var(--bg-surface)' : 'transparent',
                    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                    border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                    fontWeight: 500,
                    fontSize: '0.9rem',
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

          {/* Integrated Multi-User & Logout Block (Far Right) */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.1px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid var(--border-color)', padding: '0.25rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 1rem 0.4rem 0.6rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '100%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <User size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{auth.username}</span>
                  {(auth.isAdmin || auth.isPrimaryAdmin) && (
                    <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Admin
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Online</span>
              </div>
            </div>
            
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>
            
            <button 
              onClick={handleLogout}
              className="hover-bg-surface"
              title="Logout"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0 1rem',
                borderRadius: '10px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                height: '40px'
              }}
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
