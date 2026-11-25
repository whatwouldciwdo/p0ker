import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { disconnectSocket } from '../socket/socketClient';

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cleanUser = username.trim();
      const res = await api.post('/api/auth/login', {
        username: cleanUser,
        email: cleanUser,
        password,
      });
      const { id, username: uname, chips } = res.data;
      disconnectSocket();
      setUser({ id, username: uname, chips });
      navigate('/lobby');
    } catch (err: unknown) {
      const data = (err as any)?.response?.data;
      const msg = data?.error || data?.message;
      setError(msg || 'Login gagal. Periksa username dan password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-suit">♠</span>
          <h1>P0ker</h1>
          <span className="logo-suit red">♥</span>
        </div>
        <h2>Masuk ke Permainan</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username Anda"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Memuat...' : 'Masuk'}
          </button>
        </form>
        <p className="auth-link">
          Belum punya akun? <Link to="/register">Daftar Tanpa Email</Link>
        </p>
      </div>
    </div>
  );
}
