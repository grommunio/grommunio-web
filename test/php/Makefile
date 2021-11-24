DOCKERCOMPOSE ?= docker-compose
DOCKERCOMPOSE_UP_ARGS ?=
DOCKERCOMPOSE_EXEC_ARGS ?=
EXTRA_LOCAL_ADMIN_USER ?=


PHP ?= php
PHPUNIT ?= phpunit

BUILD_TAG ?= $(shell date +%s)

export COMPOSE_PROJECT_NAME=webapp-php-test-$(BUILD_TAG)
export EXTRA_LOCAL_ADMIN_USER


debug.php: ../../debug.php.dist
	cp $^ $@

config.php: config.ldap.php.dist
	cp $^ $@


# CI

.PHONY: test
test: config.php debug.php
	touch debug.txt
	$(DOCKERCOMPOSE) up -d $(DOCKERCOMPOSE_UP_ARGS)
	$(DOCKERCOMPOSE) run $(DOCKERCOMPOSE_EXEC_ARGS) kopano_webapp_test /workspace/test/php/starttest.sh

.PHONY:  test-kopano-ci-clean
test-kopano-ci-clean:
	$(DOCKERCOMPOSE) down -v --rmi local || true

.PHONY: clean
clean:
	@rm -rf htmlcov
	@rm -rf webapp-phptests.xml
	@rm -rf coverage.xml
