import { useNavigate } from 'react-router-dom';
import { useAuth, type Role } from '../context/AuthContext';
import TiltedCard from '../components/TiltedCard';
import Squares from '../components/Squares';
import { useTheme } from '../components/use-theme';

interface Feature {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  badge: string;
  route: string;
  roles: Role[];
}

const features: Feature[] = [
  {
    id: 'lost-and-found',
    title: 'Lost & Found',
    description: 'Facial recognition for missing persons',
    imageSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    badge: 'Biometric',
    route: '/lost-and-found',
    roles: ['admin', 'user'],
  },
  {
    id: 'crowd-detection',
    title: 'Crowd Detection',
    description: 'Real-time crowd density monitoring',
    imageSrc: 'https://images.unsplash.com/photo-1541535881652-c7fb6e252778?w=400&h=400&fit=crop',
    badge: 'Live',
    route: '/crowd-detection',
    roles: ['admin'],
  },
  {
    id: 'gun-detection',
    title: 'Weapon Detection',
    description: 'Real-time weapon identification system',
    imageSrc: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&h=400&fit=crop',
    badge: 'Security',
    route: '/weapon-detection',
    roles: ['admin'],
  },
  {
    id: 'image-recognition',
    title: 'Image Recognition',
    description: 'Advanced image processing & analysis',
    imageSrc: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=400&fit=crop',
    badge: 'AI',
    route: '/image-recognition',
    roles: ['admin'],
  },
  {
    id: 'disaster-prediction',
    title: 'Disaster Prediction',
    description: 'Disaster forecasting system',
    imageSrc: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=400&fit=crop',
    badge: 'Prediction',
    route: '/disaster-prediction',
    roles: ['admin'],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'All users, doctors & role-wise stats',
    imageSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop',
    badge: 'Insights',
    route: '/analytics',
    roles: ['admin'],
  },
  {
    id: 'pilgrim-tracker',
    title: 'Pilgrim Tracker',
    description: 'Real-time pilgrim location tracking',
    imageSrc: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400&h=400&fit=crop',
    badge: 'Tracking',
    route: '/pilgrim-tracker',
    roles: ['user'],
  },
  {
    id: 'disaster-management',
    title: 'Disaster Management',
    description: 'Emergency response & management portal',
    imageSrc: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    badge: 'Emergency',
    route: '/disaster-management',
    roles: ['user'],
  },
  {
    id: 'doctor-assistance',
    title: 'Doctor Assistance',
    description: 'Find doctors & book appointments',
    imageSrc: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
    badge: 'Health',
    route: '/doctor-assistance',
    roles: ['user'],
  },
  {
    id: 'doctor-registration',
    title: 'Register as Doctor',
    description: 'Register yourself as a medical practitioner',
    imageSrc: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=400&fit=crop',
    badge: 'Health',
    route: '/doctor-registration',
    roles: ['user'],
  },
  {
    id: 'ai-guided-map',
    title: 'AI-Guided Map',
    description: 'AI-powered navigation & routing system',
    imageSrc: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=400&fit=crop',
    badge: 'Navigation',
    route: '/ai-map',
    roles: ['user'],
  },
  {
    id: 'medical-admin-dashboard',
    title: 'Appointment Queue',
    description: 'Manage doctors & appointment queue',
    imageSrc: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=400&fit=crop',
    badge: 'Admin',
    route: '/doctor-assistance',
    roles: ['medical_admin'],
  },
  {
    id: 'doctor-list',
    title: 'Registered Doctors',
    description: 'View & manage all registered doctors',
    imageSrc: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
    badge: 'Admin',
    route: '/doctor-assistance',
    roles: ['medical_admin'],
  },
  {
    id: 'doctor-my-appointments',
    title: 'My Appointments',
    description: 'View & manage your patient appointments',
    imageSrc: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=400&fit=crop',
    badge: 'Doctor',
    route: '/doctor-assistance',
    roles: ['doctor'],
  },
  {
    id: 'doctor-profile',
    title: 'Doctor Assistance',
    description: 'View patient queue & doctor directory',
    imageSrc: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
    badge: 'Doctor',
    route: '/doctor-assistance',
    roles: ['doctor'],
  },
];

const CARD_W = 220;
const CARD_H = 260;

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin Dashboard',
  user: 'User Dashboard',
  medical_admin: 'Medical Admin Dashboard',
  doctor: 'Doctor Dashboard',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const role = profile?.role ?? null;
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const visibleFeatures = features.filter(
    (f) => role && f.roles.includes(role),
  );

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', background: 'hsl(var(--background))', position: 'relative', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Squares
          direction="diagonal"
          speed={0.5}
          borderColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}
          squareSize={40}
          hoverFillColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
          vignetteColor={isDark ? '#060010' : '#ffffff'}
        />
      </div>
      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {role ? ROLE_LABELS[role] : 'Dashboard'}
          </p>
          <h1 style={{ color: 'hsl(var(--foreground))', fontSize: '2.2rem', fontWeight: 700, margin: 0 }}>
            Trinetra Feature Modules
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            {visibleFeatures.length} active modules — select one to manage
          </p>
        </div>

      </div>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ marginTop: '1.5rem', height: '1px', background: 'linear-gradient(to right, rgba(255,255,255,0.08), transparent)' }} />
      </div>

      {/* Cards grid */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, ${CARD_W}px)`,
        justifyContent: 'center',
        gap: '3rem 2.5rem',
        padding: '2.5rem 2rem 6rem',
      }}>
        {visibleFeatures.map((feature) => (
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
