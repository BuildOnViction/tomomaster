FROM node:8-alpine

LABEL maintainer="etienne@tomochain.com"

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
    && npm install

ENTRYPOINT ["npm"]
