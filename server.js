require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas peticiones, por favor intenta más tarde.'
});
app.use('/api/', limiter);

// ============================================
// SERVIR ARCHIVOS ESTÁTICOS DEL FRONTEND
// ============================================
const frontendPath = path.join(__dirname, 'frontend', 'public');
const jsPath = path.join(frontendPath, 'js');
const cssPath = path.join(frontendPath, 'css');
const viewsPath = path.join(frontendPath, 'views');

console.log(`📁 Frontend: ${frontendPath}`);
console.log(`📁 JS: ${jsPath}`);
console.log(`📁 CSS: ${cssPath}`);
console.log(`📁 Views: ${viewsPath}`);

app.use(express.static(frontendPath));
app.use('/js', express.static(jsPath));
app.use('/css', express.static(cssPath));
app.use('/views', express.static(viewsPath));

// ============================================
// RUTAS API - BACKEND
// ============================================
const authRoutes = require('./backend/src/routes/authRoutes');
const userRoutes = require('./backend/src/routes/userRoutes');
const consentimientoRoutes = require('./backend/src/routes/consentimientoRoutes');
const reporteRoutes = require('./backend/src/routes/reporteRoutes');
const alertaRoutes = require('./backend/src/routes/alertaRoutes');
const webhookRoutes = require('./backend/src/routes/webhookRoutes');
const chatbotRoutes = require('./backend/src/routes/chatbotRoutes');
const profileRoutes = require('./backend/src/routes/profileRoutes');
const searchRoutes = require('./backend/src/routes/searchRoutes');
const securityRoutes = require('./backend/src/routes/securityRoutes');
const exportRoutes = require('./backend/src/routes/exportRoutes');

// Registrar rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/consentimientos', consentimientoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/export', exportRoutes);

console.log('✅ Todas las rutas API registradas');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'DataGuardMX API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// RUTAS DEL FRONTEND
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'dashboard.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin.html'));
});

app.get('/forgot-password.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'forgot-password.html'));
});

app.get('/reset-password.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'reset-password.html'));
});

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Manejo de errores 404 para API
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `API endpoint no encontrado: ${req.originalUrl}` });
});

// Manejo de errores general
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 DataGuardMX corriendo en:`);
  console.log(`   📡 API: http://localhost:${PORT}/api`);
  console.log(`   🌐 Frontend: http://localhost:${PORT}`);
  console.log(`   📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`   👑 Admin: http://localhost:${PORT}/admin.html`);
  console.log(`\n✅ Servidor listo! Presiona Ctrl+C para detener\n`);
});