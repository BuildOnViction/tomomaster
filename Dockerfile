FROM node:8
MAINTAINER ToMo Team

RUN npm install -g pm2 truffle

WORKDIR /build

COPY ./package.json /build
COPY ./package-lock.json /build
RUN npm install
COPY ./ /build

EXPOSE 80

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
