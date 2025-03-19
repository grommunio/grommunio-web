SUBDIRS = archive chat desktopnotifications files filesbackendOwncloud intranet kendox maps mdm meet passwd smime

.PHONY: subdirs $(SUBDIRS)

subdirs: $(SUBDIRS)

$(SUBDIRS):
	$(MAKE) DESTDIR=../../deploy/plugins/$@ -C $@

all: subdirs

clean:
