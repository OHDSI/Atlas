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
  CONFIG_LOCAL="/usr/share/nginx/html/atlas/js/config-local.js"
  TFILE=`mktemp`
  trap "rm -f $TFILE" 0 1 2 3 15
  envsubst '$WEBAPI_URL' < "$CONFIG_LOCAL" > "$TFILE"
  cat "$TFILE" > "$CONFIG_LOCAL"
  rm -f "$TFILE"
fi
