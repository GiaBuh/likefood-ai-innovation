import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls window to top on every route change.
 * Place this inside <BrowserRouter> in your app root.
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
