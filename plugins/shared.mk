# SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
# SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
# SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
# SPDX-License-Identifier: AGPL-3.0-or-later

JSDEPLOY = $(DESTDIR)/js
JSCOMPILER ?= ../../node_modules/terser/bin/terser

JSOPTIONS = --mangle reserved=['FormData','Ext','Grommunio','container','settings','properties','languages','serverconfig','user','version','urlActionData','console','Tokenizr','module','define','global','require','proxy','_','dgettext','dngettext','dnpgettext','ngettext','pgettext','onResize','tinymce','resizeLoginBox','userManager','DOMPurify','PDFJS','odf','L','GeoSearch'] \
            --compress ecma=2015,computed_props=false

$(DESTDIR)/%: %
	mkdir -p $$(dirname $@)
	cp $< $@

