#!/bin/sh
set -e

cd /app || {
    echo "Application directory not found"
    exit 1
}

echo "Starting FastAPI backend"
uvicorn backend.server:app --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 10

if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Backend failed to start during initialization"
    exit 1
fi

echo "Starting Nginx"
nginx -g 'daemon off;' &
NGINX_PID=$!

trap 'kill "$BACKEND_PID" "$NGINX_PID"; exit 0' SIGTERM SIGINT

while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$NGINX_PID" 2>/dev/null; do
    sleep 1
done

if kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Nginx exited unexpectedly, shutting down backend"
    kill "$BACKEND_PID"
else
    echo "Backend exited unexpectedly, shutting down Nginx"
    kill "$NGINX_PID"
fi

exit 1
