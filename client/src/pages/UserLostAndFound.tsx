import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface SearchRequest {
  id: string;
  userId: string;
  userName: string;
  personName: string;
  personDescription: string;
  targetImageBase64: string;
  status: 'pending' | 'processing' | 'completed' | 'not_found';
  results: Detection[];
  createdAt: Timestamp | null;
  processedAt: Timestamp | null;
}

interface Detection {
  frame: number;
  timestamp_sec: number;
  frame_image: string;
  face_crop: string;
  bbox: number[];
  engine?: string;
  score?: number;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending Review', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  processing: { label: 'Processing', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  completed: { label: 'Found', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  not_found: { label: 'Not Found', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

export default function UserLostAndFound() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [requests, setRequests] = useState<SearchRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [personName, setPersonName] = useState('');
  const [personDescription, setPersonDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Selected request for viewing results
  const [selectedRequest, setSelectedRequest] = useState<SearchRequest | null>(null);

  // ── Fetch user's search requests ─────────────────────────────────────
  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(
      collection(db, 'search_requests'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SearchRequest)));
      setLoading(false);
    });
    return unsub;
  }, [profile?.uid]);

  // ── Handle image selection ───────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp'].includes(file.type)) {
      setSubmitError('Invalid image format. Use PNG, JPG, GIF, or BMP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Image too large. Max 5MB.');
      return;
    }
    setImageFile(file);
    setSubmitError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Submit search request ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !profile) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });

      await addDoc(collection(db, 'search_requests'), {
        userId: profile.uid,
        userName: profile.name,
        personName: personName.trim() || 'Unknown',
        personDescription: personDescription.trim(),
        targetImageBase64: base64,
        status: 'pending',
        results: [],
        createdAt: serverTimestamp(),
        processedAt: null,
      });

      setSubmitSuccess(true);
      setShowForm(false);
      setPersonName('');
      setPersonDescription('');
      setImageFile(null);
      setImagePreview(null);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
    color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem',
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem',
  };

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', background: '#050508' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
            color: 'rgba(255,255,255,0.5)', padding: '6px 14px', fontSize: '0.75rem',
            cursor: 'pointer', marginBottom: '1.5rem',
          }}
        >
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
            }}>
              🔍
            </div>
            <div>
              <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>
                Lost & Found
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                Report a missing person for our surveillance team to locate
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '12px 24px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            + Report Missing Person
          </button>
        </div>

        {/* Success toast */}
        {submitSuccess && (
          <div style={{
            padding: '1rem 1.5rem', borderRadius: '12px', marginBottom: '1.5rem',
            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <span style={{ color: '#4ade80', fontWeight: 600 }}>
              Request submitted successfully! Our team will process it shortly.
            </span>
          </div>
        )}

        {/* ── New Request Form Modal ─────────────────────────────────── */}
        {showForm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
          }}>
            <div style={{
              width: '100%', maxWidth: '500px',
              background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px', padding: '2rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                  Report Missing Person
                </h2>
                <button
                  onClick={() => { setShowForm(false); setSubmitError(''); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Image Upload */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>Photo of Person *</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  {imagePreview ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(59,130,246,0.5)' }}
                      />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        style={{
                          position: 'absolute', top: '-8px', right: '-8px',
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: '#ef4444', border: 'none', color: '#fff',
                          fontSize: '0.8rem', cursor: 'pointer',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: '100%', padding: '2rem', borderRadius: '12px',
                        border: '2px dashed rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.05)',
                        color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                      }}
                    >
                      <span style={{ fontSize: '2rem' }}>📷</span>
                      Click to upload a clear photo of the missing person
                    </button>
                  )}
                </div>

                {/* Person Name */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>Person's Name</label>
                  <input
                    type="text"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="Enter name if known"
                    style={inputStyle}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Description / Last Seen</label>
                  <textarea
                    value={personDescription}
                    onChange={(e) => setPersonDescription(e.target.value)}
                    placeholder="Clothing, location last seen, any identifying features..."
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Error */}
                {submitError && (
                  <div style={{
                    padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  }}>
                    <p style={{ color: '#ef4444', margin: 0, fontSize: '0.8rem' }}>⚠️ {submitError}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!imageFile || submitting}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                    background: !imageFile || submitting ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                    cursor: !imageFile || submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Search Request'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── My Requests List ───────────────────────────────────────── */}
        <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
          My Search Requests
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>Loading...</div>
        ) : requests.length === 0 ? (
          <div style={{
            padding: '3rem', textAlign: 'center', borderRadius: '16px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
              You haven't submitted any search requests yet.
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                marginTop: '1rem', padding: '10px 20px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none',
                color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              Report Missing Person
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {requests.map((req) => {
              const statusMeta = STATUS_META[req.status] || STATUS_META.pending;
              return (
                <div
                  key={req.id}
                  style={{
                    padding: '1.25rem', borderRadius: '14px',
                    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
                    cursor: req.status === 'completed' ? 'pointer' : 'default',
                  }}
                  onClick={() => req.status === 'completed' && setSelectedRequest(req)}
                >
                  {/* Person image */}
                  <img
                    src={req.targetImageBase64}
                    alt={req.personName}
                    style={{
                      width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px',
                      border: '2px solid rgba(255,255,255,0.1)',
                    }}
                  />

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                        {req.personName || 'Unknown Person'}
                      </h3>
                      <span style={{
                        padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                        background: statusMeta.bg, color: statusMeta.color,
                        border: `1px solid ${statusMeta.color}33`,
                      }}>
                        {statusMeta.label}
                      </span>
                    </div>

                    {req.personDescription && (
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: '0 0 0.5rem', lineHeight: 1.4 }}>
                        {req.personDescription}
                      </p>
                    )}

                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', margin: 0 }}>
                      Submitted {req.createdAt?.toDate().toLocaleString() || 'just now'}
                    </p>

                    {/* View Results button for completed */}
                    {req.status === 'completed' && req.results.length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); }}
                        style={{
                          marginTop: '0.75rem', padding: '6px 14px', borderRadius: '8px',
                          background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                          color: '#4ade80', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        👁 View {req.results.length} Detection{req.results.length > 1 ? 's' : ''}
                      </button>
                    )}

                    {req.status === 'not_found' && (
                      <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        No matches found in the scanned footage.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Detection Results Modal ────────────────────────────────── */}
        {selectedRequest && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
            overflowY: 'auto',
          }}>
            <div style={{
              width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
              background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px', padding: '2rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={selectedRequest.targetImageBase64}
                    alt="Target"
                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <div>
                    <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                      Search Results: {selectedRequest.personName}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                      {selectedRequest.results.length} detection{selectedRequest.results.length > 1 ? 's' : ''} found
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              {/* Detection grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {selectedRequest.results.map((det, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', overflow: 'hidden',
                  }}>
                    <img
                      src={det.frame_image}
                      alt={`Detection ${idx + 1}`}
                      style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.8rem' }}>
                          ✓ Match Found
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                          {det.timestamp_sec}s
                        </span>
                      </div>
                      {det.engine && (
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', margin: 0 }}>
                          Engine: {det.engine} {det.score ? `(${(det.score * 100).toFixed(1)}%)` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
