
export const touchGestureService = {
  detectSwipe: (element, callback) => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleGesture();
    };

    const handleGesture = () => {
      const distanceX = touchEndX - touchStartX;
      const distanceY = touchEndY - touchStartY;
      
      if (Math.abs(distanceX) > Math.abs(distanceY)) {
        // Horizontal Swipe
        if (Math.abs(distanceX) > minSwipeDistance) {
          if (distanceX > 0) callback('right');
          else callback('left');
        }
      } else {
        // Vertical Swipe
        if (Math.abs(distanceY) > minSwipeDistance) {
          if (distanceY > 0) callback('down');
          else callback('up');
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  },

  detectLongPress: (element, callback, duration = 500) => {
    let timer;

    const start = (e) => {
      timer = setTimeout(() => {
        callback(e);
      }, duration);
    };

    const end = () => {
      if (timer) clearTimeout(timer);
    };

    element.addEventListener('touchstart', start, { passive: true });
    element.addEventListener('touchend', end);
    element.addEventListener('touchmove', end);

    return () => {
      element.removeEventListener('touchstart', start);
      element.removeEventListener('touchend', end);
      element.removeEventListener('touchmove', end);
    };
  },

  detectDoubleTap: (element, callback, delay = 300) => {
    let lastTap = 0;

    const handleTap = (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < delay && tapLength > 0) {
        callback(e);
        e.preventDefault(); // Prevent zoom on double tap
      }
      lastTap = currentTime;
    };

    element.addEventListener('touchend', handleTap);
    return () => element.removeEventListener('touchend', handleTap);
  },

  detectPinchZoom: (element, callback) => {
    let initialDistance = 0;

    const getDistance = (touches) => {
      return Math.hypot(
        touches[0].pageX - touches[1].pageX,
        touches[0].pageY - touches[1].pageY
      );
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        const currentDistance = getDistance(e.touches);
        if (initialDistance > 0) {
          if (currentDistance > initialDistance) {
            callback('zoomIn');
          } else {
            callback('zoomOut');
          }
        }
        initialDistance = currentDistance;
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }
};
