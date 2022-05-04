#!/bin/sh

set -eu

GROMMUNIO_SOCKET=${GROMMUNIO_SOCKET:-file:///run/grommunio/server.sock}

if [ "$CI" -eq "1" ]; then
	if [ -x "$(command -v dockerize)" ]; then
		dockerize -wait $GROMMUNIO_SOCKET -timeout 60s
	fi
fi

echo "Sync users"
count=0
while true; do
	if grommunio-admin --sync; then
		break
	fi

	if [ "$count" -eq 10 ]; then
		exit 1
	fi

	count=$((count +1))
	sleep 1
done

grommunio-admin -l

# Create public store
grommunio-storeadm -h default: -P

echo 'Deploy grommunio Web'

make -C /workspace server
echo 'Running tests'

cd test/php/
phpunit -c webapp.xml
