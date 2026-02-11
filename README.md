# Focus Mode Pro

**Block distractions, stay productive.**

A Chrome extension that blocks distracting websites and helps you manage your time with a built-in Pomodoro timer. No accounts, no data collection -- just focus.

## Features

- **Smart Website Blocking** -- Block any site with simple patterns or advanced regex
- **Pre-built Categories** -- One-click blocking for Social Media, News, Entertainment, Shopping, and Gaming
- **Whitelist Support** -- Always allow important work sites during focus mode
- **Pomodoro Timer** -- Classic 25/5 minute cycles with customizable durations
- **Custom Timer** -- Set any focus duration from 5 minutes to 3 hours
- **Indefinite Mode** -- Focus until you decide to stop
- **Auto-Schedule** -- Automatically enable focus mode during work hours
- **Productivity Stats** -- Track focus time, sessions, and streaks
- **Password Protection** -- Optional password to prevent disabling during focus
- **Emergency Unlock** -- Access blocked sites when absolutely needed (with cooldown)
- **Motivational Quotes** -- Stay inspired with quotes on blocked pages
- **Keyboard Shortcut** -- Alt+Shift+F to toggle focus mode instantly

## Screenshots

Screenshots are located in the `store/screenshots/` directory.

## Installation

### Chrome Web Store

Install directly from the [Chrome Web Store](https://chrome.google.com/webstore) (link coming soon).

### Manual / Developer Install

```bash
git clone https://github.com/theluckystrike/focus-mode-extension.git
cd focus-mode-extension
npm install
npm run build
```

Then in Chrome:

1. Navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` directory

## Usage

1. Click the Focus Mode Pro icon in your browser toolbar.
2. Choose a timer mode: Pomodoro, Custom, or Indefinite.
3. Press **Start** to begin your focus session. Distracting sites will be blocked automatically.
4. Take breaks when prompted and track your productivity over time.

**Keyboard shortcut:** Press `Alt+Shift+F` from any tab to toggle focus mode on or off.

## Tech Stack

- React 18
- TypeScript
- Webpack 5
- Tailwind CSS
- Chrome Extensions Manifest V3

## Development

```bash
# First-time setup (installs dependencies and generates icons)
npm run setup

# Install dependencies
npm install

# Production build
npm run build

# Development mode (watch for changes)
npm run watch

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run type-check
```

## Project Structure

```
src/
  background/    # Service worker for extension lifecycle and blocking logic
  blocked/       # Blocked page UI shown when a distracting site is intercepted
  content/       # Content script injected into web pages
  lib/           # Shared utilities, types, and storage helpers
  options/       # Options/settings page
  popup/         # Browser action popup UI
    components/  # React components for the popup
```

## Privacy

Focus Mode Pro does not collect, transmit, or store any user data externally. All preferences, blocklists, and statistics are stored locally on your device using the Chrome Storage API.

For details, see the [Privacy Policy](https://zovo.one/privacy/focus-mode-pro).

## License

MIT

## Contact

For questions, feedback, or support: [hello@zovo.one](mailto:hello@zovo.one)
