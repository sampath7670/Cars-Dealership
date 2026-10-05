FROM node:22-bookworm-slim AS frontend
WORKDIR /build
COPY server/frontend/package*.json ./
RUN npm ci
COPY server/frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY server/ ./server/
COPY --from=frontend /build/dist ./server/frontend/dist
RUN python server/manage.py collectstatic --noinput && useradd --create-home app && mkdir /data && chown -R app:app /data /app
USER app
EXPOSE 8000
CMD ["sh", "-c", "python server/manage.py migrate --noinput && python server/manage.py seed_data && cd server && gunicorn cars.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --access-logfile -"]
