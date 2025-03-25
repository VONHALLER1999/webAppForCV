FROM python:3.13-slim

# Install required system packages and python3-setuptools, then upgrade pip and setuptools.
RUN apt-get update && \
    apt-get install -y python3-distutils python3-dev build-essential python3-setuptools && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip setuptools

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 4000

CMD ["python", "app.py"]