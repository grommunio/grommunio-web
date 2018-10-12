include ../shared.mk

JSFILES = js/AbstractFolderWidget.js js/AppointmentsWidget.js js/MailWidget.js js/TasksWidget.js

COPYFILES = LICENSE.txt manifest.xml \
	$(wildcard resources/css/*.css resources/images/*.svg) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/folderwidgets.js

$(JSDEPLOY)/folderwidgets.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(JSDEPLOY)/folderwidgets-debug.js
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/js/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map \
		$(JSOPTIONS)
