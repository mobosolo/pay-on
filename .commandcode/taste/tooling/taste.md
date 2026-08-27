# Tooling preferences

- Prefers Vite over Create React App for React project scaffolding, citing it as lighter and faster. Confidence: 0.95
- Uses React 18 with React Router v6 for routing. Confidence: 0.9
- For Node.js backend services, prefers Node ≥18, Express 4.x, with `pg` for PostgreSQL, `axios` for outbound HTTP, and `dotenv` for config — loaded via a single `src/config.js` that exposes an `assertConfig()` guard. Confidence: 0.85
- For client-side QR code generation as a placeholder before backend delivers real ones, uses `qrcode.react`. Confidence: 0.85
- For money formatting in fr-FR locale, prefers `Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 })` — XOF is an integer unit, no decimals. Confidence: 0.85
