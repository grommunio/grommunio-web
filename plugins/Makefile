SUBDIRS = desktopnotifications filepreviewer intranet passwd safesenderssettings webappmanual

.PHONY: subdirs $(SUBDIRS)

subdirs: $(SUBDIRS)

$(SUBDIRS):
	$(MAKE) DESTDIR=../../deploy/plugins/$@ -C $@

all: subdirs

clean:
