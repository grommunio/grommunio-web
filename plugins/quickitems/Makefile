include ../shared.mk

JSFILES = js/AbstractQuickItemWidget.js js/QuickAppointmentWidget.js js/QuickContactWidget.js js/QuickMailWidget.js js/QuickNoteWidget.js js/QuickTaskWidget.js

COPYFILES = LICENSE.txt manifest.xml \
	$(wildcard resources/css/*.css resources/images/*.svg)
COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/quickitems.js

$(JSDEPLOY)/quickitems.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(JSDEPLOY)/quickitems-debug.js
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/js/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map \
		$(JSOPTIONS)
