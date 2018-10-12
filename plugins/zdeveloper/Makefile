include ../shared.mk

JSFILES = js/ZDeveloper.js

COPYFILES = LICENSE.txt manifest.xml config.php \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/zdeveloper.js $(DESTDIR)/resources/css/zdeveloper.css

$(JSDEPLOY)/zdeveloper.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(JSDEPLOY)/zdeveloper-debug.js
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/js/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map \
		$(JSOPTIONS)

$(DESTDIR)/resources/css/zdeveloper.css: resources/css/zdeveloper-styles.css
	mkdir -p $(DESTDIR)/resources/css
	cp resources/css/zdeveloper-styles.css $(DESTDIR)/resources/css/zdeveloper.css
