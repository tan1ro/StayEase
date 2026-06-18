import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { ThemeProvider } from './context/ThemeContext';
import { CookieConsentProvider } from './context/CookieConsentContext';
import { SearchModalProvider } from './context/SearchModalContext';
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
import Messages from './pages/guest/Messages';
import FindMyRoom from './pages/guest/FindMyRoom';
import Receipt from './pages/guest/Receipt';
import Wishlist from './pages/guest/Wishlist';
import HostProfile from './pages/guest/HostProfile';
import AccountSettings from './pages/guest/AccountSettings';

import HostShell from './components/host/HostShell';
import HostDashboard from './pages/host/HostDashboard';
import ManageRooms from './pages/host/ManageRooms';
import AddRoom from './pages/host/AddRoom';
import EditRoom from './pages/host/EditRoom';
import ListingEditor from './pages/host/ListingEditor';
import ViewYourSpace from './pages/host/ViewYourSpace';
import ListingPreferences from './pages/host/ListingPreferences';
import ManageBookings from './pages/host/ManageBookings';
import HostMessages from './pages/host/HostMessages';
import Payouts from './pages/host/Payouts';
import ManageOffers from './pages/host/ManageOffers';
import HostSettings from './pages/host/HostSettings';
import HostingResources from './pages/host/HostingResources';
import HostCalendar from './pages/host/HostCalendar';
import Analytics from './pages/host/Analytics';
import ListingSetupOverview from './pages/host/listing-setup/ListingSetupOverview';
import ListingSetupIdentity from './pages/host/listing-setup/ListingSetupIdentity';
import ListingSetupIdentityUpload from './pages/host/listing-setup/ListingSetupIdentityUpload';
import ListingSetupPhone from './pages/host/listing-setup/ListingSetupPhone';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyIdentity from './pages/auth/VerifyIdentity';

import PrivacyPolicy from './pages/shared/PrivacyPolicy';
import CookiePolicy from './pages/shared/CookiePolicy';
import TermsOfService from './pages/shared/TermsOfService';
import LocalLaws from './pages/shared/help/LocalLaws';
import NondiscriminationPolicy from './pages/shared/help/NondiscriminationPolicy';
import ServiceFees from './pages/shared/help/ServiceFees';
import CancellationPolicy from './pages/shared/help/CancellationPolicy';
import BillingGst from './pages/shared/help/BillingGst';
import InvoicesReceipts from './pages/shared/help/InvoicesReceipts';
import TouristGuidelines from './pages/shared/help/TouristGuidelines';
import HostGuidelines from './pages/shared/help/HostGuidelines';
import HostingResponsibly from './pages/shared/help/HostingResponsibly';
import Notifications from './pages/shared/Notifications';
import HelpCentre from './pages/shared/HelpCentre';
import LiveChat from './components/LiveChat';
import NotFound from './pages/shared/NotFound';
import Unauthorized from './pages/shared/Unauthorized';
import ServerError from './pages/shared/ServerError';
import { isHostPortalPath } from './utils/routes';

function ProfileRedirect() {
  const { hash } = useLocation();
  const normalized = !hash || hash === '#settings' ? '' : hash;
  return <Navigate to={`/settings${normalized}`} replace />;
}

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
  const isListingSetup = location.pathname.startsWith('/host/listings/setup');
  const isHostPreview = /\/host\/rooms\/[^/]+\/view$/.test(location.pathname);
  const isHostShell = isHostPortalPath(location.pathname) && !isListingWizard && !isListingSetup && !isHostPreview;
  const hideNavSearch = isHostPortalPath(location.pathname)
    || location.pathname.startsWith('/login')
    || location.pathname.startsWith('/register')
    || location.pathname.startsWith('/forgot-password');

  return (
    <div className="app-layout">
      {!isListingWizard && !isHostShell && !isListingSetup && !isHostPreview && <Navbar showSearch={isHome || !hideNavSearch} />}
      <main className={`app-main ${
        isListingWizard || isListingSetup ? 'app-main--wizard' :
        isHostPreview ? 'app-main--host-preview' :
        isHostShell ? 'app-main--host' :
        location.pathname === '/' ? 'app-main--home' :
        location.pathname.startsWith('/rooms/') || location.pathname.startsWith('/hosts/') ? 'app-main--wide' :
        isHostPortalPath(location.pathname) ? 'app-main--wide' : ''
      }`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/hosts/:id" element={<HostProfile />} />
          <Route path="/book/:roomId" element={<ProtectedRoute><BookRoom /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><BookingHistory /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/find-my-room" element={<FindMyRoom />} />
          <Route path="/profile" element={<ProtectedRoute><ProfileRedirect /></ProtectedRoute>} />
          <Route path="/receipt/:id" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          <Route path="/host" element={<HostRoute><HostShell /></HostRoute>}>
            <Route index element={<HostDashboard />} />
            <Route path="calendar" element={<HostCalendar />} />
            <Route path="rooms" element={<ManageRooms />} />
            <Route path="rooms/edit/:id" element={<EditRoom />} />
            <Route path="rooms/:id/editor" element={<ListingEditor />} />
            <Route path="rooms/:id/preferences" element={<ListingPreferences />} />
            <Route path="bookings" element={<ManageBookings />} />
            <Route path="messages" element={<HostMessages />} />
            <Route path="earnings" element={<Navigate to="/host?tab=earnings" replace />} />
            <Route path="insights" element={<Navigate to="/host?tab=listings" replace />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="payouts" element={<Payouts />} />
            <Route path="offers" element={<ManageOffers />} />
            <Route path="settings" element={<HostSettings />} />
            <Route path="resources" element={<HostingResources />} />
          </Route>
          <Route path="/host/rooms/add" element={<HostRoute><AddRoom /></HostRoute>} />
          <Route path="/host/rooms/:id/view" element={<HostRoute><ViewYourSpace /></HostRoute>} />
          <Route path="/host/listings/setup" element={<HostRoute><ListingSetupOverview /></HostRoute>} />
          <Route path="/host/listings/setup/identity" element={<HostRoute><ListingSetupIdentity /></HostRoute>} />
          <Route path="/host/listings/setup/identity/upload" element={<HostRoute><ListingSetupIdentityUpload /></HostRoute>} />
          <Route path="/host/listings/setup/phone" element={<HostRoute><ListingSetupPhone /></HostRoute>} />

          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-identity" element={<ProtectedRoute><VerifyIdentity /></ProtectedRoute>} />

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/help" element={<HelpCentre />} />
          <Route path="/help/cancellation" element={<CancellationPolicy />} />
          <Route path="/help/billing-gst" element={<BillingGst />} />
          <Route path="/help/invoices" element={<InvoicesReceipts />} />
          <Route path="/help/tourist-guidelines" element={<TouristGuidelines />} />
          <Route path="/help/host-guidelines" element={<HostGuidelines />} />
          <Route path="/help/hosting-responsibly" element={<HostingResponsibly />} />
          <Route path="/help/local-laws" element={<LocalLaws />} />
          <Route path="/help/nondiscrimination" element={<NondiscriminationPolicy />} />
          <Route path="/help/service-fees" element={<ServiceFees />} />

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/error" element={<ServerError />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isListingWizard && !isHostShell && !isListingSetup && !isHostPreview && <Footer />}
      {!isListingWizard && !isHostShell && !isListingSetup && !isHostPreview && <MobileBottomNav />}
      <LiveChat />
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
              <CookieConsentProvider>
                <SearchModalProvider>
                  <Layout />
                </SearchModalProvider>
              </CookieConsentProvider>
            </BrowserRouter>
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
