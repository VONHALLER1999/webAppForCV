FROM python:3.10-slim

WORKDIR /app

# Copy and install backend dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application code
COPY . .

# Expose the port the app runs on
EXPOSE 4000

# Command to run the application
CMD ["python", "app.py"]