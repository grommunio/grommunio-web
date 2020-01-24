include ../shared.mk

JSFILES = js/PimPlugin.js js/PimPluginSettingsWidget.js

COPYFILES = LICENSE.txt manifest.xml config.php \
	$(wildcard resources/css/*.css resources/icons/*.png) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/pimfolder.js

$(JSDEPLOY)/pimfolder.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(JSDEPLOY)/pimfolder-debug.js
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/js/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map \
		$(JSOPTIONS)
