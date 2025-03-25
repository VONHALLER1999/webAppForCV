FROM python:3.13-slim

RUN apt-get update \
    && apt-get install -y python3-distutils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 4000

CMD ["python", "app.py"]