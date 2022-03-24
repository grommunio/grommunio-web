include ../shared.mk

JSFILES = js/MapsPlugin.js js/MapsTab.js

COPYFILES = LICENSE.txt manifest.xml config.php \
        $(wildcard resources/css/*.css) \
        $(wildcard resources/css/images/*.png) \
        $(wildcard js/external/*.css) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/maps.js

$(JSDEPLOY)/maps.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(JSDEPLOY)/maps-debug.js
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/js/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map \
		$(JSOPTIONS)
