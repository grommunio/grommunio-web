include ../shared.mk

JSFILES = js/crypto/BrowserCrypto.js \
          js/crypto/PgpMime.js \
          js/data/PgpResponseHandler.js \
          js/PgpUtils.js \
          js/dialogs/PgpDialogs.js \
          js/settings/SettingsPgpWidget.js \
          js/settings/SettingsPgpCategory.js \
          js/PgpTransport.js \
          js/PgpPlugin.js
VENDORFILES = resources/vendor/pgp-vendor.js resources/vendor/pgp-vendor.js.LEGAL.txt \
              resources/vendor/openpgp.LICENSE resources/vendor/postal-mime.LICENSE resources/vendor/fflate.LICENSE
COPYFILES = manifest.xml config.php $(wildcard php/*.php) $(wildcard resources/icons/*.svg) $(VENDORFILES)
CSSFILES = resources/css/pgp-styles.css
COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/pgp.js $(DESTDIR)/resources/css/pgp.css

$(VENDORFILES) &: ../../package-lock.json js/crypto/vendor.mjs ../../tools/build-pgp-vendor.mjs
	cd ../.. && node tools/build-pgp-vendor.mjs

$(JSDEPLOY)/pgp.js: $(JSFILES)
	mkdir -p $(JSDEPLOY)
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "base='$(@D)',url='$(@F).map'" $(JSOPTIONS)

$(DESTDIR)/resources/css/pgp.css: $(CSSFILES)
	mkdir -p $(@D)
	cp $< $@
