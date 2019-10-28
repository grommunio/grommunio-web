#!/bin/sh

set -eu

KOPANO_SOCKET=${KOPANO_SOCKET:-file:///run/kopano/server.sock}

if [ "$CI" -eq "1" ]; then
	if [ -x "$(command -v dockerize)" ]; then
		dockerize -wait $KOPANO_SOCKET -timeout 60s
	fi
fi

echo "Sync users"
count=0
while true; do
	if kopano-admin --sync; then
		break
	fi

	if [ "$count" -eq 10 ]; then
		exit 1
	fi

	count=$((count +1))
	sleep 1
done

kopano-admin -l

# Create public store
kopano-storeadm -h default: -P

echo 'Deploy WebApp'

make -C /workspace server
echo 'Running tests'

cd test/php/
phpunit -c webapp.xml
