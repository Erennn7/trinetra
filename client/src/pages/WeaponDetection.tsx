import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────────────────────
interface PersonImage {
  image: string;
  confidence: number;
  bbox: number[];
}

interface FrameAnalysis {
  status: 'safe' | 'anomaly' | 'danger' | 'critical' | 'error';
  summary: string;
  weapons: string[];
  fighting_detected: boolean;
  fire_detected: boolean;
  suspicious_activity: boolean;
}

interface FrameResult {
  frame: number;
  timestamp_sec: number;
  analysis: FrameAnalysis;
  frame_screenshot?: string;
  person_images?: PersonImage[];
}

interface AnalysisResponse {
  success: boolean;
  results: FrameResult[];
  total_frames: number;
  threats_detected: number;
  error?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const API_URL = 'http://localhost:5002';

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
  safe:     { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.3)',  icon: '✓', label: 'Safe' },
  anomaly:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.3)', icon: '⚠', label: 'Anomaly' },
  danger:   { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.3)',  icon: '⛔', label: 'Danger' },
  critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.15)',  border: 'rgba(220,38,38,0.5)',  icon: '🚨', label: 'Critical' },
  error:    { color: '#6b7280', bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.3)', icon: '?', label: 'Error' },
};

const ALLOWED_EXT = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'jpg', 'jpeg', 'png'];

// ─── Utility Components ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.error;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: '6px', padding: '3px 10px',
    }}>
      <span>{cfg.icon}</span> {cfg.label}
    </span>
  );
}

function TagPill({ label, color = '#a78bfa' }: { label: string; color?: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '0.6rem', fontWeight: 600,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color, background: `${color}18`, border: `1px solid ${color}40`,
      borderRadius: '4px', padding: '2px 8px',
    }}>
      {label}
    </span>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function WeaponDetection() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<FrameResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // ── File handling ───────────────────────────────────────────────────────
  const handleFile = useCallback((f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXT.includes(ext)) {
      setError(`Unsupported file type. Allowed: ${ALLOWED_EXT.join(', ')}`);
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError('File size exceeds 100 MB limit.');
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
    setSelectedFrame(null);

    // Generate preview
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else if (f.type.startsWith('video/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  // ── Upload & Analyze ───────────────────────────────────────────────────
  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedFrame(null);
    setProgress(0);

    // Fake progress animation while waiting
    const interval = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + Math.random() * 8));
    }, 600);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data: AnalysisResponse = await res.json();
      clearInterval(interval);
      setProgress(100);

      if (!res.ok || !data.success) {
        setError(data.error || 'Analysis failed. Please try again.');
      } else {
        setResult(data);
        // Auto-select first threat frame if any
        const firstThreat = data.results.find(
          (r) => r.analysis.status !== 'safe' && r.analysis.status !== 'error'
        );
        setSelectedFrame(firstThreat || data.results[0] || null);
      }
    } catch (err: unknown) {
      clearInterval(interval);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Network error: ${message}. Make sure the API is running at ${API_URL}`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setSelectedFrame(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Computed Stats ─────────────────────────────────────────────────────
  const stats = result
    ? {
        total: result.total_frames,
        safe: result.results.filter((r) => r.analysis.status === 'safe').length,
        anomaly: result.results.filter((r) => r.analysis.status === 'anomaly').length,
        danger: result.results.filter((r) => r.analysis.status === 'danger').length,
        critical: result.results.filter((r) => r.analysis.status === 'critical').length,
        weaponsFound: [...new Set(result.results.flatMap((r) => r.analysis.weapons))],
        fightingFrames: result.results.filter((r) => r.analysis.fighting_detected).length,
        fireFrames: result.results.filter((r) => r.analysis.fire_detected).length,
      }
    : null;

  const overallStatus = stats
    ? stats.critical > 0
      ? 'critical'
      : stats.danger > 0
        ? 'danger'
        : stats.anomaly > 0
          ? 'anomaly'
          : 'safe'
    : null;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', background: '#050508' }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 2rem 0' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
            color: 'rgba(255,255,255,0.5)', padding: '6px 14px', fontSize: '0.75rem',
            cursor: 'pointer', marginBottom: '1.5rem', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)';
            e.currentTarget.style.color = '#c4b5fd';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          ← Back to Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.3rem' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
          }}>
            🔫
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0 }}>
              Security Module
            </p>
            <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>
              Weapon & Threat Detection
            </h1>
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
          Upload CCTV footage or images. AI will analyze each frame for weapons, fighting, fire, and suspicious activity.
        </p>
        <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(239,68,68,0.3), transparent)' }} />
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* ── Upload Area ─────────────────────────────────────────────── */}
        {!result && (
          <div style={{ display: 'grid', gridTemplateColumns: file ? '1fr 1fr' : '1fr', gap: '2rem', marginBottom: '2rem' }}>
            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '16px', padding: '3rem 2rem',
                background: dragActive ? 'rgba(167,139,250,0.05)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center',
                minHeight: '280px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXT.map((e) => `.${e}`).join(',')}
                onChange={onFileChange}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.4 }}>
                {file ? '📁' : '📤'}
              </div>
              {file ? (
                <>
                  <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: 0 }}>{file.name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <p style={{ color: 'rgba(167,139,250,0.7)', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                    Click to change file
                  </p>
                </>
              ) : (
                <>
                  <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                    Drop a video or image here
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    or click to browse
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem', marginTop: '1rem' }}>
                    Supported: MP4, AVI, MOV, MKV, WebM, JPG, PNG — Max 100 MB
                  </p>
                </>
              )}
            </div>

            {/* Preview */}
            {file && preview && (
              <div style={{
                borderRadius: '16px', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)', background: '#0a0b12',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '280px',
              }}>
                {file.type.startsWith('video/') ? (
                  <video
                    src={preview}
                    controls
                    style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '350px' }}
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '350px' }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Analyze button */}
        {file && !result && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button
              onClick={analyze}
              disabled={loading}
              style={{
                flex: 1, padding: '14px 28px', borderRadius: '12px', border: 'none',
                background: loading
                  ? 'rgba(239,68,68,0.3)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s', letterSpacing: '0.03em',
              }}
            >
              {loading ? 'Analyzing…' : '🔍  Analyze for Threats'}
            </button>
            {!loading && (
              <button
                onClick={reset}
                style={{
                  padding: '14px 24px', borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                  color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.85rem',
                  cursor: 'pointer', transition: 'all 0.3s',
                }}
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Progress bar */}
        {loading && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              width: '100%', height: '6px', borderRadius: '3px',
              background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: '3px',
                background: 'linear-gradient(90deg, #ef4444, #f59e0b)',
                width: `${progress}%`, transition: 'width 0.5s ease',
              }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center' }}>
              Analyzing frames with Gemini AI… This may take a minute for longer videos.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '1rem 1.5rem', borderRadius: '12px', marginBottom: '2rem',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          }}>
            <p style={{ color: '#ef4444', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* ── Results ─────────────────────────────────────────────────── */}
        {result && stats && (
          <>
            {/* Overall summary bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.25rem 1.5rem', borderRadius: '14px', marginBottom: '1.5rem',
              background: STATUS_CONFIG[overallStatus || 'safe'].bg,
              border: `1px solid ${STATUS_CONFIG[overallStatus || 'safe'].border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>
                  {overallStatus === 'critical' ? '🚨' : overallStatus === 'danger' ? '⛔' : overallStatus === 'anomaly' ? '⚠️' : '✅'}
                </span>
                <div>
                  <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    {overallStatus === 'safe' ? 'All Clear — No Threats Detected' :
                     overallStatus === 'anomaly' ? 'Suspicious Activity Detected' :
                     overallStatus === 'danger' ? 'Threats Detected!' :
                     'Critical Threats Detected!'}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', margin: '0.15rem 0 0' }}>
                    {stats.total} frames analyzed · {result.threats_detected} threat(s) found
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                style={{
                  padding: '8px 18px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
                  color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                New Analysis
              </button>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Total Frames', value: stats.total, color: '#8b5cf6' },
                { label: 'Safe', value: stats.safe, color: '#22c55e' },
                { label: 'Anomaly', value: stats.anomaly, color: '#f59e0b' },
                { label: 'Danger', value: stats.danger, color: '#ef4444' },
                { label: 'Critical', value: stats.critical, color: '#dc2626' },
                { label: 'Fighting', value: stats.fightingFrames, color: '#f97316' },
                { label: 'Fire', value: stats.fireFrames, color: '#ef4444' },
              ].map((s) => (
                <div key={s.label} style={{
                  padding: '1rem', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  textAlign: 'center',
                }}>
                  <p style={{ color: s.color, fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>{s.value}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', margin: '0.2rem 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Weapons found */}
            {stats.weaponsFound.length > 0 && (
              <div style={{
                padding: '1rem 1.5rem', borderRadius: '12px', marginBottom: '2rem',
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Weapons Identified
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {stats.weaponsFound.map((w) => (
                    <TagPill key={w} label={w} color="#ef4444" />
                  ))}
                </div>
              </div>
            )}

            {/* Frame detail + timeline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
              {/* Left — Selected frame detail */}
              <div style={{
                borderRadius: '14px', padding: '1.5rem',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {selectedFrame ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 0.25rem' }}>
                          Frame #{selectedFrame.frame} · {selectedFrame.timestamp_sec}s
                        </p>
                        <StatusBadge status={selectedFrame.analysis.status} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {selectedFrame.analysis.weapons.map((w) => <TagPill key={w} label={w} color="#ef4444" />)}
                        {selectedFrame.analysis.fighting_detected && <TagPill label="Fighting" color="#f97316" />}
                        {selectedFrame.analysis.fire_detected && <TagPill label="Fire" color="#ef4444" />}
                        {selectedFrame.analysis.suspicious_activity && <TagPill label="Suspicious" color="#f59e0b" />}
                      </div>
                    </div>

                    {/* Screenshot */}
                    {selectedFrame.frame_screenshot && (
                      <div style={{
                        borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem',
                        border: '1px solid rgba(255,255,255,0.08)', background: '#000',
                      }}>
                        <img
                          src={selectedFrame.frame_screenshot}
                          alt={`Frame ${selectedFrame.frame}`}
                          style={{ width: '100%', display: 'block' }}
                        />
                      </div>
                    )}

                    {/* Summary */}
                    <div style={{
                      padding: '1rem', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      marginBottom: '1rem',
                    }}>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 0.4rem' }}>
                        AI Analysis Summary
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem', margin: 0, lineHeight: 1.6 }}>
                        {selectedFrame.analysis.summary}
                      </p>
                    </div>

                    {/* Person images */}
                    {selectedFrame.person_images && selectedFrame.person_images.length > 0 && (
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 0.6rem' }}>
                          Detected Persons
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          {selectedFrame.person_images.map((p, i) => (
                            <div key={i} style={{
                              borderRadius: '10px', overflow: 'hidden',
                              border: '1px solid rgba(239,68,68,0.3)', width: '120px',
                            }}>
                              <img src={p.image} alt={`Person ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                              <div style={{ padding: '0.3rem 0.5rem', background: 'rgba(0,0,0,0.6)' }}>
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.6rem', margin: 0 }}>
                                  Conf: {(p.confidence * 100).toFixed(0)}%
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Select a frame from the timeline →</p>
                  </div>
                )}
              </div>

              {/* Right — Timeline */}
              <div style={{
                borderRadius: '14px', padding: '1rem',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                maxHeight: '600px', overflowY: 'auto',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 0.75rem', padding: '0 0.25rem' }}>
                  Frame Timeline
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {result.results.map((frame) => {
                    const isSelected = selectedFrame?.frame === frame.frame;
                    const cfg = STATUS_CONFIG[frame.analysis.status] || STATUS_CONFIG.error;
                    return (
                      <button
                        key={frame.frame}
                        onClick={() => setSelectedFrame(frame)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.65rem 0.75rem', borderRadius: '10px',
                          border: isSelected ? `1px solid ${cfg.border}` : '1px solid rgba(255,255,255,0.04)',
                          background: isSelected ? cfg.bg : 'transparent',
                          cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: cfg.color, flexShrink: 0,
                          boxShadow: frame.analysis.status !== 'safe' ? `0 0 6px ${cfg.color}` : 'none',
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600, margin: 0 }}>
                            {frame.timestamp_sec}s
                          </p>
                          <p style={{
                            color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', margin: '0.1rem 0 0',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {frame.analysis.summary}
                          </p>
                        </div>
                        <StatusBadge status={frame.analysis.status} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
