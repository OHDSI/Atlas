#!/bin/sh

set -e

CONFIG_PATH=${CONFIG_PATH:-/etc/atlas/config-local.js}
CONFIG_TARGET_PATH="/usr/share/nginx/html/atlas/js/config-local.js"

# Copy mounted configuration file if present
if [ -f "${CONFIG_PATH}" ]; then
  echo "Using config-local.js from ${CONFIG_PATH}"
  # Don't copy but rewrite so that permissions are not changed.
  cat "${CONFIG_PATH}" > "${CONFIG_TARGET_PATH}"
fi

if [ -n "${WEBAPI_URL}" ]; then
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
  TFILE=`mktemp`
  trap "rm -f $TFILE" 0 1 2 3 15
  # Don't copy but rewrite so that permissions are not changed.
  envsubst '$WEBAPI_URL' < "$CONFIG_TARGET_PATH" > "$TFILE"
  cat "$TFILE" > "$CONFIG_TARGET_PATH"
  rm -f "$TFILE"
fi
