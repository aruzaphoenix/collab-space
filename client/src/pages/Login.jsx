import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const nav = useNavigate();

  const handleLogin = async () => {
    try {
      const { data } = await axios.post('/api/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Ubuntu, sans-serif' }}>
      <div style={{ border: '1px solid #ddd', padding: '32px', width: '100%', maxWidth: '380px' }}>
        <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>Sign In</h1>
        <p style={{ color: '#666', marginBottom: '24px', marginTop: '0' }}>Enter your credentials</p>

        {error && <p style={{ color: '#d32f2f', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

        <input
          style={{ width: '100%', marginBottom: '12px' }}
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <input
          style={{ width: '100%', marginBottom: '24px' }}
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <button
          onClick={handleLogin}
          style={{ width: '100%', padding: '12px', fontSize: '14px' }}
        >
          Sign In
        </button>

        <p style={{ color: '#666', fontSize: '14px', marginTop: '20px', textAlign: 'center', marginBottom: '0' }}>
          No account?{' '}
          <span
            onClick={() => nav('/register')}
            style={{ color: '#000', cursor: 'pointer', borderBottom: '1px solid #000' }}
          >
            Create one
          </span>
        </p>
      </div>
    </div>
  );
}