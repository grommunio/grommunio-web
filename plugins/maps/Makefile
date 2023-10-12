include ../shared.mk

JSFILES = js/MapsPlugin.js js/MapsTab.js

COPYFILES = manifest.xml config.php \
        $(wildcard resources/css/*.css) \
        $(wildcard resources/css/images/*.png) \
        $(wildcard js/external/*.js) \
        $(wildcard js/external/*.js.map) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/maps.js

$(JSDEPLOY)/maps.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)
