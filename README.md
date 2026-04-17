# 🛡️ DataGuardMX

<p align="center">
  <img src="https://img.shields.io/badge/status-MVP%20completo-success?style=for-the-badge" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-green?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/express-4.x-black?style=for-the-badge&logo=express" />
  <img src="https://img.shields.io/badge/supabase-DB-3ecf8e?style=for-the-badge&logo=supabase" />
  <img src="https://img.shields.io/badge/docker-ready-blue?style=for-the-badge&logo=docker" />
  <img src="https://img.shields.io/badge/license-MIT-purple?style=for-the-badge" />
</p>

<p align="center">
  <b>Plataforma SaaS de protección de identidad digital en México 🇲🇽</b><br>
  <i>"Tu identidad digital, bajo tu control"</i>
</p>

---

## 🎬 Demo (Animación)

<p align="center">
  <img src="./docs/demo.gif" alt="Demo DataGuardMX" width="800"/>
</p>

> 💡 Tip: puedes grabar este GIF con ScreenToGif o OBS

---

## 📸 Screenshots

### 🧭 Dashboard Principal

<p align="center">
  <img src="./docs/screenshots/dashboard.png" width="800"/>
</p>

### 🚨 Alertas de Seguridad

<p align="center">
  <img src="./docs/screenshots/alertas.png" width="800"/>
</p>

### 🗺️ Mapa de Incidentes

<p align="center">
  <img src="./docs/screenshots/mapa.png" width="800"/>
</p>

### 🤖 Chatbot "Guardia"

<p align="center">
  <img src="./docs/screenshots/chatbot.png" width="500"/>
</p>

---

## 🚀 Descripción

**DataGuardMX** es una plataforma que protege la identidad digital de ciudadanos y empresas frente a riesgos derivados de la centralización de datos como:

* CURP
* Número telefónico
* Datos personales sensibles

Integra automatización, visualización de datos y seguridad en un solo sistema.

---

## ⚠️ Problema

México enfrenta un riesgo creciente de:

* Robo de identidad
* Filtraciones masivas
* Fraudes financieros

Debido a la centralización de datos en sistemas gubernamentales.

---

## 💡 Solución

DataGuardMX proporciona:

* 🚨 Alertas de filtraciones
* 📊 Semáforo de riesgo
* 📑 Gestión de consentimientos
* ⚖️ Cumplimiento ARCO
* 🤖 Chatbot inteligente

---

## 🧱 Arquitectura

```
Frontend → Backend → Supabase → n8n
```

---

## ⚙️ Instalación

```bash
git clone https://github.com/tu-usuario/dataguardmx.git
cd dataguardmx

cp .env.example .env

npm install
npm run dev
```

---

## 🌐 Acceso

| Servicio | URL                       |
| -------- | ------------------------- |
| App      | http://localhost:3000     |
| API      | http://localhost:3000/api |
| n8n      | http://localhost:5678     |

---

## 📌 Funcionalidades

* Dashboard interactivo
* Sistema de autenticación (JWT)
* Gestión de usuarios
* Reporte de incidentes
* Chatbot automatizado
* Exportación de PDF
* Verificación de filtraciones

---

## 🧠 Stack Tecnológico

**Backend**

* Node.js
* Express
* Supabase

**Frontend**

* HTML, CSS, JS
* Leaflet
* Chart.js

**Infraestructura**

* Docker
* Nginx
* n8n

---

## 🔐 Seguridad

* JWT Authentication
* bcrypt hashing
* Helmet (headers)
* Rate limiting
* RBAC (roles)

---

## 📊 Estado del Proyecto

| Fase          | Estado |
| ------------- | ------ |
| MVP           | ✅      |
| Escalabilidad | 🚧     |
| Expansión     | 🔮     |

---

## 🧪 Scripts

```bash
npm run dev
npm start
npm run test
```

---

## 🧠 Roadmap

* IA avanzada (GPT / Gemini)
* Monitoreo real de filtraciones
* App móvil
* 2FA

---

## 🤝 Contribuir

```bash
git checkout -b feature/nueva
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva
```

---

## 📜 Licencia

MIT

---

## ✨ Autor
**Miriam Edith Garcia Miguel**
**Sabina Perez Olvera**
**Eduardo Ochoa Almaraz**

---

## ⭐ Dale estrella

Si te gustó el proyecto, dale ⭐ en GitHub 🙌
