const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const consentimientoRoutes = require('./routes/consentimientoRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const alertaRoutes = require('./routes/alertaRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');  
const profileRoutes = require('./routes/profileRoutes');
const searchRoutes = require('./routes/searchRoutes');
const securityRoutes = require('./routes/securityRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();

// Seguridad
app.use(helmet({
  contentSecurityPolicy: false // Para permitir estilos inline en desarrollo
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por IP
  message: 'Demasiadas peticiones, por favor intenta más tarde.'
});
app.use('/api/', limiter);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas existentes
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'DataGuardMX API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;