import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Index from './pages/Index';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Partner from './pages/Partner';
import Login from './pages/Login';
import ResourceAdmin from './pages/ResourceAdmin';
import PageNav from './components/PageNav';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PageNav />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/partner/resources" element={<ResourceAdmin />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
