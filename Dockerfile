FROM node:8-alpine

ENV HOST 0.0.0.0

WORKDIR /app

COPY . .

RUN apk --no-cache --virtual deps add \
      python \
      make \
      g++ \
      bash \
      git \
    && npm install -g pm2 truffle \
    && npm install \
    && truffle deploy \
    && npm run build \
    && rm -rf node_modules \
    && npm install --production \
    && apk del deps

ENTRYPOINT ["./entrypoint.sh"]
