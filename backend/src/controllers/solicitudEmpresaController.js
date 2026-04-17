const SolicitudEmpresa = require('../models/SolicitudEmpresa');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Crear solicitud de registro empresarial
exports.createSolicitud = async (req, res) => {
  try {
    const {
      nombre_empresa,
      rfc,
      email_contacto,
      telefono,
      nombre_contacto,
      puesto_contacto
    } = req.body;

    // Validar campos requeridos
    if (!nombre_empresa || !rfc || !email_contacto || !telefono || !nombre_contacto) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validar formato de RFC
    const rfcRegex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    if (!rfcRegex.test(rfc.toUpperCase())) {
      return res.status(400).json({ message: 'RFC inválido' });
    }

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from('solicitudes_empresas')
      .select('id')
      .eq('rfc', rfc.toUpperCase())
      .single();
    
    if (existing) {
      return res.status(400).json({ message: 'Ya existe una solicitud para este RFC' });
    }

    // Crear solicitud
    const solicitud = await SolicitudEmpresa.create({
      nombre_empresa,
      rfc: rfc.toUpperCase(),
      email_contacto: email_contacto.toLowerCase(),
      telefono,
      nombre_contacto,
      puesto_contacto
    });

    // Enviar WhatsApp al administrador
    await whatsappService.notificarNuevaSolicitud(solicitud);

    // Enviar correo de confirmación al solicitante
    await emailService.sendEmpresaSolicitudEmail({
      email: email_contacto,
      nombre_empresa,
      nombre_contacto,
      solicitud_id: solicitud.id
    });

    res.status(201).json({ 
      message: 'Solicitud enviada correctamente. Revisaremos tus documentos y te contactaremos.',
      solicitud_id: solicitud.id 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
};

// Subir documento (se puede hacer con multer para archivos)
exports.subirDocumento = async (req, res) => {
  try {
    const { solicitud_id, documento_id } = req.body;
    const archivo = req.file; // Asumiendo que usas multer
    
    // Aquí subirías el archivo a Supabase Storage
    const archivo_url = `https://storage.dataguardmx.com/documentos/${solicitud_id}/${archivo.originalname}`;
    
    const documento = await SolicitudEmpresa.addDocumento(
      solicitud_id,
      documento_id,
      archivo_url,
      archivo.originalname
    );
    
    res.json({ message: 'Documento subido', documento });
  } catch (error) {
    res.status(500).json({ message: 'Error al subir documento' });
  }
};

// Obtener todas las solicitudes (admin)
exports.getAllSolicitudes = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    
    const { estatus } = req.query;
    const solicitudes = await SolicitudEmpresa.getAll({ estatus });
    res.json(solicitudes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener solicitudes' });
  }
};

// Aprobar solicitud y crear usuario
exports.aprobarSolicitud = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    
    const { id } = req.params;
    const { observaciones } = req.body;
    
    const solicitud = await SolicitudEmpresa.findById(id);
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    // Generar contraseña aleatoria
    const passwordGenerada = Math.random().toString(36).slice(-8) + 
                             Math.random().toString(36).slice(-8).toUpperCase();
    const hashedPassword = await bcrypt.hash(passwordGenerada, 10);
    
    // Crear usuario en la base de datos
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([{
        email: solicitud.email_contacto,
        password: hashedPassword,
        role: 'empresa',
        nombre: solicitud.nombre_contacto,
        empresa_nombre: solicitud.nombre_empresa,
        telefono: solicitud.telefono,
        is_active: true
      }])
      .select()
      .single();
    
    if (userError) throw userError;
    
    // Actualizar solicitud
    await SolicitudEmpresa.updateStatus(id, 'aprobada', observaciones, passwordGenerada, newUser.id);
    
    // Enviar correo con credenciales
    await emailService.sendEmpresaAprobadaEmail({
      email: solicitud.email_contacto,
      nombre_empresa: solicitud.nombre_empresa,
      nombre_contacto: solicitud.nombre_contacto,
      password: passwordGenerada,
      email_acceso: solicitud.email_contacto
    });
    
    // Enviar WhatsApp con credenciales
    await whatsappService.enviarCredencialesEmpresa({
      telefono: solicitud.telefono,
      nombre_empresa: solicitud.nombre_empresa,
      email: solicitud.email_contacto,
      password: passwordGenerada
    });
    
    res.json({ message: 'Solicitud aprobada y usuario creado', user: newUser });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al aprobar solicitud' });
  }
};

// Rechazar solicitud
exports.rechazarSolicitud = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    
    const { id } = req.params;
    const { observaciones } = req.body;
    
    const solicitud = await SolicitudEmpresa.findById(id);
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    await SolicitudEmpresa.updateStatus(id, 'rechazada', observaciones);
    
    // Enviar correo de rechazo
    await emailService.sendEmpresaRechazadaEmail({
      email: solicitud.email_contacto,
      nombre_empresa: solicitud.nombre_empresa,
      nombre_contacto: solicitud.nombre_contacto,
      observaciones
    });
    
    // Enviar WhatsApp de rechazo
    await whatsappService.enviarRechazoEmpresa({
      telefono: solicitud.telefono,
      nombre_empresa: solicitud.nombre_empresa,
      observaciones
    });
    
    res.json({ message: 'Solicitud rechazada' });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al rechazar solicitud' });
  }
};

// Obtener documentos requeridos
exports.getDocumentosRequeridos = async (req, res) => {
  try {
    const documentos = await SolicitudEmpresa.getDocumentosRequeridos();
    res.json(documentos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener documentos' });
  }
};