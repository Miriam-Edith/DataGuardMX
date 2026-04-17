// ============================================
// SERVICIO DE GENERACIÓN DE PDF
// ============================================

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Asegurar que existe el directorio temp
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

class PDFService {
  /**
   * Genera reporte PDF de consentimientos
   */
  generateConsentimientosReport(user, consentimientos) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        info: {
          Title: 'Reporte de Consentimientos - DataGuardMX',
          Author: 'DataGuardMX',
          Subject: 'Consentimientos de tratamiento de datos',
          Creator: 'DataGuardMX PDF Service'
        }
      });
      
      const filename = `consentimientos_${user.id}_${Date.now()}.pdf`;
      const filepath = path.join(tempDir, filename);
      
      const stream = fs.createWriteStream(filepath);
      
      stream.on('error', reject);
      stream.on('finish', () => resolve(filepath));
      
      doc.pipe(stream);

      // ===== ENCABEZADO =====
      // Logo / Título
      doc.fontSize(24)
         .fillColor('#00e5c3')
         .text('🛡️ DataGuardMX', { align: 'center' });
      
      doc.fontSize(16)
         .fillColor('#080f14')
         .text('Reporte de Consentimientos', { align: 'center' });
      
      doc.moveDown();
      
      // Información del usuario
      doc.fontSize(10)
         .fillColor('#5a7a90')
         .text(`Generado para: ${user.nombre || 'Usuario'} (${user.email})`);
      doc.text(`Fecha de generación: ${new Date().toLocaleString('es-MX')}`);
      doc.text(`Total de consentimientos: ${consentimientos.length}`);
      
      doc.moveDown(2);

      // ===== TABLA DE CONSENTIMIENTOS =====
      let y = doc.y;
      
      // Cabecera de tabla
      doc.fontSize(10)
         .fillColor('#00e5c3');
      
      doc.text('Empresa', 50, y);
      doc.text('Finalidad', 200, y);
      doc.text('Vigencia', 370, y);
      doc.text('Estado', 470, y);
      
      y += 20;
      
      // Línea separadora
      doc.strokeColor('#1a3a52')
         .lineWidth(1)
         .moveTo(50, y)
         .lineTo(550, y)
         .stroke();
      
      y += 15;
      
      // Datos de consentimientos
      doc.fontSize(9).fillColor('#c8dde8');
      
      consentimientos.forEach((c, index) => {
        // Nueva página si es necesario
        if (y > 750) {
          doc.addPage();
          y = 50;
          
          // Repetir cabecera en nueva página
          doc.fontSize(10).fillColor('#00e5c3');
          doc.text('Empresa', 50, y);
          doc.text('Finalidad', 200, y);
          doc.text('Vigencia', 370, y);
          doc.text('Estado', 470, y);
          
          y += 20;
          doc.strokeColor('#1a3a52').lineWidth(1)
             .moveTo(50, y).lineTo(550, y).stroke();
          
          y += 15;
          doc.fontSize(9).fillColor('#c8dde8');
        }
        
        // Empresa
        doc.text(c.empresa || '—', 50, y, { width: 140 });
        
        // Finalidad (truncar si es muy largo)
        const finalidad = c.finalidad || '—';
        doc.text(finalidad.length > 30 ? finalidad.substring(0, 30) + '...' : finalidad, 
                 200, y, { width: 160 });
        
        // Vigencia
        const vigencia = c.vigencia 
          ? new Date(c.vigencia).toLocaleDateString('es-MX')
          : 'Indefinida';
        doc.text(vigencia, 370, y);
        
        // Estado con color
        const estadoColor = c.estado === 'activo' ? '#2ecc71' : '#e74c3c';
        doc.fillColor(estadoColor)
           .text(c.estado?.toUpperCase() || 'DESCONOCIDO', 470, y);
        doc.fillColor('#c8dde8');
        
        y += 20;
        
        // Línea separadora entre filas
        if (index < consentimientos.length - 1) {
          doc.strokeColor('#1a3a52')
             .lineWidth(0.5)
             .moveTo(50, y - 5)
             .lineTo(550, y - 5)
             .stroke();
        }
      });

      // ===== PIE DE PÁGINA =====
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        
        // Número de página
        doc.fontSize(8)
           .fillColor('#5a7a90')
           .text(`Página ${i + 1} de ${totalPages}`, 50, 800, { align: 'center' });
        
        // Nota legal
        doc.fontSize(7)
           .fillColor('#5a7a90')
           .text('Este documento fue generado automáticamente por DataGuardMX y tiene validez legal como evidencia de consentimiento.', 
                  50, 815, { align: 'center', width: 500 });
      }

      doc.end();
    });
  }

  /**
   * Genera reporte PDF de incidentes
   */
  generateIncidentesReport(user, incidentes) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });
      
      const filename = `incidentes_${user.id}_${Date.now()}.pdf`;
      const filepath = path.join(tempDir, filename);
      
      const stream = fs.createWriteStream(filepath);
      
      stream.on('error', reject);
      stream.on('finish', () => resolve(filepath));
      
      doc.pipe(stream);

      // Encabezado
      doc.fontSize(24)
         .fillColor('#f0a500')
         .text('🚨 DataGuardMX', { align: 'center' });
      
      doc.fontSize(16)
         .fillColor('#080f14')
         .text('Reporte de Incidentes de Datos', { align: 'center' });
      
      doc.moveDown();
      
      doc.fontSize(10)
         .fillColor('#5a7a90')
         .text(`Generado para: ${user.nombre || 'Usuario'} (${user.email})`);
      doc.text(`Fecha: ${new Date().toLocaleString('es-MX')}`);
      doc.text(`Total de incidentes: ${incidentes.length}`);
      
      doc.moveDown(2);

      incidentes.forEach((incidente, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }
        
        // Título del incidente
        doc.fontSize(14)
           .fillColor('#00e5c3')
           .text(`${index + 1}. ${incidente.tipo_contaminante || 'Incidente de datos'}`);
        
        doc.moveDown(0.5);
        
        // Detalles
        doc.fontSize(10)
           .fillColor('#7a9db5')
           .text('Fecha del reporte:', { continued: true })
           .fillColor('#c8dde8')
           .text(` ${new Date(incidente.creado_en).toLocaleString('es-MX')}`);
        
        doc.fontSize(10)
           .fillColor('#7a9db5')
           .text('Ubicación / Entidad:', { continued: true })
           .fillColor('#c8dde8')
           .text(` ${incidente.ubicacion || 'No especificada'}`);
        
        doc.moveDown();
        
        // Descripción
        doc.fontSize(10)
           .fillColor('#7a9db5')
           .text('Descripción del incidente:');
        
        doc.fontSize(9)
           .fillColor('#c8dde8')
           .text(incidente.descripcion || 'Sin descripción', { width: 500 });
        
        doc.moveDown(1.5);
        
        // Línea separadora
        if (index < incidentes.length - 1) {
          doc.strokeColor('#1a3a52')
             .lineWidth(0.5)
             .moveTo(50, doc.y)
             .lineTo(550, doc.y)
             .stroke();
          doc.moveDown();
        }
      });

      // Pie de página
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .fillColor('#5a7a90')
           .text(`Página ${i + 1} de ${totalPages}`, 50, 800, { align: 'center' });
        doc.text('DataGuardMX - Reporte oficial de incidentes', 50, 815, { align: 'center' });
      }

      doc.end();
    });
  }

  /**
   * Genera certificado de cumplimiento ARCO (para empresas)
   */
  generateARCOCertificate(empresa, stats) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        layout: 'landscape'
      });
      
      const filename = `certificado_arco_${empresa.id}_${Date.now()}.pdf`;
      const filepath = path.join(tempDir, filename);
      
      const stream = fs.createWriteStream(filepath);
      
      stream.on('error', reject);
      stream.on('finish', () => resolve(filepath));
      
      doc.pipe(stream);

      // Borde decorativo
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .strokeColor('#00e5c3')
         .lineWidth(2)
         .stroke();
      
      doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50)
         .strokeColor('#00e5c3')
         .lineWidth(0.5)
         .stroke();

      // Título
      doc.fontSize(28)
         .fillColor('#00e5c3')
         .text('CERTIFICADO DE CUMPLIMIENTO', { align: 'center' });
      
      doc.fontSize(16)
         .fillColor('#080f14')
         .text('Derechos ARCO - LFPDPPP', { align: 'center' });
      
      doc.moveDown(2);

      // Cuerpo
      doc.fontSize(12)
         .fillColor('#c8dde8')
         .text('Por medio del presente, DataGuardMX certifica que:', { align: 'center' });
      
      doc.moveDown();
      
      doc.fontSize(20)
         .fillColor('#eaf5fb')
         .text(empresa.nombre, { align: 'center' });
      
      doc.moveDown();
      
      doc.fontSize(11)
         .fillColor('#c8dde8')
         .text('Ha implementado los mecanismos necesarios para garantizar el ejercicio de los', { align: 'center' })
         .text('derechos ARCO (Acceso, Rectificación, Cancelación y Oposición) de los titulares', { align: 'center' })
         .text('de datos personales, en cumplimiento con la Ley Federal de Protección de Datos', { align: 'center' })
         .text('Personales en Posesión de los Particulares (LFPDPPP).', { align: 'center' });
      
      doc.moveDown(2);

      // Estadísticas
      doc.fontSize(10)
         .fillColor('#5a7a90')
         .text('Métricas de cumplimiento:', 100);
      
      doc.fontSize(11)
         .fillColor('#c8dde8')
         .text(`• Solicitudes ARCO atendidas: ${stats.solicitudesAtendidas || 0}`, 120)
         .text(`• Tiempo promedio de respuesta: ${stats.tiempoPromedio || 'N/A'} días`, 120)
         .text(`• Tasa de cumplimiento: ${stats.tasaCumplimiento || 100}%`, 120);
      
      doc.moveDown(3);

      // Firmas
      doc.fontSize(10)
         .fillColor('#c8dde8')
         .text('_________________________', 100, doc.y + 20)
         .text('Director de DataGuardMX', 100, doc.y + 35);
      
      doc.text('_________________________', 400, doc.y)
         .text('Oficial de Privacidad', 400, doc.y + 15);
      
      doc.moveDown(2);
      
      doc.fontSize(8)
         .fillColor('#5a7a90')
         .text(`Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center' })
         .text(`Válido por 12 meses a partir de la fecha de emisión`, { align: 'center' })
         .text(`ID de Certificado: DG-${Date.now().toString(36).toUpperCase()}`, { align: 'center' });

      doc.end();
    });
  }

  /**
   * Limpia archivos temporales antiguos (más de 1 hora)
   */
  async cleanupTempFiles() {
    try {
      const files = fs.readdirSync(tempDir);
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      
      for (const file of files) {
        const filepath = path.join(tempDir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtimeMs < oneHourAgo) {
          fs.unlinkSync(filepath);
          console.log(`🧹 Archivo temporal eliminado: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error limpiando archivos temporales:', error);
    }
  }
}

// Ejecutar limpieza cada hora
setInterval(() => {
  const pdfService = new PDFService();
  pdfService.cleanupTempFiles();
}, 60 * 60 * 1000);

module.exports = new PDFService();