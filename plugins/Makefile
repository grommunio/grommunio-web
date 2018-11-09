SUBDIRS = contactfax folderwidgets gmaps pimfolder quickitems titlecounter webappmanual zdeveloper

.PHONY: subdirs $(SUBDIRS)

subdirs: $(SUBDIRS)

$(SUBDIRS):
	$(MAKE) DESTDIR=../../deploy/plugins/$@ -C $@

all: subdirs

clean:
