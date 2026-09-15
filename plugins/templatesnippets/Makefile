# SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later

include ../shared.mk

JSFILES = js/TemplateSnippetsPlugin.js \
          js/TemplateSnippetsResponseHandler.js \
          js/settings/SettingsTemplateSnippetsCategory.js \
          js/settings/SettingsTemplateSnippetsWidget.js

COPYFILES = manifest.xml config.php \
	$(wildcard resources/css/*.css) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/templatesnippets.js

$(JSDEPLOY)/templatesnippets.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "base='$(@D)',url='$(@F).map'" \
	        $(JSOPTIONS)
