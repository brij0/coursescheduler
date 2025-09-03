import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use scrollTo with behavior: 'instant' to prevent smooth scrolling animation
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // This is the key change - prevents animation
    });
  }, [pathname]);

  return null;
}

export default ScrollToTop;