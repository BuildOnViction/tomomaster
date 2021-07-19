FROM node:8-alpine

LABEL maintainer="etienne@tomochain.com"

WORKDIR /app

COPY package*.json ./

RUN apk --no-cache --virtual deps add \
      python \
      make \
      g++ \
      bash \
      git \
    && npm install
       npm@6 \
       dotenv \
       node-gyp
COPY . .

RUN mkdir -p build/contracts \
    && mv abis/* build/contracts/ \
    && npm run build \
    && rm -rf node_modules \
    && npm install --production \
    && apk del deps

ENTRYPOINT ["npm"]

CMD ["start"]
