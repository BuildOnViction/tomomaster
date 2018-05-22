#!/bin/bash

echo "Generating Configuration File ..."
cp /build/config/default.json /build/config/local.json

npm run build && \
    pm2 start -x ./services/crawl.js && \
    pm2 start -x --no-daemon index.js
