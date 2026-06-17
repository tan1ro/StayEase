import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import AuthGateModal from './components/onboarding/AuthGateModal';
import { ProtectedRoute, HostRoute } from './components/ProtectedRoute';

import Home from './pages/guest/Home';
import RoomDetail from './pages/guest/RoomDetail';
import BookRoom from './pages/guest/BookRoom';
import BookingHistory from './pages/guest/BookingHistory';
import FindMyRoom from './pages/guest/FindMyRoom';
import Receipt from './pages/guest/Receipt';
import Wishlist from './pages/guest/Wishlist';
import Profile from './pages/guest/Profile';
import HostProfile from './pages/guest/HostProfile';
import AccountSettings from './pages/guest/AccountSettings';

import HostShell from './components/host/HostShell';
import HostDashboard from './pages/host/HostDashboard';
import ManageRooms from './pages/host/ManageRooms';
import AddRoom from './pages/host/AddRoom';
import EditRoom from './pages/host/EditRoom';
import ListingEditor from './pages/host/ListingEditor';
import ListingPreferences from './pages/host/ListingPreferences';
import ManageBookings from './pages/host/ManageBookings';
import Analytics from './pages/host/Analytics';
import Insights from './pages/host/Insights';
import Earnings from './pages/host/Earnings';
import ManageOffers from './pages/host/ManageOffers';
import HostSettings from './pages/host/HostSettings';
import HostingResources from './pages/host/HostingResources';
import HostCalendar from './pages/host/HostCalendar';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyIdentity from './pages/auth/VerifyIdentity';

import PrivacyPolicy from './pages/shared/PrivacyPolicy';
import TermsOfService from './pages/shared/TermsOfService';
import NotFound from './pages/shared/NotFound';
import Unauthorized from './pages/shared/Unauthorized';
import ServerError from './pages/shared/ServerError';

function GlobalModals() {
  const { authGate, closeAuthGate } = useOnboarding();
  return (
    <AuthGateModal
      open={!!authGate}
      title={authGate?.title}
      message={authGate?.message}
      cta={authGate?.cta}
      redirect={authGate?.redirect}
      offerCode={authGate?.offerCode}
      onClose={closeAuthGate}
    />
  );
}

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isListingWizard = location.pathname === '/host/rooms/add';
  const isHostShell = location.pathname.startsWith('/host') && !isListingWizard;
  const hideNavSearch = location.pathname.startsWith('/host')
    || location.pathname.startsWith('/login')
    || location.pathname.startsWith('/register');

  return (
    <div className="app-layout">
      {!isListingWizard && !isHostShell && <Navbar showSearch={isHome || !hideNavSearch} />}
      <main className={`app-main ${
        isListingWizard ? 'app-main--wizard' :
        isHostShell ? 'app-main--host' :
        location.pathname === '/' ? 'app-main--home' :
        location.pathname.startsWith('/host') || location.pathname.startsWith('/rooms/') || location.pathname.startsWith('/hosts/') ? 'app-main--wide' : ''
      }`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/hosts/:id" element={<HostProfile />} />
          <Route path="/book/:roomId" element={<ProtectedRoute><BookRoom /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><BookingHistory /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/find-my-room" element={<FindMyRoom />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/receipt/:id" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />

          <Route path="/host" element={<HostRoute><HostShell /></HostRoute>}>
            <Route index element={<HostDashboard />} />
            <Route path="calendar" element={<HostCalendar />} />
            <Route path="rooms" element={<ManageRooms />} />
            <Route path="rooms/edit/:id" element={<EditRoom />} />
            <Route path="rooms/:id/editor" element={<ListingEditor />} />
            <Route path="rooms/:id/preferences" element={<ListingPreferences />} />
            <Route path="bookings" element={<ManageBookings />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="insights" element={<Insights />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="payouts" element={<Navigate to="/host/earnings" replace />} />
            <Route path="offers" element={<ManageOffers />} />
            <Route path="settings" element={<HostSettings />} />
            <Route path="resources" element={<HostingResources />} />
          </Route>
          <Route path="/host/rooms/add" element={<HostRoute><AddRoom /></HostRoute>} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-identity" element={<ProtectedRoute><VerifyIdentity /></ProtectedRoute>} />

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/error" element={<ServerError />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isListingWizard && !isHostShell && <Footer />}
      {!isListingWizard && !isHostShell && <MobileBottomNav />}
      <GlobalModals />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <OnboardingProvider>
            <BrowserRouter>
              <Layout />
            </BrowserRouter>
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
