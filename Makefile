# Tools

ANT ?= ant
PHPMD ?= phpmd
NPM ?= npm

# Files

POFILES = $(wildcard server/language/*/*/*.po)
PHPFILES = config.php.dist kopano.php $(wildcard server/includes/*.php) $(wildcard server/includes/*/*.php)
JSFILES = $(wildcard client/zarafa/*.js) $(wildcard client/zarafa/*/*.js)
CORE_FILES = $(POFILES) $(PHPFILES) $(JSFILES)


# Build

.PHONY: all
all: build


build: node_modules deploy
test: jstest


# TODO(jelle): add plugin file dependency's (or Makefile in plugins)
deploy: $(CORE_FILES)
	$(ANT) deploy
	# Ant doesn't update the deploy modification time
	touch $@

.PHONY: lint
lint: vendor
	$(NPM) run lint -- --cache

.PHONY: lintci
lintci: vendor
	$(NPM) run lint -- --quiet -f junit -o eslint.xml client/zarafa/ || true

.PHONY: jstest
jstest: build
	$(NPM) run jsunit

.PHONY: jstestci
jstestci: build
	$(NPM) run jsunit -- --reporters junit

.PHONY: jstestcov
jstestcov: build
	$(NPM) run jsunit -- --reporters coverage

open-coverage: jstestcov
	${BROWSER} test/js/coverage/report-html/index.html

.PHONY: phplint
phplint:
	$(PHPMD) server text .phpmd.xml

.PHONY: phplintcli
phplintci:
	$(PHPMD) server xml .phpmd.xml --ignore-violations-on-exit | python tools/violations_to_junit.py > phpmd.xml

# NPM

.PHONY: vendor
vendor: node_modules

node_modules:
	$(NPM) install

.PHONY: clean
clean:
	@rm -rf deploy
	@rm -rf node_modules
