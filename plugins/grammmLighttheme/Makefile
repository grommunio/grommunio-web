include ../shared.mk

COPYFILES = favicon.ico theme.json \
	$(wildcard img/*) \
	$(wildcard css/*)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST)

