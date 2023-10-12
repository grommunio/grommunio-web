include ../shared.mk

MSGFMT ?= msgfmt

JSFILES = js/IntranetPlugin.js \
		js/ui/ContentPanel.js \
		js/ui/Panel.js

COPYFILES = manifest.xml config.php \
	$(wildcard resources/css/*.css) \
	$(wildcard resources/icons/*.png) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/intranet.js

$(JSDEPLOY)/intranet.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)
