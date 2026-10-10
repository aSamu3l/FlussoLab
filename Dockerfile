# FlussoLab server: Node only, no external packages. Data in /data (one SQLite file).
FROM node:24-alpine
RUN apk add --no-cache su-exec
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY admin ./admin
COPY core ./core
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data PUID=1000 PGID=1000 NODE_OPTIONS=--disable-warning=ExperimentalWarning
# the entrypoint gives /data to PUID:PGID (also a host folder owned by root) and runs the server as that user, never as root
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && mkdir -p /data && chown 1000:1000 /data
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8080/api/info >/dev/null || exit 1
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
