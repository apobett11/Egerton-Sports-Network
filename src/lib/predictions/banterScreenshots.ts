// Self-contained high-contrast SVG screenshot cards for authentic Egerton Sports Network banter posts

function encodeSvg(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const LEAGUE_PAUSE_OFFICIAL_NOTICE_SCREENSHOT = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340" fill="none">
  <rect width="600" height="340" rx="14" fill="#0b1624"/>
  <rect x="0.5" y="0.5" width="599" height="339" rx="13.5" stroke="#1e293b"/>

  <!-- Header Banner -->
  <rect x="0" y="0" width="600" height="52" rx="14" fill="#14263b"/>
  <circle cx="28" cy="26" r="10" fill="#f59e0b" fill-opacity="0.2"/>
  <circle cx="28" cy="26" r="5" fill="#f59e0b"/>
  <text x="48" y="31" fill="#f8fafc" font-size="13" font-family="system-ui, -apple-system, sans-serif" font-weight="800" letter-spacing="0.5">EGERTON SPORTS DIRECTORATE · OFFICIAL CIRCULAR</text>
  <text x="495" y="30" fill="#f59e0b" font-size="11" font-family="monospace" font-weight="700">MD13 PAUSE</text>

  <!-- Body Container -->
  <rect x="20" y="66" width="560" height="200" rx="10" fill="#071524" stroke="#1e2e42"/>
  
  <text x="36" y="96" fill="#f8fafc" font-size="14" font-family="sans-serif" font-weight="800">COMMUNIQUE: TEMPORARY SUSPENSION OF LEAGUE MATCHES</text>
  <text x="36" y="122" fill="#94a3b8" font-size="11" font-family="sans-serif">TO: All Egerton Premier League & Championship Participating Clubs & Match Officials</text>

  <line x1="36" y1="134" x2="564" y2="134" stroke="#1e293b"/>

  <text x="36" y="156" fill="#cbd5e1" font-size="11" font-family="sans-serif">1. All Matchday 13 fixtures are currently paused across both senior campus leagues.</text>
  <text x="36" y="176" fill="#cbd5e1" font-size="11" font-family="sans-serif">2. Pitch A (Main Stadium) drainage maintenance & Pavilion Pitch B turf leveling underway.</text>
  <text x="36" y="196" fill="#cbd5e1" font-size="11" font-family="sans-serif">3. League Management & Referees Committee holding mid-season assessment clinics.</text>
  <text x="36" y="216" fill="#cbd5e1" font-size="11" font-family="sans-serif">4. Resumption dates will be officially ratified and published on Egerton Sports Network.</text>

  <rect x="36" y="234" width="528" height="24" rx="4" fill="#0f263e"/>
  <text x="46" y="250" fill="#38bdf8" font-size="10" font-family="monospace" font-weight="700">CURRENT STATUS: LEAGUES PAUSED AT MD 13 · RESUMPTION COMMUNICATED ON APP</text>

  <!-- Bottom Stamp -->
  <rect x="20" y="278" width="560" height="46" rx="8" fill="#132338" stroke="#1e3450"/>
  <text x="36" y="306" fill="#38bdf8" font-size="12" font-family="sans-serif" font-weight="700">📋 SIGNED: Dean of Students & Sports Directorate · Secretariat Office</text>
</svg>
`);

export const SUPER_EAGLES_RUNAWAY_LEADER_SCREENSHOT = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340" fill="none">
  <rect width="600" height="340" rx="14" fill="#0b1624"/>
  <rect x="0.5" y="0.5" width="599" height="339" rx="13.5" stroke="#1e293b"/>

  <!-- Header -->
  <rect x="0" y="0" width="600" height="48" rx="14" fill="#14263b"/>
  <circle cx="28" cy="24" r="10" fill="#10b981" fill-opacity="0.2"/>
  <circle cx="28" cy="24" r="5" fill="#10b981"/>
  <text x="48" y="29" fill="#f8fafc" font-size="13" font-family="system-ui, sans-serif" font-weight="800" letter-spacing="0.5">EPL TITLE RACE · 7-POINT SUMMIT LEAD</text>
  <text x="475" y="28" fill="#34d399" font-size="11" font-family="monospace" font-weight="700">MATCHDAY 12</text>

  <!-- Columns -->
  <text x="24" y="74" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">#</text>
  <text x="56" y="74" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">CLUB</text>
  <text x="240" y="74" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">P</text>
  <text x="275" y="74" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">W</text>
  <text x="310" y="74" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">D</text>
  <text x="345" y="74" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">L</text>
  <text x="385" y="74" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">GF</text>
  <text x="425" y="74" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">GA</text>
  <text x="470" y="74" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">GD</text>
  <text x="540" y="74" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="700">PTS</text>

  <line x1="20" y1="84" x2="580" y2="84" stroke="#1e293b"/>

  <!-- Row 1: Super Eagles (Leader) -->
  <rect x="16" y="92" width="568" height="42" rx="8" fill="#10b981" fill-opacity="0.18" stroke="#10b981" stroke-width="1.5"/>
  <text x="24" y="117" fill="#34d399" font-size="12" font-family="monospace" font-weight="800">1</text>
  <text x="56" y="117" fill="#ffffff" font-size="13" font-family="sans-serif" font-weight="900">Super eagles 🦅</text>
  <text x="242" y="117" fill="#ffffff" font-size="11" font-family="monospace" font-weight="700">12</text>
  <text x="277" y="117" fill="#ffffff" font-size="11" font-family="monospace" font-weight="700">11</text>
  <text x="312" y="117" fill="#ffffff" font-size="11" font-family="monospace" font-weight="700">0</text>
  <text x="347" y="117" fill="#ffffff" font-size="11" font-family="monospace" font-weight="700">1</text>
  <text x="385" y="117" fill="#34d399" font-size="12" font-family="monospace" font-weight="900">41</text>
  <text x="427" y="117" fill="#ffffff" font-size="11" font-family="monospace" font-weight="700">9</text>
  <text x="466" y="117" fill="#34d399" font-size="12" font-family="monospace" font-weight="900">+32</text>
  <text x="542" y="117" fill="#34d399" font-size="14" font-family="monospace" font-weight="900">33</text>

  <!-- Row 2: Legends Fc -->
  <text x="24" y="156" fill="#94a3b8" font-size="11" font-family="monospace">2</text>
  <text x="56" y="156" fill="#e2e8f0" font-size="12" font-family="sans-serif" font-weight="700">Legends Fc</text>
  <text x="242" y="156" fill="#cbd5e1" font-size="11" font-family="monospace">13</text>
  <text x="277" y="156" fill="#cbd5e1" font-size="11" font-family="monospace">8</text>
  <text x="312" y="156" fill="#cbd5e1" font-size="11" font-family="monospace">2</text>
  <text x="347" y="156" fill="#cbd5e1" font-size="11" font-family="monospace">3</text>
  <text x="387" y="156" fill="#cbd5e1" font-size="11" font-family="monospace">25</text>
  <text x="427" y="156" fill="#cbd5e1" font-size="11" font-family="monospace">17</text>
  <text x="468" y="156" fill="#10b981" font-size="11" font-family="monospace">+8</text>
  <text x="544" y="156" fill="#f8fafc" font-size="12" font-family="monospace" font-weight="800">26</text>

  <line x1="20" y1="172" x2="580" y2="172" stroke="#1e293b" stroke-opacity="0.6"/>

  <!-- Row 3: Wazito Fc -->
  <text x="24" y="196" fill="#94a3b8" font-size="11" font-family="monospace">3</text>
  <text x="56" y="196" fill="#e2e8f0" font-size="12" font-family="sans-serif" font-weight="700">Wazito Fc</text>
  <text x="242" y="196" fill="#cbd5e1" font-size="11" font-family="monospace">12</text>
  <text x="277" y="196" fill="#cbd5e1" font-size="11" font-family="monospace">7</text>
  <text x="312" y="196" fill="#cbd5e1" font-size="11" font-family="monospace">1</text>
  <text x="347" y="196" fill="#cbd5e1" font-size="11" font-family="monospace">4</text>
  <text x="387" y="196" fill="#cbd5e1" font-size="11" font-family="monospace">22</text>
  <text x="427" y="196" fill="#cbd5e1" font-size="11" font-family="monospace">11</text>
  <text x="468" y="196" fill="#10b981" font-size="11" font-family="monospace">+11</text>
  <text x="544" y="196" fill="#f8fafc" font-size="12" font-family="monospace" font-weight="800">22</text>

  <line x1="20" y1="212" x2="580" y2="212" stroke="#1e293b" stroke-opacity="0.6"/>

  <!-- Row 4: BCOM FC -->
  <text x="24" y="236" fill="#94a3b8" font-size="11" font-family="monospace">4</text>
  <text x="56" y="236" fill="#e2e8f0" font-size="12" font-family="sans-serif" font-weight="700">BCOM FC</text>
  <text x="242" y="236" fill="#cbd5e1" font-size="11" font-family="monospace">12</text>
  <text x="277" y="236" fill="#cbd5e1" font-size="11" font-family="monospace">7</text>
  <text x="312" y="236" fill="#cbd5e1" font-size="11" font-family="monospace">1</text>
  <text x="347" y="236" fill="#cbd5e1" font-size="11" font-family="monospace">4</text>
  <text x="387" y="236" fill="#cbd5e1" font-size="11" font-family="monospace">18</text>
  <text x="427" y="236" fill="#cbd5e1" font-size="11" font-family="monospace">14</text>
  <text x="468" y="236" fill="#10b981" font-size="11" font-family="monospace">+4</text>
  <text x="544" y="236" fill="#f8fafc" font-size="12" font-family="monospace" font-weight="800">22</text>

  <!-- Bottom stat bar -->
  <rect x="16" y="264" width="568" height="52" rx="8" fill="#08221b" stroke="#10b981" stroke-opacity="0.4"/>
  <text x="32" y="287" fill="#6ee7b7" font-size="12" font-family="sans-serif" font-weight="800">🔥 DOMINANCE: Super Eagles have scored 3.4 goals per match!</text>
  <text x="32" y="305" fill="#a7f3d0" font-size="10" font-family="sans-serif">Nearest contender Legends is 7 points back with an extra match played.</text>
</svg>
`);

export const REFEREE_JARK_CONTROVERSY_SCREENSHOT = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320" fill="none">
  <rect width="600" height="320" rx="14" fill="#0b1624"/>
  <rect x="0.5" y="0.5" width="599" height="319" rx="13.5" stroke="#1e293b"/>

  <!-- Header -->
  <rect x="0" y="0" width="600" height="48" rx="14" fill="#1f1d2b"/>
  <circle cx="28" cy="24" r="10" fill="#f59e0b" fill-opacity="0.2"/>
  <circle cx="28" cy="24" r="5" fill="#f59e0b"/>
  <text x="48" y="29" fill="#f8fafc" font-size="13" font-family="system-ui, sans-serif" font-weight="800" letter-spacing="0.5">EGERTON REFEREES COMMITTEE · MID-SEASON AUDIT</text>
  <text x="485" y="28" fill="#f59e0b" font-size="11" font-family="monospace">OFFICIATING</text>

  <!-- Ref 1: Jark -->
  <rect x="24" y="66" width="260" height="105" rx="8" fill="#141c2b" stroke="#334155"/>
  <text x="36" y="90" fill="#f8fafc" font-size="13" font-family="sans-serif" font-weight="800">Referee Jark</text>
  <text x="210" y="90" fill="#f59e0b" font-size="11" font-family="monospace" font-weight="800">14 PENS</text>
  <text x="36" y="110" fill="#94a3b8" font-size="10" font-family="sans-serif">Primary: Pitch A Stadium</text>
  <text x="36" y="130" fill="#cbd5e1" font-size="11" font-family="sans-serif">Penalties awarded: 14 in 8 games</text>
  <text x="36" y="150" fill="#fca5a5" font-size="10" font-family="sans-serif">⚠️ 5 penalties contested by coaches</text>

  <!-- Ref 2: Lamoh -->
  <rect x="316" y="66" width="260" height="105" rx="8" fill="#141c2b" stroke="#334155"/>
  <text x="328" y="90" fill="#f8fafc" font-size="13" font-family="sans-serif" font-weight="800">Referee Lamoh</text>
  <text x="495" y="90" fill="#38bdf8" font-size="11" font-family="monospace" font-weight="800">38 CARDS</text>
  <text x="328" y="110" fill="#94a3b8" font-size="10" font-family="sans-serif">Primary: Tatton Ground & Pavilion</text>
  <text x="328" y="130" fill="#cbd5e1" font-size="11" font-family="sans-serif">Fouls called: 182 · High disciplinary rate</text>
  <text x="328" y="150" fill="#34d399" font-size="10" font-family="sans-serif">✅ 0 red card appeals upheld</text>

  <!-- Ref 3: Chalo -->
  <rect x="24" y="185" width="260" height="105" rx="8" fill="#141c2b" stroke="#334155"/>
  <text x="36" y="209" fill="#f8fafc" font-size="13" font-family="sans-serif" font-weight="800">Referee Chalo</text>
  <text x="195" y="209" fill="#f87171" font-size="11" font-family="monospace" font-weight="800">DISALLOWED</text>
  <text x="36" y="229" fill="#94a3b8" font-size="10" font-family="sans-serif">Offside whistle rate: 94%</text>
  <text x="36" y="249" fill="#cbd5e1" font-size="11" font-family="sans-serif">4 goals ruled offside in last 3 weeks</text>
  <text x="36" y="269" fill="#fca5a5" font-size="10" font-family="sans-serif">⚠️ 89th min Blue Blazers equalizer vetoed</text>

  <!-- Ref 4: Ericko -->
  <rect x="316" y="185" width="260" height="105" rx="8" fill="#141c2b" stroke="#334155"/>
  <text x="328" y="209" fill="#f8fafc" font-size="13" font-family="sans-serif" font-weight="800">Referee Ericko</text>
  <text x="500" y="209" fill="#a78bfa" font-size="11" font-family="monospace" font-weight="800">FLOW REF</text>
  <text x="328" y="229" fill="#94a3b8" font-size="10" font-family="sans-serif">Advantage rule applied: 42 times</text>
  <text x="328" y="249" fill="#cbd5e1" font-size="11" font-family="sans-serif">Lowest stoppage time in the league</text>
  <text x="328" y="269" fill="#34d399" font-size="10" font-family="sans-serif">✅ Preferred by attacking teams</text>
</svg>
`);

export const MIGHTY_BLACKS_DEFENSE_COLLAPSE_SCREENSHOT = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320" fill="none">
  <rect width="600" height="320" rx="14" fill="#0b1624"/>
  <rect x="0.5" y="0.5" width="599" height="319" rx="13.5" stroke="#1e293b"/>

  <!-- Header -->
  <rect x="0" y="0" width="600" height="48" rx="14" fill="#2d0a14"/>
  <circle cx="28" cy="24" r="10" fill="#ef4444" fill-opacity="0.2"/>
  <circle cx="28" cy="24" r="5" fill="#ef4444"/>
  <text x="48" y="29" fill="#f8fafc" font-size="13" font-family="system-ui, sans-serif" font-weight="800" letter-spacing="0.5">EPL DEFENSIVE AUDIT · MIGHTY BLACKS</text>
  <text x="460" y="28" fill="#f87171" font-size="11" font-family="monospace" font-weight="700">39 CONCEDED</text>

  <!-- Big Stat Box -->
  <rect x="24" y="66" width="552" height="110" rx="10" fill="#1a0b12" stroke="#dc2626" stroke-opacity="0.4"/>
  <text x="44" y="100" fill="#fca5a5" font-size="12" font-family="sans-serif" font-weight="800">MIGHTY BLACKS DEFENSIVE RECORD</text>
  <text x="44" y="146" fill="#ef4444" font-size="44" font-family="monospace" font-weight="900">39 GA</text>
  <text x="210" y="130" fill="#ffffff" font-size="14" font-family="sans-serif" font-weight="800">3.25 Goals Conceded per Match</text>
  <text x="210" y="152" fill="#94a3b8" font-size="12" font-family="sans-serif">Only 2 wins from 12 games · Goal Difference: -30</text>

  <!-- Visual Bar Comparison -->
  <rect x="24" y="190" width="552" height="64" rx="8" fill="#0f1926" stroke="#1e293b"/>
  <text x="40" y="214" fill="#94a3b8" font-size="11" font-family="sans-serif">Goals conceded vs League Average (16.2 GA)</text>
  <rect x="40" y="226" width="460" height="14" rx="7" fill="#1e293b"/>
  <rect x="40" y="226" width="440" height="14" rx="7" fill="#ef4444"/>
  <text x="510" y="238" fill="#ef4444" font-size="14" font-family="monospace" font-weight="900">39</text>

  <!-- Troll Warning -->
  <rect x="24" y="266" width="552" height="38" rx="6" fill="#24070f" stroke="#ef4444" stroke-opacity="0.4"/>
  <text x="40" y="290" fill="#fca5a5" font-size="11" font-family="sans-serif" font-weight="700">🚨 DEFENSIVE SIEVE: More leaks than Pavilion pitch drainage during the pause</text>
</svg>
`);

export const TOP_SCORER_SCREENSHOT = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320" fill="none">
  <rect width="600" height="320" rx="14" fill="#0b1624"/>
  <rect x="0.5" y="0.5" width="599" height="319" rx="13.5" stroke="#1e293b"/>

  <!-- Header -->
  <rect x="0" y="0" width="600" height="46" rx="14" fill="#172554"/>
  <text x="24" y="28" fill="#60a5fa" font-size="12" font-family="system-ui, sans-serif" font-weight="800" letter-spacing="0.5">EPL GOLDEN BOOT · SUMMIT LEADER</text>
  <text x="460" y="28" fill="#93c5fd" font-size="11" font-family="monospace">PRE-PAUSE STATS</text>

  <!-- Player Spotlight Box -->
  <rect x="24" y="60" width="552" height="110" rx="10" fill="#0f1f33" stroke="#2563eb" stroke-opacity="0.4"/>
  <circle cx="68" cy="115" r="30" fill="#1d4ed8" fill-opacity="0.3"/>
  <text x="52" y="123" fill="#60a5fa" font-size="22" font-weight="900" font-family="sans-serif">#9</text>

  <text x="114" y="98" fill="#f8fafc" font-size="16" font-family="sans-serif" font-weight="800">M. Ochieng (Super Eagles)</text>
  <text x="114" y="118" fill="#94a3b8" font-size="12" font-family="sans-serif">14 Goals in 12 Matches • 34% of League Leading 41 Goals</text>

  <rect x="114" y="132" width="440" height="14" rx="7" fill="#1e293b"/>
  <rect x="114" y="132" width="410" height="14" rx="7" fill="#eab308"/>
  <text x="500" y="122" fill="#eab308" font-size="18" font-family="monospace" font-weight="900">14 G</text>

  <!-- Rest of squad comparison -->
  <rect x="24" y="180" width="552" height="66" rx="10" fill="#0d1b2a" stroke="#1e293b"/>
  <text x="44" y="206" fill="#94a3b8" font-size="12" font-family="sans-serif" font-weight="700">Chasers: Kamau (Legends - 9G) · Otieno (Wazito - 8G) · Mwangi (BCOM - 7G)</text>
  <rect x="44" y="218" width="440" height="12" rx="6" fill="#1e293b"/>
  <rect x="44" y="218" width="280" height="12" rx="6" fill="#38bdf8"/>
  <text x="500" y="214" fill="#38bdf8" font-size="16" font-family="monospace" font-weight="900">9 G</text>

  <!-- Warning Tag -->
  <rect x="24" y="258" width="552" height="42" rx="8" fill="#07221b" stroke="#10b981" stroke-opacity="0.4"/>
  <text x="40" y="284" fill="#6ee7b7" font-size="11" font-family="sans-serif" font-weight="700">⚽ GOLDEN BOOT LOCK: 5-goal lead heading into the Matchday 13 resumption</text>
</svg>
`);

export const LAW_FC_TABLE_SCREENSHOT = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320" fill="none">
  <rect width="600" height="320" rx="14" fill="#0b1624"/>
  <rect x="0.5" y="0.5" width="599" height="319" rx="13.5" stroke="#1e293b"/>

  <!-- Header -->
  <rect x="0" y="0" width="600" height="48" rx="14" fill="#14263b"/>
  <circle cx="28" cy="24" r="10" fill="#ff0046" fill-opacity="0.2"/>
  <circle cx="28" cy="24" r="5" fill="#ff0046"/>
  <text x="48" y="29" fill="#f8fafc" font-size="13" font-family="system-ui, sans-serif" font-weight="800" letter-spacing="0.5">CHAMPIONSHIP STANDINGS · LAW FC STRUGGLE</text>
  <text x="480" y="28" fill="#94a3b8" font-size="11" font-family="monospace">CAMPUS TROLL</text>

  <rect x="16" y="70" width="568" height="160" rx="8" fill="#121e2d" stroke="#233549"/>
  <text x="36" y="100" fill="#f8fafc" font-size="13" font-family="sans-serif" font-weight="800">1. Talanta fc — 25 PTS (Promotion Bound)</text>
  <text x="36" y="126" fill="#cbd5e1" font-size="13" font-family="sans-serif" font-weight="800">2. Ajax fc — 22 PTS</text>
  <text x="36" y="152" fill="#cbd5e1" font-size="13" font-family="sans-serif" font-weight="800">3. young stars — 17 PTS</text>
  <text x="36" y="178" fill="#cbd5e1" font-size="13" font-family="sans-serif" font-weight="800">4. Fass Elites — 17 PTS</text>
  <text x="36" y="204" fill="#ff0046" font-size="13" font-family="sans-serif" font-weight="900">10. law fc — 4 PTS (Appealing every offside flag to Dean)</text>

  <!-- Bottom Alert Bar -->
  <rect x="16" y="250" width="568" height="50" rx="8" fill="#1e1022" stroke="#ff0046" stroke-opacity="0.4"/>
  <text x="32" y="274" fill="#ff4d79" font-size="11" font-family="sans-serif" font-weight="700">⚖️ COURT IS IN SESSION: Law FC debating ref decisions instead of scoring goals</text>
  <text x="32" y="290" fill="#fca5a5" font-size="10" font-family="sans-serif">0 wins in the last 4 matches. Conceded 18 goals.</text>
</svg>
`);
