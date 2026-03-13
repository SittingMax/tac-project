import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Helper component that resets the window scroll position to top
 * whenever the route (pathname) changes.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // We use a small timeout to ensure the DOM has updated and layout shifts
    // have settled, providing a more reliable "top" position.
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
