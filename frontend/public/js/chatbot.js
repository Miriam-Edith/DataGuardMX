// ============================================
// CHATBOT MODULE - DATA GUARD MX
// ============================================

// Importar api (asegurando que existe globalmente)
const api = window.api;

const chatbotState = {
  isOpen: false,
  isTyping: false,
  messageHistory: [],
  sessionId: null,
  context: {},
  reconnectAttempts: 0,
  maxReconnectAttempts: 3
};

const quickReplies = {
  default: [
    { text: '📊 Mi nivel de riesgo', action: 'riesgo' },
    { text: '🔐 Derechos ARCO', action: 'arco' },
    { text: '🚨 Reportar incidente', action: 'reporte' },
    { text: '❓ ¿Qué es DataGuard?', action: 'info' },
    { text: '📞 Contactar soporte', action: 'soporte' }
  ],
  riesgo: [
    { text: '📈 Ver más detalles', action: 'dashboard' },
    { text: '🔔 Configurar alertas', action: 'alertas' },
    { text: '↩️ Menú principal', action: 'menu' }
  ],
  arco: [
    { text: '📝 Solicitar acceso', action: 'solicitar' },
    { text: '✏️ Rectificar datos', action: 'rectificar' },
    { text: '↩️ Menú principal', action: 'menu' }
  ],
  reporte: [
    { text: '🔓 Filtración de datos', action: 'reporte_filtracion' },
    { text: '🚪 Acceso no autorizado', action: 'reporte_acceso' },
    { text: '↩️ Menú principal', action: 'menu' }
  ]
};

const botResponses = {
  'riesgo': '📊 **Tu nivel de riesgo**\n\nBasado en tu actividad reciente:\n• Alertas activas: 0\n• Consentimientos vigentes: 2\n• Incidentes reportados: 0\n\n✅ Tu nivel es **BAJO**. ¡Sigue así! ¿Quieres ver más detalles?',
  'arco': '🔐 **Derechos ARCO**\n\n• **A**cceso: Conocer qué datos tienen de ti\n• **R**ectificación: Corregir datos inexactos\n• **C**ancelación: Solicitar eliminación\n• **O**posición: Negarte al tratamiento\n\n¿Necesitas ejercer alguno de estos derechos?',
  'info': '🛡️ **DataGuardMX**\n\nEs tu plataforma de protección de identidad digital en México. Te ayudamos a:\n• Monitorear tus datos personales\n• Gestionar consentimientos\n• Recibir alertas de seguridad\n• Reportar incidentes de datos',
  'soporte': '📞 **Contacto de soporte**\n\n• Email: soporte@dataguardmx.com\n• Teléfono: +52 55 1234 5678\n• Horario: L-V 9:00 - 18:00\n\n¿En qué más puedo ayudarte?',
  'reporte': '🚨 **Reportar un incidente**\n\nPuedes reportar un incidente de datos desde el botón "Reportar incidente" en la sección de Incidentes del dashboard.\n\n¿Necesitas ayuda para identificar qué tipo de incidente reportar?',
  'default': 'Gracias por tu mensaje. ¿Puedo ayudarte con algo más específico? Puedes preguntar sobre:\n• Nivel de riesgo\n• Derechos ARCO\n• Reportar incidentes\n• Protección de datos'
};

export function initChatbot() {
  const elements = {
    window: document.getElementById('chatbotWindow'),
    messages: document.getElementById('chatMessages'),
    input: document.getElementById('chatInput'),
    toggle: document.getElementById('chatbotToggle'),
    close: document.getElementById('chatbotClose'),
    send: document.getElementById('chatSend')
  };

  if (!elements.toggle || !elements.window) {
    console.warn('Chatbot: Elementos no encontrados');
    return;
  }

  chatbotState.sessionId = generateSessionId();
  setupEventListeners(elements);
  loadChatHistory();
  
  if (elements.messages.children.length === 0 || elements.messages.children.length === 1) {
    showWelcomeMessage(elements.messages);
  }
}

function setupEventListeners(elements) {
  const { window: chatWin, messages, input, toggle, close, send } = elements;

  toggle.addEventListener('click', () => {
    chatWin.classList.toggle('open');
    chatbotState.isOpen = chatWin.classList.contains('open');
    if (chatbotState.isOpen) {
      input.focus();
      messages.scrollTop = messages.scrollHeight;
    }
  });

  close?.addEventListener('click', () => {
    chatWin.classList.remove('open');
    chatbotState.isOpen = false;
  });

  send?.addEventListener('click', () => sendMessage(elements));
  
  input?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(elements);
    }
  });

  messages?.addEventListener('click', (e) => {
    const quickReply = e.target.closest('.quick-reply-btn');
    if (quickReply) {
      const action = quickReply.dataset.action;
      handleQuickReply(action, elements);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatWin.classList.contains('open')) {
      chatWin.classList.remove('open');
      chatbotState.isOpen = false;
    }
  });
}

async function sendMessage(elements) {
  const { input, messages, send } = elements;
  const message = input.value.trim();
  
  if (!message || chatbotState.isTyping) return;

  input.value = '';
  toggleTypingState(true, elements);
  addMessage('user', message, messages);
  saveMessageToHistory('user', message);

  try {
    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    
    let response;
    const msgLower = message.toLowerCase();
    
    if (msgLower.includes('riesgo') || msgLower.includes('nivel')) {
      response = botResponses.riesgo;
    } else if (msgLower.includes('arco')) {
      response = botResponses.arco;
    } else if (msgLower.includes('reporte') || msgLower.includes('incidente') || msgLower.includes('brecha')) {
      response = botResponses.reporte;
    } else if (msgLower.includes('dataguard') || msgLower.includes('qué es') || msgLower.includes('que es')) {
      response = botResponses.info;
    } else if (msgLower.includes('soporte') || msgLower.includes('contactar') || msgLower.includes('ayuda') || msgLower.includes('telefono') || msgLower.includes('email')) {
      response = botResponses.soporte;
    } else {
      response = botResponses.default;
    }
    
    await addMessageWithTyping('bot', response, messages);
    saveMessageToHistory('bot', response);
    
    addQuickReplies(getQuickRepliesForMessage(msgLower), messages);
    
  } catch (error) {
    console.error('Error en chatbot:', error);
    addMessage('bot', '❌ Lo siento, hubo un error. Por favor, intenta de nuevo.', messages);
  } finally {
    toggleTypingState(false, elements);
  }
}

function addMessage(sender, text, container) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `msg ${sender}`;
  messageDiv.innerHTML = formatMessage(text);
  
  const timestamp = document.createElement('span');
  timestamp.className = 'msg-time';
  timestamp.textContent = new Date().toLocaleTimeString('es-MX', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  messageDiv.appendChild(timestamp);
  
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
  return messageDiv;
}

async function addMessageWithTyping(sender, text, container) {
  showTypingIndicator(container);
  const typingTime = Math.min(text.length * 20, 1500);
  await new Promise(resolve => setTimeout(resolve, typingTime));
  removeTypingIndicator(container);
  return addMessage(sender, text, container);
}

function showTypingIndicator(container) {
  removeTypingIndicator(container);
  const indicator = document.createElement('div');
  indicator.className = 'msg bot typing-indicator';
  indicator.id = 'typingIndicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator(container) {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) indicator.remove();
}

function toggleTypingState(isTyping, elements) {
  chatbotState.isTyping = isTyping;
  const { input, send } = elements;
  input.disabled = isTyping;
  send.disabled = isTyping;
  send.innerHTML = isTyping ? '<i class="fas fa-spinner fa-spin"></i>' : 'Enviar';
  if (!isTyping) input.focus();
}

function addQuickReplies(replies, container) {
  if (!replies || replies.length === 0) return;
  
  const repliesDiv = document.createElement('div');
  repliesDiv.className = 'quick-replies';
  
  replies.forEach(reply => {
    const btn = document.createElement('button');
    btn.className = 'quick-reply-btn';
    btn.dataset.action = reply.action;
    btn.innerHTML = reply.text;
    repliesDiv.appendChild(btn);
  });
  
  container.appendChild(repliesDiv);
  container.scrollTop = container.scrollHeight;
}

function getQuickRepliesForMessage(message) {
  if (message.includes('riesgo')) return quickReplies.riesgo;
  if (message.includes('arco')) return quickReplies.arco;
  if (message.includes('reporte')) return quickReplies.reporte;
  return quickReplies.default;
}

function handleQuickReply(action, elements) {
  const actionMap = {
    'riesgo': () => sendPredefinedMessage('¿Cuál es mi nivel de riesgo?', elements),
    'arco': () => sendPredefinedMessage('¿Qué son los derechos ARCO?', elements),
    'reporte': () => sendPredefinedMessage('Quiero reportar un incidente', elements),
    'info': () => sendPredefinedMessage('¿Qué es DataGuardMX?', elements),
    'soporte': () => sendPredefinedMessage('Contactar a soporte', elements),
    'dashboard': () => {
      const dashboardBtn = document.querySelector('.nav-item[data-view="riesgo"]');
      if (dashboardBtn) dashboardBtn.click();
      elements.window.classList.remove('open');
      chatbotState.isOpen = false;
    },
    'alertas': () => {
      const alertasBtn = document.querySelector('.nav-item[data-view="alertas"]');
      if (alertasBtn) alertasBtn.click();
      elements.window.classList.remove('open');
      chatbotState.isOpen = false;
    },
    'menu': () => {
      addMessage('bot', '📋 **Menú Principal**\n¿En qué puedo ayudarte?', elements.messages);
      addQuickReplies(quickReplies.default, elements.messages);
    },
    'reporte_filtracion': () => sendPredefinedMessage('Quiero reportar una filtración de datos', elements),
    'reporte_acceso': () => sendPredefinedMessage('Quiero reportar un acceso no autorizado', elements),
    'solicitar': () => sendPredefinedMessage('¿Cómo puedo solicitar acceso a mis datos?', elements),
    'rectificar': () => sendPredefinedMessage('¿Cómo puedo rectificar mis datos personales?', elements)
  };
  
  const handler = actionMap[action];
  if (handler) handler();
}

function sendPredefinedMessage(message, elements) {
  elements.input.value = message;
  sendMessage(elements);
}

function formatMessage(text) {
  // URLs a links
  text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  
  // Negrita
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Cursiva
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Listas
  text = text.replace(/• /g, '&nbsp;&nbsp;• ');
  
  // Saltos de línea
  text = text.replace(/\n/g, '<br>');
  
  return text;
}

function showWelcomeMessage(container) {
  const welcomeMsg = `¡Hola! 👋 Soy **Guardia**, tu asistente de privacidad.
    
Puedo ayudarte con:
• 📊 Consultar tu nivel de riesgo
• 🔐 Información sobre derechos ARCO
• 🚨 Reportar incidentes de datos
• ❓ Responder tus dudas

¿En qué puedo ayudarte hoy?`;
  
  addMessage('bot', welcomeMsg, container);
  addQuickReplies(quickReplies.default, container);
}

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function saveMessageToHistory(sender, text) {
  chatbotState.messageHistory.push({
    sender,
    text,
    timestamp: new Date().toISOString()
  });
  
  // Mantener solo últimos 50 mensajes
  if (chatbotState.messageHistory.length > 50) {
    chatbotState.messageHistory = chatbotState.messageHistory.slice(-50);
  }
  
  try {
    localStorage.setItem('chatHistory', JSON.stringify(chatbotState.messageHistory));
  } catch (e) {
    console.warn('No se pudo guardar historial:', e);
  }
}

function loadChatHistory() {
  try {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      chatbotState.messageHistory = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('No se pudo cargar historial:', e);
  }
}

// Exportar funciones adicionales para uso externo
export function openChatbot() {
  const window = document.getElementById('chatbotWindow');
  if (window) {
    window.classList.add('open');
    chatbotState.isOpen = true;
    const input = document.getElementById('chatInput');
    if (input) input.focus();
  }
}

export function closeChatbot() {
  const window = document.getElementById('chatbotWindow');
  if (window) {
    window.classList.remove('open');
    chatbotState.isOpen = false;
  }
}

export function clearChatHistory() {
  chatbotState.messageHistory = [];
  localStorage.removeItem('chatHistory');
  const messages = document.getElementById('chatMessages');
  if (messages) {
    messages.innerHTML = '';
    showWelcomeMessage(messages);
  }
}