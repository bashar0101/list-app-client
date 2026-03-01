import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { KeyRound } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setStatus('success');
      setMessage(res.data.data || 'Reset link sent to your email');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--primary)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <KeyRound color="white" />
          </div>
          <h1>Forgot Password</h1>
          <p style={{ color: 'var(--text-muted)' }}>Enter your email to reset your password</p>
        </div>

        {status === 'error' && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}
        {status === 'success' && <div style={{ color: 'var(--success)', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}

        {status !== 'success' && (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={status === 'loading'}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          Remember your password? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
