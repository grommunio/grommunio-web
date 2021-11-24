ARG docker_repo=kopano
ARG kopano_core_version=latest
FROM ${docker_repo}/kopano_core:${kopano_core_version}

WORKDIR /workspace/

RUN apt-get update && apt-get install --no-install-recommends -y \
	phpunit \
	php7-mapi \
	php-xdebug \
	make \
	libxml2-utils \
	gettext

# Note: this has to be updated every new PHP release
RUN echo 'include_path="${include_path}:/usr/share/php"' > /etc/php/7.3/cli/conf.d/20-phpunit.ini

CMD [ "/bin/true" ]
