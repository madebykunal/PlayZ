import React, { useEffect, useRef } from 'react';
import styles from './GameCard.module.css';

/**
 * GameCard Component
 * Displays a single game tile with thumbnail/canvas preview and launch handler.
 */
export default function GameCard({
  id,
  title,
  thumbnail,
  canvas,
  route,
  onLaunch
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    // If a canvas render function is provided, initialize it cleanly with unmount cleanup
    if (typeof canvas === 'function' && canvasRef.current) {
      const cleanup = canvas(canvasRef.current);

      return () => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      };
    }
  }, [canvas]);

  const handleLaunch = () => {
    if (onLaunch) {
      onLaunch({ id, title, route });
    } else if (route) {
      window.location.href = route;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLaunch();
    }
  };

  return (
    <div
      className={styles.gameCard}
      data-game-id={id}
      onClick={handleLaunch}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Play ${title}`}
    >
      <div className={styles.gamePlaceholder}>
        {canvas ? (
          typeof canvas === 'function' ? (
            <canvas ref={canvasRef} className={styles.gameCanvas} />
          ) : (
            canvas
          )
        ) : typeof thumbnail === 'string' ? (
          <img
            src={thumbnail}
            alt={title}
            className={styles.gameImage}
            loading="lazy"
          />
        ) : (
          thumbnail
        )}
      </div>
    </div>
  );
}
