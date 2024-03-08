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
LABEL org.opencontainers.image.authors="Joris Borgdorff <joris@thehyve.nl>, Lee Evans - www.ltscomputingllc.com, Shaun Turner<shaun.turner1@nhs.net>"
LABEL org.opencontainers.image.description="ATLAS is an open source software tool for researchers to \
conduct scientific analyses on standardized observational data"
LABEL org.opencontainers.image.licenses="Apache-2.0"
LABEL org.opencontainers.image.vendor="OHDSI"
LABEL org.opencontainers.image.source="https://github.com/OHDSI/Atlas"

# URL where WebAPI can be queried by the client
ENV USE_DYNAMIC_WEBAPI_URL="false"
ENV DYNAMIC_WEBAPI_SUFFIX="/WebAPI/"
ENV WEBAPI_URL="http://localhost:8080/WebAPI/"
ENV CONFIG_PATH="/etc/atlas/config-local.js"
ENV APP_NAME="OHDSI"
ENV COHORT_COMPARISON_RESULTS="false"
ENV USER_AUTHENTICATION="false"
ENV PLP_RESULTS="false"
ENV CLEAR_LOCAL_STORAGE="false"
ENV DISABLE_BROWSER_CHECK="false"
ENV ENABLE_PERMISSIONS_MGMT="true"
ENV CACHE_SOURCES="false"
ENV POLL_INTERVAL="60000"
ENV SKIP_LOGIN="false"
ENV USE_EXECUTION_ENGINE="false"
ENV VIEW_PROFILE_DATES="false"
ENV ENABLE_COSTS="false"
ENV SUPPORT_URL="https://github.com/ohdsi/atlas/issues"
ENV SUPPORT_MAIL="atlasadmin@your.org"
ENV FEEDBACK_CONTACTS="For access or questions concerning the Atlas application please contact:"
ENV FEEDBACK_HTML=""
ENV COMPANYINFO_HTML=""
ENV COMPANYINFO_SHOW="true"
ENV DEFAULT_LOCALE="en"

ENV WIN_PROVIDER_ENABLED="false"
ENV WIN_PROVIDER_NAME="Windows"
ENV WIN_PROVIDER_URL="user/login/windows"
ENV WIN_PROVIDER_AJAX="true"
ENV WIN_PROVIDER_ICON="fab fa-windows"

ENV KERB_PROVIDER_ENABLED="false"
ENV KERB_PROVIDER_NAME="Kerberos"
ENV KERB_PROVIDER_URL="user/login/kerberos"
ENV KERB_PROVIDER_AJAX="true"
ENV KERB_PROVIDER_ICON="fab fa-windows"

ENV OID_PROVIDER_ENABLED="false"
ENV OID_PROVIDER_NAME="OpenID Connect"
ENV OID_PROVIDER_URL="user/login/openid"
ENV OID_PROVIDER_AJAX="false"
ENV OID_PROVIDER_ICON="fa fa-openid"

ENV GGL_PROVIDER_ENABLED="false"
ENV GGL_PROVIDER_NAME="Google"
ENV GGL_PROVIDER_URL="user/oauth/google"
ENV GGL_PROVIDER_AJAX="false"
ENV GGL_PROVIDER_ICON="fab fa-google"

ENV FB_PROVIDER_ENABLED="false"
ENV FB_PROVIDER_NAME="Facebook"
ENV FB_PROVIDER_URL="user/oauth/facebook"
ENV FB_PROVIDER_AJAX="false"
ENV FB_PROVIDER_ICON="fab fa-facebook-f"

ENV GH_PROVIDER_ENABLED="false"
ENV GH_PROVIDER_NAME="Github"
ENV GH_PROVIDER_URL="user/oauth/github"
ENV GH_PROVIDER_AJAX="false"
ENV GH_PROVIDER_ICON="fab fa-github"

ENV DB_PROVIDER_ENABLED="false"
ENV DB_PROVIDER_NAME="DB"
ENV DB_PROVIDER_URL="user/login/db"
ENV DB_PROVIDER_AJAX="true"
ENV DB_PROVIDER_ICON="fa fa-database"
ENV DB_PROVIDER_CREDFORM="true"

ENV LDAP_PROVIDER_ENABLED="false"
ENV LDAP_PROVIDER_NAME="LDAP"
ENV LDAP_PROVIDER_URL="user/login/ldap"
ENV LDAP_PROVIDER_AJAX="true"
ENV LDAP_PROVIDER_ICON="fa fa-cubes"
ENV LDAP_PROVIDER_CREDFORM="true"

ENV SAML_PROVIDER_ENABLED="false"
ENV SAML_PROVIDER_NAME="SAML"
ENV SAML_PROVIDER_URL="user/login/saml"
ENV SAML_PROVIDER_AJAX="false"
ENV SAML_PROVIDER_ICON="fab fa-openid"

ENV AD_PROVIDER_ENABLED="false"
ENV AD_PROVIDER_NAME="Active Directory LDAP"
ENV AD_PROVIDER_URL="user/login/ad"
ENV AD_PROVIDER_AJAX="true"
ENV AD_PROVIDER_ICON="fa fa-cubes"
ENV AD_PROVIDER_CREDFORM="true"

ENV ENABLE_TANDCS="true"
ENV ENABLE_PERSONCOUNT="true"
ENV ENABLE_TAGGING_SECTION="false"
ENV REFRESH_TOKEN_THRESHOLD="240"

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
