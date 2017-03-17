#!/bin/bash

declare -r newlang=$1

update_translations () {
  potfile=$1
  lang=$2
  files=$3
  xgettext --no-location --omit-header --keyword=_ --keyword=_W --keyword=_TT -j -L $lang --keyword=dgettext:2 --keyword=ngettext:1,2 --keyword=dngettext:2,3 --keyword=pgettext:1c,2 --keyword=dpgettext:2c,3 --keyword=npgettext:1c,2,3 --keyword=dnpgettext:2c,3,4 --add-comments=TRANSLATORS --from-code utf-8 --files-from $files -o $potfile
}

update_potfile() {
  # Find JavaScript translations
  find client/zarafa plugins client/extjs-mod -type f -name '*.js' ! -path "./deploy/*" -printf '%p\n' | sort > /tmp/JSFILES
  update_translations $POT_FILE JavaScript /tmp/JSFILES # gettext 0.19.3 supports javascript, buildserver runs moldy debian wheezy.

  # Find PHP translations
  find . -type f -name '*.php' ! -path "./test/*" ! -path "./deploy/*" -printf '%P\n'   | sort > /tmp/PHPFILES
  update_translations $POT_FILE php /tmp/PHPFILES
}

POT_FILE=webapp.pot
# Clean up pot file if script aborted.
[ -e "$POT_FILE" ] && rm $POT_FILE

# Otherwise xgettext complains
touch $POT_FILE

update_potfile

if [ -z "${newlang}" ]; then
  # Merge PO files and remove obsolete strings
  for lang in server/language/*.UTF-8/LC_MESSAGES/zarafa_webapp.po; do
    echo $lang
    msgmerge -N -q $lang $POT_FILE | msgattrib --no-obsolete -o $lang.new && mv $lang.new $lang
  done
else
  # Create the server/language/${lang}/LC_MESSAGES/ directory
  langdir="server/language/${newlang}.UTF-8/LC_MESSAGES/"
  mkdir -p "${langdir}"
  touch "server/language/${newlang}.UTF-8/language.txt"

  # Create po file
  touch "${langdir}/zarafa_webapp.po"
  msgmerge -N -q "${langdir}/zarafa_webapp.po" $POT_FILE > "${langdir}/zarafa_webapp.po"
fi

rm $POT_FILE
