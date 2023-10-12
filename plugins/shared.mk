JAVA ?= java

JSDEPLOY = $(DESTDIR)/js
JSCOMPILER ?= node_modules/terser/bin/terser

JSOPTIONS = --mangle reserved=['FormData','Ext','Zarafa','container','settings','properties','languages','serverconfig','user','version','urlActionData','console','Tokenizr','module','define','global','require','proxy','_','dgettext','dngettext','dnpgettext','ngettext','pgettext','onResize','tinymce','resizeLoginBox','userManager','DOMPurify','PDFJS','odf','L','GeoSearch'] \
            --compress ecma=2015,computed_props=false

$(DESTDIR)/%: %
	mkdir -p $$(dirname $@)
	cp $< $@

