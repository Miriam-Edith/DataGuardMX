FROM nginx:alpine
# Copia la configuración personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copia todos los archivos del sitio (carpeta public)
COPY public /usr/share/nginx/html
EXPOSE 80