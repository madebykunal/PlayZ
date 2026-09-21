# 🎮 PlayZ

An open-source browser gaming hub featuring quick, fun web games crafted with modern web technologies and AI assistance.

🌐 **Live Demo:** [playz.pages.dev](https://playz.pages.dev)

---

## ⚡ Tech Stack

- **Framework:** Vanilla HTML, CSS, and JavaScript
- **Styling:** Custom CSS3 (responsive, modern dark UI)
- **Deployment:** Cloudflare Pages

---

## 🚀 Getting Started

This project is built purely with Vanilla HTML, CSS, and JS, meaning there is no build step required!

### Installation & Development

```bash
# 1. Clone the repository
git clone https://github.com/madebykunal/PlayZ.git
cd PlayZ

# 2. Start a local server (e.g., using Python, Node, or VS Code Live Server)
python3 -m http.server
# OR
npx serve
```

Visit the local server address (e.g., `http://localhost:8000`) in your browser.

---

## 🕹️ Adding a New Game

1. Place your game files (HTML, CSS, JS) inside `game/<game-name>/`.
2. Add a thumbnail image (`.webp` or `.png`) into `images/`.
3. Register your game in [`js/data.js`](js/data.js):

```javascript
{
  id: 'your-game',
  title: 'Your Game Title',
  thumbnail: './images/your-game.webp',
  route: './game/your-game/index.html'
}
```

---

## 📬 Submit a Game

Have a game idea or made a game with AI?
- Open an [Issue / Game Request](https://github.com/madebykunal/PlayZ/issues/new)
- Or email your game files to: **madebykunal@gmail.com**

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

Crafted with ❤️ by [Kunal Creates](https://github.com/madebykunal)
