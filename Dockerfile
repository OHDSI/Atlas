# Build the source
FROM docker.io/library/node:18.14.1-alpine@sha256:045b1a1c90bdfd8fcaad0769922aa16c401e31867d8bf5833365b0874884bbae as builder

WORKDIR /code

# First install dependencies. This part will be cached as long as
# the package.json file remains identical.
COPY package.json /code/
RUN npm install

# Build code
COPY ./build /code/build
COPY ./js /code/js
RUN npm run build:docker

# Statically pre-compress all output files to be served
COPY ./index.html /code/index.html
RUN find . -type f "(" \
        -name "*.css" \
        -o -name "*.html" \
        -o -name "*.js" ! -name "config-local.js" \
        -o -name "*.json" \
        -o -name "*.svg" \
        -o -name "*.xml" \
      ")" -print0 \
      | xargs -0 -n 1 gzip -kf

# Production Nginx image
FROM docker.io/nginxinc/nginx-unprivileged:1.23.3-alpine@sha256:c748ba587e7436aaa8729b64d4e0412410a486f0c592f0eec100fb3804ff9afd

LABEL org.opencontainers.image.title="OHDSI-Atlas"
LABEL org.opencontainers.image.authors="Joris Borgdorff <joris@thehyve.nl>, Lee Evans - www.ltscomputingllc.com"
LABEL org.opencontainers.image.description="ATLAS is an open source software tool for researchers to \
conduct scientific analyses on standardized observational data"
LABEL org.opencontainers.image.licenses="Apache-2.0"
LABEL org.opencontainers.image.vendor="OHDSI"
LABEL org.opencontainers.image.source="https://github.com/OHDSI/Atlas"

# URL where WebAPI can be queried by the client
ENV WEBAPI_URL=http://localhost:8080/WebAPI/ \
  CONFIG_PATH=/etc/atlas/config-local.js

# Configure webserver
COPY ./docker/nginx-default.conf /etc/nginx/conf.d/default.conf
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
