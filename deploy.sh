
npm config set user 0
npm config set unsafe-perm true


mkdir node_modules
chmod 777 -R node_modules/
npm install
cp ../config/* ./config/

pm2 reload crawler
pm2 reload tomomaster
