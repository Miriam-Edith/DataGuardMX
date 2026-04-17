// ============================================
// SERVICIO DE CORREO ELECTRÓNICO - GMAIL
// ============================================

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    // Configuración para Gmail
    const config = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // false para puerto 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // Contraseña de aplicación
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    this.transporter = nodemailer.createTransport(config);
    
    // Verificar conexión
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Error en configuración de correo:', error);
        console.error('   Verifica tu EMAIL_USER y EMAIL_PASS en .env');
      } else {
        console.log('✅ Servicio de correo configurado correctamente');
        console.log(`   📧 Enviando desde: ${process.env.EMAIL_USER}`);
      }
    });
  }

  /**
   * Envía email de recuperación de contraseña
   */
  async sendPasswordResetEmail(user, resetUrl) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recupera tu contraseña - DataGuardMX</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #080f14;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 560px;
            margin: 0 auto;
            background: #0f2336;
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid #1a3a52;
          }
          .header {
            background: linear-gradient(135deg, #00e5c3, #00a38a);
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            color: #080f14;
            font-size: 28px;
          }
          .header p {
            margin: 10px 0 0;
            color: #0b1c28;
          }
          .content {
            padding: 35px 30px;
          }
          .greeting {
            color: #e8f4fb;
            font-size: 18px;
            margin-bottom: 20px;
          }
          .message {
            color: #b8d4e4;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 25px;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #00e5c3, #00a38a);
            color: #080f14;
            text-decoration: none;
            padding: 14px 35px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 16px;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: scale(1.05);
          }
          .warning {
            background: rgba(231,76,60,0.1);
            border-left: 3px solid #e74c3c;
            padding: 15px;
            margin: 25px 0;
            color: #e88;
            font-size: 13px;
          }
          .footer {
            background: #0b1c28;
            padding: 20px;
            text-align: center;
            color: #5a7a90;
            font-size: 12px;
            border-top: 1px solid #1a3a52;
          }
          .code {
            background: #0b1c28;
            padding: 12px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            color: #00e5c3;
            text-align: center;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ DataGuardMX</h1>
            <p>Protegiendo tu identidad digital</p>
          </div>
          <div class="content">
            <div class="greeting">
              Hola <strong>${user.nombre || user.email}</strong>,
            </div>
            <div class="message">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta en DataGuardMX.
              Si no solicitaste este cambio, puedes ignorar este correo.
            </div>
            <div class="button-container">
              <a href="${resetUrl}" class="button">🔐 Restablecer Contraseña</a>
            </div>
            <div class="code">
              O copia este enlace:<br>
              ${resetUrl}
            </div>
            <div class="warning">
              ⚠️ Este enlace expirará en <strong>1 hora</strong> por seguridad.
            </div>
          </div>
          <div class="footer">
            <p>© 2024 DataGuardMX - Todos los derechos reservados</p>
            <p>Este es un correo automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      DataGuardMX - Recuperación de contraseña
      
      Hola ${user.nombre || user.email},
      
      Recibimos una solicitud para restablecer la contraseña de tu cuenta.
      
      Haz clic en el siguiente enlace para restablecer tu contraseña:
      ${resetUrl}
      
      Este enlace expirará en 1 hora.
      
      Si no solicitaste este cambio, ignora este correo.
      
      --
      DataGuardMX - Protegiendo tu identidad digital
    `;

    try {
      const info = await this.transporter.sendMail({
        from: `"DataGuardMX" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: '🔐 DataGuardMX - Recupera tu contraseña',
        text: textContent,
        html: htmlContent
      });
      
      console.log(`✅ Email de recuperación enviado a ${user.email}`);
      console.log(`   Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando email:', error.message);
      return false;
    }
  }

  /**
 * Envía correo de confirmación de solicitud empresarial
 */
async sendEmpresaSolicitudEmail(data) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Solicitud Recibida - DataGuardMX</title>
      <style>
        body { font-family: Arial, sans-serif; background: #080f14; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #0f2336; border-radius: 20px; border: 1px solid #1a3a52; }
        .header { background: linear-gradient(135deg, #00e5c3, #00a38a); padding: 30px; text-align: center; border-radius: 20px 20px 0 0; }
        .header h1 { margin: 0; color: #080f14; }
        .content { padding: 35px 30px; }
        .info-box { background: #0b1c28; padding: 15px; border-radius: 12px; margin: 20px 0; }
        .button { display: inline-block; background: #00e5c3; color: #080f14; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { background: #0b1c28; padding: 20px; text-align: center; color: #5a7a90; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛡️ DataGuardMX</h1>
        </div>
        <div class="content">
          <p style="color: #e8f4fb;">Hola <strong>${data.nombre_contacto}</strong>,</p>
          <p style="color: #b8d4e4;">Hemos recibido tu solicitud de registro para <strong>${data.nombre_empresa}</strong>.</p>
          <div class="info-box">
            <p style="color: #00e5c3;"><strong>📋 ID de Solicitud:</strong> #${data.solicitud_id}</p>
            <p style="color: #7a9db5;"><strong>📧 Revisa tu correo regularmente</strong> - Te contactaremos en menos de 24 horas.</p>
          </div>
          <p style="color: #5a7a90; text-align: center;">Mientras tanto, puedes consultar el estado de tu solicitud respondiendo a este correo.</p>
        </div>
        <div class="footer">
          <p>DataGuardMX - Protegiendo tu identidad digital</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await this.transporter.sendMail({
      from: `"DataGuardMX" <${process.env.EMAIL_FROM}>`,
      to: data.email,
      subject: '📋 DataGuardMX - Solicitud de registro empresarial recibida',
      html: htmlContent
    });
    console.log(`✅ Email de solicitud enviado a ${data.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    return false;
  }
}

  /**
   * Envía alerta de seguridad
   */
  async sendSecurityAlert(user, alerta) {
    const severityColors = {
      alta: '#e74c3c',
      media: '#f5a623',
      baja: '#2ecc71',
      info: '#00e5c3'
    };

    const severityEmojis = {
      alta: '🚨',
      media: '⚠️',
      baja: 'ℹ️',
      info: '📢'
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Alerta de Seguridad - DataGuardMX</title>
        <style>
          body { font-family: Arial, sans-serif; background: #080f14; margin: 0; padding: 20px; }
          .container { max-width: 560px; margin: 0 auto; background: #0f2336; border-radius: 20px; border: 1px solid #1a3a52; }
          .header { background: linear-gradient(135deg, ${severityColors[alerta.severidad]}, #080f14); padding: 30px; text-align: center; }
          .header h2 { margin: 0; color: white; }
          .content { padding: 35px 30px; }
          .alert-box { background: #0b1c28; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${severityColors[alerta.severidad]}; }
          .alert-title { color: ${severityColors[alerta.severidad]}; font-size: 18px; font-weight: bold; }
          .alert-message { color: #b8d4e4; margin: 15px 0; line-height: 1.6; }
          .footer { background: #0b1c28; padding: 20px; text-align: center; color: #5a7a90; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${severityEmojis[alerta.severidad]} Alerta de Seguridad</h2>
          </div>
          <div class="content">
            <p style="color: #e8f4fb;">Hola <strong>${user.nombre || user.email}</strong>,</p>
            <div class="alert-box">
              <div class="alert-title">${alerta.mensaje}</div>
              <div class="alert-message">Fecha: ${new Date().toLocaleString('es-MX')}</div>
            </div>
            <p style="color: #5a7a90; font-size: 13px; text-align: center;">
              Inicia sesión en DataGuardMX para más detalles.
            </p>
          </div>
          <div class="footer">
            <p>DataGuardMX - Protegiendo tu identidad digital</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"DataGuardMX" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: `${severityEmojis[alerta.severidad]} ${alerta.mensaje.substring(0, 50)}`,
        html: htmlContent
      });
      console.log(`✅ Alerta enviada a ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando alerta:', error.message);
      return false;
    }
  }

  // Enviar email de bienvenida con credenciales
async sendWelcomeEmail(data) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Bienvenido a DataGuardMX</title>
      <style>
        body { font-family: Arial, sans-serif; background: #080f14; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #0f2336; border-radius: 20px; border: 1px solid #1a3a52; }
        .header { background: linear-gradient(135deg, #00e5c3, #00a38a); padding: 30px; text-align: center; border-radius: 20px 20px 0 0; }
        .header h1 { margin: 0; color: #080f14; }
        .content { padding: 35px 30px; }
        .credenciales { background: #0b1c28; padding: 15px; border-radius: 12px; margin: 20px 0; }
        .button { display: inline-block; background: #00e5c3; color: #080f14; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { background: #0b1c28; padding: 20px; text-align: center; color: #5a7a90; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛡️ DataGuardMX</h1>
        </div>
        <div class="content">
          <p style="color: #e8f4fb;">Hola <strong>${data.nombre}</strong>,</p>
          <p style="color: #b8d4e4;">Tu cuenta ha sido creada en DataGuardMX.</p>
          <div class="credenciales">
            <p style="color: #00e5c3;"><strong>🔐 Tus credenciales de acceso:</strong></p>
            <p style="color: #b8d4e4;">📧 Usuario: ${data.email}</p>
            <p style="color: #b8d4e4;">🔑 Contraseña: ${data.password}</p>
            <p style="color: #f5a623; font-size: 12px;">⚠️ Te recomendamos cambiar tu contraseña al primer inicio.</p>
          </div>
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard.html" class="button">Ir al Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>DataGuardMX - Protegiendo tu identidad digital</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await this.transporter.sendMail({
      from: `"DataGuardMX" <${process.env.EMAIL_FROM}>`,
      to: data.email,
      subject: '🎉 Bienvenido a DataGuardMX - Tus credenciales de acceso',
      html: htmlContent
    });
    console.log(`✅ Email de bienvenida enviado a ${data.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    return false;
  }
}

  /**
   * Envía resumen semanal
   */
  async sendWeeklyDigest(user, stats) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Resumen Semanal - DataGuardMX</title>
        <style>
          body { font-family: Arial, sans-serif; background: #080f14; margin: 0; padding: 20px; }
          .container { max-width: 560px; margin: 0 auto; background: #0f2336; border-radius: 20px; border: 1px solid #1a3a52; }
          .header { background: linear-gradient(135deg, #00e5c3, #00a38a); padding: 30px; text-align: center; }
          .content { padding: 35px 30px; }
          .stats { display: flex; justify-content: space-around; margin: 25px 0; }
          .stat { text-align: center; }
          .stat-value { font-size: 32px; font-weight: bold; color: #00e5c3; }
          .stat-label { color: #5a7a90; font-size: 12px; }
          .footer { background: #0b1c28; padding: 20px; text-align: center; color: #5a7a90; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0;">📊 Resumen Semanal</h2>
          </div>
          <div class="content">
            <p style="color: #e8f4fb;">Hola <strong>${user.nombre || user.email}</strong>,</p>
            <div class="stats">
              <div class="stat">
                <div class="stat-value">${stats.alertas || 0}</div>
                <div class="stat-label">Alertas</div>
              </div>
              <div class="stat">
                <div class="stat-value">${stats.consentimientos || 0}</div>
                <div class="stat-label">Consentimientos</div>
              </div>
              <div class="stat">
                <div class="stat-value">${stats.incidentes || 0}</div>
                <div class="stat-label">Incidentes</div>
              </div>
            </div>
            <p style="color: #5a7a90; text-align: center; margin-top: 20px;">
              Tu nivel de riesgo: <strong style="color: #00e5c3;">${stats.riesgo || 'BAJO'}</strong>
            </p>
          </div>
          <div class="footer">
            <p>DataGuardMX - Protegiendo tu identidad digital</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"DataGuardMX" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: '📊 DataGuardMX - Tu resumen semanal de seguridad',
        html: htmlContent
      });
      console.log(`✅ Resumen semanal enviado a ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando resumen:', error.message);
      return false;
    }
  }
}




module.exports = new EmailService();