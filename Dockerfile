FROM node:22-alpine AS build
WORKDIR /app

COPY daily-ritual-frontend/package.json daily-ritual-frontend/package-lock.json* ./
RUN npm install

COPY daily-ritual-frontend/ ./

ARG VITE_API_URL=http://localhost:8080
ARG VITE_SESSION_API_URL=http://localhost:8082
ARG VITE_PROGRESS_API_URL=http://localhost:8083
ARG VITE_SCHEDULER_API_URL=http://localhost:8084
ARG VITE_NOTIFICATION_API_URL=http://localhost:8085

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SESSION_API_URL=$VITE_SESSION_API_URL
ENV VITE_PROGRESS_API_URL=$VITE_PROGRESS_API_URL
ENV VITE_SCHEDULER_API_URL=$VITE_SCHEDULER_API_URL
ENV VITE_NOTIFICATION_API_URL=$VITE_NOTIFICATION_API_URL

RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
