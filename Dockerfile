FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

FROM node:22-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app \
 && rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx \
           /usr/local/bin/corepack \
           /opt/yarn-v*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER app
EXPOSE 3000
CMD ["node", "server.js"]
