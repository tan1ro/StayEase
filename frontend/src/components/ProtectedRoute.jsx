import { Navigate, useLocation } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { canAccessHostPortal, normalizeRole } from '../utils/roles';

export function ProtectedRoute({ children, roles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking auth..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = normalizeRole(user.role);
  if (roles && !roles.includes(role) && role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export function TouristRoute({ children }) {
  return <ProtectedRoute roles={['tourist', 'host']}>{children}</ProtectedRoute>;
}

export function HostRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking auth..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canAccessHostPortal(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
