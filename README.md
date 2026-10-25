# Muffin Live TV (OpenStream)

A production-ready, client-side IPTV streaming web application built with **React**, **TypeScript (Strict Mode)**, **Tailwind CSS**, and **hls.js**. Muffin Live TV connects to public playlist feeds provided by the open-source [`iptv-org/iptv`](https://github.com/iptv-org/iptv) project, allowing personal live television playback without requiring servers, databases, or paid APIs.

---

## Features

- **Production-Grade M3U Parser**: Robust `#EXTINF` parser extracting channel names, stream URLs, logos, categories, countries, languages, and TVG identifiers. Gracefully tolerates single/double/unquoted attributes, missing metadata, and HTML entities.
- **HLS Video Playback**: Seamless HLS playback powered by `hls.js` with native HLS fallback (Safari / iOS). Full recovery lifecycle, audio/video synchronization, and memory-leak prevention upon switching channels.
- **Desktop-First Restrained Dark UI**: Modern dark charcoal palette (`#0b0d11`, `#12151c`), clean typography, subtle borders, responsive sidebar, and keyboard-accessible controls.
- **Featured Live Channel & Continue Watching**: Real-data hero channel spotlight and recently watched history carousel.
- **Search & Multi-Dimensional Filtering**: Real-time client-side search across channel titles, countries, languages, and categories with debounced input and sorting.
- **Favorites & History Management**: Persistent client-side storage with automated validation, corruption recovery, and quota protection.
- **Responsive Navigation**: Adaptive desktop sidebar and fluid mobile drawer navigation.
- **Custom Playlist Support**: In addition to curated iptv-org category presets (News, Sports, Entertainment, Movies, Music, Documentary, Kids, Master directory), users can add custom public M3U feeds.
- **Zero Server Footprint**: Deployable instantly to Netlify, Vercel, or any static web host.

---

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19** | Declarative Component-Driven UI |
| **TypeScript (Strict Mode)** | Full Type Safety & Contracts |
| **Vite 8** | High-performance Bundler & Fast HMR |
| **Tailwind CSS** | Custom Charcoal-Surface Design System |
| **hls.js** | Media Source Extensions (MSE) HLS Streaming Engine |
| **Lucide React** | Streamlined Iconography |
| **Vitest & Testing Library** | Unit & Component Test Suite |

---

## Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

---

## Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with HMR |
| `npm run build` | Compiles TypeScript and builds optimized static assets to `dist/` |
| `npm run preview` | Runs local HTTP server to preview production build |
| `npm run typecheck` | Validates TypeScript in strict mode without emitting files |
| `npm run test` | Runs the full Vitest automated test suite |
| `npm run test:watch` | Runs Vitest in interactive watch mode |

---

## Playlist Sources

Muffin Live TV loads official public streams maintained by the `iptv-org` community:

- **News Playlist**: `https://iptv-org.github.io/iptv/categories/news.m3u` *(Default)*
- **Sports Playlist**: `https://iptv-org.github.io/iptv/categories/sports.m3u`
- **Entertainment Playlist**: `https://iptv-org.github.io/iptv/categories/entertainment.m3u`
- **Movies Playlist**: `https://iptv-org.github.io/iptv/categories/movies.m3u`
- **Music Playlist**: `https://iptv-org.github.io/iptv/categories/music.m3u`
- **Documentary Playlist**: `https://iptv-org.github.io/iptv/categories/documentary.m3u`
- **Kids & Family Playlist**: `https://iptv-org.github.io/iptv/categories/kids.m3u`
- **Master Directory**: `https://iptv-org.github.io/iptv/index.m3u` *(10,000+ worldwide feeds)*

*Note: For optimal performance and fast load times, category playlists are loaded by default. The master index can be selected on-demand from the playlist dropdown.*

---

## Player Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause |
| <kbd>F</kbd> | Toggle Fullscreen |
| <kbd>M</kbd> | Toggle Mute / Unmute |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Increase / Decrease Volume |
| <kbd>→</kbd> / <kbd>←</kbd> | Next / Previous Channel |
| <kbd>Esc</kbd> | Close / Return to Channel Browsing |

---

## Deployment

The application compiles to pure static HTML/CSS/JS in the `dist` directory.

### Deploying to Netlify
Netlify configuration is included in [`netlify.toml`](./netlify.toml):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
1. Push this repository to GitHub or GitLab.
2. In the Netlify dashboard, choose **Add new site** > **Import an existing project**.
3. Select this repository. Netlify will automatically detect `dist` and build commands.
4. Click **Deploy site**.

### Deploying to Vercel
Vercel configuration is included in [`vercel.json`](./vercel.json):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
1. Import the repository in your Vercel Dashboard.
2. Framework Preset: **Vite**.
3. Click **Deploy**.

---

## Browser Playback Limitations & Troubleshooting

### Understanding Public IPTV Feeds
Public IPTV feeds are broadcasted by external web servers, television stations, and internet relay operators across the globe. Because of this:
1. **CORS Restrictions**: Standard web browsers enforce the **Same-Origin Policy** (`CORS`). When a stream server does not send an `Access-Control-Allow-Origin: *` response header, modern browsers block the web application from reading the stream chunks.
   - *Solution*: Muffin Live TV handles CORS blocks cleanly with informative error cards and provides a **Copy Stream URL** button so you can inspect or test the direct link in VLC or MPV player.
2. **Mixed Content (HTTP vs HTTPS)**: If Muffin Live TV is deployed over `https://`, browsers will block plain `http://` streams by default due to browser Mixed Content security rules. Most prominent public iptv-org feeds provide `https://` URLs.
3. **Geo-Blocking & Expired Feeds**: Channels may restrict access to viewers inside specific geographic boundaries or rotate authentication tokens. Muffin Live TV displays a clear `Access forbidden / Geo-restricted` notification when a stream responds with HTTP 403.
4. **Browser Autoplay Policies**: Modern browsers prohibit audio playback without prior user interaction. If autoplay is prevented upon choosing a channel, Muffin Live TV displays an intuitive "Click to Play" overlay.

---

## Attribution & Responsible Use

- **Data Source**: Channel metadata and public stream links are curated by the open-source [iptv-org/iptv](https://github.com/iptv-org/iptv) project under the Unlicense.
- **Responsible Use**: Muffin Live TV does not host, broadcast, archive, or re-transmit media content. It acts strictly as an in-browser client player for publicly accessible streaming links. No DRM circumvention or unauthorized access tools are implemented.
