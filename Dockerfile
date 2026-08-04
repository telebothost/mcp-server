# TeleBotHost MCP Server — production image
FROM node:20.18.0-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json ./
RUN npm install --omit=dev

# App source (tsx runs TypeScript directly)
COPY api ./api
COPY lib ./lib
COPY server.ts ./
COPY tsconfig.json ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]
