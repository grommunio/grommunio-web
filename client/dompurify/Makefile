# Usage: 
#
# make update 
# make update TAG=tags/2.1.1
#
TAG ?= latest

URL = $(shell curl -sq https://api.github.com/repos/cure53/DOMPurify/releases/$(TAG)|jq -r .tarball_url)
VERSION = $(shell basename $(URL))

all:

.PHONY: update
update:
	echo $(VERSION)
	curl -L $(URL) | tar -C . --strip-components 2 --wildcards "*/dist/purify.js*" --wildcards "*/dist/purify.min.js*" -xzvf -
	@echo "# DOMPurify library\n\nTaken from $(URL)" > README.md
