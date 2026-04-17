// ============================================
// TEST HIBP - Have I Been Pwned
// Modo híbrido: API real + Simulación fallback
// ============================================

require('dotenv').config({ path: '../.env' });
const axios = require('axios');

// ============================================
// CONFIGURACIÓN
// ============================================
const USE_REAL_API = process.env.HIBP_ENABLED !== 'false';
const TEST_EMAILS = [
  'test@example.com',
  'admin@test.com',
  'seguro@example.com',
  'zombie1250yt@gmail.com'  // Tu email real para probar
];

// Control de rate limiting
let requestCount = 0;
let lastReset = Date.now();

// ============================================
// FUNCIONES
// ============================================

async function checkRateLimit() {
  const now = Date.now();
  if (now - lastReset > 60000) {
    requestCount = 0;
    lastReset = now;
  }
  
  if (requestCount >= 10) {
    const waitTime = 60000 - (now - lastReset);
    console.log(`\n⏳ Rate limit alcanzado, esperando ${Math.ceil(waitTime/1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitTime + 100));
    requestCount = 0;
    lastReset = Date.now();
  }
  
  requestCount++;
}

async function checkHIBPReal(email) {
  try {
    await checkRateLimit();
    
    const response = await axios.get(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`,
      {
        headers: { 'User-Agent': 'DataGuardMX-Security-Test' },
        timeout: 8000
      }
    );
    
    return {
      success: true,
      found: true,
      count: response.data.length,
      breaches: response.data.map(b => ({
        name: b.Name,
        domain: b.Domain,
        date: b.BreachDate,
        description: b.Description,
        dataClasses: b.DataClasses
      })),
      source: 'HIBP API (Real)'
    };
    
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        success: true,
        found: false,
        count: 0,
        breaches: [],
        source: 'HIBP API (Real)'
      };
    }
    
    return {
      success: false,
      error: error.message,
      source: 'HIBP API'
    };
  }
}

function simulateBreachCheck(email) {
  const simulatedData = {
    'test@example.com': {
      found: true,
      count: 2,
      breaches: [
        { 
          name: 'Adobe', 
          domain: 'adobe.com', 
          date: '2013-10-04',
          description: 'In October 2013, 153 million Adobe accounts were breached.',
          dataClasses: ['Email addresses', 'Password hints', 'Passwords']
        },
        { 
          name: 'LinkedIn', 
          domain: 'linkedin.com', 
          date: '2012-05-05',
          description: 'In May 2012, LinkedIn suffered a data breach.',
          dataClasses: ['Email addresses', 'Passwords']
        }
      ]
    },
    'admin@test.com': {
      found: true,
      count: 3,
      breaches: [
        { 
          name: 'Dropbox', 
          domain: 'dropbox.com', 
          date: '2012-07-31',
          dataClasses: ['Email addresses', 'Passwords']
        },
        { 
          name: 'MySpace', 
          domain: 'myspace.com', 
          date: '2008-07-01',
          dataClasses: ['Email addresses', 'Passwords', 'Usernames']
        },
        { 
          name: 'Tumblr', 
          domain: 'tumblr.com', 
          date: '2013-02-28',
          dataClasses: ['Email addresses', 'Passwords']
        }
      ]
    },
    'diabliya06@gmail.com': {
      found: true,
      count: 1,
      breaches: [
        {
          name: 'Canva',
          domain: 'canva.com',
          date: '2019-05-24',
          description: 'In May 2019, Canva suffered a data breach.',
          dataClasses: ['Email addresses', 'Names', 'Passwords']
        }
      ]
    }
  };

  const result = simulatedData[email.toLowerCase()] || { found: false, count: 0, breaches: [] };
  result.source = 'Simulación (Fallback)';
  result.success = true;
  
  return result;
}

async function checkEmail(email) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📧 Verificando: ${email}`);
  console.log('='.repeat(60));
  
  let result;
  
  if (USE_REAL_API) {
    console.log('🌐 Intentando API real de HIBP...');
    result = await checkHIBPReal(email);
    
    if (!result.success) {
      console.log(`   ⚠️ API falló: ${result.error}`);
      console.log('   🎭 Cambiando a modo simulación...');
      result = simulateBreachCheck(email);
    }
  } else {
    console.log('🎭 Modo simulación activado...');
    result = simulateBreachCheck(email);
  }
  
  // Mostrar resultado
  console.log(`\n📊 Fuente: ${result.source}`);
  
  if (result.found) {
    console.log(`\n🔴 ¡EMAIL COMPROMETIDO!`);
    console.log(`   Aparece en ${result.count} filtración(es):\n`);
    
    result.breaches.forEach((breach, index) => {
      console.log(`   ${index + 1}. 📍 ${breach.name}`);
      console.log(`      🌐 Dominio: ${breach.domain}`);
      console.log(`      📅 Fecha: ${breach.date}`);
      if (breach.description) {
        console.log(`      📝 ${breach.description.substring(0, 80)}...`);
      }
      console.log(`      🔓 Datos comprometidos: ${breach.dataClasses?.join(', ') || 'N/A'}`);
      console.log('');
    });
    
    // Recomendaciones
    console.log('   💡 Recomendaciones:');
    console.log('      • Cambia las contraseñas de las cuentas afectadas');
    console.log('      • Usa contraseñas únicas para cada servicio');
    console.log('      • Activa la verificación en dos pasos');
    
  } else {
    console.log(`\n🟢 ¡EMAIL LIMPIO!`);
    console.log(`   No aparece en filtraciones conocidas.\n`);
    console.log('   💡 Recomendaciones:');
    console.log('      • Mantén buenas prácticas de seguridad');
    console.log('      • Usa un gestor de contraseñas');
  }
  
  return result;
}

async function getLatestBreaches() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🌍 ÚLTIMAS FILTRACIONES GLOBALES (Simulación)');
  console.log('='.repeat(60));
  
  const breaches = [
    { 
      name: 'Twitter', 
      domain: 'twitter.com', 
      date: '2023-01-05',
      pwnCount: 221000000,
      description: 'Email addresses, phone numbers',
      verified: true
    },
    { 
      name: 'LinkedIn', 
      domain: 'linkedin.com', 
      date: '2012-05-05',
      pwnCount: 164611595,
      description: 'Email addresses, passwords',
      verified: true
    },
    { 
      name: 'Adobe', 
      domain: 'adobe.com', 
      date: '2013-10-04',
      pwnCount: 152445165,
      description: 'Email addresses, password hints, passwords',
      verified: true
    },
    { 
      name: 'MySpace', 
      domain: 'myspace.com', 
      date: '2008-07-01',
      pwnCount: 359420698,
      description: 'Email addresses, passwords, usernames',
      verified: true
    },
    { 
      name: 'Canva', 
      domain: 'canva.com', 
      date: '2019-05-24',
      pwnCount: 137000000,
      description: 'Email addresses, names, passwords',
      verified: true
    }
  ];
  
  breaches.forEach((breach, index) => {
    console.log(`\n   ${index + 1}. 📍 ${breach.name}`);
    console.log(`      🌐 Dominio: ${breach.domain}`);
    console.log(`      📅 Fecha: ${breach.date}`);
    console.log(`      👥 Cuentas afectadas: ${breach.pwnCount.toLocaleString()}`);
    console.log(`      🔓 Datos: ${breach.description}`);
    if (breach.verified) {
      console.log(`      ✅ Verificado`);
    }
  });
}

// ============================================
// EJECUTAR PRUEBAS
// ============================================
async function runTests() {
  console.clear();
  console.log('🛡️  DATAGUARD MX - PRUEBA DE VERIFICACIÓN DE FILTRACIONES');
  console.log('='.repeat(60));
  console.log(`📌 Modo: ${USE_REAL_API ? 'HÍBRIDO (API Real + Simulación)' : 'SIMULACIÓN'}`);
  console.log(`📌 Rate limit: 10 solicitudes/minuto`);
  console.log('='.repeat(60));
  
  // Probar cada email
  for (const email of TEST_EMAILS) {
    await checkEmail(email);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa entre emails
  }
  
  // Mostrar últimas filtraciones
  await getLatestBreaches();
  
  // Resumen
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ PRUEBA COMPLETADA');
  console.log('='.repeat(60));
  console.log('\n📋 Para usar en producción:');
  console.log('   • HIBP API Key (pago): https://haveibeenpwned.com/API/Key');
  console.log('   • Alternativas gratuitas: LeakCheck.io, BreachDirectory.org');
  console.log('');
}

// Iniciar pruebas
runTests().catch(console.error);