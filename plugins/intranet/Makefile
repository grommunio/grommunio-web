include ../shared.mk

MSGFMT ?= msgfmt

JSFILES = js/IntranetPlugin.js \
		js/ui/ContentPanel.js \
		js/ui/Panel.js

COPYFILES = LICENSE.txt manifest.xml config.php \
	$(wildcard resources/css/*.css) \
	$(wildcard resources/icons/*.png) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/intranet.js

$(JSDEPLOY)/intranet.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(JSDEPLOY)/intranet-debug.js
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/js/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map \
		$(JSOPTIONS)
