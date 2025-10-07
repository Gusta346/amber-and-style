import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// When the route changes, scroll to top. Lightweight and compatible with Vite/React Router.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
}
