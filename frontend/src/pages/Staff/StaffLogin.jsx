import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function StaffLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('staff_token', data.token);
        localStorage.setItem('staff_counter', data.counter);
        localStorage.setItem('staff_username', data.username);
        navigate('/staff/dashboard');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Network error. Unable to connect to server.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto 0 auto' }}>
      <div className="glass-panel">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '1rem' }}>
            <Lock size={32} />
          </div>
          <h1 className="heading" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Staff Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Login to manage your counter</p>
        </div>

        {error && <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>Try: tea_staff | snacks_staff | meals_staff</small>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>Default: staff123</small>
          </div>

          <button type="submit" className="btn" style={{ marginTop: '1rem' }}>Secure Login</button>
        </form>
      </div>
    </div>
  );
}
