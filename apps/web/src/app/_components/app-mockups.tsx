// Realistic app mockups for the landing page "duas formas de usar" section
// Codex (verde OpenAI) e Claude Code (laranja Anthropic)

export function CodexMockup() {
  return (
    <svg viewBox="0 0 720 440" xmlns="http://www.w3.org/2000/svg" className="block w-full h-auto">
      <defs>
        <linearGradient id="codex-window-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0E1A14" />
          <stop offset="100%" stopColor="#080C0A" />
        </linearGradient>
        <linearGradient id="codex-titlebar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A2922" />
          <stop offset="100%" stopColor="#0E1A14" />
        </linearGradient>
        <linearGradient id="codex-approval-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F3D2D" />
          <stop offset="100%" stopColor="#0A2A1F" />
        </linearGradient>
        <radialGradient id="codex-glow" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#10A37F" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#10A37F" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Window shadow */}
      <rect x="3" y="6" width="714" height="430" rx="14" fill="#000" opacity="0.5" filter="blur(8px)" />

      {/* Window background */}
      <rect width="720" height="440" rx="14" fill="url(#codex-window-bg)" stroke="#10A37F" strokeOpacity="0.15" />

      {/* Glow */}
      <rect width="720" height="440" rx="14" fill="url(#codex-glow)" />

      {/* Title bar */}
      <rect width="720" height="42" rx="14" fill="url(#codex-titlebar)" />
      <rect y="14" width="720" height="28" fill="url(#codex-titlebar)" />
      <line x1="0" y1="42" x2="720" y2="42" stroke="#10A37F" strokeOpacity="0.2" />

      {/* Traffic lights */}
      <circle cx="22" cy="21" r="6" fill="#FF5F56" />
      <circle cx="22" cy="21" r="5" fill="#FF5F56" opacity="0.5" />
      <circle cx="44" cy="21" r="6" fill="#FFBD2E" />
      <circle cx="44" cy="21" r="5" fill="#FFBD2E" opacity="0.5" />
      <circle cx="66" cy="21" r="6" fill="#27C93F" />
      <circle cx="66" cy="21" r="5" fill="#27C93F" opacity="0.5" />

      {/* Tab title */}
      <text x="360" y="26" fill="#10A37F" fontSize="11.5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" textAnchor="middle" fontWeight="600">
        codex — ~/projects/consecom-routing (zsh)
      </text>

      {/* Tab indicator (active dot) */}
      <circle cx="676" cy="21" r="3" fill="#10A37F" />

      {/* Content area */}
      <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="13">
        {/* Prompt 1: cd */}
        <text x="20" y="80" fill="#7A8478">$</text>
        <text x="40" y="80" fill="#D4D4D4">cd ~/projects/consecom-routing</text>

        {/* Prompt 2: openai env (highlight) */}
        <text x="20" y="106" fill="#7A8478">$</text>
        <text x="40" y="106" fill="#D4D4D4">export </text>
        <text x="100" y="106" fill="#DCDCAA">OPENAI_API_BASE</text>
        <text x="222" y="106" fill="#D4D4D4">=</text>
        <text x="234" y="106" fill="#CE9178">"https://api.consecom.com.br/v1"</text>

        {/* Prompt 3: codex command */}
        <text x="20" y="132" fill="#7A8478">$</text>
        <text x="40" y="132" fill="#10A37F" fontWeight="700">codex </text>
        <text x="92" y="132" fill="#CE9178">"adicione dark mode toggle no dashboard"</text>

        {/* Empty line */}
        <rect x="0" y="148" width="720" height="20" fill="#FFFFFF" opacity="0.02" />

        {/* Codex output */}
        <g transform="translate(40, 172)">
          {/* Banner */}
          <text fill="#10A37F" fontWeight="700" fontSize="13">▌ codex v0.1.0</text>
          <text x="120" fill="#7A8478">— OpenAI's coding agent</text>

          <text y="22" fill="#10A37F" fontWeight="700">▌</text>
          <text x="14" y="22" fill="#7A8478">Connecting to</text>
          <text x="130" y="22" fill="#10A37F">api.consecom.com.br</text>
          <text x="280" y="22" fill="#7A8478">...</text>
          <text x="305" y="22" fill="#10A37F" fontWeight="700">OK</text>

          <text y="44" fill="#10A37F" fontWeight="700">▌</text>
          <text x="14" y="44" fill="#7A8478">Model:</text>
          <text x="70" y="44" fill="#10A37F" fontWeight="700">claude-haiku-4-5-puter</text>

          <text y="66" fill="#10A37F" fontWeight="700">▌</text>
          <text x="14" y="66" fill="#7A8478">Working on</text>
          <text x="100" y="66" fill="#CE9178">apps/web/src/app/dashboard/page.tsx</text>
        </g>

        {/* Tool call: Read */}
        <g transform="translate(40, 264)">
          <rect x="-12" y="-14" width="660" height="26" rx="5" fill="#10A37F" fillOpacity="0.08" stroke="#10A37F" strokeOpacity="0.35" />
          <text fill="#10A37F" fontSize="13" fontWeight="700">▸</text>
          <text x="16" fill="#10A37F" fontWeight="700">Reading</text>
          <text x="86" fill="#CE9178">apps/web/src/app/dashboard/page.tsx</text>
          <text x="380" fill="#7A8478">...</text>
          <text x="408" fill="#10A37F" fontWeight="700">ok (847 lines)</text>
        </g>

        {/* Tool call: Edit */}
        <g transform="translate(40, 300)">
          <rect x="-12" y="-14" width="660" height="26" rx="5" fill="#10A37F" fillOpacity="0.08" stroke="#10A37F" strokeOpacity="0.35" />
          <text fill="#10A37F" fontSize="13" fontWeight="700">▸</text>
          <text x="16" fill="#10A37F" fontWeight="700">Editing</text>
          <text x="78" fill="#CE9178">apps/web/src/app/dashboard/page.tsx</text>
          <text x="380" fill="#7A8478">+ </text>
          <text x="396" fill="#10A37F" fontWeight="700">12 lines</text>
        </g>

        {/* Approval prompt */}
        <g transform="translate(40, 340)">
          <rect x="-12" y="-14" width="660" height="64" rx="6" fill="url(#codex-approval-bg)" stroke="#10A37F" strokeOpacity="0.5" strokeWidth="1.5" />

          <text fill="#10A37F" fontSize="13" fontWeight="700">▌</text>
          <text x="16" fill="#D4D4D4">Approve and run?</text>
          <text x="146" fill="#7A8478">[</text>
          <text x="154" fill="#10A37F" fontWeight="700" fontSize="14">y</text>
          <text x="166" fill="#7A8478">es/</text>
          <text x="190" fill="#10A37F" fontWeight="700" fontSize="14">n</text>
          <text x="202" fill="#7A8478">o]</text>

          {/* Cursor input line */}
          <text y="28" fill="#10A37F" fontWeight="700">▌</text>
          <text x="16" y="28" fill="#10A37F" fontWeight="700" fontSize="14">y</text>
          <rect x="32" y="18" width="8" height="14" fill="#10A37F" opacity="0.8" />
        </g>
      </g>

      {/* Status bar at bottom */}
      <rect y="410" width="720" height="30" fill="#000" opacity="0.4" />
      <line x1="0" y1="410" x2="720" y2="410" stroke="#10A37F" strokeOpacity="0.2" />
      <g fontFamily="ui-monospace, monospace" fontSize="10">
        <circle cx="14" cy="425" r="3" fill="#10A37F" />
        <text x="24" y="429" fill="#10A37F">ready</text>
        <text x="120" y="429" fill="#7A8478">·</text>
        <text x="135" y="429" fill="#D4D4D4">tokens: 2.3k</text>
        <text x="220" y="429" fill="#7A8478">·</text>
        <text x="235" y="429" fill="#D4D4D4">claude-haiku-4-5-puter</text>
        <text x="400" y="429" fill="#7A8478">·</text>
        <text x="412" y="429" fill="#10A37F" fontWeight="700">$0.012</text>
      </g>
    </svg>
  );
}

export function ClaudeCodeMockup() {
  return (
    <svg viewBox="0 0 720 440" xmlns="http://www.w3.org/2000/svg" className="block w-full h-auto">
      <defs>
        <linearGradient id="claude-window-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#221409" />
          <stop offset="100%" stopColor="#0F0907" />
        </linearGradient>
        <linearGradient id="claude-titlebar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1F1409" />
          <stop offset="100%" stopColor="#15090A" />
        </linearGradient>
        <linearGradient id="claude-user-msg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E85D1F" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#E85D1F" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="claude-assistant-msg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFF7ED" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#FFF7ED" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="claude-send-btn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FB8B3C" />
          <stop offset="100%" stopColor="#E85D1F" />
        </linearGradient>
        <radialGradient id="claude-glow" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#E85D1F" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#E85D1F" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Window shadow */}
      <rect x="3" y="6" width="714" height="430" rx="14" fill="#000" opacity="0.5" filter="blur(8px)" />

      {/* Window background */}
      <rect width="720" height="440" rx="14" fill="url(#claude-window-bg)" stroke="#E85D1F" strokeOpacity="0.15" />

      {/* Glow */}
      <rect width="720" height="440" rx="14" fill="url(#claude-glow)" />

      {/* Title bar */}
      <rect width="720" height="42" rx="14" fill="url(#claude-titlebar)" />
      <rect y="14" width="720" height="28" fill="url(#claude-titlebar)" />
      <line x1="0" y1="42" x2="720" y2="42" stroke="#E85D1F" strokeOpacity="0.2" />

      {/* Traffic lights */}
      <circle cx="22" cy="21" r="6" fill="#FF5F56" />
      <circle cx="44" cy="21" r="6" fill="#FFBD2E" />
      <circle cx="66" cy="21" r="6" fill="#27C93F" />

      {/* Tab title with Claude icon */}
      <text x="360" y="26" fill="#E85D1F" fontSize="11.5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" textAnchor="middle" fontWeight="600">
        Claude Code — consecom-routing
      </text>

      {/* Tab indicator (active dot) */}
      <circle cx="676" cy="21" r="3" fill="#E85D1F" />

      {/* Sidebar */}
      <rect x="0" y="42" width="180" height="368" fill="#000" opacity="0.3" />
      <line x1="180" y1="42" x2="180" y2="410" stroke="#E85D1F" strokeOpacity="0.15" />

      {/* Sidebar header */}
      <g fontFamily="ui-sans-serif, system-ui" fontSize="10">
        <rect x="12" y="58" width="156" height="22" rx="6" fill="#E85D1F" fillOpacity="0.15" />
        <text x="22" y="73" fill="#E85D1F" fontWeight="700" fontFamily="monospace">consecom-routing</text>
      </g>

      {/* Sidebar tree */}
      <g fontFamily="ui-monospace, monospace" fontSize="10.5" fill="#A89585">
        <text x="14" y="100">📁 apps</text>
        <text x="22" y="116">  📁 web</text>
        <text x="34" y="132">    📁 src</text>
        <text x="44" y="148">      📁 app</text>
        <text x="54" y="164">        📁 dashboard</text>
        <text x="64" y="180" fill="#E85D1F" fontWeight="700">        📄 page.tsx</text>
        <text x="64" y="196">        📄 layout.tsx</text>
        <text x="44" y="212">      📁 _components</text>
        <text x="34" y="228">    📄 globals.css</text>
        <text x="22" y="244">  📁 api</text>
        <text x="14" y="260">📁 packages</text>
        <text x="14" y="276">  📁 db</text>
        <text x="14" y="292">  📁 shared</text>
        <text x="14" y="308">  📁 config</text>
        <text x="14" y="324">📄 package.json</text>
        <text x="14" y="340">📄 pnpm-lock.yaml</text>

        {/* Files changed indicator */}
        <rect x="12" y="358" width="156" height="44" rx="6" fill="#E85D1F" fillOpacity="0.08" stroke="#E85D1F" strokeOpacity="0.2" />
        <text x="22" y="375" fill="#E85D1F" fontWeight="700">Files Changed</text>
        <text x="22" y="390" fill="#A89585">+ 3 modified</text>
        <text x="22" y="402" fill="#A89585">+ 1 created</text>
      </g>

      {/* Main chat area */}
      <g transform="translate(196, 56)">
        {/* Model selector */}
        <rect x="0" y="0" width="148" height="26" rx="8" fill="#E85D1F" fillOpacity="0.15" stroke="#E85D1F" strokeOpacity="0.5" />
        <circle cx="14" cy="13" r="4" fill="#E85D1F" />
        <text x="26" y="17" fill="#E85D1F" fontSize="10.5" fontFamily="ui-monospace, monospace" fontWeight="700">Claude Sonnet 4.5</text>

        {/* Connection indicator */}
        <rect x="368" y="0" width="80" height="26" rx="8" fill="#10A37F" fillOpacity="0.1" stroke="#10A37F" strokeOpacity="0.4" />
        <circle cx="380" cy="13" r="3" fill="#10A37F" />
        <text x="390" y="17" fill="#10A37F" fontSize="10" fontFamily="monospace">conectado</text>

        {/* User message */}
        <g transform="translate(0, 48)">
          <rect x="0" y="0" width="500" height="46" rx="10" fill="url(#claude-user-msg)" stroke="#E85D1F" strokeOpacity="0.3" />
          <text x="14" y="16" fill="#E85D1F" fontSize="9" fontFamily="ui-monospace, monospace" fontWeight="700">Você · 14:32</text>
          <text x="14" y="36" fill="#FFF7ED" fontSize="12" fontFamily="ui-sans-serif, system-ui">Refatora o auth pra usar OAuth2 em vez de JWT custom.</text>
        </g>

        {/* Assistant message */}
        <g transform="translate(0, 110)">
          <rect x="0" y="0" width="500" height="170" rx="10" fill="url(#claude-assistant-msg)" stroke="#FFF7ED" strokeOpacity="0.15" />

          {/* Avatar */}
          <circle cx="22" cy="20" r="11" fill="#E85D1F" />
          <text x="22" y="24" fill="#FFF7ED" fontSize="11" fontFamily="ui-sans-serif" fontWeight="700" textAnchor="middle">C</text>

          <text x="42" y="24" fill="#E85D1F" fontSize="9" fontFamily="ui-monospace, monospace" fontWeight="700">Claude · 14:32</text>

          <text x="14" y="52" fill="#FFF7ED" fontSize="12" fontFamily="ui-sans-serif, system-ui">Vou refatorar o sistema de autenticação.</text>
          <text x="14" y="70" fill="#FFF7ED" fontSize="12" fontFamily="ui-sans-serif, system-ui">Plano de execução:</text>

          {/* Step list */}
          <text x="14" y="92" fill="#10A37F" fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="700">1.</text>
          <text x="28" y="92" fill="#FFF7ED" fontSize="11" fontFamily="ui-sans-serif, system-ui">Adicionar </text>
          <text x="100" y="92" fill="#CE9178" fontSize="11" fontFamily="ui-monospace, monospace">OAuth2Provider</text>
          <text x="184" y="92" fill="#FFF7ED" fontSize="11" fontFamily="ui-sans-serif, system-ui"> class</text>

          <text x="14" y="110" fill="#10A37F" fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="700">2.</text>
          <text x="28" y="110" fill="#FFF7ED" fontSize="11" fontFamily="ui-sans-serif, system-ui">Substituir JWT middleware</text>

          <text x="14" y="128" fill="#10A37F" fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="700">3.</text>
          <text x="28" y="128" fill="#FFF7ED" fontSize="11" fontFamily="ui-sans-serif, system-ui">Adicionar refresh token rotation</text>

          <text x="14" y="146" fill="#10A37F" fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="700">4.</text>
          <text x="28" y="146" fill="#FFF7ED" fontSize="11" fontFamily="ui-sans-serif, system-ui">Atualizar testes e migrações</text>
        </g>

        {/* Tool indicator (loading) */}
        <g transform="translate(0, 296)">
          <circle cx="10" cy="10" r="4" fill="#E85D1F">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <text x="22" y="14" fill="#A89585" fontSize="10" fontFamily="ui-monospace, monospace">
            Reading apps/api/src/middleware/auth.ts · 124 lines · 4.2KB
          </text>
        </g>
      </g>

      {/* Bottom input area */}
      <g transform="translate(196, 360)">
        <rect x="0" y="0" width="500" height="42" rx="12" fill="#221409" stroke="#FFF7ED" strokeOpacity="0.15" />
        <text x="14" y="26" fill="#7A8478" fontSize="11.5" fontFamily="ui-sans-serif, system-ui">Pergunte ao Claude...</text>

        {/* Model pill */}
        <rect x="380" y="11" width="68" height="20" rx="6" fill="#E85D1F" fillOpacity="0.15" />
        <text x="414" y="25" fill="#E85D1F" fontSize="9" fontFamily="monospace" textAnchor="middle">Sonnet 4.5</text>

        {/* Send button */}
        <rect x="458" y="6" width="36" height="30" rx="9" fill="url(#claude-send-btn)" />
        <text x="476" y="26" fill="#FFF7ED" fontSize="16" fontFamily="ui-sans-serif" textAnchor="middle" fontWeight="700">↑</text>
      </g>
    </svg>
  );
}
