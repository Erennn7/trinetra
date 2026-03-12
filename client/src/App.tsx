import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import WeaponDetection from './pages/WeaponDetection';
import CrowdDetection from './pages/CrowdDetection';
import ImageRecognition from './pages/imageRecognition';
import LostAndFound from './pages/LostAndFound';
import GooeyNav from './components/GooeyNav';
import { Footer2 } from './components/Footer2';

const navItems = [
  { label: 'Dashboard', href: 'http://localhost:5173/dashboard#' },
  { label: 'About', href: '#' },
  { label: 'Contact', href: '#' },
];

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#050508' }}>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', alignItems: 'center', paddingTop: '1rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <a href="http://localhost:3000" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>TRINETRA</a>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <GooeyNav
            items={navItems}
            particleCount={15}
            particleDistances={[90, 10]}
            particleR={100}
            initialActiveIndex={0}
            animationTime={600}
            timeVariance={300}
            colors={[1, 2, 3, 1, 2, 3, 1, 4]}
          />
          </div>
        </div>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/weapon-detection" element={<WeaponDetection />} />
          <Route path="/lost-and-found" element={<LostAndFound />} />
          <Route path="/crowd-detection" element={<CrowdDetection />} />
          <Route path="/image-recognition" element={<ImageRecognition />} />
        </Routes>
        <Footer2 />
      </div>
    </BrowserRouter>
  );
}

export default App;
