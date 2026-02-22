import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
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
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cycle" element={<CyclePage />} />
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/certs" element={<CertsProofPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/explore-careers" element={<ExploreCareers />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/partner/resources" element={<ResourceAdmin />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
