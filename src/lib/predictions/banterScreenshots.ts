// Self-contained high-contrast SVG screenshot cards for Troll Football banter posts

function encodeSvg(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const LAW_FC_TABLE_SCREENSHOT = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320" fill="none">
  <rect width="600" height="320" rx="14" fill="#0b1624"/>
  <rect x="0.5" y="0.5" width="599" height="319" rx="13.5" stroke="#1e293b"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="600" height="48" rx="14" fill="#14263b"/>
  <circle cx="28" cy="24" r="10" fill="#ff0046" fill-opacity="0.2"/>
  <circle cx="28" cy="24" r="5" fill="#ff0046"/>
  <text x="48" y="29" fill="#f8fafc" font-size="13" font-family="system-ui, -apple-system, sans-serif" font-weight="800" letter-spacing="0.5">EPL STANDINGS · RELEGATION ZONE</text>
  <text x="490" y="28" fill="#94a3b8" font-size="11" font-family="monospace">MATCHDAY 7</text>

  <!-- Table Columns -->
  <text x="24" y="76" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">#</text>
  <text x="56" y="76" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">TEAM</text>
  <text x="240" y="76" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">P</text>
  <text x="280" y="76" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">W</text>
  <text x="320" y="76" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">D</text>
  <text x="360" y="76" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">L</text>
  <text x="400" y="76" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">GF</text>
  <text x="445" y="76" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">GA</text>
  <text x="495" y="76" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">GD</text>
  <text x="550" y="76" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">PTS</text>

  <line x1="20" y1="88" x2="580" y2="88" stroke="#1e293b"/>

  <!-- Row 5: Blue Blazers -->
  <text x="24" y="116" fill="#94a3b8" font-size="11" font-family="monospace">5</text>
  <text x="56" y="116" fill="#e2e8f0" font-size="11" font-family="sans-serif" font-weight="600">Blue Blazers</text>
  <text x="242" y="116" fill="#cbd5e1" font-size="11" font-family="monospace">6</text>
  <text x="282" y="116" fill="#cbd5e1" font-size="11" font-family="monospace">3</text>
  <text x="322" y="116" fill="#cbd5e1" font-size="11" font-family="monospace">1</text>
  <text x="362" y="116" fill="#cbd5e1" font-size="11" font-family="monospace">2</text>
  <text x="404" y="116" fill="#cbd5e1" font-size="11" font-family="monospace">8</text>
  <text x="448" y="116" fill="#cbd5e1" font-size="11" font-family="monospace">7</text>
  <text x="496" y="116" fill="#10b981" font-size="11" font-family="monospace">+1</text>
  <text x="554" y="116" fill="#f8fafc" font-size="11" font-family="monospace" font-weight="700">10</text>

  <line x1="20" y1="132" x2="580" y2="132" stroke="#1e293b" stroke-opacity="0.6"/>

  <!-- Row 6: Mighty Blacks -->
  <text x="24" y="158" fill="#94a3b8" font-size="11" font-family="monospace">6</text>
  <text x="56" y="158" fill="#e2e8f0" font-size="11" font-family="sans-serif" font-weight="600">Mighty Blacks</text>
  <text x="242" y="158" fill="#cbd5e1" font-size="11" font-family="monospace">6</text>
  <text x="282" y="158" fill="#cbd5e1" font-size="11" font-family="monospace">2</text>
  <text x="322" y="158" fill="#cbd5e1" font-size="11" font-family="monospace">2</text>
  <text x="362" y="158" fill="#cbd5e1" font-size="11" font-family="monospace">2</text>
  <text x="404" y="158" fill="#cbd5e1" font-size="11" font-family="monospace">6</text>
  <text x="448" y="158" fill="#cbd5e1" font-size="11" font-family="monospace">6</text>
  <text x="498" y="158" fill="#94a3b8" font-size="11" font-family="monospace">0</text>
  <text x="554" y="158" fill="#f8fafc" font-size="11" font-family="monospace" font-weight="700">8</text>

  <line x1="20" y1="174" x2="580" y2="174" stroke="#1e293b" stroke-opacity="0.6"/>

  <!-- Row 7: FASS Elites -->
  <text x="24" y="200" fill="#94a3b8" font-size="11" font-family="monospace">7</text>
  <text x="56" y="200" fill="#e2e8f0" font-size="11" font-family="sans-serif" font-weight="600">FASS Elites</text>
  <text x="242" y="200" fill="#cbd5e1" font-size="11" font-family="monospace">6</text>
  <text x="282" y="200" fill="#cbd5e1" font-size="11" font-family="monospace">2</text>
  <text x="322" y="200" fill="#cbd5e1" font-size="11" font-family="monospace">0</text>
  <text x="362" y="200" fill="#cbd5e1" font-size="11" font-family="monospace">4</text>
  <text x="404" y="200" fill="#cbd5e1" font-size="11" font-family="monospace">5</text>
  <text x="446" y="200" fill="#f87171" font-size="11" font-family="monospace">11</text>
  <text x="496" y="200" fill="#ef4444" font-size="11" font-family="monospace">-6</text>
  <text x="554" y="200" fill="#f8fafc" font-size="11" font-family="monospace" font-weight="700">6</text>

  <!-- Row 8 Highlighted Troll: Law FC -->
  <rect x="16" y="214" width="568" height="42" rx="8" fill="#ff0046" fill-opacity="0.18" stroke="#ff0046" stroke-width="1.5"/>
  <text x="24" y="239" fill="#ff4d79" font-size="11" font-family="monospace" font-weight="800">8</text>
  <text x="56" y="239" fill="#ffffff" font-size="12" font-family="sans-serif" font-weight="800">Law FC 🚨</text>
  <text x="242" y="239" fill="#ffffff" font-size="11" font-family="monospace" font-weight="700">6</text>
  <text x="282" y="239" fill="#ffffff" font-size="11" font-family="monospace">1</text>
  <text x="322" y="239" fill="#ffffff" font-size="11" font-family="monospace">1</text>
  <text x="362" y="239" fill="#ffffff" font-size="11" font-family="monospace">4</text>
  <text x="404" y="239" fill="#ffffff" font-size="11" font-family="monospace">2</text>
  <text x="444" y="239" fill="#fca5a5" font-size="12" font-family="monospace" font-weight="800">26</text>
  <text x="492" y="239" fill="#ff0046" font-size="12" font-family="monospace" font-weight="900">-24</text>
  <text x="554" y="239" fill="#ffffff" font-size="12" font-family="monospace" font-weight="800">4</text>

  <!-- Bottom Alert Bar -->
  <rect x="16" y="268" width="568" height="36" rx="8" fill="#1e1022" stroke="#ff0046" stroke-opacity="0.4"/>
  <text x="32" y="291" fill="#ff4d79" font-size="11" font-family="sans-serif" font-weight="700">💀 HISTORIC COLLAPSE: 20 GOALS CONCEDED IN 2 MATCHES THIS WEEKEND</text>
</svg>
`);

export const SPARTANS_TACTICAL_SCREENSHOT = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320" fill="none">
  <rect width="600" height="320" rx="14" fill="#081812"/>
  <rect x="0.5" y="0.5" width="599" height="319" rx="13.5" stroke="#143e2e"/>

  <!-- Header -->
  <rect x="0" y="0" width="600" height="46" rx="14" fill="#0e281e"/>
  <text x="24" y="28" fill="#34d399" font-size="12" font-family="system-ui, sans-serif" font-weight="800" letter-spacing="0.5">TACTICAL FORMATION · SPARTANS UNITED</text>
  <text x="460" y="28" fill="#6ee7b7" font-size="11" font-family="monospace">SYSTEM: 10-0-0</text>

  <!-- Pitch markings -->
  <rect x="30" y="60" width="540" height="200" rx="6" stroke="#1d4d39" stroke-width="1.5" fill="#071b13"/>
  <line x1="300" y1="60" x2="300" y2="260" stroke="#1d4d39" stroke-width="1.5" stroke-dasharray="4 4"/>
  <circle cx="300" cy="160" r="36" stroke="#1d4d39" stroke-width="1.5"/>

  <!-- Penalty box (Left/Parked) -->
  <rect x="30" y="90" width="120" height="140" stroke="#1d4d39" stroke-width="1.5"/>
  <rect x="30" y="120" width="46" height="80" stroke="#1d4d39" stroke-width="1.5"/>

  <!-- GK -->
  <circle cx="48" cy="160" r="10" fill="#f59e0b"/>
  <text x="44" y="164" fill="#000" font-size="10" font-weight="900" font-family="monospace">1</text>

  <!-- 10 Defenders crowded on goal line -->
  <circle cx="78" cy="115" r="9" fill="#10b981"/><text x="75" y="119" fill="#000" font-size="9" font-weight="800">2</text>
  <circle cx="78" cy="135" r="9" fill="#10b981"/><text x="75" y="139" fill="#000" font-size="9" font-weight="800">3</text>
  <circle cx="78" cy="155" r="9" fill="#10b981"/><text x="75" y="159" fill="#000" font-size="9" font-weight="800">4</text>
  <circle cx="78" cy="175" r="9" fill="#10b981"/><text x="75" y="179" fill="#000" font-size="9" font-weight="800">5</text>
  <circle cx="78" cy="195" r="9" fill="#10b981"/><text x="75" y="199" fill="#000" font-size="9" font-weight="800">6</text>

  <circle cx="108" cy="125" r="9" fill="#10b981"/><text x="105" y="129" fill="#000" font-size="9" font-weight="800">7</text>
  <circle cx="108" cy="145" r="9" fill="#10b981"/><text x="105" y="149" fill="#000" font-size="9" font-weight="800">8</text>
  <circle cx="108" cy="165" r="9" fill="#10b981"/><text x="105" y="169" fill="#000" font-size="9" font-weight="800">9</text>
  <circle cx="108" cy="185" r="9" fill="#10b981"/><text x="104" y="189" fill="#000" font-size="9" font-weight="800">10</text>
  <circle cx="128" cy="160" r="9" fill="#10b981"/><text x="124" y="164" fill="#000" font-size="9" font-weight="800">11</text>

  <!-- Empty opponent half label -->
  <text x="360" y="155" fill="#2d6a50" font-size="12" font-family="sans-serif" font-weight="700">EMPTY OPPOSITION HALF</text>
  <text x="365" y="175" fill="#245540" font-size="10" font-family="sans-serif">(Zero passes recorded)</text>

  <!-- Bottom Annotation -->
  <rect x="30" y="270" width="540" height="38" rx="6" fill="#0a241b" stroke="#1d4d39"/>
  <text x="46" y="293" fill="#a7f3d0" font-size="11" font-family="sans-serif" font-weight="700">🛡️ CLEAN SHEET MASTERCLASS: 0 set-piece goals conceded all month</text>
</svg>
`);

export const TOP_SCORER_SCREENSHOT = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320" fill="none">
  <rect width="600" height="320" rx="14" fill="#0b1624"/>
  <rect x="0.5" y="0.5" width="599" height="319" rx="13.5" stroke="#1e293b"/>

  <!-- Header -->
  <rect x="0" y="0" width="600" height="46" rx="14" fill="#172554"/>
  <text x="24" y="28" fill="#60a5fa" font-size="12" font-family="system-ui, sans-serif" font-weight="800" letter-spacing="0.5">EPL GOLDEN BOOT · CARRYING AUDIT</text>
  <text x="480" y="28" fill="#93c5fd" font-size="11" font-family="monospace">WEEK 7 STATS</text>

  <!-- Player Spotlight Box -->
  <rect x="24" y="60" width="552" height="110" rx="10" fill="#0f1f33" stroke="#2563eb" stroke-opacity="0.4"/>
  <circle cx="68" cy="115" r="30" fill="#1d4ed8" fill-opacity="0.3"/>
  <text x="56" y="123" fill="#60a5fa" font-size="22" font-weight="900" font-family="sans-serif">#9</text>

  <text x="114" y="98" fill="#f8fafc" font-size="16" font-family="sans-serif" font-weight="800">M. Ochieng (Super Eagles)</text>
  <text x="114" y="118" fill="#94a3b8" font-size="12" font-family="sans-serif">8 Goals in 6 Matches • 89% of Club Goals</text>

  <rect x="114" y="132" width="440" height="14" rx="7" fill="#1e293b"/>
  <rect x="114" y="132" width="390" height="14" rx="7" fill="#eab308"/>
  <text x="510" y="122" fill="#eab308" font-size="18" font-family="monospace" font-weight="900">8 G</text>

  <!-- Rest of squad comparison -->
  <rect x="24" y="180" width="552" height="66" rx="10" fill="#0d1b2a" stroke="#1e293b"/>
  <text x="44" y="206" fill="#94a3b8" font-size="12" font-family="sans-serif" font-weight="700">Rest of Super Eagles Squad (10 Outfield Players)</text>
  <rect x="44" y="218" width="440" height="12" rx="6" fill="#1e293b"/>
  <rect x="44" y="218" width="50" height="12" rx="6" fill="#ef4444"/>
  <text x="510" y="214" fill="#ef4444" font-size="16" font-family="monospace" font-weight="900">1 G</text>

  <!-- Warning Tag -->
  <rect x="24" y="258" width="552" height="42" rx="8" fill="#3b0716" stroke="#ff0046" stroke-opacity="0.4"/>
  <text x="40" y="284" fill="#fda4af" font-size="11" font-family="sans-serif" font-weight="700">🚑 SPINAL STRAIN WARNING: Striker is carrying 10 grown university men</text>
</svg>
`);
