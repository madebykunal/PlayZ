import React from 'react';
import Navbar from '@/components/Navbar';
import GameGrid from '@/components/GameGrid';
import { games } from '@/data/games';

/**
 * Main Application Component
 */
export default function App() {
  return (
    <div className="container">
      <Navbar />
      <GameGrid games={games} />
    </div>
  );
}
