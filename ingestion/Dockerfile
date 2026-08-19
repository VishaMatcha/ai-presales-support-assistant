FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY ingestion/package.json ingestion/package.json
RUN npm ci
COPY ingestion ingestion
CMD ["npm", "run", "ingest", "-w", "ingestion"]
