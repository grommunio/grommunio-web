FROM ubuntu:16.04

RUN apt-get update && apt-get install -y chromium-browser phpmd \
			ant ant-optional libxml2-utils gettext \
			openjdk-8-jdk php-xml php-zip php-common php-gettext \
			wget apt-transport-https gnupg2 make python
# Latest nodejs
RUN wget -qO- https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -
RUN echo "deb https://deb.nodesource.com/node_9.x xenial main" > /etc/apt/sources.list.d/node.list
RUN apt-get update && apt-get -y install nodejs

# Set timezone for JS unit tests
RUN ln -fs /usr/share/zoneinfo/Europe/Amsterdam /etc/localtime && \
dpkg-reconfigure -f noninteractive tzdata

# Add user
RUN useradd -m -u 109 jenkins

# Cleanup
RUN apt-get remove -y gnupg2 apt-transport-https wget
RUN apt-get clean -y && \
  apt-get autoclean -y && \
  apt-get autoremove -y && \
  rm -rf /usr/share/locale/* && \
  rm -rf /var/cache/debconf/*-old && \
  rm -rf /var/lib/apt/lists/* && \
  rm -rf /usr/share/doc/*
