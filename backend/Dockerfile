FROM python:3.11-slim

# Update package lists and install required system packages.
RUN apt-get update && \
    apt-get install -y python3-distutils python3-dev build-essential && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and upgrade pip, setuptools, and wheel.
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of your app's code.
COPY . .

EXPOSE 4000 4000

CMD ["python", "app.py"]