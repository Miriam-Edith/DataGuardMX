// ============================================
// CONTROLADOR DE EXPORTACIÓN DE REPORTES
// ============================================

const pdfService = require('../services/pdfService');
const Consentimiento = require('../models/Consentimiento');
const Reporte = require('../models/Reporte');
const fs = require('fs').promises;

/**
 * Exporta consentimientos a PDF
 */
exports.exportConsentimientosPDF = async (req, res) => {
  try {
    const consentimientos = await Consentimiento.findByUser(req.user.id);
    const filepath = await pdfService.generateConsentimientosReport(req.user, consentimientos);
    
    res.download(filepath, `consentimientos_${Date.now()}.pdf`, async (err) => {
      if (err) {
        console.error('Error enviando PDF:', err);
      }
      // Eliminar archivo temporal después de enviar (esperar 5 segundos)
      setTimeout(async () => {
        await fs.unlink(filepath).catch(console.error);
      }, 5000);
    });
  } catch (error) {
    console.error('Error generando PDF de consentimientos:', error);
    res.status(500).json({ message: 'Error generando reporte PDF' });
  }
};

/**
 * Exporta incidentes a PDF
 */
exports.exportIncidentesPDF = async (req, res) => {
  try {
    const incidentes = await Reporte.findByUser(req.user.id);
    const filepath = await pdfService.generateIncidentesReport(req.user, incidentes);
    
    res.download(filepath, `incidentes_${Date.now()}.pdf`, async (err) => {
      if (err) {
        console.error('Error enviando PDF:', err);
      }
      setTimeout(async () => {
        await fs.unlink(filepath).catch(console.error);
      }, 5000);
    });
  } catch (error) {
    console.error('Error generando PDF de incidentes:', error);
    res.status(500).json({ message: 'Error generando reporte PDF' });
  }
};

/**
 * Exporta certificado ARCO (solo empresas)
 */
exports.exportARCOCertificate = async (req, res) => {
  try {
    if (req.user.role !== 'empresa') {
      return res.status(403).json({ message: 'Solo empresas pueden generar este certificado' });
    }
    
    // Obtener estadísticas de cumplimiento
    const stats = {
      solicitudesAtendidas: 0, // Implementar conteo real
      tiempoPromedio: 'N/A',
      tasaCumplimiento: 100
    };
    
    const filepath = await pdfService.generateARCOCertificate(
      { id: req.user.id, nombre: req.user.empresa_nombre || req.user.nombre },
      stats
    );
    
    res.download(filepath, `certificado_arco_${Date.now()}.pdf`, async (err) => {
      if (err) console.error('Error enviando certificado:', err);
      setTimeout(async () => {
        await fs.unlink(filepath).catch(console.error);
      }, 5000);
    });
  } catch (error) {
    console.error('Error generando certificado:', error);
    res.status(500).json({ message: 'Error generando certificado' });
  }
};