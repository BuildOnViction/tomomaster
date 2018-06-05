FROM node:8

WORKDIR /build

RUN npm install -g pm2
COPY ./package.json /build
COPY ./package-lock.json /build
RUN npm install
COPY ./ /build
RUN npm run build && rm -rf /build/node_modules

RUN npm install --production

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
