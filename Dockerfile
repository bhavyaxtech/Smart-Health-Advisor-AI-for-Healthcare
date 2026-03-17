FROM node:20 AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ARG REACT_APP_BACKEND_URL=""
ARG REACT_APP_GOOGLE_CLIENT_ID=""
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
ENV REACT_APP_GOOGLE_CLIENT_ID=${REACT_APP_GOOGLE_CLIENT_ID}
RUN npm run build

FROM nginx:stable-alpine

WORKDIR /app

COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html
COPY backend /app/backend
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh \
    && apk add --no-cache python3 py3-pip \
    && pip3 install --break-system-packages --no-cache-dir -r /app/backend/requirements.txt

ENV PYTHONUNBUFFERED=1

CMD ["/entrypoint.sh"]
