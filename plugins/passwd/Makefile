# SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
# SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
# SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
# SPDX-License-Identifier: AGPL-3.0-or-later

include ../shared.mk

JSFILES = js/PasswdPlugin.js \
	js/data/PasswdResponseHandler.js \
	js/external/PasswordMeter.js \
	js/settings/PasswdPanel.js \
	js/settings/SettingsPasswdCategory.js \
	js/settings/SettingsPasswdWidget.js

COPYFILES = manifest.xml config.php \
	$(wildcard resources/css/*.css) \
	$(wildcard resources/images/*.png) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/passwd.js

$(JSDEPLOY)/passwd.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "base='$(@D)',url='$(@F).map'" \
	        $(JSOPTIONS)
