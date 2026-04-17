// ============================================
// CONTROLADOR DE BÚSQUEDA - DATAGUARD MX
// ============================================

const Reporte = require('../models/Reporte');
const Consentimiento = require('../models/Consentimiento');

// Dataset combinado para búsqueda
async function getSearchDataset(userId) {
  const [reportes, consentimientos] = await Promise.all([
    Reporte.findByUser(userId),
    Consentimiento.findByUser(userId)
  ]);
  
  const items = [];
  
  // Formatear reportes
  reportes.forEach(r => {
    items.push({
      id: `rep-${r.id}`,
      type: 'incidente',
      title: r.tipo_contaminante || 'Incidente',
      description: r.descripcion || '',
      category: 'Incidentes',
      tags: [r.tipo_contaminante, r.ubicacion].filter(Boolean),
      date: r.creado_en,
      extra: { ubicacion: r.ubicacion }
    });
  });
  
  // Formatear consentimientos
  consentimientos.forEach(c => {
    items.push({
      id: `con-${c.id}`,
      type: 'consentimiento',
      title: c.empresa,
      description: c.finalidad || '',
      category: 'Consentimientos',
      tags: [c.empresa, c.estado].filter(Boolean),
      date: c.otorgado_en,
      extra: { estado: c.estado, vigencia: c.vigencia }
    });
  });
  
  return items;
}

// Calcular score de coincidencia
function calculateScore(item, query) {
  if (!query) return 1;
  
  const q = query.toLowerCase();
  let score = 0;
  
  // Coincidencia en título (peso 3)
  if (item.title.toLowerCase().includes(q)) score += 3;
  
  // Coincidencia en descripción (peso 2)
  if (item.description.toLowerCase().includes(q)) score += 2;
  
  // Coincidencia en tags (peso 1 por tag)
  item.tags.forEach(tag => {
    if (tag && tag.toLowerCase().includes(q)) score += 1;
  });
  
  return score;
}

// Búsqueda principal
exports.search = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      q = '',
      category,
      type,
      tags,
      sort = 'relevance',
      page = 1,
      limit = 10
    } = req.query;
    
    // Obtener dataset
    let items = await getSearchDataset(userId);
    
    // Búsqueda por texto (simple)
    if (q) {
      items = items.map(item => ({
        ...item,
        score: calculateScore(item, q)
      })).filter(item => item.score > 0);
    }
    
    // Filtros avanzados
    if (category) {
      items = items.filter(item => item.category === category);
    }
    
    if (type) {
      items = items.filter(item => item.type === type);
    }
    
    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim().toLowerCase());
      items = items.filter(item => 
        tagsArray.some(tag => 
          item.tags.some(itemTag => 
            itemTag && itemTag.toLowerCase().includes(tag)
          )
        )
      );
    }
    
    // Ordenamiento
    if (sort === 'relevance' && q) {
      items.sort((a, b) => b.score - a.score);
    } else if (sort === 'newest') {
      items.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sort === 'oldest') {
      items.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sort === 'title') {
      items.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    // Paginación
    const total = items.length;
    const start = (page - 1) * limit;
    const paginatedItems = items.slice(start, start + parseInt(limit));
    
    // Formatear respuesta
    res.json({
      query: q,
      filters: { category, type, tags },
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      items: paginatedItems.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        snippet: item.description.substring(0, 150) + (item.description.length > 150 ? '...' : ''),
        category: item.category,
        tags: item.tags,
        date: item.date,
        extra: item.extra,
        score: item.score
      }))
    });
    
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ message: 'Error realizando búsqueda' });
  }
};

// Obtener opciones de filtros
exports.getFilterOptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await getSearchDataset(userId);
    
    const categories = [...new Set(items.map(i => i.category))];
    const types = [...new Set(items.map(i => i.type))];
    const allTags = [...new Set(items.flatMap(i => i.tags).filter(Boolean))];
    
    res.json({ categories, types, tags: allTags });
  } catch (error) {
    console.error('Error obteniendo filtros:', error);
    res.status(500).json({ message: 'Error obteniendo opciones de filtros' });
  }
};