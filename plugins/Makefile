SUBDIRS = contactfax folderwidgets gmaps pimfolder quickitems titlecounter webappmanual

.PHONY: subdirs $(SUBDIRS)

subdirs: $(SUBDIRS)

$(SUBDIRS):
	$(MAKE) DESTDIR=../../deploy/plugins/$@ -C $@

all: subdirs

clean:
