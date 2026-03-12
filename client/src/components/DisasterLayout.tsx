import { NavLink, Outlet } from 'react-router-dom';
import { useDisasterData } from '../context/DisasterDataContext';
import {
  Dashboard, WbSunny, Waves, Groups, DirectionsCar,
  NotificationsActive, Emergency, Satellite, Hiking, ArrowBack, Code,
} from '@mui/icons-material';

const RISK_COLORS: Record<string, string> = { critical: '#FF4757', high: '#FFA502', moderate: '#FFD700', low: '#2ED573' };

const NAV_ITEMS = [
  { label: 'Overview', icon: <Dashboard sx={{ fontSize: 18 }} />, path: '' },
  { label: 'Weather', icon: <WbSunny sx={{ fontSize: 18 }} />, path: 'weather' },
  { label: 'Earthquakes', icon: <Waves sx={{ fontSize: 18 }} />, path: 'earthquakes' },
  { label: 'Crowd', icon: <Groups sx={{ fontSize: 18 }} />, path: 'crowd' },
  { label: 'Traffic', icon: <DirectionsCar sx={{ fontSize: 18 }} />, path: 'traffic' },
  { label: 'Alerts', icon: <NotificationsActive sx={{ fontSize: 18 }} />, path: 'alerts' },
  { label: 'Emergency', icon: <Emergency sx={{ fontSize: 18 }} />, path: 'emergency' },
  { label: 'Satellite', icon: <Satellite sx={{ fontSize: 18 }} />, path: 'satellite' },
  { label: 'Pilgrim Aid', icon: <Hiking sx={{ fontSize: 18 }} />, path: 'pilgrim' },
  { label: 'API Testing', icon: <Code sx={{ fontSize: 18 }} />, path: 'api-test', adminOnly: true },
] as const;

export default function DisasterLayout() {
  const { selectedCity, availableCities, changeCity, dashboardData, isAdmin } = useDisasterData();
  const riskLevel = (dashboardData?.risk_score as any)?.risk_level || 'low';
  const riskColor = RISK_COLORS[riskLevel?.toLowerCase()] || RISK_COLORS.low;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', paddingTop: '4.5rem', background: '#050508' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        position: 'fixed',
        top: '4.5rem',
        left: 0,
        bottom: 0,
        background: 'rgba(10, 11, 18, 0.98)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        overflowY: 'auto',
      }}>
        {/* Back to dashboard */}
        <NavLink
          to="/dashboard"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px', margin: '8px 8px 4px',
            color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem',
            textDecoration: 'none', borderRadius: 8,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#c4b5fd'; e.currentTarget.style.background = 'rgba(196,181,253,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <ArrowBack sx={{ fontSize: 16 }} />
          Back to Dashboard
        </NavLink>

        <div style={{ padding: '8px 16px 4px', marginTop: 4 }}>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Monitoring
          </span>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '4px 8px' }}>
          {NAV_ITEMS.filter(item => !('adminOnly' in item && item.adminOnly) || isAdmin).map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === ''}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                margin: '2px 0',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(196,181,253,0.12) 0%, rgba(167,139,250,0.06) 100%)'
                  : 'transparent',
                borderLeft: isActive ? '3px solid #c4b5fd' : '3px solid transparent',
                transition: 'all 0.2s',
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Risk level indicator */}
        <div style={{ padding: '8px 16px 4px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Risk Level</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: `${riskColor}10`, border: `1px solid ${riskColor}30`, borderRadius: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: riskColor, boxShadow: `0 0 6px ${riskColor}` }} />
            <span style={{ color: riskColor, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{riskLevel}</span>
          </div>
        </div>

        {/* City selector */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            City
          </span>
          <select
            value={selectedCity}
            onChange={e => changeCity(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              color: '#fff',
              fontSize: '0.78rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {availableCities.map(c => (
              <option key={c.id} value={c.id} style={{ background: '#0a0b12' }}>
                {c.display_name}
              </option>
            ))}
          </select>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: 220,
        padding: '24px 32px 64px',
        minHeight: '100%',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
