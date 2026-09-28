# RSVP backend v0.3
Один FastAPI backend обслуживает разные свадьбы через `weddingId`.

## Запуск
`pip install -r requirements.txt`

Задайте `ADMIN_USER`, длинный `ADMIN_PASSWORD`, `ALLOWED_ORIGINS` (HTTPS-адрес приглашения) и при необходимости `DATABASE_PATH`, затем:
`uvicorn app:app --host 127.0.0.1 --port 8000`

Маршруты: `POST /api/rsvp`, `GET /health`, закрытые `GET /admin` и `/admin/export.csv`.
SQLite создаётся автоматически. Backend и файл базы нельзя публиковать в GitHub Pages. В production API должен быть за HTTPS reverse proxy.
