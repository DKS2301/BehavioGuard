FROM node:18-bullseye

ENV EXPO_NO_TELEMETRY=1

RUN apt-get update && apt-get install -y \
    python3 make g++ git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* .npmrc ./

RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; elif [ -f yarn.lock ]; then corepack enable && corepack prepare yarn@stable --activate && yarn install --frozen-lockfile; else npm install --legacy-peer-deps; fi

COPY . .

EXPOSE 19000 19001 19002 8081

CMD ["./start-docker.sh"]


