FROM node:20-alpine  AS build

WORKDIR /application
COPY package*.json .

RUN npm install

RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27 AS prod

COPY --from=build /application/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Add script to generate runtime config
RUN echo '#!/bin/sh \n\
echo "window.RUNTIME_CONFIG = { \
  AUTH_API_URL: \"$VITE_AUTH_API_URL\"  \
  \VITE_PROJECT_API_URL: \"VITE_PROJECT_API_URL\" \
};" > /usr/share/nginx/html/config.js \n\
exec nginx -g "daemon off;"' > /docker-entrypoint.sh && \
chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]