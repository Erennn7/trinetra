import { useState, useRef, useCallback, type DragEvent, type ReactNode, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface RegionStat {
  crowd_level: string;
  mean_density: number;
  max_density?: number;
}

interface ImageAnalysis {
  estimated_count: number;
  crowd_level: string;
  confidence: number;
  highest_density_region: string;
  mean_density: number;
  max_density: number;
  regions: Record<string, RegionStat>;
}

interface VideoAnalysis {
  total_frames: number;
  total_people_detected: number;
  average_people_per_frame: number;
  max_people_in_frame: number;
  final_crowd_level: string;
  final_regions: Record<string, RegionStat>;
}

interface ImageResult {
  success: true;
  type: 'image';
  analysis: ImageAnalysis;
  images: { heatmap: string; blended: string; analysis: string };
}

interface VideoResult {
  success: true;
  type: 'video';
  analysis: VideoAnalysis;
  videos: { blended_video: string; heatmap_video: string };
  images: { final_heatmap: string; final_analysis: string };
}

type AnalysisResult = ImageResult | VideoResult;

const LEVEL_COLORS: Record<string, string> = {
  'Very Low': '#22c55e',
  'Low': '#4ade80',
  'Medium': '#facc15',
  'High': '#f97316',
  'Very High': '#ef4444',
  'Extremely High': '#dc2626',
};

function levelColor(level: string) {
  return LEVEL_COLORS[level] ?? '#a78bfa';
}

export default function CrowdDetection() {
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
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setResult(data as AnalysisResult);
      } else {
        setError(data.error || 'Analysis failed.');
      }
    } catch {
      setError('Network error — is the backend running on port 5000?');
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
          Crowd Detection
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '0.3rem', fontSize: '0.85rem' }}>
          Upload drone footage or images to analyze crowd density
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
          <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>📁</div>
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
          accept=".jpg,.jpeg,.png,.bmp,.tiff,.mp4,.avi,.mov,.mkv,.wmv"
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
            <p style={{ margin: 0, fontWeight: 500 }}>Analyzing… this may take a moment for videos</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div style={{ maxWidth: 960, margin: '1.5rem auto', padding: '0 1.5rem 4rem' }}>
          {result.type === 'image' ? <ImageResults data={result} /> : <VideoResults data={result} />}
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
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: color ?? '#fff' }}>{value}</div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{label}</div>
    </div>
  );
}

function ImageResults({ data }: { data: ImageResult }) {
  const a = data.analysis;
  return (
    <>
      <Card title="Analysis Summary">
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <StatBox label="Estimated People" value={a.estimated_count.toLocaleString()} />
          <StatBox label="Crowd Level" value={a.crowd_level} color={levelColor(a.crowd_level)} />
          <StatBox label="Confidence" value={`${(a.confidence * 100).toFixed(1)}%`} />
          <StatBox label="Highest Density" value={a.highest_density_region.replace(/_/g, ' ')} />
        </div>
      </Card>

      <Card title="Road Side Analysis">
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          {(['left_side', 'center', 'right_side'] as const).map((k) => {
            const r = a.regions[k];
            if (!r) return null;
            return (
              <div key={k} style={{
                flex: '1 1 180px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '1rem',
              }}>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                  {k.replace(/_/g, ' ').toUpperCase()}
                </div>
                <div style={{ color: levelColor(r.crowd_level), fontWeight: 500, fontSize: '0.85rem' }}>
                  {r.crowd_level}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  Density: {r.mean_density.toFixed(4)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Heatmap Visualizations">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {data.images.heatmap && (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Heatmap</p>
              <img src={`data:image/png;base64,${data.images.heatmap}`} alt="Heatmap" style={{ width: '100%', borderRadius: 8 }} />
            </div>
          )}
          {data.images.blended && (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Blended View</p>
              <img src={`data:image/jpeg;base64,${data.images.blended}`} alt="Blended" style={{ width: '100%', borderRadius: 8 }} />
            </div>
          )}
        </div>
        {data.images.analysis && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Detailed Analysis</p>
            <img src={`data:image/png;base64,${data.images.analysis}`} alt="Analysis" style={{ width: '100%', borderRadius: 8 }} />
          </div>
        )}
      </Card>
    </>
  );
}

function VideoResults({ data }: { data: VideoResult }) {
  const a = data.analysis;
  return (
    <>
      <Card title="Video Analysis Summary">
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <StatBox label="Total Frames" value={a.total_frames.toLocaleString()} />
          <StatBox label="Avg People / Frame" value={a.average_people_per_frame.toFixed(1)} />
          <StatBox label="Peak Count" value={a.max_people_in_frame.toLocaleString()} />
          <StatBox label="Crowd Level" value={a.final_crowd_level} color={levelColor(a.final_crowd_level)} />
        </div>
      </Card>

      <Card title="Road Side Distribution">
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          {(['left_side', 'center', 'right_side'] as const).map((k) => {
            const r = a.final_regions[k];
            if (!r) return null;
            return (
              <div key={k} style={{
                flex: '1 1 180px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '1rem',
              }}>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                  {k.replace(/_/g, ' ').toUpperCase()}
                </div>
                <div style={{ color: levelColor(r.crowd_level), fontWeight: 500 }}>{r.crowd_level}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  Density: {r.mean_density.toFixed(4)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Generated Videos">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Blended Video</p>
            <video key={data.videos.blended_video} controls style={{ width: '100%', borderRadius: 8 }}>
              <source src={data.videos.blended_video} type="video/mp4" />
            </video>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Heatmap Video</p>
            <video key={data.videos.heatmap_video} controls style={{ width: '100%', borderRadius: 8 }}>
              <source src={data.videos.heatmap_video} type="video/mp4" />
            </video>
          </div>
        </div>
      </Card>

      <Card title="Final Cumulative Heatmaps">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {data.images.final_heatmap && (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Final Heatmap</p>
              <img src={`data:image/png;base64,${data.images.final_heatmap}`} alt="Final Heatmap" style={{ width: '100%', borderRadius: 8 }} />
            </div>
          )}
          {data.images.final_analysis && (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Final Analysis</p>
              <img src={`data:image/png;base64,${data.images.final_analysis}`} alt="Final Analysis" style={{ width: '100%', borderRadius: 8 }} />
            </div>
          )}
        </div>
      </Card>
    </>
  );
}