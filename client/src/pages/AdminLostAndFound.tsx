import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── Types ──────────────────────────────────────────────────────────────────
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
  saved_file?: string;
  location?: string;
  verified_by?: string;
}

interface StreamResult {
  success: boolean;
  message: string;
  total_frames_scanned: number;
  detections: Detection[];
  person_found: boolean;
  error?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const API_URL = 'http://localhost:5001';
const STREAM_WEBRTC_URL = 'http://localhost:8889/webcam/';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  processing: { label: 'Processing', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  completed: { label: 'Found', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  not_found: { label: 'Not Found', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AdminLostAndFound() {
  const navigate = useNavigate();

  // All search requests
  const [requests, setRequests] = useState<SearchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'not_found'>('all');

  // Selected request for processing
  const [selectedRequest, setSelectedRequest] = useState<SearchRequest | null>(null);

  // Scan settings - OPTIMIZED for faster ~20s results
  const [scanMode, setScanMode] = useState<'stream' | 'video'>('stream');
  const [tolerance, setTolerance] = useState(0.55);
  const [frameSkip, setFrameSkip] = useState(15);  // Higher = faster (was 3)
  const [scanDuration, setScanDuration] = useState(20);  // Reduced from 45
  const [maxDetections, setMaxDetections] = useState(5);  // Early stop after N detections

  // Video upload (for video mode)
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<StreamResult | null>(null);
  const [scanError, setScanError] = useState('');

  // Stream preview
  const [streamOnline, setStreamOnline] = useState(false);
  const iframeKey = useRef(0);

  // ── Fetch all requests ───────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'search_requests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SearchRequest)));
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Check stream status ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const checkStream = async () => {
      try {
        const res = await fetch(`${STREAM_WEBRTC_URL}whep`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: 'v=0',
        });
        if (!cancelled) setStreamOnline(res.status !== 404);
      } catch {
        if (!cancelled) setStreamOnline(false);
      }
    };
    checkStream();
    const interval = setInterval(checkStream, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // ── Convert base64 to Blob ───────────────────────────────────────────
  const base64ToBlob = useCallback((base64: string): Blob => {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    return new Blob([array], { type: mime });
  }, []);

  // ── Process request (run scan) ───────────────────────────────────────
  const processRequest = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    setScanError('');
    setScanResult(null);

    try {
      // Update status to processing
      await updateDoc(doc(db, 'search_requests', selectedRequest.id), {
        status: 'processing',
      });

      // Convert target image base64 to File
      const imageBlob = base64ToBlob(selectedRequest.targetImageBase64);
      const imageFile = new File([imageBlob], 'target.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('person_image', imageFile);
      formData.append('tolerance', tolerance.toString());
      formData.append('frame_skip', frameSkip.toString());

      let result: StreamResult;

      if (scanMode === 'stream') {
        formData.append('max_seconds', scanDuration.toString());
        formData.append('max_detections', maxDetections.toString());  // Early termination
        const res = await fetch(`${API_URL}/api/detect-stream`, {
          method: 'POST',
          body: formData,
        });
        result = await res.json();
        console.log('Scan result:', result);
        console.log('Detections count:', result.detections?.length);
        if (result.detections?.length > 0) {
          console.log('First detection frame_image exists:', !!result.detections[0].frame_image);
        }
      } else {
        if (!videoFile) {
          throw new Error('Please select a video file');
        }
        formData.append('crowd_video', videoFile);
        const res = await fetch(`${API_URL}/api/detect`, {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();
        // Convert video result format to stream result format
        result = {
          success: json.success,
          message: json.message,
          total_frames_scanned: json.detection_summary?.total_frames || 0,
          detections: [], // Video endpoint doesn't return base64 frames directly
          person_found: json.detection_summary?.detected_frames > 0,
        };
        // If found, we need to fetch the detection frame
        if (result.person_found && json.detection_frame) {
          const frameRes = await fetch(`${API_URL}/api/view/${json.detection_frame}`);
          const frameBlob = await frameRes.blob();
          const reader = new FileReader();
          reader.onload = () => {
            result.detections = [{
              frame: 0,
              timestamp_sec: json.detection_summary?.detection_timestamps?.[0] || 0,
              frame_image: reader.result as string,
              face_crop: reader.result as string,
              bbox: [],
              engine: 'hybrid',
              score: 0.9,
            }];
            setScanResult(result);
          };
          reader.readAsDataURL(frameBlob);
        }
      }

      setScanResult(result);

      // Update Firestore with results (without base64 images to avoid size limits)
      const newStatus = result.person_found ? 'completed' : 'not_found';
      // Only save metadata to Firestore, not the full images (but include location!)
      const resultsForFirestore = (result.detections || []).map(det => ({
        frame: det.frame,
        timestamp_sec: det.timestamp_sec,
        bbox: det.bbox,
        engine: det.engine,
        score: det.score,
        saved_file: det.saved_file || null,
        location: det.location || 'East Nada Gate',
        verified_by: det.verified_by || 'Admin',
      }));
      
      await updateDoc(doc(db, 'search_requests', selectedRequest.id), {
        status: newStatus,
        results: resultsForFirestore,
        processedAt: serverTimestamp(),
      });

      // Update local state (keep full detections with images for display)
      setSelectedRequest((prev) => prev ? { ...prev, status: newStatus, results: result.detections || [] } : null);

    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed');
      // Revert status
      await updateDoc(doc(db, 'search_requests', selectedRequest.id), { status: 'pending' });
    } finally {
      setProcessing(false);
    }
  };

  // ── Filter requests ──────────────────────────────────────────────────
  const filteredRequests = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  // ── Stats ────────────────────────────────────────────────────────────
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    processing: requests.filter((r) => r.status === 'processing').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    not_found: requests.filter((r) => r.status === 'not_found').length,
  };

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', background: '#050508' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
          }}>
            🔍
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>
              Lost & Found — Admin
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              Process search requests from users
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { key: 'total', label: 'Total', value: stats.total, color: '#8b5cf6' },
            { key: 'pending', label: 'Pending', value: stats.pending, color: '#fbbf24' },
            { key: 'processing', label: 'Processing', value: stats.processing, color: '#60a5fa' },
            { key: 'completed', label: 'Found', value: stats.completed, color: '#4ade80' },
            { key: 'not_found', label: 'Not Found', value: stats.not_found, color: '#f87171' },
          ].map((s) => (
            <div key={s.key} style={{
              padding: '1rem 1.5rem', borderRadius: '12px', minWidth: '100px',
              background: `${s.color}10`, border: `1px solid ${s.color}33`,
              cursor: 'pointer',
            }} onClick={() => setFilter(s.key as typeof filter)}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {s.label}
              </p>
              <p style={{ color: s.color, fontSize: '1.8rem', fontWeight: 800, margin: '0.25rem 0 0' }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Main content: 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedRequest ? '1fr 1fr' : '1fr', gap: '2rem' }}>
          {/* Left: Request list */}
          <div>
            <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Search Requests {filter !== 'all' && `(${filter})`}
            </h2>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading...</div>
            ) : filteredRequests.length === 0 ? (
              <div style={{
                padding: '3rem', textAlign: 'center', borderRadius: '14px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>No requests found.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {filteredRequests.map((req) => {
                  const statusMeta = STATUS_META[req.status] || STATUS_META.pending;
                  const isSelected = selectedRequest?.id === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      style={{
                        padding: '1rem', borderRadius: '12px',
                        background: isSelected ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.025)',
                        border: `1px solid ${isSelected ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)'}`,
                        display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <img
                        src={req.targetImageBase64}
                        alt={req.personName}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {req.personName || 'Unknown'}
                          </h3>
                          <span style={{
                            padding: '3px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700,
                            background: statusMeta.bg, color: statusMeta.color,
                          }}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', margin: '0.25rem 0 0' }}>
                          by {req.userName} • {req.createdAt?.toDate().toLocaleDateString() || 'just now'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Processing panel */}
          {selectedRequest && (
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', padding: '1.5rem', position: 'sticky', top: '6rem', alignSelf: 'start',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  Process Request
                </h2>
                <button
                  onClick={() => { setSelectedRequest(null); setScanResult(null); setScanError(''); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              {/* Target person info */}
              <div style={{
                display: 'flex', gap: '1rem', padding: '1rem', marginBottom: '1.5rem',
                background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '12px',
              }}>
                <img
                  src={selectedRequest.targetImageBase64}
                  alt={selectedRequest.personName}
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px' }}
                />
                <div>
                  <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
                    {selectedRequest.personName || 'Unknown Person'}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', margin: 0 }}>
                    Reported by: {selectedRequest.userName}
                  </p>
                  {selectedRequest.personDescription && (
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: '0.5rem 0 0', lineHeight: 1.4 }}>
                      {selectedRequest.personDescription}
                    </p>
                  )}
                </div>
              </div>

              {/* Already processed? Show results */}
              {(selectedRequest.status === 'completed' || selectedRequest.status === 'not_found') && !scanResult && (
                <div style={{
                  padding: '1.5rem', borderRadius: '12px', textAlign: 'center',
                  background: selectedRequest.status === 'completed' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
                  border: `1px solid ${selectedRequest.status === 'completed' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                }}>
                  <p style={{ color: selectedRequest.status === 'completed' ? '#4ade80' : '#f87171', fontWeight: 700, margin: 0 }}>
                    {selectedRequest.status === 'completed' ? '✓ Person Found' : '✗ Not Found'}
                  </p>
                  {selectedRequest.results.length > 0 && (
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
                      {selectedRequest.results.length} detection(s) recorded
                    </p>
                  )}
                  <button
                    onClick={() => { setScanResult(null); setScanError(''); }}
                    style={{
                      marginTop: '1rem', padding: '8px 16px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', cursor: 'pointer',
                    }}
                  >
                    Re-scan
                  </button>
                </div>
              )}

              {/* Scan controls (for pending requests) */}
              {(selectedRequest.status === 'pending' || selectedRequest.status === 'processing') && !scanResult && (
                <>
                  {/* Mode selector */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
                      Scan Mode
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['stream', 'video'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setScanMode(m as 'stream' | 'video')}
                          style={{
                            flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                            background: scanMode === m ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(255,255,255,0.04)',
                            color: scanMode === m ? '#fff' : 'rgba(255,255,255,0.4)',
                            fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                          }}
                        >
                          {m === 'stream' ? '📡 Live Stream' : '📹 Upload Video'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stream preview */}
                  {scanMode === 'stream' && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{
                        aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden',
                        background: '#000', position: 'relative',
                      }}>
                        {streamOnline ? (
                          <iframe
                            key={iframeKey.current}
                            src={STREAM_WEBRTC_URL}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            allow="autoplay"
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Stream offline</p>
                          </div>
                        )}
                        <span style={{
                          position: 'absolute', top: '8px', right: '8px',
                          padding: '3px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700,
                          background: streamOnline ? 'rgba(74,222,128,0.9)' : 'rgba(248,113,113,0.9)',
                          color: '#000',
                        }}>
                          {streamOnline ? 'LIVE' : 'OFFLINE'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Video upload */}
                  {scanMode === 'video' && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <input
                        type="file"
                        ref={videoInputRef}
                        accept="video/*"
                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                        style={{ display: 'none' }}
                      />
                      <button
                        onClick={() => videoInputRef.current?.click()}
                        style={{
                          width: '100%', padding: '1.5rem', borderRadius: '10px',
                          border: '2px dashed rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.05)',
                          color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', cursor: 'pointer',
                        }}
                      >
                        {videoFile ? `📹 ${videoFile.name}` : 'Click to select video file'}
                      </button>
                    </div>
                  )}

                  {/* Parameters */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', display: 'block', marginBottom: '0.3rem' }}>
                        Tolerance: {tolerance}
                      </label>
                      <input
                        type="range"
                        min="0.3"
                        max="0.8"
                        step="0.05"
                        value={tolerance}
                        onChange={(e) => setTolerance(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', display: 'block', marginBottom: '0.3rem' }}>
                        Frame Skip: {frameSkip} (higher = faster)
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        value={frameSkip}
                        onChange={(e) => setFrameSkip(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    {scanMode === 'stream' && (
                      <>
                        <div>
                          <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', display: 'block', marginBottom: '0.3rem' }}>
                            Scan Duration: {scanDuration}s
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="60"
                            step="5"
                            value={scanDuration}
                            onChange={(e) => setScanDuration(parseInt(e.target.value))}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', display: 'block', marginBottom: '0.3rem' }}>
                            Max Detections: {maxDetections} (early stop)
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={maxDetections}
                            onChange={(e) => setMaxDetections(parseInt(e.target.value))}
                            style={{ width: '100%' }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Error */}
                  {scanError && (
                    <div style={{
                      padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem',
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    }}>
                      <p style={{ color: '#ef4444', margin: 0, fontSize: '0.8rem' }}>⚠️ {scanError}</p>
                    </div>
                  )}

                  {/* Run scan button */}
                  <button
                    onClick={processRequest}
                    disabled={processing || (scanMode === 'stream' && !streamOnline) || (scanMode === 'video' && !videoFile)}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                      background: processing ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                      cursor: processing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {processing ? '🔍 Scanning...' : '🔍 Start Scan'}
                  </button>
                </>
              )}

              {/* Scan results */}
              {scanResult && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{
                    padding: '1rem', borderRadius: '12px', marginBottom: '1rem',
                    background: scanResult.person_found ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                    border: `1px solid ${scanResult.person_found ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                  }}>
                    <p style={{ color: scanResult.person_found ? '#4ade80' : '#f87171', fontWeight: 700, margin: 0, fontSize: '1rem' }}>
                      {scanResult.person_found ? '✓ Person Found!' : '✗ Person Not Found'}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', margin: '0.5rem 0 0' }}>
                      Scanned {scanResult.total_frames_scanned} frames • {scanResult.detections.length} detection(s)
                    </p>
                  </div>

                  {/* Detection images */}
                  {scanResult.detections.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                      {scanResult.detections.slice(0, 4).map((det, idx) => (
                        <img
                          key={idx}
                          src={det.frame_image}
                          alt={`Detection ${idx + 1}`}
                          style={{ width: '100%', borderRadius: '8px', border: '2px solid rgba(74,222,128,0.3)' }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
