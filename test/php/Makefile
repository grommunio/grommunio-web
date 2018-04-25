
PHP ?= php
PHPUNIT ?= phpunit


config.php: config.db.php.dist
	cp $^ $@

.PHONY: test
test: config.php
	$(PHP) create_db_user.php
	$(PHPUNIT) -c webapp.xml

.PHONY: clean
clean:
	@rm -rf htmlcov
