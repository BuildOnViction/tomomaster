FROM node:8-alpine

LABEL maintainer="etienne@tomochain.com"

ENV SERVER_HOST '0.0.0.0'
ENV SERVER_PORT '3001'
ENV BC_RPC ''
ENV BC_NETWORK_ID '89'
ENV BC_EPOCH '990'
ENV BC_BLOCK_TIME '2'
ENV EXPLORER_URL ''
ENV DB_URI ''
ENV REDIS_HOST ''
ENV REDIS_PORT '6379'
ENV REDIS_PASSWORD ''
ENV REDIS_PREFIX 'tomomaster'

WORKDIR /app

COPY package*.json ./

RUN apk --no-cache --virtual deps add \
      python \
      make \
      g++ \
      bash \
      git \
    && npm install --production \
    && npm install

COPY . .

RUN mkdir -p build/contracts \
    && mv abis/* build/contracts/ \
    && npm run build

ENTRYPOINT ["npm"]

CMD ["start"]
