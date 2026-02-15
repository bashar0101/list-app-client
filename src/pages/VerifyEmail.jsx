import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(res.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token]);

  return (
    <div className="auth-container">
      <div className="glass-card auth-card animate-fade-in" style={{ textAlign: 'center' }}>
        {status === 'verifying' && (
          <>
            <Loader className="animate-spin" size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h1>Verifying...</h1>
            <p>Please wait while we verify your email.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
            <h1>Verified!</h1>
            <p>{message}</p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
              Proceed to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
            <h1>Verification Failed</h1>
            <p>{message}</p>
            <Link to="/login" className="btn btn-outline" style={{ marginTop: '1rem', display: 'inline-block' }}>
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
