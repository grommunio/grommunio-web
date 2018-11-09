include ../shared.mk

JSFILES = js/GmapsPlugin.js js/GmapsTab.js

COPYFILES = LICENSE.txt manifest.xml config.php \
	$(wildcard php/*.php) \
	$(wildcard md5/*.js)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/gmaps.js

$(JSDEPLOY)/gmaps.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(JSDEPLOY)/gmaps-debug.js
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/js/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map \
		$(JSOPTIONS)
