FROM python:3.10-slim

# Install Node.js, npm, and supervisor
RUN apt-get update && apt-get install -y nodejs npm supervisor \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and build the frontend
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm install
# Use "npm run build" if you want to build static files; if you want the dev server, use "npm start" below.
# RUN npm run build

# Return to the root working directory
WORKDIR /app

# Copy and install backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/ ./backend/

# Copy Supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 5000 3000

CMD ["/usr/bin/supervisord", "-n"]