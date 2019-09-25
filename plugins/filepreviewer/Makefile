include ../shared.mk

MSGFMT ?= msgfmt

JSFILES = js/ABOUT.js js/FileviewerPlugin.js js/ViewerPanel.js

COPYFILES = LICENSE.txt manifest.xml config.php \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/filepreviewer.js

$(JSDEPLOY)/filepreviewer.js: $(JSFILES)
	rm -rf $(DESTDIR)/external
	cp -R external $(DESTDIR)/
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(JSDEPLOY)/filepreviewer-debug.js
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/js/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map \
		$(JSOPTIONS)
