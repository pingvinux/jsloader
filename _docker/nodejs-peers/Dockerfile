FROM ubuntu:trusty

RUN apt-get update && \
    apt-get -y install nodejs npm && \
        ln -s /usr/bin/nodejs /usr/bin/node

RUN npm install peer

ADD docker-exec.sh /usr/local/bin
CMD docker-exec.sh