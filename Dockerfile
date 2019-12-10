# Build the source
FROM node:12 as builder

WORKDIR /code

# First install dependencies. This part will be cached as long as
# the package(-lock).json files remain identical.
COPY package*.json /code/
RUN npm install

# Load code to be built
COPY ./build /code/build
COPY ./js /code/js

RUN npm run build:docker

# Production Nginx image
FROM nginx:1.17-alpine

# Directory where atlas files will be stored
ENV ATLAS_HOME=/usr/share/nginx/html/atlas
# URL where WebAPI can be queried by the client
ENV WEBAPI_URL=http://localhost:8080/WebAPI/
# Hostname for nginx configuration
ENV ATLAS_HOSTNAME=localhost

# Configure webserver
COPY ./docker/nginx.conf /etc/nginx/nginx.conf
COPY ./docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Load code
COPY ./images $ATLAS_HOME/images
COPY ./index.html ./README.md ./LICENSE $ATLAS_HOME/
COPY --from=builder /code/node_modules $ATLAS_HOME/node_modules
COPY --from=builder /code/js $ATLAS_HOME/js

# Load Atlas configuration
COPY ./docker/config-local.js $ATLAS_HOME/js/config-local.js

ENTRYPOINT ["/entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80
