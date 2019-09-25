
PHP ?= php
PHPUNIT ?= phpunit

debug.php: ../../debug.php.dist
	cp $^ $@

config.php: config.db.php.dist
	cp $^ $@

.PHONY: test
test: config.php debug.php
	touch debug.txt
	$(PHP) create_db_user.php
	$(PHPUNIT) -c webapp.xml

.PHONY: clean
clean:
	@rm -rf htmlcov
	@rm -rf webapp-phptests.xml
	@rm -rf coverage.xml
