
npm config set user 0
npm config set unsafe-perm true


cp ../config/tomomaster.json ./config/local.json
cp abis/*json build/contracts/

pm2 list || npm i -g pm2
pm2 startOrReload pm2.config.js