import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Logged-in guests upgrade to host; guests sign up; hosts go to the dashboard. */
export function useBecomeHost() {
  const navigate = useNavigate();
  const { user, isAuthenticated, canAccessHostPortal, becomeHost } = useAuth();

  return useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/register?as=host');
      return;
    }
    if (canAccessHostPortal) {
      navigate('/host');
      return;
    }
    await becomeHost();
    navigate('/host');
  }, [isAuthenticated, canAccessHostPortal, becomeHost, navigate, user?.id]);
}
