import { games } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
  const gameGrid = document.querySelector('.gameGrid');

  if (!gameGrid) return;

  games.forEach(game => {
    // Create the card container
    const card = document.createElement('div');
    card.className = 'gameCard';
    card.setAttribute('data-game-id', game.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Play ${game.title}`);

    // Create the placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'gamePlaceholder';

    // Since we're dealing with static thumbnails based on data.js
    const img = document.createElement('img');
    img.src = game.thumbnail;
    img.alt = game.title;
    img.className = 'gameImage';
    img.loading = 'lazy';

    placeholder.appendChild(img);
    card.appendChild(placeholder);

    // Event handlers for launch
    const handleLaunch = () => {
      if (game.route) {
        window.location.href = game.route;
      }
    };

    card.addEventListener('click', handleLaunch);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleLaunch();
      }
    });

    gameGrid.appendChild(card);
  });
});
