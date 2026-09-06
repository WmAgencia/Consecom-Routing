export function CodexMockup() {
  return (
    <svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      <defs>
        <linearGradient id="codex-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F1B14" />
          <stop offset="100%" stopColor="#0A0F0C" />
        </linearGradient>
        <linearGradient id="codex-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10A37F" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#10A37F" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Window background */}
      <rect width="600" height="380" rx="12" fill="url(#codex-bg)" />
      <rect width="600" height="380" rx="12" fill="url(#codex-glow)" />

      {/* Title bar */}
      <rect width="600" height="36" fill="#000" opacity="0.3" />
      <line x1="0" y1="36" x2="600" y2="36" stroke="#10A37F" strokeOpacity="0.2" />

      {/* Traffic lights */}
      <circle cx="20" cy="18" r="6" fill="#FF5F56" />
      <circle cx="40" cy="18" r="6" fill="#FFBD2E" />
      <circle cx="60" cy="18" r="6" fill="#27C93F" />

      {/* Tab title */}
      <text x="300" y="22" fill="#10A37F" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="600">
        codex — ~/consecom-routing (zsh)
      </text>

      {/* Content area */}
      <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="12">
        {/* Prompt 1: cd */}
        <text x="20" y="70" fill="#7A8478">$</text>
        <text x="36" y="70" fill="#D4D4D4">cd ~/projects/consecom-routing</text>

        {/* Prompt 2: openai env */}
        <text x="20" y="92" fill="#7A8478">$</text>
        <text x="36" y="92" fill="#D4D4D4">export </text>
        <text x="92" y="92" fill="#DCDCAA">OPENAI_API_BASE</text>
        <text x="200" y="92" fill="#D4D4D4">=</text>
        <text x="212" y="92" fill="#CE9178">"https://api.consecom.com.br/v1"</text>

        {/* Prompt 3: codex command */}
        <text x="20" y="114" fill="#7A8478">$</text>
        <text x="36" y="114" fill="#10A37F" fontWeight="700">codex </text>
        <text x="82" y="114" fill="#CE9178">"adicione dark mode toggle no dashboard"</text>

        {/* Empty line */}
        <text x="20" y="136" fill="#7A8478"> </text>

        {/* Codex output */}
        <g transform="translate(36, 156)">
          <text fill="#10A37F" fontWeight="700">▌</text>
          <text x="14" fill="#7A8478">codex v0.1.0 — OpenAI's coding agent</text>
          <text x="0" y="18" fill="#7A8478">▌ Connecting to api.consecom.com.br</text>
          <text x="0" y="36" fill="#7A8478">▌ Model: </text>
          <text x="58" y="36" fill="#10A37F">claude-haiku-4-5-puter</text>
          <text x="0" y="54" fill="#7A8478">▌ Working...</text>
        </g>

        {/* Tool call block */}
        <g transform="translate(36, 240)">
          <rect x="-8" y="-12" width="540" height="22" rx="4" fill="#10A37F" fillOpacity="0.1" stroke="#10A37F" strokeOpacity="0.3" />
          <text fill="#10A37F">▸</text>
          <text x="14" fill="#DCDCAA">Reading</text>
          <text x="78" fill="#CE9178">apps/web/src/app/dashboard/page.tsx</text>
          <text x="320" fill="#7A8478">...</text>
          <text x="340" fill="#10A37F">ok (847 lines)</text>
        </g>

        {/* Edit block */}
        <g transform="translate(36, 268)">
          <rect x="-8" y="-12" width="540" height="22" rx="4" fill="#10A37F" fillOpacity="0.1" stroke="#10A37F" strokeOpacity="0.3" />
          <text fill="#10A37F">▸</text>
          <text x="14" fill="#DCDCAA">Editing</text>
          <text x="68" fill="#CE9178">apps/web/src/app/dashboard/page.tsx</text>
          <text x="320" fill="#7A8478">+ </text>
          <text x="332" fill="#10A37F">12 lines</text>
        </g>

        {/* Approval prompt */}
        <g transform="translate(36, 304)">
          <rect x="-8" y="-12" width="540" height="36" rx="4" fill="#10A37F" fillOpacity="0.08" stroke="#10A37F" strokeOpacity="0.4" />
          <text fill="#10A37F">▌</text>
          <text x="14" y="2" fill="#D4D4D4">Approve and run? </text>
          <text x="146" y="2" fill="#7A8478">[</text>
          <text x="152" y="2" fill="#10A37F" fontWeight="700">y</text>
          <text x="160" y="2" fill="#7A8478">es/</text>
          <text x="180" y="2" fill="#10A37F" fontWeight="700">n</text>
          <text x="190" y="2" fill="#7A8478">o]</text>
          <text x="14" y="20" fill="#10A37F">▌</text>
          <text x="24" y="20" fill="#10A37F" fontWeight="700">y</text>
        </g>
      </g>
    </svg>
  );
}

export function ClaudeCodeMockup() {
  return (
    <svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      <defs>
        <linearGradient id="claude-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A0F08" />
          <stop offset="100%" stopColor="#0F0907" />
        </linearGradient>
        <linearGradient id="claude-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E85D1F" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#E85D1F" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Window background */}
      <rect width="600" height="380" rx="12" fill="url(#claude-bg)" />
      <rect width="600" height="380" rx="12" fill="url(#claude-glow)" />

      {/* Title bar */}
      <rect width="600" height="36" fill="#000" opacity="0.3" />
      <line x1="0" y1="36" x2="600" y2="36" stroke="#E85D1F" strokeOpacity="0.2" />

      {/* Traffic lights */}
      <circle cx="20" cy="18" r="6" fill="#FF5F56" />
      <circle cx="40" cy="18" r="6" fill="#FFBD2E" />
      <circle cx="60" cy="18" r="6" fill="#27C93F" />

      {/* Tab title with Claude icon */}
      <text x="300" y="22" fill="#E85D1F" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="600">
        Claude Code — consecom-routing
      </text>

      {/* Sidebar */}
      <rect x="0" y="36" width="140" height="344" fill="#000" opacity="0.25" />
      <line x1="140" y1="36" x2="140" y2="380" stroke="#E85D1F" strokeOpacity="0.15" />

      {/* Sidebar content */}
      <g fontFamily="ui-monospace, monospace" fontSize="10" fill="#A89585">
        <text x="14" y="62" fontWeight="700" fill="#E85D1F">consecom-routing</text>
        <text x="14" y="82">  📁 apps</text>
        <text x="14" y="98">    📁 web</text>
        <text x="22" y="114">      📄 page.tsx</text>
        <text x="22" y="130">      📄 layout.tsx</text>
        <text x="22" y="146">      📁 _components</text>
        <text x="14" y="162">  📁 packages</text>
        <text x="14" y="178">  📁 node_modules</text>
        <text x="14" y="200" fontWeight="700" fill="#E85D1F">Files Changed</text>
        <text x="14" y="220">+ 3 modified</text>
        <text x="14" y="236">+ 1 created</text>
      </g>

      {/* Main area */}
      <g transform="translate(160, 56)">
        {/* Model selector */}
        <rect x="0" y="0" width="120" height="22" rx="6" fill="#E85D1F" fillOpacity="0.15" stroke="#E85D1F" strokeOpacity="0.4" />
        <text x="10" y="14" fill="#E85D1F" fontSize="10" fontFamily="monospace">Claude Sonnet 4.5</text>

        {/* Messages */}
        <g fontFamily="ui-sans-serif, system-ui" fontSize="11">
          {/* User message */}
          <g transform="translate(0, 40)">
            <rect x="0" y="0" width="380" height="36" rx="8" fill="#E85D1F" fillOpacity="0.1" stroke="#E85D1F" strokeOpacity="0.3" />
            <text x="14" y="14" fill="#A89585" fontSize="9" fontFamily="monospace">Você</text>
            <text x="14" y="28" fill="#FFF7ED">Refatora o auth pra usar OAuth2 em vez de JWT</text>
          </g>

          {/* Assistant message */}
          <g transform="translate(0, 90)">
            <rect x="0" y="0" width="380" height="100" rx="8" fill="#FFF7ED" fillOpacity="0.05" stroke="#FFF7ED" strokeOpacity="0.1" />
            <text x="14" y="14" fill="#E85D1F" fontSize="9" fontFamily="monospace">Claude</text>

            <text x="14" y="32" fill="#FFF7ED">Vou refatorar o sistema de autenticação</text>
            <text x="14" y="48" fill="#FFF7ED">seguindo estes passos:</text>

            <text x="14" y="68" fill="#10A37F">1.</text>
            <text x="26" y="68" fill="#FFF7ED">Adicionar </text>
            <text x="84" y="68" fill="#CE9178" fontFamily="monospace">OAuth2Provider</text>
            <text x="160" y="68" fill="#FFF7ED"> class</text>

            <text x="14" y="84" fill="#10A37F">2.</text>
            <text x="26" y="84" fill="#FFF7ED">Substituir JWT middleware</text>
          </g>

          {/* Tool indicator */}
          <g transform="translate(0, 204)">
            <circle cx="8" cy="8" r="3" fill="#E85D1F">
              <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <text x="18" y="12" fill="#A89585" fontSize="9" fontFamily="monospace">Reading apps/api/src/middleware/auth.ts</text>
          </g>
        </g>
      </g>

      {/* Bottom input area */}
      <g transform="translate(160, 340)">
        <rect x="0" y="0" width="420" height="32" rx="8" fill="#221409" stroke="#FFF7ED" strokeOpacity="0.15" />
        <text x="14" y="20" fill="#A89585" fontSize="11" fontFamily="monospace">Pergunte ao Claude...</text>
        {/* Send button */}
        <rect x="380" y="4" width="32" height="24" rx="6" fill="#E85D1F" />
        <text x="396" y="20" fill="#FFF7ED" fontSize="14" textAnchor="middle">↑</text>
      </g>
    </svg>
  );
}
