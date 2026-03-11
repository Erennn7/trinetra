import GooeyNav from './components/GooeyNav';
import HeroCanvas from './components/HeroCanvas';
import VisionSection from './components/VisionSection';
import TechnologySection from './components/TechnologySection';
import CTASection from './components/CTASection';
import { Footer2 } from './components/Footer2';

const navItems = [
  { label: 'Dashboard', href: 'http://localhost:5173/dashboard#' },
  { label: 'Technology', href: '#technology' },
  { label: 'About', href: '#about' },
];

export default function Home() {
  return (
    <main style={{ background: '#050505', minHeight: '100vh' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', alignItems: 'center', paddingTop: '1rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <a href="#" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>TRINETRA</a>
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
      <HeroCanvas />
      <VisionSection />
      <TechnologySection />
      <CTASection />
      <Footer2 />
    </main>
  );
}
