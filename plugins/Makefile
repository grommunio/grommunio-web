SUBDIRS = chat desktopnotifications intranet mdm meet passwd safesenderssettings webappmanual 

.PHONY: subdirs $(SUBDIRS)

subdirs: $(SUBDIRS)

$(SUBDIRS):
	$(MAKE) DESTDIR=../../deploy/plugins/$@ -C $@

all: subdirs

clean:
