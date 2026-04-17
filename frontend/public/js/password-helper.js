// ============================================
// PASSWORD HELPER - VALIDACIÓN Y SEGURIDAD
// ============================================

// Inicializar funcionalidades de contraseña
function initPasswordHelpers() {
  // Toggle password visibility (ojito)
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        const icon = this.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-eye');
          icon.classList.toggle('fa-eye-slash');
        }
      }
    });
  });

  // Medidor de fortaleza de contraseña
  const passwordInput = document.getElementById('regPassword');
  const strengthContainer = document.getElementById('passwordStrengthContainer');
  const strengthFill = document.getElementById('strengthFill');
  const strengthText = document.getElementById('strengthText');
  
  if (passwordInput) {
    passwordInput.addEventListener('input', function() {
      const password = this.value;
      
      if (strengthContainer) {
        strengthContainer.style.display = password.length > 0 ? 'block' : 'none';
      }
      
      if (password.length === 0) {
        if (strengthFill) strengthFill.style.width = '0%';
        if (strengthText) strengthText.textContent = '';
        // Resetear requisitos
        resetPasswordRequirements();
        // Resetear validación del campo
        passwordInput.classList.remove('input-valid', 'input-error');
        return;
      }
      
      // Calcular fortaleza
      const result = calculatePasswordStrength(password);
      
      // Actualizar barra
      if (strengthFill) {
        strengthFill.style.width = result.percentage + '%';
        strengthFill.className = 'strength-meter-fill ' + result.class;
      }
      
      // Actualizar texto
      if (strengthText) {
        strengthText.textContent = result.text;
        strengthText.className = 'strength-text ' + result.class;
      }
      
      // Actualizar requisitos visuales
      updatePasswordRequirements(password);
      
      // Validar campo
      validatePasswordField(password);
    });
  }
  
  // Validar confirmación de contraseña
  const password2Input = document.getElementById('regPassword2');
  if (password2Input && passwordInput) {
    password2Input.addEventListener('input', function() {
      validatePasswordMatch(passwordInput.value, this.value);
    });
  }
  
  // Manejar cambio de tipo de cuenta (empresa/ciudadano)
  const roleSelect = document.getElementById('regRole');
  const empresaMensaje = document.getElementById('empresaMensaje');
  const empresaField = document.getElementById('empresaField');
  const registerBtn = document.getElementById('doRegister');
  
  if (roleSelect) {
    roleSelect.addEventListener('change', function() {
      const isEmpresa = this.value === 'empresa';
      
      if (empresaField) {
        empresaField.style.display = isEmpresa ? 'block' : 'none';
      }
      
      if (empresaMensaje) {
        empresaMensaje.style.display = isEmpresa ? 'block' : 'none';
      }
      
      if (registerBtn) {
        registerBtn.disabled = isEmpresa;
        registerBtn.style.opacity = isEmpresa ? '0.5' : '1';
        registerBtn.title = isEmpresa ? 'Las empresas deben contactar por WhatsApp' : '';
      }
    });
  }
}

// Resetear requisitos de contraseña
function resetPasswordRequirements() {
  const requirementIds = ['req-length', 'req-upper', 'req-lower', 'req-number', 'req-special'];
  
  requirementIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.remove('valid', 'invalid');
      const icon = element.querySelector('i');
      if (icon) {
        icon.className = 'fas fa-circle';
      }
    }
  });
}

// Calcular fortaleza de contraseña
function calculatePasswordStrength(password) {
  let score = 0;
  
  // Longitud
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Mayúsculas
  if (/[A-Z]/.test(password)) score++;
  
  // Minúsculas
  if (/[a-z]/.test(password)) score++;
  
  // Números
  if (/[0-9]/.test(password)) score++;
  
  // Símbolos
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  // Calcular porcentaje (máximo 7 puntos)
  const percentage = Math.min((score / 7) * 100, 100);
  
  let text = '';
  let classname = '';
  
  if (percentage < 30) {
    text = 'Muy débil';
    classname = 'weak';
  } else if (percentage < 50) {
    text = 'Débil';
    classname = 'weak';
  } else if (percentage < 70) {
    text = 'Regular';
    classname = 'medium';
  } else if (percentage < 90) {
    text = 'Fuerte';
    classname = 'strong';
  } else {
    text = 'Muy fuerte';
    classname = 'very-strong';
  }
  
  return { percentage, text, class: classname, score };
}

// Actualizar requisitos visuales
function updatePasswordRequirements(password) {
  const requirements = {
    'req-length': password.length >= 8,
    'req-upper': /[A-Z]/.test(password),
    'req-lower': /[a-z]/.test(password),
    'req-number': /[0-9]/.test(password),
    'req-special': /[^A-Za-z0-9]/.test(password)
  };
  
  for (const [id, isValid] of Object.entries(requirements)) {
    const element = document.getElementById(id);
    if (element) {
      const icon = element.querySelector('i');
      if (isValid) {
        element.classList.add('valid');
        element.classList.remove('invalid');
        if (icon) {
          icon.className = 'fas fa-check-circle';
        }
      } else {
        element.classList.add('invalid');
        element.classList.remove('valid');
        if (icon) {
          icon.className = 'fas fa-circle';
        }
      }
    }
  }
}

// Validar campo de contraseña
function validatePasswordField(password) {
  const field = document.getElementById('regPassword');
  if (!field) return;
  
  const isValid = password.length >= 8 && 
                  /[A-Z]/.test(password) && 
                  /[a-z]/.test(password) && 
                  /[0-9]/.test(password) && 
                  /[^A-Za-z0-9]/.test(password);
  
  if (password.length > 0) {
    if (isValid) {
      field.classList.add('input-valid');
      field.classList.remove('input-error');
    } else {
      field.classList.add('input-error');
      field.classList.remove('input-valid');
    }
  } else {
    field.classList.remove('input-valid', 'input-error');
  }
}

// Validar coincidencia de contraseñas
function validatePasswordMatch(password, password2) {
  const field2 = document.getElementById('regPassword2');
  if (!field2) return;
  
  if (password2.length > 0) {
    if (password === password2) {
      field2.classList.add('input-valid');
      field2.classList.remove('input-error');
    } else {
      field2.classList.add('input-error');
      field2.classList.remove('input-valid');
    }
  } else {
    field2.classList.remove('input-valid', 'input-error');
  }
}

// Exportar función para usar en auth.js
window.calculatePasswordStrength = calculatePasswordStrength;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  initPasswordHelpers();
});