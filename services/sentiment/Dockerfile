FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir 'Flask>=3.1,<3.2' vaderSentiment==3.3.2 'gunicorn>=23,<24'
COPY services/sentiment/app.py ./
RUN useradd --create-home app
USER app
EXPOSE 5000
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--workers", "2"]
