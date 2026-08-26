import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.js';
import clientesRoutes from './routes/clientes.js';
import usuariosRoutes from './routes/usuarios.js';
import descuentosRoutes from './routes/descuentos.js';
import dashboardRoutes from './routes/dashboard.js';
import rankingRoutes from './routes/ranking.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Docker/Dokploy reverse proxy
app.set('trust proxy', 1);

// Security Headers (XSS, Clickjacking, MIME sniffing, HSTS)
app.use(helmet({
  contentSecurityPolicy: false, // Desactivado para permitir fuentes/iconos locales sin conflicto
}));

// CORS - Permitir cualquier origen
// En prod el frontend se sirve desde el mismo servidor (same-origin)
// En dev Vite proxy maneja las requests
// La función permite cualquier origin incluyendo requests sin header Origin (same-origin, mobile, etc.)
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true
}));

// Rate limiting - Límite generoso ya que todas las promotoras comparten IP detras del proxy de Dokploy
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 req/15min por IP - generoso para multiples promotoras
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Por favor, reintenta más tarde.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Máximo 20 intentos de login por 15 min
  message: { error: 'Demasiados intentos de inicio de sesión. Reintenta en 15 minutos.' }
});
app.use(express.json({ limit: '1mb' })); // Previene payload demasiado grande (DoS)

app.use('/api/auth/login', authLimiter);
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/descuentos', descuentosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ranking', rankingRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Servir frontend compilado en producción (Dokploy / Single Container)
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../frontend/dist');

app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

import { runMigrations } from './db/initDb.js';

app.listen(PORT, async () => {
  console.log(`🌸 Queen Promotoras API corriendo en http://localhost:${PORT}`);
  console.log(`📌 DB_HOST=${process.env.DB_HOST || 'NO DEFINIDO'} DB_NAME=${process.env.DB_NAME || 'NO DEFINIDO'} DB_USER=${process.env.DB_USER || 'NO DEFINIDO'}`);
  await runMigrations();
});
