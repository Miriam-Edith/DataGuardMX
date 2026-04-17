FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --omit=dev

# Copiar código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p uploads temp storage

EXPOSE 3001

CMD ["node", "server.js"]