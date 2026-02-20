#!/bin/bash

echo ">>> Building Frontend (React/Vite) <<<"
cd frontend
npm install
npm run build
cd ..

echo ">>> Starting FastAPI Backend <<<"
# Uvicorn binds to 0.0.0.0 so you can access it from Chrome Localhost 
# or other devices on your local network
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
