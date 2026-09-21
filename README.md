# 🎮 PlayZ

An open-source browser gaming hub featuring quick, fun web games crafted with modern web technologies and AI assistance.

🌐 **Live Demo:** [playz.pages.dev](https://playz.pages.dev)

---

## ⚡ Tech Stack

- **Framework:** React 18 + Vite
- **Styling:** CSS3 (responsive, modern dark UI)
- **Deployment:** Cloudflare Pages

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Installation & Development

```bash
# 1. Clone the repository
git clone https://github.com/kunal-creates/PlayZ.git
cd PlayZ

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Build for Production

```bash
npm run build
```

The output will be in the `dist/` directory ready for deployment.

---

## 🕹️ Adding a New Game

1. Place your game files (HTML, CSS, JS) inside `public/games/<game-name>/`.
2. Add a thumbnail image (`.webp` or `.png`) into `public/images/`.
3. Register your game in [`src/data/games.js`](src/data/games.js):

```javascript
{
  id: 'your-game',
  title: 'Your Game Title',
  category: 'Arcade',
  image: '/images/your-game.webp',
  path: '/games/your-game/index.html',
  description: 'Short description of your game.',
  tags: ['Classic', 'Fun']
}
```

---

## 📬 Submit a Game

Have a game idea or made a game with AI?
- Open an [Issue / Game Request](https://github.com/kunal-creates/PlayZ/issues/new)
- Or email your game files to: **madebykunal@gmail.com**

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

Crafted with ❤️ by [Kunal Creates](https://github.com/kunal-creates)
