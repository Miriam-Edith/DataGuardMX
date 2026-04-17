// ============================================
// CHATBOT CONTROLLER MEJORADO Y OPTIMIZADO
// ============================================

const axios = require('axios');
const NodeCache = require('node-cache');

// ===== OPTIMIZACIÓN: Importar modelos directamente =====
const Alerta = require('../models/Alerta');
const Reporte = require('../models/Reporte');
const Consentimiento = require('../models/Consentimiento');

// Cache para respuestas frecuentes (TTL: 1 hora)
const responseCache = new NodeCache({ stdTTL: 3600 });

// Respuestas enriquecidas con contexto
const enrichedResponses = {
  'hola': {
    reply: '¡Hola! 👋 Soy Guardia, tu asistente de privacidad en DataGuardMX.',
    quickReplies: [
      { text: '📊 Mi nivel de riesgo', action: 'riesgo' },
      { text: '🔐 Derechos ARCO', action: 'arco' },
      { text: '📝 Reportar incidente', action: 'reporte' }
    ]
  },
  
  'derechos arco': {
    reply: `**Derechos ARCO** - Protección de Datos Personales

🔍 **A**cceso: Conocer qué datos tuyos se están tratando
✏️ **R**ectificación: Corregir datos inexactos o incompletos
❌ **C**ancelación: Solicitar la eliminación de tus datos
🚫 **O**posición: Negarte al tratamiento de tus datos

📧 Puedes ejercerlos desde tu dashboard o en: privacidad@dataguardmx.com`,
    quickReplies: [
      { text: '📝 Solicitar acceso', action: 'solicitar' },
      { text: '✏️ Rectificar datos', action: 'rectificar' }
    ]
  },
  
  'que es dataguard': {
    reply: `**DataGuardMX** es tu plataforma de protección de identidad digital en México.

🛡️ **Servicios principales:**
• Monitoreo de datos personales
• Alertas de seguridad en tiempo real
• Gestión de consentimientos
• Reporte de incidentes
• Asesoría en derechos ARCO

🔒 Cumplimos con la LFPDPPP y estándares internacionales.`,
    quickReplies: [
      { text: '📊 Ver mi dashboard', action: 'dashboard' },
      { text: '🔐 Saber más', action: 'info' }
    ]
  }
};

// Intenciones mejoradas con patrones
const intentPatterns = {
  riesgo: {
    keywords: ['riesgo', 'alerta', 'seguridad', 'filtración', 'hackeo', 'vulnerable'],
    patterns: [
      /(nivel|estado).*riesgo/i,
      /(qué|como|cuál).*seguridad/i,
      /(hay|tengo).*alerta/i
    ],
    priority: 1
  },
  arco: {
    keywords: ['arco', 'derechos', 'privacidad', 'datos personales', 'acceso', 'rectificación'],
    patterns: [
      /derechos?.{0,10}arco/i,
      /(cómo|quiero).{0,20}(acceder|rectificar|cancelar)/i,
      /protección.{0,10}datos/i
    ],
    priority: 2
  },
  reporte: {
    keywords: ['reporte', 'denuncia', 'queja', 'incidente', 'reportar', 'filtraron'],
    patterns: [
      /(quiero|necesito).{0,10}reportar/i,
      /(cómo|donde).{0,10}(denunciar|reportar)/i,
      /(mis |los )datos.{0,10}(filtrados|robados)/i
    ],
    priority: 3
  },
  consentimiento: {
    keywords: ['consentimiento', 'autorización', 'permiso', 'aceptar'],
    patterns: [
      /(dar|otorgar|revocar).{0,10}consentimiento/i,
      /(cómo|dónde).{0,10}(gestionar|administrar).{0,10}permisos/i
    ],
    priority: 4
  }
};

exports.chatbotMessage = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { message, userId, context = {}, history = [] } = req.body;
    const user = req.user;
    
    // Validación
    if (!message?.trim()) {
      return res.status(400).json({ 
        error: 'Mensaje requerido',
        reply: 'Por favor, escribe un mensaje.' 
      });
    }

    const msgLower = normalizeText(message);
    
    // 1. Verificar cache para respuestas idénticas
    const cacheKey = `chat:${userId}:${msgLower}`;
    const cached = responseCache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // 2. Verificar respuestas enriquecidas
    const enrichedMatch = findEnrichedResponse(msgLower);
    if (enrichedMatch) {
      responseCache.set(cacheKey, enrichedMatch);
      return res.json(enrichedMatch);
    }

    // 3. Detectar intención mejorada
    const intent = detectIntent(msgLower, context);
    
    // 4. Procesar según intención
    let response;
    
    switch (intent) {
      case 'riesgo':
        response = await handleRiesgoIntent(userId, user);
        break;
        
      case 'arco':
        response = handleArcoIntent(context);
        break;
        
      case 'reporte':
        response = handleReporteIntent(userId, context);
        break;
        
      case 'consentimiento':
        response = await handleConsentimientoIntent(userId);
        break;
        
      default:
        // 5. Enviar a n8n/Gemini con contexto enriquecido
        response = await callN8NWebhook({
          message,
          userId,
          user,
          intent,
          context,
          history: history.slice(-5) // Últimos 5 mensajes para contexto
        });
    }

    // 6. Enriquecer respuesta con quick replies si no tiene
    if (!response.quickReplies) {
      response.quickReplies = getQuickRepliesForIntent(intent);
    }

    // 7. Guardar en cache
    responseCache.set(cacheKey, response);

    // 8. Log de métricas
    logChatMetrics({
      userId,
      message: msgLower,
      intent,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

    res.json(response);

  } catch (error) {
    console.error('Error en chatbot:', error);
    
    // Respuesta de fallback amigable
    res.status(500).json({
      reply: '❌ Lo siento, tuve un problema técnico. ¿Puedes intentarlo de nuevo?',
      quickReplies: [
        { text: '🔄 Reintentar', action: 'retry' },
        { text: '🏠 Menú principal', action: 'menu' }
      ],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function findEnrichedResponse(message) {
  for (const [key, response] of Object.entries(enrichedResponses)) {
    if (message.includes(key)) {
      return response;
    }
  }
  return null;
}

function detectIntent(message, context = {}) {
  const scores = {};
  
  for (const [intent, config] of Object.entries(intentPatterns)) {
    let score = 0;
    
    // Keywords matching
    config.keywords.forEach(keyword => {
      if (message.includes(keyword)) score += 2;
    });
    
    // Pattern matching
    config.patterns.forEach(pattern => {
      if (pattern.test(message)) score += 3;
    });
    
    // Context bonus
    if (context.lastIntent === intent) score += 1;
    
    scores[intent] = score * config.priority;
  }
  
  // Encontrar la intención con mayor score
  const bestIntent = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)[0];
  
  return bestIntent && bestIntent[1] > 2 ? bestIntent[0] : 'general';
}

// ============================================
// FUNCIÓN OPTIMIZADA - USA MODELOS DIRECTAMENTE
// ============================================
async function handleRiesgoIntent(userId, user) {
  try {
    // ===== OPTIMIZACIÓN: Llamadas directas a modelos =====
    // Ejecutar todas las consultas en paralelo para mejor rendimiento
    const [alertas, totalReportes, totalConsentimientos] = await Promise.all([
      Alerta.findByUser(userId),
      Reporte.countByUser(userId),
      Consentimiento.countByUser(userId)
    ]);
    
    const total = alertas.length;
    let nivel, emoji, recomendaciones;
    
    if (total >= 3) {
      nivel = 'ALTO';
      emoji = '🔴';
      recomendaciones = [
        'Revisa urgentemente tu dashboard',
        'Cambia tus contraseñas principales',
        'Activa la verificación en dos pasos'
      ];
    } else if (total >= 1) {
      nivel = 'MEDIO';
      emoji = '🟠';
      recomendaciones = [
        'Monitorea tus cuentas regularmente',
        'Revisa las alertas pendientes'
      ];
    } else {
      nivel = 'BAJO';
      emoji = '🟢';
      recomendaciones = [
        'Mantén buenas prácticas de seguridad',
        'Revisa tus consentimientos activos'
      ];
    }
    
    return {
      reply: `${emoji} **Nivel de riesgo: ${nivel}**
      
📊 **Resumen de seguridad:**
• Alertas activas: ${total}
• Incidentes reportados: ${totalReportes}
• Consentimientos activos: ${totalConsentimientos}

💡 **Recomendaciones:**
${recomendaciones.map(r => `• ${r}`).join('\n')}

¿Quieres ver más detalles?`,
      intent: 'riesgo',
      context: { nivel, total },
      data: { 
        alertas, 
        stats: { 
          incidentes: totalReportes, 
          consentimientos: totalConsentimientos 
        } 
      }
    };
    
  } catch (error) {
    console.error('Error obteniendo datos de riesgo:', error);
    return {
      reply: `⚠️ No pude consultar tu nivel de riesgo en este momento.

**Mientras tanto, te recomiendo:**
• Revisar tu dashboard manualmente
• Verificar tus últimas notificaciones
• Contactar a soporte si ves algo sospechoso

¿Necesitas ayuda con algo más?`,
      intent: 'riesgo'
    };
  }
}

function handleArcoIntent(context) {
  const response = { ...enrichedResponses['derechos arco'] };
  
  // Personalizar según contexto
  if (context.arcoAction) {
    response.reply = `Sobre tu solicitud de ${context.arcoAction}:\n\n` + response.reply;
  }
  
  return response;
}

function handleReporteIntent(userId, context) {
  const tiposIncidente = [
    'Filtración de datos',
    'Acceso no autorizado',
    'Pérdida de información',
    'Suplantación de identidad',
    'Malware/Virus',
    'Phishing'
  ];
  
  return {
    reply: `🚨 **Reportar incidente de datos**

Puedes reportar diferentes tipos de incidentes:
${tiposIncidente.map(t => `• ${t}`).join('\n')}

**Pasos para reportar:**
1️⃣ Identifica el tipo de incidente
2️⃣ Describe lo sucedido
3️⃣ Indica la entidad involucrada
4️⃣ Proporciona fechas aproximadas

¿Qué tipo de incidente quieres reportar?`,
    quickReplies: tiposIncidente.slice(0, 4).map(tipo => ({
      text: tipo,
      action: `report_${tipo.toLowerCase().replace(/\s+/g, '_')}`
    })),
    intent: 'reporte'
  };
}

// ============================================
// FUNCIÓN OPTIMIZADA - USA MODELOS DIRECTAMENTE
// ============================================
async function handleConsentimientoIntent(userId) {
  try {
    // ===== OPTIMIZACIÓN: Llamada directa al modelo =====
    const consentimientos = await Consentimiento.findActiveByUser(userId);
    
    return {
      reply: `📝 **Gestión de consentimientos**

Actualmente tienes ${consentimientos.length} consentimientos activos.

**¿Qué deseas hacer?**
• Otorgar nuevo consentimiento
• Revocar consentimiento existente
• Consultar estado de consentimientos`,
      quickReplies: [
        { text: '✅ Otorgar', action: 'otorgar' },
        { text: '❌ Revocar', action: 'revocar' },
        { text: '📋 Consultar', action: 'consultar' }
      ],
      intent: 'consentimiento'
    };
  } catch (error) {
    console.error('Error obteniendo consentimientos:', error);
    return {
      reply: 'Puedes gestionar tus consentimientos desde la sección "Consentimientos" en tu dashboard.',
      intent: 'consentimiento'
    };
  }
}

async function callN8NWebhook(data) {
  const n8nWebhook = process.env.N8N_WEBHOOK_URL + '/chatbot';
  
  try {
    const response = await axios.post(n8nWebhook, {
      ...data,
      timestamp: new Date().toISOString(),
      source: 'web-chatbot'
    }, {
      timeout: 10000 // 10 segundos timeout
    });
    
    return {
      reply: response.data.reply || 'Procesé tu consulta.',
      intent: response.data.intent,
      context: response.data.context,
      quickReplies: response.data.quickReplies
    };
    
  } catch (error) {
    console.error('Error llamando a n8n:', error.message);
    
    // Fallback a respuesta genérica
    return {
      reply: `Puedo ayudarte con:
• 📊 Tu nivel de riesgo
• 🔐 Derechos ARCO
• 🚨 Reportar incidentes
• 📝 Gestionar consentimientos

¿Sobre qué tema necesitas ayuda?`,
      intent: 'fallback'
    };
  }
}

function getQuickRepliesForIntent(intent) {
  const repliesMap = {
    'riesgo': [
      { text: '📊 Ver detalles', action: 'dashboard' },
      { text: '🔔 Configurar alertas', action: 'alertas' }
    ],
    'arco': [
      { text: '📝 Solicitar acceso', action: 'solicitar' },
      { text: '✏️ Rectificar datos', action: 'rectificar' }
    ],
    'reporte': [
      { text: '🚨 Nuevo reporte', action: 'reporte' },
      { text: '📋 Mis reportes', action: 'mis_reportes' }
    ],
    'general': [
      { text: '📊 Mi riesgo', action: 'riesgo' },
      { text: '🔐 Derechos ARCO', action: 'arco' },
      { text: '❓ Ayuda', action: 'ayuda' }
    ]
  };
  
  return repliesMap[intent] || repliesMap.general;
}

// ============================================
// FUNCIÓN AUXILIAR PARA OBTENER ALERTAS (MANTENIDA PARA COMPATIBILIDAD)
// ============================================
async function getAlertasUsuario(userId) {
  try {
    // ===== OPTIMIZACIÓN: Usar modelo directamente =====
    return await Alerta.findByUser(userId);
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    return [];
  }
}

function logChatMetrics(data) {
  // En producción, enviar a sistema de analytics
  if (process.env.NODE_ENV === 'production') {
    console.log('[Chatbot Metrics]', JSON.stringify(data));
  }
}