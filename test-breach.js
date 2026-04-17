// test-breaches.js - Probar endpoint de filtraciones
const axios = require('axios');

async function testBreaches() {
  console.log('🧪 Probando endpoint de filtraciones...\n');
  
  try {
    // Primero, hacer login para obtener token
    console.log('1️⃣ Iniciando sesión...');
    const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@dataguardmx.com',
      password: 'Admin123!'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login exitoso\n');
    
    // Obtener últimas filtraciones
    console.log('2️⃣ Obteniendo últimas filtraciones...');
    const breachesRes = await axios.get('http://localhost:3001/api/security/breaches/latest?limit=5', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ Encontrados ${breachesRes.data.length} reportes:\n`);
    
    breachesRes.data.forEach((b, i) => {
      console.log(`${i + 1}. 📍 ${b.name}`);
      console.log(`   📍 Ubicación: ${b.domain}`);
      console.log(`   📅 Fecha: ${new Date(b.date).toLocaleDateString('es-MX')}`);
      console.log(`   📝 ${b.description?.substring(0, 100)}...`);
      console.log(`   👤 Reportado por: ${b.reported_by || 'Anónimo'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testBreaches();