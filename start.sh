#!/bin/bash
# filepath: /Users/vilhelmgroenbaek/DevProjects/webAppForCV/start.sh

# Start the backend (assumes it listens on the proper port)
python backend/app.py &

# Serve the built frontend (using a simple HTTP server)
cd frontend/build && python3 -m http.server 8080

wait