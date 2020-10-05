#!/bin/sh

set -e

# make sure the WebAPI URL ends with a slash
case $WEBAPI_URL in
  # correct, no action
  */)
    ;;
  # otherwise, add slash
  *)
    WEBAPI_URL="$WEBAPI_URL/"
    ;;
esac

if [ -n "${WEBAPI_URL}" ]; then
  TFILE=`mktemp`
  trap "rm -f $TFILE" 0 1 2 3 15
  sed "s|http://localhost:8080/WebAPI/|$WEBAPI_URL|g" "$ATLAS_HOME/js/config-local.js" > "$TFILE"
  cat "$TFILE" > "$ATLAS_HOME/js/config-local.js"
fi

if [ -n "${ATLAS_HOSTNAME}" ]; then
  sed -i "s/server_name \$hostname;/server_name $ATLAS_HOSTNAME;/" /etc/nginx/nginx.conf
fi
