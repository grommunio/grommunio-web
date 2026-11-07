# SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
# SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
# SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
# SPDX-License-Identifier: AGPL-3.0-or-later

SUBDIRS = ai archive chat desktopnotifications files filesbackendDefault filesbackendSeafile intranet kendox maps mdm meet passkey passwd pgp smime templatesnippets

.PHONY: subdirs $(SUBDIRS)

subdirs: $(SUBDIRS)

DESTDIR ?= ../../deploy/plugins

$(SUBDIRS):
	$(MAKE) DESTDIR=$(DESTDIR)/$@ -C $@

all: subdirs

clean:
