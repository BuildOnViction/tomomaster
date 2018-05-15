#!/bin/bash

echo "Generating Configuration File ..."
cp /build/config/default.json /build/config/local.json

pm2 start -x --no-daemon index.js
