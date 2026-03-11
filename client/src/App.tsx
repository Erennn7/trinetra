import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import GooeyNav from './components/GooeyNav';
import { Footer2 } from './components/Footer2';

const navItems = [
  { label: 'Home', href: '#' },
  { label: 'About', href: '#' },
  { label: 'Contact', href: '#' },
];

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#050508' }}>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', paddingTop: '1rem' }}>
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
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <Footer2 />
      </div>
    </BrowserRouter>
  );
}

export default App;
