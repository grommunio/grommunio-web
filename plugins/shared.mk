JAVA ?= java

JSDEPLOY = $(DESTDIR)/js
JSCOMPILER ?= $(JAVA) -jar ../../tools/lib/compiler.jar

JSOPTIONS = --externs ../../client/externs.js \
	--compilation_level SIMPLE --warning_level VERBOSE --jscomp_off=es5Strict \
	--jscomp_off=globalThis --jscomp_off=misplacedTypeAnnotation --jscomp_off=nonStandardJsDocs \
	--jscomp_off=missingProperties --jscomp_off=invalidCasts --jscomp_off=checkTypes \
	--jscomp_warning=visibility --jscomp_warning=unknownDefines --jscomp_warning=undefinedVars \
	--jscomp_warning=strictModuleDepCheck --jscomp_warning=fileoverviewTags --jscomp_warning=deprecated \
	--jscomp_error=checkVars --jscomp_warning=checkRegExp --jscomp_warning=accessControls

$(DESTDIR)/%: %
	mkdir -p $$(dirname $@)
	cp $< $@

