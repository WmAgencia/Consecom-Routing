// Minimal HTTP server for Railway smoke test
import http from 'node:http';
const PORT = Number(process.env.PORT ?? 3000);
const server = http.createServer((req, res) => {
  console.log(`[smoke] ${req.method} ${req.url}`);
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', port: PORT, time: new Date().toISOString() }));
    return;
  }
  res.writeHead(404);
  res.end('not found');
});
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[smoke] listening on 0.0.0.0:${PORT}`);
});
server.on('error', (err) => {
  console.error('[smoke] server error:', err);
  process.exit(1);
});