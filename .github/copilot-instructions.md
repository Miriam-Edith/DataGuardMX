# Reglas para GitHub Copilot - DataGuardMX

## Convenciones de código:
- Usar async/await siempre
- Controladores: exports.nombreFuncion = async (req, res) => {}
- Middleware: next() obligatorio
- Respuestas: { message, data, error }

## Estructura:
- controllers/ → lógica de negocio
- routes/ → solo definición de rutas
- models/ → interacción con Supabase

## Node.js específico:
- Usar try/catch en todos los controladores
- Logs con console.log con emojis (📝 ✅ ❌)
- Variables de ambiente con process.env