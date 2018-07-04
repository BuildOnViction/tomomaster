#!/bin/sh

echo "Generating Configuration File ..."
cp ./config/default.json ./config/local.json

pm2 start -x ./services/crawl.js
pm2 start -x --no-daemon index.js
