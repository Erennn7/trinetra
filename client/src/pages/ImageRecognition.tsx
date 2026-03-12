import { useState, useRef, useCallback, type DragEvent, type ReactNode, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface AnalysisResult {
  analysis_type: 'image' | 'video';
  crowd_level: string;
  estimated_people: number;
  police_required: boolean;
  police_count: number;
  medical_required: boolean;
  medical_staff_count: number;
  activities: string[];
  chokepoints_detected: boolean;
  emergency_access_clear: boolean;
  harm_likelihood: string;
  notes: string;
}

const LEVEL_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#facc15',
  high: '#f97316',
  very_high: '#ef4444',
  very_low: '#4ade80',
};

function levelColor(level: string) {
  return LEVEL_COLORS[level] ?? '#a78bfa';
}

function formatLevel(level: string) {
  return level.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ImageRecognition() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video'>('image');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const processFile = useCallback(async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      setError('Please upload an image or video file.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('File too large. Max 100 MB.');
      return;
    }

    setError(null);
    setResult(null);
    setPreviewType(isVideo ? 'video' : 'image');
    setPreview(URL.createObjectURL(file));
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/imgrec/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data as AnalysisResult);
      }
    } catch {
      setError('Network error — is the image-recognition backend running on port 5003?');
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', background: '#050508' }}>
      {/* Header */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem 0' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '0.4rem 1rem',
            fontSize: '0.8rem', marginBottom: '1.5rem',
          }}
        >
          ← Back to Dashboard
        </button>

        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 700, margin: 0 }}>
          Image Recognition &amp; Crowd Safety
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '0.3rem', fontSize: '0.85rem' }}>
          Upload images or videos for AI-powered crowd safety assessment (Gemini)
        </p>
        <div style={{ marginTop: '1.2rem', height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.08), transparent)' }} />
      </div>

      {/* Upload area */}
      <div style={{ maxWidth: 960, margin: '2rem auto', padding: '0 1.5rem' }}>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragOver ? '#a78bfa' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 16, padding: '3rem 2rem', textAlign: 'center',
            cursor: 'pointer', transition: 'border-color 0.2s',
            background: dragOver ? 'rgba(167,139,250,0.04)' : 'transparent',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🔍</div>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: '1rem', margin: 0 }}>
            Drop files here or click to browse
          </p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginTop: '0.4rem' }}>
            Images (JPG, PNG, BMP, TIFF) &bull; Videos (MP4, AVI, MOV) &bull; Max 100 MB
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.bmp,.tiff,.mp4,.avi,.mov,.mkv"
          hidden
          onChange={(e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, padding: '0.8rem 1.2rem', color: '#fca5a5', fontSize: '0.85rem',
          }}>
            {error}
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div style={{ maxWidth: 960, margin: '1.5rem auto', padding: '0 1.5rem' }}>
          <Card title="Preview">
            {previewType === 'image' ? (
              <img src={preview} alt="Preview" style={{ maxWidth: '100%', borderRadius: 8 }} />
            ) : (
              <video src={preview} controls style={{ maxWidth: '100%', borderRadius: 8 }} />
            )}
          </Card>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ maxWidth: 960, margin: '1.5rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <div style={{
            background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
            borderRadius: 12, padding: '2rem', color: '#c4b5fd',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', animation: 'spin 1.2s linear infinite' }}>⏳</div>
            <p style={{ margin: 0, fontWeight: 500 }}>Analyzing with Gemini AI… this may take a moment</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div style={{ maxWidth: 960, margin: '1.5rem auto', padding: '0 1.5rem 4rem' }}>
          <AnalysisResults data={result} />
        </div>
      )}
    </div>
  );
}

/* ───── Sub-components ───── */

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '1.2rem 1.4rem', marginBottom: '1.2rem',
    }}>
      <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 1rem' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '1rem 1.2rem',
      flex: '1 1 140px', minWidth: 140,
    }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: color ?? '#fff' }}>{value}</div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{label}</div>
    </div>
  );
}

function BoolBadge({ value, trueLabel, falseLabel }: { value: boolean; trueLabel: string; falseLabel: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
      background: value ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
      color: value ? '#fca5a5' : '#86efac',
      border: `1px solid ${value ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
    }}>
      {value ? trueLabel : falseLabel}
    </span>
  );
}

function AnalysisResults({ data }: { data: AnalysisResult }) {
  return (
    <>
      {/* Main Stats */}
      <Card title="Assessment Overview">
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <StatBox label="Estimated People" value={data.estimated_people.toLocaleString()} />
          <StatBox label="Crowd Level" value={formatLevel(data.crowd_level)} color={levelColor(data.crowd_level)} />
          <StatBox label="Harm Likelihood" value={formatLevel(data.harm_likelihood)} color={levelColor(data.harm_likelihood)} />
          <StatBox label="Analysis Type" value={data.analysis_type === 'image' ? 'Image' : 'Video'} />
        </div>
      </Card>

      {/* Safety & Staffing */}
      <Card title="Safety Recommendations">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {/* Police */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '1rem 1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>🚔 Police Deployment</span>
              <BoolBadge value={data.police_required} trueLabel="Required" falseLabel="Not Required" />
            </div>
            {data.police_required && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', margin: 0 }}>
                Recommended: <strong style={{ color: '#fff' }}>{data.police_count}</strong> personnel
              </p>
            )}
          </div>

          {/* Medical */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '1rem 1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>🏥 Medical Staff</span>
              <BoolBadge value={data.medical_required} trueLabel="Required" falseLabel="Not Required" />
            </div>
            {data.medical_required && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', margin: 0 }}>
                Recommended: <strong style={{ color: '#fff' }}>{data.medical_staff_count}</strong> staff
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Infrastructure */}
      <Card title="Infrastructure Assessment">
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '1rem 1.2rem', flex: '1 1 200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontSize: '0.85rem' }}>Chokepoints Detected</span>
              <BoolBadge value={data.chokepoints_detected} trueLabel="Yes" falseLabel="No" />
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '1rem 1.2rem', flex: '1 1 200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontSize: '0.85rem' }}>Emergency Access Clear</span>
              <BoolBadge value={!data.emergency_access_clear} trueLabel="Blocked" falseLabel="Clear" />
            </div>
          </div>
        </div>
      </Card>

      {/* Activities */}
      {data.activities.length > 0 && (
        <Card title="Observed Activities">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {data.activities.map((act, i) => (
              <span key={i} style={{
                background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
                borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', color: '#c4b5fd',
              }}>
                {act}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Notes */}
      {data.notes && (
        <Card title="Additional Notes">
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
            {data.notes}
          </p>
        </Card>
      )}
    </>
  );
}