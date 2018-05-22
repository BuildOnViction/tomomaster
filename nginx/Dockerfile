FROM nginx:1.12
MAINTAINER Nguyen Sy Thanh Son 

RUN echo "deb http://ftp.debian.org/debian jessie-backports main" >> /etc/apt/sources.list \
  && apt-get update && apt-get install -y wget certbot -t jessie-backports

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
