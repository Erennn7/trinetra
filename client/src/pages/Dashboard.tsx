import { useNavigate } from 'react-router-dom';
import TiltedCard from '../components/TiltedCard';

const features = [
  {
    id: 'ai-guided-map',
    title: 'AI-Guided Map',
    description: 'AI-powered navigation & routing system',
    imageSrc: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=400&fit=crop',
    badge: 'Navigation',
    route: '',
  },
  {
    id: 'crowd-detection',
    title: 'Crowd Detection',
    description: 'Real-time crowd density monitoring',
    imageSrc: 'https://images.unsplash.com/photo-1541535881652-c7fb6e252778?w=400&h=400&fit=crop',
    badge: 'Live',
    route: '/crowd-detection',
  },
  {
    id: 'gun-detection',
    title: 'Weapon Detection',
    description: 'Real-time weapon identification system',
    imageSrc: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&h=400&fit=crop',
    badge: 'Security',
    route: '/weapon-detection',
  },
  {
    id: 'image-recognition',
    title: 'Image Recognition',
    description: 'Advanced image processing & analysis',
    imageSrc: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=400&fit=crop',
    badge: 'AI',
    route: '/image-recognition',
  },
  {
    id: 'lost-and-found',
    title: 'Lost & Found',
    description: 'Facial recognition for missing persons',
    imageSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    badge: 'Biometric',
    route: '/lost-and-found',
  },
  {
    id: 'disaster-prediction',
    title: 'Disaster Prediction',
    description: 'Mahakumbh disaster forecasting system',
    imageSrc: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=400&fit=crop',
    badge: 'Prediction',
    route: '',
  },
  {
    id: 'Doctor Assistance',
    title: 'Doctor Assistance',
    description: 'Realtime Doctor Assistance system',
    imageSrc: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop',
    badge: 'Health',
    route: '',
  },
  {
    id: 'trinetra',
    title: 'Trinetra Core',
    description: 'Main surveillance and control system',
    imageSrc: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=400&fit=crop',
    badge: 'Core',
    route: '',
  },
];

const CARD_W = 220;
const CARD_H = 260;

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', background: '#050508' }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem 1rem' }}>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Admin Dashboard
        </p>
        <h1 style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 700, margin: 0 }}>
          Trinetra Feature Modules
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
          {features.length} active modules — select one to manage
        </p>
        <div style={{ marginTop: '1.5rem', height: '1px', background: 'linear-gradient(to right, rgba(255,255,255,0.08), transparent)' }} />
      </div>

      {/* Cards grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, ${CARD_W}px)`,
        justifyContent: 'center',
        gap: '3rem 2.5rem',
        padding: '2.5rem 2rem 6rem',
      }}>
        {features.map((feature) => (
          <div
            key={feature.id}
            onClick={() => feature.route && navigate(feature.route)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', cursor: feature.route ? 'pointer' : 'default' }}
          >
            <TiltedCard
              imageSrc={feature.imageSrc}
              altText={feature.title}
              containerHeight={`${CARD_H}px`}
              containerWidth={`${CARD_W}px`}
              imageHeight={`${CARD_H}px`}
              imageWidth={`${CARD_W}px`}
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent
              overlayContent={
                <div style={{ width: `${CARD_W}px`, height: `${CARD_H}px`, position: 'relative', pointerEvents: 'none' }}>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '2.5rem 0.85rem 0.85rem',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                    borderRadius: '0 0 15px 15px',
                  }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.55rem',
                      fontWeight: 700,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: '#c4b5fd',
                      background: 'rgba(167,139,250,0.18)',
                      border: '1px solid rgba(167,139,250,0.4)',
                      borderRadius: '4px',
                      padding: '2px 7px',
                      marginBottom: '0.35rem',
                    }}>
                      {feature.badge}
                    </span>
                    <p style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600, margin: 0, lineHeight: 1.35 }}>
                      {feature.title}
                    </p>
                  </div>
                </div>
              }
            />
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.7rem', textAlign: 'center', maxWidth: `${CARD_W}px`, margin: 0, lineHeight: 1.5 }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
