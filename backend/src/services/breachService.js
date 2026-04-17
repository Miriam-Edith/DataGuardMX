// ============================================
// SERVICIO DE VERIFICACIÓN DE FILTRACIONES
// USA BASE DE DATOS REAL
// ============================================

const supabase = require('../config/supabase');
const NodeCache = require('node-cache');

const breachCache = new NodeCache({ stdTTL: 3600 });

class BreachService {
  constructor() {
    this.useRealAPI = process.env.HIBP_ENABLED !== 'false';
    this.rapidApiKey = process.env.RAPIDAPI_KEY;
    this.rapidApiHost = process.env.RAPIDAPI_HOST;
  }

  /**
   * Obtiene las últimas filtraciones DESDE LA BASE DE DATOS
   * Basado en los reportes de incidentes reales
   */
  async getLatestBreaches(limit = 10) {
    try {
      console.log(`🔍 Buscando últimos ${limit} reportes desde BD...`);
      
      // Obtener reportes de la base de datos
      const { data: reportes, error } = await supabase
        .from('reportes')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error en Supabase:', error);
        throw error;
      }

      if (!reportes || reportes.length === 0) {
        console.log('No hay reportes en la base de datos');
        return [{
          name: 'No hay incidentes reportados',
          domain: 'Sistema seguro',
          date: new Date().toISOString(),
          pwnCount: 0,
          description: 'Aún no se han reportado incidentes. ¡Sé el primero en reportar!',
          verified: true,
          source: 'database'
        }];
      }

      console.log(`✅ Encontrados ${reportes.length} reportes`);

      // Obtener emails de los usuarios por separado
      const userIds = [...new Set(reportes.map(r => r.user_id).filter(Boolean))];
      let userEmails = {};
      
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);
        
        if (!usersError && users) {
          userEmails = users.reduce((acc, u) => {
            acc[u.id] = u.email;
            return acc;
          }, {});
        }
      }

      // Transformar reportes en formato de filtraciones
      const breaches = reportes.map(reporte => ({
        id: reporte.id,
        name: reporte.tipo_contaminante || 'Incidente de datos',
        domain: reporte.ubicacion || 'Ubicación no especificada',
        date: reporte.creado_en,
        pwnCount: 1,
        description: reporte.descripcion?.substring(0, 200) || 'Incidente reportado por usuario',
        verified: true,
        sensitive: reporte.tipo_contaminante?.toLowerCase().includes('filtración') || false,
        reported_by: userEmails[reporte.user_id] || 'Usuario anónimo',
        source: 'database'
      }));

      return breaches;

    } catch (error) {
      console.error('Error obteniendo filtraciones de BD:', error);
      return [{
        name: 'Error al cargar incidentes',
        domain: 'Sistema',
        date: new Date().toISOString(),
        pwnCount: 0,
        description: 'No se pudieron cargar los incidentes reportados. Intenta de nuevo más tarde.',
        verified: false,
        source: 'error'
      }];
    }
  }

  /**
   * Verifica si un email tiene reportes asociados en la BD
   */
  async checkEmailBreaches(email) {
    const cacheKey = `breach:${email.toLowerCase()}`;
    const cached = breachCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      // Buscar usuario por email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single();

      if (userError || !user) {
        const result = { found: false, count: 0, breaches: [], source: 'database' };
        breachCache.set(cacheKey, result);
        return result;
      }

      // Buscar reportes del usuario
      const { data: reportes, error: reportesError } = await supabase
        .from('reportes')
        .select('*')
        .eq('user_id', user.id);

      if (reportesError) throw reportesError;

      const found = reportes && reportes.length > 0;
      
      const result = {
        found: found,
        count: reportes?.length || 0,
        breaches: reportes?.map(r => ({
          name: r.tipo_contaminante || 'Incidente',
          domain: r.ubicacion || 'No especificada',
          date: r.creado_en,
          description: r.descripcion?.substring(0, 150) || 'Sin descripción',
          dataClasses: ['Datos personales']
        })) || [],
        source: 'database'
      };

      breachCache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error verificando email en BD:', error);
      return { found: false, count: 0, breaches: [], source: 'database', error: error.message };
    }
  }

  /**
   * Realiza chequeo completo de seguridad basado en BD
   */
  async performFullSecurityCheck(user) {
    const emailResult = await this.checkEmailBreaches(user.email);
    
    let riskLevel = 'bajo';
    const recommendations = [];
    
    if (emailResult.found && emailResult.count > 0) {
      if (emailResult.count >= 3) riskLevel = 'alto';
      else if (emailResult.count >= 1) riskLevel = 'medio';
      
      recommendations.push(
        '🔍 Revisa tus reportes de incidentes en el dashboard',
        '🔐 Cambia tus contraseñas regularmente',
        '📧 Contacta a las entidades afectadas para más información'
      );
    } else {
      recommendations.push(
        '✅ No tienes incidentes reportados, ¡sigue así!',
        '🛡️ Mantén buenas prácticas de seguridad',
        '📝 Reporta cualquier actividad sospechosa inmediatamente'
      );
    }
    
    recommendations.push('📊 Monitorea tu dashboard regularmente para estar al tanto de novedades');
    
    return {
      emailBreaches: emailResult,
      riskLevel,
      recommendations,
      compromisedData: emailResult.found 
        ? [...new Set(emailResult.breaches.flatMap(b => b.dataClasses || []))]
        : []
    };
  }

  /**
   * Obtiene consejos de seguridad basados en datos comprometidos
   */
  getSecurityAdvice(compromisedData) {
    const advice = [];
    
    if (compromisedData.includes('Email')) {
      advice.push('Revisa tu bandeja de entrada por correos sospechosos');
      advice.push('Cambia la contraseña de tu correo electrónico');
    }
    if (compromisedData.includes('Password')) {
      advice.push('Cambia tus contraseñas en todos los servicios');
      advice.push('Usa un gestor de contraseñas como Bitwarden o LastPass');
    }
    if (compromisedData.includes('Phone') || compromisedData.includes('Teléfono')) {
      advice.push('Desconfía de llamadas o SMS solicitando información personal');
    }
    
    if (advice.length === 0) {
      advice.push('Activa la verificación en dos pasos en todos tus servicios importantes');
      advice.push('Monitorea tus estados de cuenta bancarios regularmente');
    }
    
    return advice;
  }
}

module.exports = new BreachService();