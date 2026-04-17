// ============================================
// UI MODULE - DATA GUARD MX
// ============================================

export function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) {
    console.warn('Toast element not found:', message);
    alert(message);
    return;
  }
  
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  
  clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

export function initModals() {
  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(modal => {
        closeModal(modal.id);
      });
    }
  });
  
  // Cerrar con overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) closeModal(modal.id);
    });
  });
  
  // Botones de cerrar
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) closeModal(modal.id);
    });
  });
}

// Funciones globales para usar en onclick
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;