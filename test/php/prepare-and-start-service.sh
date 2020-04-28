#!/bin/sh

# This script is the startup script for the kopano core container to be used
# when running the CI tests.

set -e

if [ -n "$EXTRA_LOCAL_ADMIN_USER" ]; then
	useradd \
		--no-create-home \
		--no-user-group \
		--uid $EXTRA_LOCAL_ADMIN_USER \
		testrunner || true
fi

exec /kopano/start-service.sh
