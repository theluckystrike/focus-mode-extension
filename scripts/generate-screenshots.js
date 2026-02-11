const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, '..', 'store', 'screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const W = 1280, H = 800;

function browserChrome(title) {
  return `
    <rect x="0" y="0" width="${W}" height="40" fill="#27272A"/>
    <circle cx="20" cy="20" r="6" fill="#EF4444"/>
    <circle cx="40" cy="20" r="6" fill="#F59E0B"/>
    <circle cx="60" cy="20" r="6" fill="#22C55E"/>
    <rect x="80" y="8" width="200" height="24" rx="4" fill="#3F3F46"/>
    <text x="110" y="25" font-family="Arial" font-size="11" fill="#A1A1AA">${title}</text>
  `;
}

function screenshot1_popup() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#0A0A0B"/>
    ${browserChrome('chrome-extension://focus-mode-pro/popup.html')}

    <!-- Popup window centered -->
    <rect x="440" y="60" width="400" height="560" rx="12" fill="#111113" stroke="#27272A" stroke-width="1"/>

    <!-- Header -->
    <rect x="460" y="80" width="30" height="30" rx="8" fill="#7C3AED"/>
    <circle cx="475" cy="95" r="8" fill="none" stroke="white" stroke-width="2"/>
    <circle cx="475" cy="95" r="3" fill="white"/>
    <text x="500" y="95" font-family="Arial" font-size="16" font-weight="bold" fill="white">Focus Mode Pro</text>
    <text x="500" y="110" font-family="Arial" font-size="10" fill="#71717A">by Zovo</text>

    <!-- Mode selector -->
    <rect x="460" y="130" width="360" height="35" rx="8" fill="#18181B"/>
    <rect x="462" y="132" width="118" height="31" rx="7" fill="#7C3AED"/>
    <text x="521" y="152" font-family="Arial" font-size="12" font-weight="bold" fill="white" text-anchor="middle">Pomodoro</text>
    <text x="639" y="152" font-family="Arial" font-size="12" fill="#A1A1AA" text-anchor="middle">Custom</text>
    <text x="759" y="152" font-family="Arial" font-size="12" fill="#A1A1AA" text-anchor="middle">Indefinite</text>

    <!-- Timer display -->
    <text x="640" y="260" font-family="Arial" font-size="72" font-weight="bold" fill="white" text-anchor="middle">25:00</text>
    <text x="640" y="290" font-family="Arial" font-size="13" fill="#71717A" text-anchor="middle">Ready to focus</text>

    <!-- Start button -->
    <rect x="520" y="320" width="240" height="48" rx="24" fill="#7C3AED"/>
    <text x="640" y="350" font-family="Arial" font-size="16" font-weight="bold" fill="white" text-anchor="middle">Start Focus</text>

    <!-- Quick stats -->
    <rect x="460" y="400" width="110" height="70" rx="8" fill="#18181B"/>
    <text x="515" y="430" font-family="Arial" font-size="20" font-weight="bold" fill="#22C55E" text-anchor="middle">1h 30m</text>
    <text x="515" y="450" font-family="Arial" font-size="10" fill="#71717A" text-anchor="middle">Today</text>

    <rect x="585" y="400" width="110" height="70" rx="8" fill="#18181B"/>
    <text x="640" y="430" font-family="Arial" font-size="20" font-weight="bold" fill="#7C3AED" text-anchor="middle">8</text>
    <text x="640" y="450" font-family="Arial" font-size="10" fill="#71717A" text-anchor="middle">Blocked</text>

    <rect x="710" y="400" width="110" height="70" rx="8" fill="#18181B"/>
    <text x="765" y="430" font-family="Arial" font-size="20" font-weight="bold" fill="#F59E0B" text-anchor="middle">5</text>
    <text x="765" y="450" font-family="Arial" font-size="10" fill="#71717A" text-anchor="middle">Day Streak</text>

    <!-- Footer -->
    <text x="640" y="540" font-family="Arial" font-size="10" fill="#52525B" text-anchor="middle">Alt+Shift+F to toggle</text>
    <rect x="560" y="555" width="70" height="24" rx="4" fill="#18181B" stroke="#27272A" stroke-width="1"/>
    <text x="595" y="571" font-family="Arial" font-size="10" fill="#A1A1AA" text-anchor="middle">Options</text>
    <rect x="650" y="555" width="70" height="24" rx="4" fill="#18181B" stroke="#27272A" stroke-width="1"/>
    <text x="685" y="571" font-family="Arial" font-size="10" fill="#A1A1AA" text-anchor="middle">Stats</text>

    <!-- Headline -->
    <text x="640" y="680" font-family="Arial" font-size="32" font-weight="bold" fill="white" text-anchor="middle">Clean, Modern Interface</text>
    <text x="640" y="715" font-family="Arial" font-size="16" fill="#A1A1AA" text-anchor="middle">Pomodoro, custom, and indefinite timer modes</text>
  </svg>`;
}

function screenshot2_active() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#0A0A0B"/>
    ${browserChrome('chrome-extension://focus-mode-pro/popup.html')}

    <rect x="440" y="60" width="400" height="560" rx="12" fill="#111113" stroke="#7C3AED" stroke-width="1" stroke-opacity="0.5"/>

    <!-- Header with active indicator -->
    <rect x="460" y="80" width="30" height="30" rx="8" fill="#7C3AED"/>
    <circle cx="475" cy="95" r="8" fill="none" stroke="white" stroke-width="2"/>
    <circle cx="475" cy="95" r="3" fill="white"/>
    <text x="500" y="95" font-family="Arial" font-size="16" font-weight="bold" fill="white">Focus Mode Pro</text>
    <circle cx="810" cy="90" r="5" fill="#22C55E"/>
    <text x="795" y="108" font-family="Arial" font-size="9" fill="#22C55E">ACTIVE</text>

    <!-- Timer counting down -->
    <text x="640" y="240" font-family="Arial" font-size="80" font-weight="bold" fill="#7C3AED" text-anchor="middle">18:42</text>
    <text x="640" y="275" font-family="Arial" font-size="14" fill="#A1A1AA" text-anchor="middle">Pomodoro Session 2 of 4</text>

    <!-- Progress dots -->
    <circle cx="600" cy="300" r="8" fill="#22C55E"/>
    <circle cx="625" cy="300" r="8" fill="#7C3AED"/>
    <circle cx="650" cy="300" r="8" fill="#27272A" stroke="#3F3F46" stroke-width="1"/>
    <circle cx="675" cy="300" r="8" fill="#27272A" stroke="#3F3F46" stroke-width="1"/>

    <!-- Controls -->
    <rect x="520" y="340" width="110" height="44" rx="22" fill="#18181B" stroke="#3F3F46" stroke-width="1"/>
    <text x="575" y="367" font-family="Arial" font-size="14" fill="#A1A1AA" text-anchor="middle">Pause</text>

    <rect x="650" y="340" width="110" height="44" rx="22" fill="#18181B" stroke="#EF4444" stroke-width="1"/>
    <text x="705" y="367" font-family="Arial" font-size="14" fill="#EF4444" text-anchor="middle">Stop</text>

    <!-- Quick stats -->
    <rect x="460" y="420" width="110" height="70" rx="8" fill="#18181B"/>
    <text x="515" y="450" font-family="Arial" font-size="20" font-weight="bold" fill="#22C55E" text-anchor="middle">2h 15m</text>
    <text x="515" y="470" font-family="Arial" font-size="10" fill="#71717A" text-anchor="middle">Today</text>

    <rect x="585" y="420" width="110" height="70" rx="8" fill="#18181B"/>
    <text x="640" y="450" font-family="Arial" font-size="20" font-weight="bold" fill="#7C3AED" text-anchor="middle">12</text>
    <text x="640" y="470" font-family="Arial" font-size="10" fill="#71717A" text-anchor="middle">Blocked</text>

    <rect x="710" y="420" width="110" height="70" rx="8" fill="#18181B"/>
    <text x="765" y="450" font-family="Arial" font-size="20" font-weight="bold" fill="#F59E0B" text-anchor="middle">7</text>
    <text x="765" y="470" font-family="Arial" font-size="10" fill="#71717A" text-anchor="middle">Day Streak</text>

    <!-- Headline -->
    <text x="640" y="680" font-family="Arial" font-size="32" font-weight="bold" fill="white" text-anchor="middle">Active Focus Session</text>
    <text x="640" y="715" font-family="Arial" font-size="16" fill="#A1A1AA" text-anchor="middle">Visual countdown with pause and stop controls</text>
  </svg>`;
}

function screenshot3_blocked() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0A0A0B"/>
        <stop offset="50%" stop-color="#18181B"/>
        <stop offset="100%" stop-color="#0A0A0B"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg3)"/>
    ${browserChrome('twitter.com')}

    <!-- Focus icon -->
    <rect x="600" y="100" width="80" height="80" rx="20" fill="#7C3AED"/>
    <circle cx="640" cy="140" r="20" fill="none" stroke="white" stroke-width="4"/>
    <circle cx="640" cy="140" r="6" fill="white"/>

    <text x="640" y="230" font-family="Arial" font-size="36" font-weight="bold" fill="white" text-anchor="middle">Stay Focused</text>
    <text x="640" y="265" font-family="Arial" font-size="16" fill="#A1A1AA" text-anchor="middle">This site is blocked during your focus session</text>
    <text x="640" y="290" font-family="Arial" font-size="12" fill="#71717A" text-anchor="middle">twitter.com</text>

    <!-- Timer -->
    <text x="640" y="370" font-family="Arial" font-size="56" font-weight="bold" fill="#7C3AED" text-anchor="middle">18:42</text>
    <text x="640" y="400" font-family="Arial" font-size="12" fill="#71717A" text-anchor="middle">remaining in focus session</text>

    <!-- Pomodoro dots -->
    <circle cx="610" cy="430" r="8" fill="#22C55E"/>
    <circle cx="630" cy="430" r="8" fill="#22C55E"/>
    <circle cx="650" cy="430" r="8" fill="#27272A"/>
    <circle cx="670" cy="430" r="8" fill="#27272A"/>

    <!-- Quote -->
    <rect x="370" y="470" width="540" height="90" rx="12" fill="#18181B" fill-opacity="0.5" stroke="#27272A" stroke-width="1"/>
    <text x="640" y="505" font-family="Arial" font-size="14" fill="white" text-anchor="middle" font-style="italic">"Your focus determines your reality."</text>
    <text x="640" y="530" font-family="Arial" font-size="11" fill="#71717A" text-anchor="middle">- Qui-Gon Jinn</text>

    <text x="640" y="620" font-family="Arial" font-size="12" fill="#71717A" text-anchor="middle">Need access? Emergency unlock</text>

    <text x="640" y="700" font-family="Arial" font-size="28" font-weight="bold" fill="white" text-anchor="middle">Beautiful Blocked Page</text>
    <text x="640" y="730" font-family="Arial" font-size="14" fill="#A1A1AA" text-anchor="middle">Timer countdown, motivational quotes, and emergency unlock</text>
  </svg>`;
}

function screenshot4_blocking() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#0A0A0B"/>
    ${browserChrome('Focus Mode Pro - Settings')}

    <rect x="100" y="80" width="1080" height="680" rx="0" fill="#0A0A0B"/>

    <!-- Header -->
    <rect x="140" y="100" width="40" height="40" rx="10" fill="#7C3AED"/>
    <circle cx="160" cy="120" r="10" fill="none" stroke="white" stroke-width="3"/>
    <circle cx="160" cy="120" r="3" fill="white"/>
    <text x="195" y="118" font-family="Arial" font-size="22" font-weight="bold" fill="white">Focus Mode Pro</text>
    <text x="195" y="138" font-family="Arial" font-size="12" fill="#A1A1AA">Settings &amp; Configuration</text>

    <!-- Tab bar -->
    <text x="140" y="185" font-family="Arial" font-size="13" fill="#A1A1AA">General</text>
    <text x="220" y="185" font-family="Arial" font-size="13" font-weight="bold" fill="#7C3AED">Blocking</text>
    <rect x="220" y="190" width="60" height="2" fill="#7C3AED"/>
    <text x="310" y="185" font-family="Arial" font-size="13" fill="#A1A1AA">Schedule</text>
    <text x="390" y="185" font-family="Arial" font-size="13" fill="#A1A1AA">Stats</text>
    <text x="450" y="185" font-family="Arial" font-size="13" fill="#A1A1AA">Advanced</text>
    <rect x="140" y="192" width="940" height="1" fill="#27272A"/>

    <!-- Categories card -->
    <rect x="140" y="210" width="940" height="240" rx="8" fill="#18181B" stroke="#27272A" stroke-width="1"/>
    <text x="165" y="242" font-family="Arial" font-size="16" font-weight="bold" fill="white">Block Categories</text>
    <text x="165" y="262" font-family="Arial" font-size="11" fill="#A1A1AA">Enable categories to block groups of common distracting sites.</text>

    <!-- Category toggles grid -->
    <rect x="165" y="280" width="210" height="60" rx="8" fill="#7C3AED" fill-opacity="0.1" stroke="#7C3AED" stroke-width="1"/>
    <text x="185" y="305" font-family="Arial" font-size="12" font-weight="bold" fill="white">Social Media</text>
    <text x="185" y="320" font-family="Arial" font-size="9" fill="#71717A">9 sites</text>

    <rect x="390" y="280" width="210" height="60" rx="8" fill="#27272A" stroke="#3F3F46" stroke-width="1"/>
    <text x="410" y="305" font-family="Arial" font-size="12" fill="white">News Sites</text>
    <text x="410" y="320" font-family="Arial" font-size="9" fill="#71717A">7 sites</text>

    <rect x="615" y="280" width="210" height="60" rx="8" fill="#27272A" stroke="#3F3F46" stroke-width="1"/>
    <text x="635" y="305" font-family="Arial" font-size="12" fill="white">Entertainment</text>
    <text x="635" y="320" font-family="Arial" font-size="9" fill="#71717A">7 sites</text>

    <rect x="840" y="280" width="210" height="60" rx="8" fill="#27272A" stroke="#3F3F46" stroke-width="1"/>
    <text x="860" y="305" font-family="Arial" font-size="12" fill="white">Shopping</text>
    <text x="860" y="320" font-family="Arial" font-size="9" fill="#71717A">6 sites</text>

    <rect x="165" y="355" width="210" height="60" rx="8" fill="#27272A" stroke="#3F3F46" stroke-width="1"/>
    <text x="185" y="380" font-family="Arial" font-size="12" fill="white">Gaming</text>
    <text x="185" y="395" font-family="Arial" font-size="9" fill="#71717A">5 sites</text>

    <!-- Custom blocklist card -->
    <rect x="140" y="470" width="940" height="160" rx="8" fill="#18181B" stroke="#27272A" stroke-width="1"/>
    <text x="165" y="502" font-family="Arial" font-size="16" font-weight="bold" fill="white">Custom Blocklist</text>
    <rect x="165" y="515" width="760" height="32" rx="6" fill="#27272A" stroke="#3F3F46" stroke-width="1"/>
    <text x="180" y="536" font-family="Arial" font-size="12" fill="#71717A">e.g., facebook.com or *.reddit.com</text>
    <rect x="935" y="515" width="60" height="32" rx="6" fill="#7C3AED"/>
    <text x="965" y="536" font-family="Arial" font-size="12" font-weight="bold" fill="white" text-anchor="middle">Add</text>

    <rect x="165" y="560" width="830" height="30" rx="4" fill="#27272A"/>
    <text x="180" y="580" font-family="Arial" font-size="12" fill="white">twitter.com</text>
    <text x="960" y="580" font-family="Arial" font-size="11" fill="#EF4444">Remove</text>

    <rect x="165" y="595" width="830" height="30" rx="4" fill="#27272A"/>
    <text x="180" y="615" font-family="Arial" font-size="12" fill="white">reddit.com</text>
    <text x="960" y="615" font-family="Arial" font-size="11" fill="#EF4444">Remove</text>

    <text x="640" y="720" font-family="Arial" font-size="28" font-weight="bold" fill="white" text-anchor="middle">Smart Website Blocking</text>
    <text x="640" y="750" font-family="Arial" font-size="14" fill="#A1A1AA" text-anchor="middle">One-click category blocking plus custom site rules</text>
  </svg>`;
}

function screenshot5_stats() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#0A0A0B"/>
    ${browserChrome('Focus Mode Pro - Statistics')}

    <rect x="100" y="80" width="1080" height="680" rx="0" fill="#0A0A0B"/>

    <rect x="140" y="100" width="40" height="40" rx="10" fill="#7C3AED"/>
    <text x="195" y="118" font-family="Arial" font-size="22" font-weight="bold" fill="white">Focus Mode Pro</text>
    <text x="195" y="138" font-family="Arial" font-size="12" fill="#A1A1AA">Settings &amp; Configuration</text>

    <text x="140" y="185" font-family="Arial" font-size="13" fill="#A1A1AA">General</text>
    <text x="220" y="185" font-family="Arial" font-size="13" fill="#A1A1AA">Blocking</text>
    <text x="310" y="185" font-family="Arial" font-size="13" fill="#A1A1AA">Schedule</text>
    <text x="390" y="185" font-family="Arial" font-size="13" font-weight="bold" fill="#7C3AED">Stats</text>
    <rect x="390" y="190" width="40" height="2" fill="#7C3AED"/>
    <text x="450" y="185" font-family="Arial" font-size="13" fill="#A1A1AA">Advanced</text>
    <rect x="140" y="192" width="940" height="1" fill="#27272A"/>

    <!-- Today Summary -->
    <rect x="140" y="210" width="940" height="130" rx="8" fill="#18181B" stroke="#27272A" stroke-width="1"/>
    <text x="165" y="242" font-family="Arial" font-size="16" font-weight="bold" fill="white">Today's Summary</text>

    <rect x="165" y="260" width="215" height="65" rx="8" fill="#27272A"/>
    <text x="272" y="290" font-family="Arial" font-size="24" font-weight="bold" fill="#22C55E" text-anchor="middle">2h 15m</text>
    <text x="272" y="310" font-family="Arial" font-size="10" fill="#71717A" text-anchor="middle">Focus Time</text>

    <rect x="395" y="260" width="215" height="65" rx="8" fill="#27272A"/>
    <text x="502" y="290" font-family="Arial" font-size="24" font-weight="bold" fill="#7C3AED" text-anchor="middle">5</text>
    <text x="502" y="310" font-family="Arial" font-size="10" fill="#71717A" text-anchor="middle">Sessions</text>

    <rect x="625" y="260" width="215" height="65" rx="8" fill="#27272A"/>
    <text x="732" y="290" font-family="Arial" font-size="24" font-weight="bold" fill="#EF4444" text-anchor="middle">12</text>
    <text x="732" y="310" font-family="Arial" font-size="10" fill="#71717A" text-anchor="middle">Sites Blocked</text>

    <rect x="855" y="260" width="215" height="65" rx="8" fill="#27272A"/>
    <text x="962" y="290" font-family="Arial" font-size="24" font-weight="bold" fill="#F59E0B" text-anchor="middle">4</text>
    <text x="962" y="310" font-family="Arial" font-size="10" fill="#71717A" text-anchor="middle">Pomodoros</text>

    <!-- Streaks -->
    <rect x="140" y="360" width="940" height="120" rx="8" fill="#18181B" stroke="#27272A" stroke-width="1"/>
    <text x="165" y="392" font-family="Arial" font-size="16" font-weight="bold" fill="white">Streaks</text>

    <rect x="165" y="410" width="450" height="55" rx="8" fill="#27272A"/>
    <text x="390" y="440" font-family="Arial" font-size="30" font-weight="bold" fill="#F59E0B" text-anchor="middle">7</text>
    <text x="390" y="458" font-family="Arial" font-size="10" fill="#71717A" text-anchor="middle">Current Streak (days)</text>

    <rect x="630" y="410" width="440" height="55" rx="8" fill="#27272A"/>
    <text x="850" y="440" font-family="Arial" font-size="30" font-weight="bold" fill="#7C3AED" text-anchor="middle">14</text>
    <text x="850" y="458" font-family="Arial" font-size="10" fill="#71717A" text-anchor="middle">Longest Streak (days)</text>

    <!-- Recent sessions -->
    <rect x="140" y="500" width="940" height="170" rx="8" fill="#18181B" stroke="#27272A" stroke-width="1"/>
    <text x="165" y="532" font-family="Arial" font-size="16" font-weight="bold" fill="white">Recent Sessions</text>

    <rect x="165" y="545" width="900" height="35" rx="4" fill="#27272A"/>
    <text x="180" y="567" font-family="Arial" font-size="12" fill="white">2/11/2026 at 09:30 AM</text>
    <text x="420" y="567" font-family="Arial" font-size="10" fill="#71717A">pomodoro mode - 25 min</text>
    <rect x="990" y="553" width="70" height="20" rx="10" fill="#22C55E" fill-opacity="0.2"/>
    <text x="1025" y="567" font-family="Arial" font-size="10" fill="#22C55E" text-anchor="middle">Completed</text>

    <rect x="165" y="585" width="900" height="35" rx="4" fill="#27272A"/>
    <text x="180" y="607" font-family="Arial" font-size="12" fill="white">2/11/2026 at 10:15 AM</text>
    <text x="420" y="607" font-family="Arial" font-size="10" fill="#71717A">pomodoro mode - 25 min</text>
    <rect x="990" y="593" width="70" height="20" rx="10" fill="#22C55E" fill-opacity="0.2"/>
    <text x="1025" y="607" font-family="Arial" font-size="10" fill="#22C55E" text-anchor="middle">Completed</text>

    <rect x="165" y="625" width="900" height="35" rx="4" fill="#27272A"/>
    <text x="180" y="647" font-family="Arial" font-size="12" fill="white">2/11/2026 at 11:00 AM</text>
    <text x="420" y="647" font-family="Arial" font-size="10" fill="#71717A">custom mode - 18 min</text>
    <rect x="990" y="633" width="70" height="20" rx="10" fill="#EF4444" fill-opacity="0.2"/>
    <text x="1025" y="647" font-family="Arial" font-size="10" fill="#EF4444" text-anchor="middle">Stopped</text>

    <text x="640" y="740" font-family="Arial" font-size="28" font-weight="bold" fill="white" text-anchor="middle">Track Your Productivity</text>
    <text x="640" y="770" font-family="Arial" font-size="14" fill="#A1A1AA" text-anchor="middle">Daily stats, streaks, and session history</text>
  </svg>`;
}

async function generate() {
  const screenshots = [
    { fn: screenshot1_popup, name: '1-popup-idle.png' },
    { fn: screenshot2_active, name: '2-active-focus.png' },
    { fn: screenshot3_blocked, name: '3-blocked-page.png' },
    { fn: screenshot4_blocking, name: '4-blocking-settings.png' },
    { fn: screenshot5_stats, name: '5-statistics.png' },
  ];

  for (const ss of screenshots) {
    const svg = ss.fn();
    await sharp(Buffer.from(svg)).png().toFile(path.join(outputDir, ss.name));
    console.log('Generated: ' + ss.name);
  }
  console.log('All screenshots generated!');
}

generate().catch(console.error);
