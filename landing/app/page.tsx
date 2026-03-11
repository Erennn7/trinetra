import Navbar from './components/Navbar';
import HeroCanvas from './components/HeroCanvas';
import VisionSection from './components/VisionSection';
import TechnologySection from './components/TechnologySection';
import CTASection from './components/CTASection';

export default function Home() {
  return (
    <main style={{ background: '#050505', minHeight: '100vh' }}>
      <Navbar />
      <HeroCanvas />
      <VisionSection />
      <TechnologySection />
      <CTASection />
    </main>
  );
}
