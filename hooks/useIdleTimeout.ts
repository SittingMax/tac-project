import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_TIMEOUT = 14 * 60 * 1000; // 14 minutes (1 minute warning)

export function useIdleTimeout() {
  const { signOut, isAuthenticated } = useAuthStore();
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    if (isAuthenticated) {
      await signOut();
      toast.error('Session expired', {
        description: 'You have been logged out due to inactivity.',
      });
    }
  }, [isAuthenticated, signOut]);

  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    warningTimerRef.current = setTimeout(() => {
      toast.warning('Session expiring soon', {
        description: 'You will be logged out in 1 minute due to inactivity.',
        duration: 10000,
      });
    }, WARNING_TIMEOUT);

    idleTimerRef.current = setTimeout(() => {
      handleLogout();
    }, IDLE_TIMEOUT);
  }, [isAuthenticated, handleLogout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    // Initial timer start
    resetTimer();

    const handleActivity = () => {
      resetTimer();
    };

    // Throttle the event listener to avoid performance issues
    let lastActivity = Date.now();
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastActivity > 1000) {
        handleActivity();
        lastActivity = now;
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledHandler);
    });

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, throttledHandler);
      });
    };
  }, [isAuthenticated, signOut, resetTimer]);
}
