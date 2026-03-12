import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, type Role } from '../context/AuthContext';

const ROLES: { value: Role; label: string; icon: string; desc: string }[] = [
  { value: 'user', label: 'Pilgrim / User', icon: '🙏', desc: 'Access maps, doctor help & lost persons' },
  { value: 'admin', label: 'Admin', icon: '🛡️', desc: 'Surveillance, weapons, crowd & security' },
  { value: 'medical_admin', label: 'Medical Admin', icon: '🏥', desc: 'Manage doctors & appointment queues' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await register(email, password, name, role);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
    color: '#fff', fontSize: '0.9rem', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem',
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#050508',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '460px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px', padding: '2.5rem',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', marginBottom: '1rem',
          }}>
            👁
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
            Create Account
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Join the Trinetra network
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Role selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Select Role</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  style={{
                    flex: 1, padding: '10px 6px', borderRadius: '10px', border: 'none',
                    background: role === r.value ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'rgba(255,255,255,0.04)',
                    color: role === r.value ? '#fff' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{r.icon}</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, lineHeight: 1.3 }}>{r.label}</div>
                </button>
              ))}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', marginTop: '0.4rem', textAlign: 'center' }}>
              {ROLES.find((r) => r.value === role)?.desc}
            </p>
          </div>

          {/* Name */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              placeholder="Min 6 characters"
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
            }}>
              <p style={{ color: '#ef4444', margin: 0, fontSize: '0.8rem' }}>⚠️ {error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: loading ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
            }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', textAlign: 'center', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', textAlign: 'center', marginTop: '0.5rem' }}>
          Are you a doctor?{' '}
          <Link to="/doctor-signup" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 600 }}>
            Sign up as Doctor 🩺
          </Link>
        </p>
      </div>
    </div>
  );
}
