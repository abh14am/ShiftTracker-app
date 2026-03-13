import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn } from 'lucide-react';
import api from '../api';

const Login = ({ setAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // OAuth2 requires form data, not JSON
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/auth/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, is_admin, is_primary_admin, user_id } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('isAdmin', is_admin);
      localStorage.setItem('isPrimaryAdmin', is_primary_admin);
      localStorage.setItem('userId', user_id);
      
      setAuth({ 
        isAuthenticated: true, 
        isAdmin: is_admin, 
        isPrimaryAdmin: is_primary_admin, 
        userId: user_id,
        username 
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '2.5rem',
        margin: '1rem'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'var(--accent-primary)', padding: '0.75rem', borderRadius: '16px', marginBottom: '1rem' }}>
            <ShieldAlert size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>ShiftTracker Login</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Sign in to manage and track your work.</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Username</label>
            <input 
              type="text" 
              className="input-field" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ marginTop: '0.5rem', justifyContent: 'center' }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
