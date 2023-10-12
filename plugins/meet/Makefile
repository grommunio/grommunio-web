include ../shared.mk

MSGFMT ?= msgfmt

JSFILES = js/addmeetingdialog.js \
          js/plugin.js \
          js/settings.js \
          js/tabpanel.js

COPYFILES = manifest.xml config.php \
	$(wildcard resources/css/*.css) \
	$(wildcard resources/icons/*.png) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/meet.js

$(JSDEPLOY)/meet.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)
