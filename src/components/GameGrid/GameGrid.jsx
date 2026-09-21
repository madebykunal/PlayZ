import React from 'react';
import GameCard from '@/components/GameCard';
import styles from './GameGrid.module.css';

/**
 * GameGrid Component
 * Renders the responsive catalog grid of game cards.
 */
export default function GameGrid({ games = [], onLaunchGame }) {
  return (
    <main>
      <div className={styles.gameGrid}>
        {games.map((game) => (
          <GameCard
            key={game.id}
            id={game.id}
            title={game.title}
            thumbnail={game.thumbnail}
            canvas={game.canvas}
            route={game.route}
            onLaunch={onLaunchGame}
          />
        ))}
      </div>
    </main>
  );
}
