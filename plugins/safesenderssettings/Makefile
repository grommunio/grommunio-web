include ../shared.mk

JSFILES = js/SafeSenders.js js/settings/SettingsSafesendersWidget.js

COPYFILES = LICENSE.txt manifest.xml \
	$(wildcard img/*.png)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/SafeSenders.js

$(JSDEPLOY)/SafeSenders.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(JSDEPLOY)/SafeSenders-debug.js
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/js/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map \
		$(JSOPTIONS)
