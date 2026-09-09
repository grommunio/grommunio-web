SUBDIRS = ai archive chat desktopnotifications files filesbackendDefault filesbackendSeafile intranet kendox maps mdm meet passwd pgp smime templatesnippets

.PHONY: subdirs $(SUBDIRS)

subdirs: $(SUBDIRS)

DESTDIR ?= ../../deploy/plugins

$(SUBDIRS):
	$(MAKE) DESTDIR=$(DESTDIR)/$@ -C $@

all: subdirs

clean:
