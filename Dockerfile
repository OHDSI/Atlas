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
RUN find . -type f \( -name "*.js" ! -name "config-local.js" -o -name "*.css" -o -name "*.xml" -o -name "*.html" -o -name "*.svg" -o -name "*.json" \) -print0 \
  | xargs -0 -n 1 gzip -k

# Production Nginx image
FROM nginxinc/nginx-unprivileged:1.19-alpine

# Directory where atlas files will be stored
ENV ATLAS_HOME=/usr/share/nginx/html/atlas
# URL where WebAPI can be queried by the client
ENV WEBAPI_URL=http://localhost:8080/WebAPI/
# Hostname for nginx configuration
ENV ATLAS_HOSTNAME=localhost

# Configure webserver
COPY ./docker/optimization.conf /etc/nginx/conf.d/optimization.conf
COPY ./docker/30-atlas-env-subst.sh /docker-entrypoint.d/30-atlas-env-subst.sh

# Load code
COPY ./images $ATLAS_HOME/images
COPY ./README.md ./LICENSE $ATLAS_HOME/
COPY --from=builder /code/index.html* $ATLAS_HOME/
COPY --from=builder /code/node_modules $ATLAS_HOME/node_modules
COPY --from=builder /code/js $ATLAS_HOME/js

# Load Atlas local config with current user, so it can be modified
# with env substitution
COPY --chown=101 docker/config-local.js $ATLAS_HOME/js/config-local.js
