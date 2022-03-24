SUBDIRS = chat desktopnotifications intranet mdm meet passwd maps files filesbackendOwncloud

.PHONY: subdirs $(SUBDIRS)

subdirs: $(SUBDIRS)

$(SUBDIRS):
	$(MAKE) DESTDIR=../../deploy/plugins/$@ -C $@

all: subdirs

clean:
