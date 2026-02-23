import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import RequireAuth from './components/RequireAuth';
import Index from './pages/Index';
import Onboarding from './pages/Onboarding';
import Recommendations from './pages/Recommendations';
import Dashboard from './pages/Dashboard';
import Partner from './pages/Partner';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ResourceAdmin from './pages/ResourceAdmin';
import ExploreCareers from './pages/ExploreCareers';
import CyclePage from './pages/CyclePage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import PracticePage from './pages/PracticePage';
import CertsProofPage from './pages/CertsProofPage';
import SupportPage from './pages/SupportPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          {/* Protected routes */}
          <Route path="/recommendations" element={<RequireAuth><Recommendations /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/cycle" element={<RequireAuth><CyclePage /></RequireAuth>} />
          <Route path="/opportunities" element={<RequireAuth><OpportunitiesPage /></RequireAuth>} />
          <Route path="/practice" element={<RequireAuth><PracticePage /></RequireAuth>} />
          <Route path="/certs" element={<RequireAuth><CertsProofPage /></RequireAuth>} />
          <Route path="/support" element={<RequireAuth><SupportPage /></RequireAuth>} />
          <Route path="/explore-careers" element={<RequireAuth><ExploreCareers /></RequireAuth>} />
          <Route path="/partner" element={<RequireAuth><Partner /></RequireAuth>} />
          <Route path="/partner/resources" element={<RequireAuth><ResourceAdmin /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
