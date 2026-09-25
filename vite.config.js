import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import {
  findUserByEmail,
  createUser,
  createSession,
  getSession,
  deleteSession
} from './server/db.js'

function sqliteAuthPlugin() {
  return {
    name: 'vite-plugin-sqlite-auth',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Only handle /api/auth requests
        if (!req.url.startsWith('/api/auth')) {
          return next();
        }

        const readBody = () =>
          new Promise((resolve) => {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); }
            });
          });

        const sendJson = (status, data) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        const parsedUrl = new URL(req.url, 'http://localhost');
        const pathname = parsedUrl.pathname;

        // POST /api/auth/login
        if (req.method === 'POST' && pathname === '/api/auth/login') {
          return readBody().then(({ email, password }) => {
            if (!email || !password) {
              return sendJson(400, { error: 'Email and password are required' });
            }
            const user = findUserByEmail(email);
            if (!user || user.password !== password) {
              return sendJson(401, { error: 'Invalid email or password' });
            }
            const token = createSession(user.id);
            const { password: _, ...safeUser } = user;
            return sendJson(200, { user: safeUser, token });
          });
        }

        // POST /api/auth/register
        if (req.method === 'POST' && pathname === '/api/auth/register') {
          return readBody().then(({ name, email, password, career }) => {
            if (!name || !email || !password) {
              return sendJson(400, { error: 'Name, email, and password are required' });
            }
            if (findUserByEmail(email)) {
              return sendJson(409, { error: 'An account with this email already exists' });
            }
            const user = createUser({ name, email, password, career: career || 'fullstack' });
            const token = createSession(user.id);
            return sendJson(201, { user, token });
          });
        }

        // POST /api/auth/logout
        if (req.method === 'POST' && pathname === '/api/auth/logout') {
          const authHeader = req.headers['authorization'] || '';
          const token = authHeader.replace(/^Bearer\s+/i, '');
          deleteSession(token);
          return sendJson(200, { success: true });
        }

        // GET /api/auth/me
        if (req.method === 'GET' && pathname === '/api/auth/me') {
          const authHeader = req.headers['authorization'] || '';
          const token = authHeader.replace(/^Bearer\s+/i, '');
          const user = getSession(token);
          if (!user) {
            return sendJson(401, { error: 'Session expired or not logged in' });
          }
          return sendJson(200, { user });
        }

        return next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sqliteAuthPlugin()],
})
