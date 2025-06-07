#!/bin/bash

# Start Ollama in the background
ollama serve &

# Wait for Ollama to start
sleep 5

# Pull the CodeLlama model
ollama pull codellama

# Start the Next.js application
npm run start 