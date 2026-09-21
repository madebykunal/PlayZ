/**
 * PlayZ Unified Game Shell Helper
 * Automatically manages top bar, Back button, game title, and cross-browser Fullscreen functionality.
 */

(function () {
  const EXPAND_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;
  const COMPRESS_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z"/></svg>`;
  const BACK_ARROW_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>`;

  function isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  function toggleFullscreen(targetElement, toggleBtn) {
    if (!isFullscreen()) {
      if (targetElement.requestFullscreen) {
        targetElement.requestFullscreen().catch(() => {});
      } else if (targetElement.webkitRequestFullscreen) {
        targetElement.webkitRequestFullscreen();
      } else if (targetElement.mozRequestFullScreen) {
        targetElement.mozRequestFullScreen();
      } else if (targetElement.msRequestFullscreen) {
        targetElement.msRequestFullscreen();
      } else {
        // Fallback for iOS Safari
        targetElement.classList.toggle('is-fullscreen');
        updateFullscreenButtonState(
          toggleBtn,
          targetElement.classList.contains('is-fullscreen')
        );
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  function updateFullscreenButtonState(toggleBtn, active) {
    if (!toggleBtn) return;
    toggleBtn.innerHTML = active ? COMPRESS_ICON : EXPAND_ICON;
    toggleBtn.setAttribute(
      'title',
      active ? 'Exit Fullscreen' : 'Enter Fullscreen'
    );
    toggleBtn.setAttribute(
      'aria-label',
      active ? 'Exit Fullscreen' : 'Enter Fullscreen'
    );
  }

  function initGameShell() {
    // 1. Determine Game Title
    const titleAttr = document.body.getAttribute('data-game-title');
    let title = titleAttr || document.title || 'PlayZ Game';
    title = title.replace(/[^\w\s-]/g, '').trim();

    // 2. Find or wrap the Game Box
    let gameBox = document.querySelector('.playz-game-box');
    if (!gameBox) {
      const candidate =
        document.getElementById('game-container') ||
        document.getElementById('gameContainer') ||
        document.querySelector('.game-container') ||
        document.querySelector('.container') ||
        document.querySelector('.game-wrapper') ||
        document.querySelector('main');

      if (candidate) {
        gameBox = candidate;
        gameBox.classList.add('playz-game-box');
      } else {
        gameBox = document.createElement('div');
        gameBox.className = 'playz-game-box';
        const children = Array.from(document.body.childNodes);
        children.forEach((child) => {
          if (child.nodeType === 1 && !child.classList.contains('playz-top-bar')) {
            gameBox.appendChild(child);
          }
        });
        document.body.appendChild(gameBox);
      }
    }

    // 3. Ensure gameBox is wrapped inside .playz-stage
    let stage = document.querySelector('.playz-stage');
    if (!stage && gameBox) {
      stage = document.createElement('main');
      stage.className = 'playz-stage';
      gameBox.parentNode.insertBefore(stage, gameBox);
      stage.appendChild(gameBox);
    }

    // 4. Inject Exit Fullscreen Button inside gameBox
    if (gameBox && !gameBox.querySelector('.playz-exit-fullscreen-btn')) {
      const exitBtn = document.createElement('button');
      exitBtn.className = 'playz-exit-fullscreen-btn';
      exitBtn.innerHTML = COMPRESS_ICON;
      exitBtn.setAttribute('title', 'Exit Fullscreen');
      exitBtn.setAttribute('aria-label', 'Exit Fullscreen');
      exitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isFullscreen()) {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } else {
          gameBox.classList.remove('is-fullscreen');
          const toggleBtn = document.getElementById('playz-fs-button');
          updateFullscreenButtonState(toggleBtn, false);
        }
      });
      gameBox.appendChild(exitBtn);
    }

    // 5. Inject Top Navigation Bar if not present
    if (!document.querySelector('.playz-top-bar')) {
      const topBar = document.createElement('header');
      topBar.className = 'playz-top-bar';
      topBar.innerHTML = `
        <div class="playz-top-bar-inner">
          <a href="/" class="playz-back-btn" id="playz-back-button" title="Back to Games">
            ${BACK_ARROW_ICON}
            <span>Back to Games</span>
          </a>
          <h1 class="playz-game-title">${title}</h1>
          <button class="playz-fullscreen-btn" id="playz-fs-button" title="Enter Fullscreen" aria-label="Enter Fullscreen">
            ${EXPAND_ICON}
          </button>
        </div>
      `;

      document.body.insertBefore(topBar, document.body.firstChild);

      // Bind Back Button
      const backBtn = document.getElementById('playz-back-button');
      if (backBtn) {
        backBtn.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = '/';
        });
      }

      // Bind Fullscreen Button
      const fsBtn = document.getElementById('playz-fs-button');
      if (fsBtn && gameBox) {
        fsBtn.addEventListener('click', () => {
          toggleFullscreen(gameBox, fsBtn);
        });
      }
    }

    // 6. Fullscreen event listener
    const onFullscreenChange = () => {
      const active = isFullscreen();
      const fsBtn = document.getElementById('playz-fs-button');
      updateFullscreenButtonState(fsBtn, active);
      if (gameBox) {
        if (active) {
          gameBox.classList.add('is-fullscreen');
        } else {
          gameBox.classList.remove('is-fullscreen');
        }
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    // 7. Hide all legacy back buttons
    document
      .querySelectorAll('.back-button, div.back-button')
      .forEach((el) => {
        if (!el.classList.contains('playz-back-btn')) {
          el.style.display = 'none';
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGameShell);
  } else {
    initGameShell();
  }
})();
