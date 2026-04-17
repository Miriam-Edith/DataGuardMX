// ============================================
// VALIDACIÓN DE FORMULARIOS - DATAGUARD MX
// ============================================

let captchaA = 0, captchaB = 0;

// Generar captcha matemático
function genCaptcha() {
  captchaA = Math.floor(Math.random() * 9) + 1;
  captchaB = Math.floor(Math.random() * 9) + 1;
  document.getElementById('captchaPregunta').textContent = `${captchaA} + ${captchaB} = ?`;
  document.getElementById('captcha').value = '';
}
genCaptcha();

// Mostrar error por campo
function showFieldError(name, msg) {
  const el = document.querySelector(`[data-error-for="${name}"]`);
  if (el) el.textContent = msg || '';
}

// Limpiar todos los errores
function clearAllErrors() {
  document.querySelectorAll('.error').forEach(e => (e.textContent = ''));
}

// Traducir mensajes de validación HTML5
function messageFromValidity(input) {
  if (input.validity.valueMissing) return 'Este campo es obligatorio.';
  if (input.validity.typeMismatch && input.type === 'email') return 'Escribe un correo válido (ej. nombre@dominio.com).';
  if (input.validity.patternMismatch) {
    if (input.name === 'telefono') return 'Teléfono inválido (10 dígitos).';
    if (input.name === 'password') return 'Contraseña débil (8+, mayús, minús, número y símbolo).';
    return 'Formato inválido. Revisa los requisitos.';
  }
  if (input.validity.tooShort) return `Debe tener al menos ${input.minLength} caracteres.`;
  if (input.validity.tooLong) return `Debe tener máximo ${input.maxLength} caracteres.`;
  return 'Valor inválido.';
}

// Validación completa del formulario de registro
async function validateAndRegister(formData) {
  const errors = {};
  
  // Validaciones básicas
  if (!formData.nombre || formData.nombre.length < 3) errors.nombre = 'Nombre obligatorio (mínimo 3 caracteres).';
  if (!formData.email) errors.email = 'Correo obligatorio.';
  if (!formData.telefono) errors.telefono = 'Teléfono obligatorio.';
  if (!formData.password) errors.password = 'Contraseña obligatoria.';
  if (!formData.password2) errors.password2 = 'Confirma tu contraseña.';
  if (!formData.terminos) errors.terminos = 'Debes aceptar los términos.';
  
  // Formato email
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.email && !emailRe.test(formData.email)) errors.email = 'Formato de correo inválido.';
  
  // Formato teléfono
  const phoneRe = /^\d{10}$/;
  if (formData.telefono && !phoneRe.test(formData.telefono)) errors.telefono = 'Teléfono inválido (10 dígitos).';
  
  // Formato contraseña
  const passRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (formData.password && !passRe.test(formData.password)) {
    errors.password = 'Contraseña débil (8+, mayús, minús, número y símbolo).';
  }
  
  // Coincidencia de contraseñas
  if (formData.password && formData.password2 && formData.password !== formData.password2) {
    errors.password2 = 'Las contraseñas no coinciden.';
  }
  
  // Captcha
  if (formData.captcha !== captchaA + captchaB) {
    errors.captcha = 'Respuesta incorrecta. Intenta otra vez.';
    genCaptcha();
  }
  
  // Honeypot
  if (formData.website && formData.website.trim().length > 0) {
    errors.website = 'Actividad sospechosa detectada.';
  }
  
  return errors;
}

// Inicializar validación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formRegistro');
  if (!form) return;
  
  const statusEl = document.getElementById('registerStatus');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();
    if (statusEl) statusEl.textContent = '';
    
    // Validación HTML5
    const inputs = Array.from(form.querySelectorAll('input'));
    let htmlOk = true;
    
    for (const input of inputs) {
      if (input.name === 'website') continue;
      if (!input.checkValidity()) {
        htmlOk = false;
        showFieldError(input.name, messageFromValidity(input));
      }
    }
    
    if (!htmlOk) {
      if (statusEl) statusEl.textContent = 'Corrige los campos marcados.';
      return;
    }
    
    // Obtener datos
    const formData = {
      nombre: document.getElementById('regNombre')?.value.trim() || '',
      email: document.getElementById('regEmail')?.value.trim().toLowerCase() || '',
      telefono: document.getElementById('regTelefono')?.value.trim() || '',
      password: document.getElementById('regPassword')?.value || '',
      password2: document.getElementById('regPassword2')?.value || '',
      role: document.getElementById('regRole')?.value || 'ciudadano',
      empresa_nombre: document.getElementById('regEmpresa')?.value.trim() || '',
      terminos: document.getElementById('terminos')?.checked || false,
      website: document.getElementById('website')?.value.trim() || '',
      captcha: parseInt(document.getElementById('captcha')?.value) || 0,
      captchaExpected: captchaA + captchaB
    };
    
    // Validación avanzada
    const errors = await validateAndRegister(formData);
    
    if (Object.keys(errors).length > 0) {
      for (const [field, msg] of Object.entries(errors)) {
        showFieldError(field, msg);
      }
      if (statusEl) statusEl.textContent = 'Corrige los errores e intenta de nuevo.';
      return;
    }
    
    // Enviar al backend
    const btn = document.getElementById('doRegister');
    const originalText = btn.innerHTML;
    
    try {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
      btn.disabled = true;
      if (statusEl) statusEl.textContent = 'Enviando...';
      
      const response = await api.register({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        nombre: formData.nombre,
        empresa_nombre: formData.empresa_nombre,
        telefono: formData.telefono
      });
      
      if (statusEl) {
        statusEl.textContent = '✅ Registro exitoso. Ahora inicia sesión.';
        statusEl.style.color = 'var(--green)';
      }
      
      // Limpiar formulario
      form.reset();
      genCaptcha();
      
      // Cambiar a pestaña login
      setTimeout(() => {
        document.getElementById('tabLogin')?.click();
      }, 1500);
      
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = `❌ ${err.message}`;
        statusEl.style.color = 'var(--red)';
      }
      
      // Si el error es de email duplicado
      if (err.message.includes('email') || err.message.includes('correo')) {
        showFieldError('email', 'Este correo ya está registrado.');
      }
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
  
  // Mostrar/ocultar campo empresa
  const roleSelect = document.getElementById('regRole');
  if (roleSelect) {
    roleSelect.addEventListener('change', (e) => {
      const empresaField = document.getElementById('empresaField');
      if (empresaField) {
        empresaField.style.display = e.target.value === 'empresa' ? 'block' : 'none';
      }
    });
  }
  
  // Regenerar captcha al hacer clic en la pregunta
  const captchaPregunta = document.getElementById('captchaPregunta');
  if (captchaPregunta) {
    captchaPregunta.addEventListener('click', () => {
      genCaptcha();
    });
    captchaPregunta.style.cursor = 'pointer';
  }
});