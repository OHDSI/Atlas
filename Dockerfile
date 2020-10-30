# Build the source
FROM node:12 as builder

WORKDIR /code

# First install dependencies. This part will be cached as long as
# the package(-lock).json files remain identical.
COPY package*.json /code/
RUN npm install

# Build code
COPY ./build /code/build
COPY ./js /code/js
RUN npm run build:docker

# Statically pre-compress all output files to be served
COPY ./index.html /code/index.html
RUN RUN find . -type f "(" \
        -name "*.css" \
        -o -name "*.html" \
        -o -name "*.js" ! -name "config-local.js" \
        -o -name "*.json" \
        -o -name "*.svg" \
        -o -name "*.xml" \
      ")" -print0 \
      | xargs -0 -n 1 gzip -k

# Production Nginx image
FROM nginxinc/nginx-unprivileged:1.19-alpine

# Published version of Atlas
ARG VERSION=SNAPSHOT
# Datetime that this image was created in ISO 8601 format
ARG CREATED=SNAPSHOT
# Git revision
ARG REVISION=SNAPSHOT

LABEL org.opencontainers.image.title="OHDSI ATLAS"
LABEL org.opencontainers.image.authors="Joris Borgdorff <joris@thehyve.nl>, Lee Evans - www.ltscomputingllc.com"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.description="ATLAS is an open source software tool for researchers \
to conduct scientific analyses on standardized observational data converted to the \
OMOP Common Data Model. It is served as a static site by Nginx."
LABEL org.opencontainers.image.licenses="Apache-2.0"
LABEL org.opencontainers.image.vendor="OHDSI"
LABEL org.opencontainers.image.source="https://github.com/OHDSI/Atlas"
LABEL org.opencontainers.image.created="${CREATED}"
LABEL org.opencontainers.image.revision="${REVISION}"

# URL where WebAPI can be queried by the client
ENV WEBAPI_URL=http://localhost:8080/WebAPI/

# Configure webserver
COPY ./docker/optimization.conf /etc/nginx/conf.d/optimization.conf
COPY ./docker/30-atlas-env-subst.sh /docker-entrypoint.d/30-atlas-env-subst.sh

# Load code
COPY ./images /usr/share/nginx/html/atlas/images
COPY ./README.md ./LICENSE /usr/share/nginx/html/atlas/
COPY --from=builder /code/index.html* /usr/share/nginx/html/atlas/
COPY --from=builder /code/node_modules /usr/share/nginx/html/atlas/node_modules
COPY --from=builder /code/js /usr/share/nginx/html/atlas/js

# Load Atlas local config with current user, so it can be modified
# with env substitution
COPY --chown=101 docker/config-local.js /usr/share/nginx/html/atlas/js/config-local.js
