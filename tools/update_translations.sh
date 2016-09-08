#!/bin/bash

update_translations () {
  potfile=$1
  lang=$2
  files=$3
  xgettext --keyword=_ --keyword=_W --keyword=_TT -j -L $lang --keyword=dgettext:2 --keyword=ngettext:1,2 --keyword=dngettext:2,3 --keyword=pgettext:1c,2 --keyword=dpgettext:2c,3 --keyword=npgettext:1c,2,3 --keyword=dnpgettext:2c,3,4 --add-comments=TRANSLATORS --from-code utf-8 --files-from $files -o $potfile
}

POT_FILE=webapp.pot

# Clean up pot file if script aborted.
[ -e "$POT_FILE" ] && rm $POT_FILE

# Otherwise xgettext complains
touch $POT_FILE

# Find JavaScript translations
find client/zarafa plugins client/extjs-mod -type f -name '*.js' ! -path "./deploy/*" -printf '%p\n' | sort > /tmp/JSFILES
update_translations $POT_FILE JavaScript /tmp/JSFILES # gettext 0.19.3 supports javascript, buildserver runs moldy debian wheezy.

# Find PHP translations
find . -type f -name '*.php' ! -path "./test/*" ! -path "./deploy/*" -printf '%P\n'   | sort > /tmp/PHPFILES
update_translations $POT_FILE php /tmp/PHPFILES

# Merge PO files and remove obsolete strings
for lang in server/language/*.UTF-8/LC_MESSAGES/zarafa_webapp.po; do
  echo $lang
  msgmerge -q $lang $POT_FILE | msgattrib --no-obsolete -o $lang.new && mv $lang.new $lang
done

rm $POT_FILE
