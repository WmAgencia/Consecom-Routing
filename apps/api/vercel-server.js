const { spawn } = require('node:child_process');
const { createServer } = require('node:http');

const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Start the API server
  const apiProcess = spawn('node', ['--import', 'tsx/esm', 'dist/main.js'], {
    cwd: '/var/task',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let body = '';
  req.on('data', chunk => body += chunk);

  await new Promise((resolve) => req.on('end', resolve));

  const options = {
    hostname: 'localhost',
    port: PORT,
    path: url.pathname + url.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: undefined
    }
  };

  const proxyReq = require('http').request(options, (proxyRes) => {
    res.statusCode = proxyRes.statusCode;
    Object.entries(proxyRes.headers).forEach(([k, v]) => {
      if (v) res.setHeader(k, v);
    });
    proxyRes.pipe(res);
  });

  if (body) proxyReq.write(body);
  proxyReq.end();

  apiProcess.on('error', (err) => {
    console.error('API Error:', err);
    res.statusCode = 503;
    res.end(JSON.stringify({ error: 'Service unavailable' }));
  });
});

server.listen(PORT, () => {
  console.log(`Vercel handler listening on port ${PORT}`);
});
