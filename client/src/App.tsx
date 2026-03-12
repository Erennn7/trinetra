import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import WeaponDetection from './pages/WeaponDetection';
import CrowdDetection from './pages/CrowdDetection';
import ImageRecognition from './pages/ImageRecognition';
import LostAndFound from './pages/LostAndFound';
import DoctorRegistration from './pages/DoctorRegistration';
import DoctorAssistance from './pages/DoctorAssistance';
import DoctorSignup from './pages/DoctorSignup';
import PilgrimTracker from './pages/PilgrimTracker';
import DisasterPrediction from './pages/DisasterPrediction';
import DisasterManagement from './pages/DisasterManagement';
import AIMap from './pages/AIMap';
import Analytics from './pages/Analytics';

import GooeyNav from './components/GooeyNav';
import { Footer2 } from './components/Footer2';
import { ThemeProvider } from "@/components/theme-provider"

const navItems = [
  { label: 'Home', href: 'http://localhost:3000/' },
  { label: 'Dashboard', href: 'http://localhost:5173/#' },
  { label: 'About', href: '#' },
];

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <div style={{ minHeight: '100vh', background: 'hsl(var(--background))' }}>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', alignItems: 'center', paddingTop: '1rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
            <a href="http://localhost:3000" style={{ color: 'hsl(var(--foreground))', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const, width: '100px' }}>TRINETRA</a>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <GooeyNav
                items={navItems}
                particleCount={15}
                particleDistances={[90, 10]}
                particleR={100}
                initialActiveIndex={1}
                animationTime={600}
                timeVariance={300}
                colors={[1, 2, 3, 1, 2, 3, 1, 4]}
              />
            </div>
            <div style={{ width: '100px' }} />
          </div>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/doctor-signup" element={<DoctorSignup />} />

            {/* Shared protected routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/lost-and-found" element={<ProtectedRoute allowedRoles={['admin', 'user']}><LostAndFound /></ProtectedRoute>} />

            {/* Admin-only routes */}
            <Route path="/weapon-detection" element={<ProtectedRoute allowedRoles={['admin']}><WeaponDetection /></ProtectedRoute>} />
            <Route path="/crowd-detection" element={<ProtectedRoute allowedRoles={['admin']}><CrowdDetection /></ProtectedRoute>} />
            <Route path="/image-recognition" element={<ProtectedRoute allowedRoles={['admin']}><ImageRecognition /></ProtectedRoute>} />
            <Route path="/disaster-prediction" element={<ProtectedRoute allowedRoles={['admin']}><DisasterPrediction /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute>} />

            {/* User routes */}
            <Route path="/pilgrim-tracker" element={<ProtectedRoute allowedRoles={['user']}><PilgrimTracker /></ProtectedRoute>} />
            <Route path="/disaster-management" element={<ProtectedRoute allowedRoles={['user']}><DisasterManagement /></ProtectedRoute>} />
            <Route path="/doctor-assistance" element={<ProtectedRoute allowedRoles={['user', 'medical_admin', 'doctor']}><DoctorAssistance /></ProtectedRoute>} />
            <Route path="/doctor-registration" element={<ProtectedRoute allowedRoles={['user']}><DoctorRegistration /></ProtectedRoute>} />
            <Route path="/ai-map" element={<ProtectedRoute allowedRoles={['user']}><AIMap /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Footer2 />
        </div>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
