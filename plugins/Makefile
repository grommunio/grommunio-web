SUBDIRS = ai archive chat desktopnotifications files filesbackendDefault filesbackendSeafile google2fa intranet kendox maps mdm meet passwd smime templatesnippets

.PHONY: subdirs $(SUBDIRS)

subdirs: $(SUBDIRS)

$(SUBDIRS):
	$(MAKE) DESTDIR=../../deploy/plugins/$@ -C $@

all: subdirs

clean:
