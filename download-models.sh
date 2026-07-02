#!/bin/bash
# Script to download Piper TTS voice models automatically for Podmine 2-Host podcast setup

set -e

MODELS_DIR="models"
mkdir -p "$MODELS_DIR"

echo "📂 Creating '$MODELS_DIR' directory..."

# Host A model: en_US-lessac-medium
echo "📥 Downloading Host A Voice Model (en_US-lessac-medium)..."
if [ ! -f "$MODELS_DIR/en_US-lessac-medium.onnx" ]; then
  curl -L "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx" -o "$MODELS_DIR/en_US-lessac-medium.onnx"
fi
if [ ! -f "$MODELS_DIR/en_US-lessac-medium.onnx.json" ]; then
  curl -L "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json" -o "$MODELS_DIR/en_US-lessac-medium.onnx.json"
fi

# Host B model: en_US-joe-medium
echo "📥 Downloading Host B Voice Model (en_US-joe-medium)..."
if [ ! -f "$MODELS_DIR/en_US-joe-medium.onnx" ]; then
  curl -L "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/joe/medium/en_US-joe-medium.onnx" -o "$MODELS_DIR/en_US-joe-medium.onnx"
fi
if [ ! -f "$MODELS_DIR/en_US-joe-medium.onnx.json" ]; then
  curl -L "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/joe/medium/en_US-joe-medium.onnx.json" -o "$MODELS_DIR/en_US-joe-medium.onnx.json"
fi

echo "✅ All models downloaded successfully in './$MODELS_DIR/'!"
echo "🚀 Run 'docker compose up --build' to start Podmine production stack."
