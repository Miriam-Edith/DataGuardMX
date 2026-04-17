require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('📧 Probando envío de correo...');
  console.log(`   Desde: ${process.env.EMAIL_USER}`);
  console.log(`   Hacia: ${process.env.EMAIL_USER} (mismo correo para prueba)`);
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    // Verificar conexión
    await transporter.verify();
    console.log('✅ Conexión SMTP exitosa!');
    
    // Enviar correo de prueba
    const info = await transporter.sendMail({
      from: `"DataGuardMX" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_USER, // Se envía a sí mismo para prueba
      subject: '🧪 DataGuardMX - Prueba de configuración',
      text: `¡Hola!

Este es un correo de prueba para verificar que la configuración de correo en DataGuardMX está funcionando correctamente.

Tu configuración:
- Email: ${process.env.EMAIL_USER}
- Host: ${process.env.EMAIL_HOST}
- Puerto: ${process.env.EMAIL_PORT}

Si recibes este correo, ¡todo funciona correctamente! 🎉

--
DataGuardMX - Protegiendo tu identidad digital`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; background: #080f14; padding: 20px;">
          <div style="max-width: 560px; margin: 0 auto; background: #0f2336; border-radius: 20px; border: 1px solid #1a3a52;">
            <div style="background: linear-gradient(135deg, #00e5c3, #00a38a); padding: 30px; text-align: center; border-radius: 20px 20px 0 0;">
              <h1 style="margin: 0; color: #080f14;">🛡️ DataGuardMX</h1>
              <p style="margin: 10px 0 0; color: #0b1c28;">Prueba de configuración exitosa</p>
            </div>
            <div style="padding: 35px 30px;">
              <p style="color: #e8f4fb; font-size: 18px;">✅ ¡Configuración correcta!</p>
              <p style="color: #b8d4e4; line-height: 1.6;">Tu sistema de correo en DataGuardMX está funcionando perfectamente.</p>
              <div style="background: #0b1c28; padding: 15px; border-radius: 12px; margin: 20px 0;">
                <p style="color: #00e5c3; margin: 0;">📧 Email: ${process.env.EMAIL_USER}</p>
                <p style="color: #5a7a90; margin: 5px 0 0;">🔐 Configuración verificada</p>
              </div>
              <p style="color: #5a7a90; font-size: 13px; text-align: center;">Ya puedes usar la recuperación de contraseña y alertas por email.</p>
            </div>
            <div style="background: #0b1c28; padding: 20px; text-align: center; color: #5a7a90; font-size: 12px; border-top: 1px solid #1a3a52;">
              <p>DataGuardMX - Protegiendo tu identidad digital</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log('\n✅ Correo de prueba enviado exitosamente!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`\n📨 Revisa tu bandeja de entrada: ${process.env.EMAIL_USER}`);
    console.log('   Si no ves el correo, revisa la carpeta SPAM');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'EAUTH') {
      console.log('\n⚠️ Error de autenticación. Verifica:');
      console.log('   1. La contraseña de aplicación es correcta (sin espacios)');
      console.log('   2. La verificación en 2 pasos está activada en tu Gmail');
      console.log('   3. El correo es: edithgm.ti23@utsjr.edu.mx');
    } else if (error.code === 'ESOCKET') {
      console.log('\n⚠️ Error de conexión. Verifica tu internet.');
    }
  }
}

testEmail();