import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { errMsg } from '../api';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">ProjectHub <span className="brand-ai">AI</span></h1>
        <p className="muted center">AI-Powered Student Project Management System</p>

        <div className="tabs">
          <button className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => setMode('login')}>
            Log in
          </button>
          <button className={mode === 'register' ? 'tab active' : 'tab'} onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        <form onSubmit={submit} className="form">
          {mode === 'register' && (
            <>
              <label>Full name
                <input value={form.name} onChange={set('name')} required />
              </label>
              <label>I am a
                <select value={form.role} onChange={set('role')}>
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty member</option>
                </select>
              </label>
            </>
          )}
          <label>Email
            <input type="email" value={form.email} onChange={set('email')} required />
          </label>
          <label>Password
            <input type="password" value={form.password} onChange={set('password')} minLength={6} required />
          </label>
          {error && <div className="alert">{error}</div>}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
