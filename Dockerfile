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