#!/usr/bin/env bash
set -euo pipefail

IMAGE="behaviorguard:dev"
CONTAINER="behaviorguard_app"

docker build -t "$IMAGE" .

HOST_DIR="$(pwd)"

docker run --name "$CONTAINER" --rm -it \
  -p 19000:19000 -p 19001:19001 -p 19002:19002 -p 8081:8081 \
  -e EXPO_NO_TELEMETRY=1 -e CHOKIDAR_USEPOLLING=true \
  -v "$HOST_DIR":/app -v behaviorguard_node_modules:/app/node_modules \
  "$IMAGE"


