# FlussoLab server: Node only, no external packages. Data in /data (one SQLite file).
FROM node:24-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY admin ./admin
COPY core ./core
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data NODE_OPTIONS=--disable-warning=ExperimentalWarning
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8080/api/info >/dev/null || exit 1
CMD ["node", "src/server.js"]
