import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const SPECIALIZATIONS = [
  'General Physician',
  'Orthopedic',
  'Dermatology',
  'Pediatrics',
  'ENT',
  'Cardiology',
  'Neurology',
  'Ophthalmology',
  'Dentistry',
  'Ayurveda',
  'Homeopathy',
  'Emergency Medicine',
  'Other',
];

export default function DoctorSignup() {
  const navigate = useNavigate();

  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Doctor profile fields
  const [name, setName] = useState('');
  const [degree, setDegree] = useState('');
  const [specialization, setSpecialization] = useState(SPECIALIZATIONS[0]);
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!name.trim()) { setError('Full name is required'); return; }
    if (!degree.trim()) { setError('Degree / qualification is required'); return; }

    setError('');
    setLoading(true);
    try {
      // 1. Create Firebase Auth account
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Save user profile with role = 'doctor'
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email,
        name: name.trim(),
        role: 'doctor',
      });

      // 3. Save doctor details to doctors collection
      await addDoc(collection(db, 'doctors'), {
        name: name.trim(),
        degree: degree.trim(),
        specialization,
        phone: phone.trim(),
        experience: parseInt(experience) || 0,
        registeredBy: cred.user.uid,
        registeredByName: name.trim(),
        available: true,
        uid: cred.user.uid,
        createdAt: serverTimestamp(),
      });

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

  const accent = 'rgba(34,197,94,';

  return (
    <div style={{
      minHeight: '100vh', background: '#050508',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '520px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px', padding: '2.5rem',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', marginBottom: '1rem',
          }}>
            🩺
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
            Sign Up as Doctor
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Create your account & medical profile in one step
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── Account Section ── */}
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
            Account Details
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = `${accent}0.5)`}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                placeholder="doctor@example.com" />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = `${accent}0.5)`}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                placeholder="Min 6 characters" />
            </div>
          </div>

          {/* ── Medical Profile Section ── */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.5rem 0 1.25rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
            Medical Profile
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = `${accent}0.5)`}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              placeholder="Dr. John Doe" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Degree / Qualification</label>
              <input type="text" value={degree} onChange={(e) => setDegree(e.target.value)} required style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = `${accent}0.5)`}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                placeholder="MBBS, MD, BDS…" />
            </div>
            <div>
              <label style={labelStyle}>Specialization</label>
              <select value={specialization} onChange={(e) => setSpecialization(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s} style={{ background: '#1a1a2e', color: '#fff' }}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = `${accent}0.5)`}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                placeholder="+91 9876543210" />
            </div>
            <div>
              <label style={labelStyle}>Years of Experience</label>
              <input type="number" min="0" max="60" value={experience} onChange={(e) => setExperience(e.target.value)} style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = `${accent}0.5)`}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                placeholder="5" />
            </div>
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
              background: loading ? 'rgba(34,197,94,0.3)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
            }}
          >
            {loading ? 'Creating account…' : '🩺 Sign Up as Doctor'}
          </button>
        </form>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', textAlign: 'center', marginTop: '1.5rem' }}>
          Not a doctor?{' '}
          <Link to="/register" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
            Register as User / Admin
          </Link>
        </p>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', textAlign: 'center', marginTop: '0.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
