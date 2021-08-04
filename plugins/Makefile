SUBDIRS = desktopnotifications filepreviewer intranet meet passwd safesenderssettings webappmanual

.PHONY: subdirs $(SUBDIRS)

subdirs: $(SUBDIRS)

$(SUBDIRS):
	$(MAKE) DESTDIR=../../deploy/plugins/$@ -C $@

all: subdirs

clean:
