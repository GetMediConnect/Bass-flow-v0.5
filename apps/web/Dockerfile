# Serve the static BassFlow v5 HTML via nginx
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the v5 HTML as index, plus any static assets
COPY bassflow_v5.html /usr/share/nginx/html/index.html
COPY css /usr/share/nginx/html/css
COPY js  /usr/share/nginx/html/js

EXPOSE 8080
