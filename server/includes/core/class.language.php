<?php

/**
 * Broken-down representation of an XPG locale identifier
 * (language[_territory][.codeset][@modifier]), after gromox lib/string.cpp.
 */
class XpgLocale {
	public string $language = "";
	public string $territory = "";
	public string $codeset = "";
	public string $modifier = "";

	public function __construct(string $locale) {
		$pos = strpos($locale, '@');
		if ($pos !== false) {
			$this->modifier = substr($locale, $pos + 1);
			$locale = substr($locale, 0, $pos);
		}
		$pos = strpos($locale, '.');
		if ($pos !== false) {
			$this->codeset = substr($locale, $pos + 1);
			$locale = substr($locale, 0, $pos);
		}
		$pos = strpos($locale, '_');
		if ($pos !== false) {
			$this->territory = substr($locale, $pos + 1);
			$locale = substr($locale, 0, $pos);
		}
		$this->language = $locale;
	}

	public function __toString(): string {
		return $this->toString('_');
	}

	/**
	 * @param string $tsep separator between language and territory
	 */
	public function toString($tsep): string {
		$o = $this->language;
		if ($o === '') {
			return $o;
		}
		if ($this->territory !== '') {
			$o .= $tsep . $this->territory;
		}
		if ($this->codeset !== '') {
			$o .= '.' . $this->codeset;
		}
		if ($this->modifier !== '') {
			$o .= '@' . $this->modifier;
		}

		return $o;
	}
}

/**
 * Language handling class.
 */
class Language {
	// Key and size of the shared memory segment the parsed translations live in.
	private const CACHE_KEY = 0x950412DE;
	private const CACHE_SIZE = 16 * 1024 * 1024;

	private $languages = ["en_US" => "English"];
	private $lang;
	private $loaded = false;

	/**
	 * Default constructor.
	 *
	 * By default, the Language class only knows about en_GB (English). If you want more languages, you
	 * must call loadLanguages().
	 */
	public function __construct() {}

	/**
	 * Loads languages from disk.
	 *
	 * loadLanguages() reads the languages from disk by reading LANGUAGE_DIR and opening all directories
	 * in that directory. Each directory must contain a 'language.txt' file containing:
	 *
	 * <language display name>
	 * <win32 language name>
	 *
	 * For example:
	 * <code>
	 * Nederlands
	 * nld_NLD
	 * </code>
	 *
	 * Also, the directory names must be XPG locale identifiers without a
	 * codeset that are available to the server's locale system, for example nl_NL.
	 */
	public function loadLanguages() {
		if ($this->loaded) {
			return;
		}

		// Older configurations still list the languages with a codeset
		$languages = [];
		foreach (explode(";", ENABLED_LANGUAGES) as $language) {
			$language = new XpgLocale($language);
			$language->codeset = "";
			$languages[] = (string) $language;
		}
		$dh = opendir(LANGUAGE_DIR);
		while (($entry = readdir($dh)) !== false) {
			if (in_array($entry, $languages)) {
				if (is_dir(LANGUAGE_DIR . $entry . "/LC_MESSAGES") && is_file(LANGUAGE_DIR . $entry . "/language.txt")) {
					$fh = fopen(LANGUAGE_DIR . $entry . "/language.txt", "r");
					$lang_title = fgets($fh);
					fclose($fh);
					$lang_title = trim($lang_title);
					// Names in other scripts get the English name next to them, so
					// the entry stays readable without a font for that script
					if (class_exists('Locale') && !preg_match('/\\p{Latin}/u', $lang_title)) {
						$english = Locale::getDisplayLanguage($entry, 'en');
						if (!empty($english) && $english !== $entry) {
							$lang_title .= " ({$english})";
						}
					}
					$this->languages[$entry] = "{$entry}: " . $lang_title;
				}
			}
		}
		asort($this->languages, SORT_LOCALE_STRING);
		$this->loaded = true;
	}

	/**
	 * Attempt to set language.
	 *
	 * setLanguage attempts to set the language to the specified language. The language passed
	 * is the name of the directory containing the language.
	 *
	 * For setLanguage() to succeed, the language has to have been loaded via loadLanguages() AND
	 * the gettext system must 'know' the language specified.
	 *
	 * @param string $lang XPG locale identifier (eg nl_NL)
	 */
	public function setLanguage($lang) {
		if (isset($GLOBALS['translations'])) {
			return;
		}
		$lang = (empty($lang) || str_starts_with($lang, '.') || $lang == "C") ? LANG : $lang; // default language fix

		$selected = $this->findLanguage($lang);
		if ($selected === false) {
			error_log(sprintf("setLanguage: no translations present for \"%s\"", $lang));
			$this->resetLocale();

			return;
		}
		$this->lang = $selected;
		$this->bindTextDomain($selected);
		$tmp_translations = $this->getTranslations();
		$translations = [];
		foreach ($tmp_translations as $program => $resources) {
			if (substr($program, 0, 1) == '_') {
				continue;
			}
			$resourcesCount = count($resources);
			for ($i = 0; $i < $resourcesCount; ++$i) {
				$msgid = $resources[$i]['msgid'];
				if (isset($msgid)) {
					$translations[$msgid] = $resources[$i]['msgstr'];
				}
			}
		}
		$GLOBALS['translations'] = $translations;
	}

	/**
	 * Match a locale identifier request to a directory in LANGUAGE_DIR.
	 *
	 * @param string $lang XPG locale identifier
	 *
	 * @return bool|XpgLocale the locale naming the directory, or false if none matches
	 */
	private function findLanguage($lang) {
		$p = new XpgLocale($lang);

		// Directory names never contain a codeset
		$p->codeset = "";
		if (is_dir(LANGUAGE_DIR . "/{$p}")) {
			return $p;
		}

		// Try from most specific to least specific
		$p->modifier = "";
		if (is_dir(LANGUAGE_DIR . "/{$p}")) {
			return $p;
		}
		$p->territory = "";
		if (is_dir(LANGUAGE_DIR . "/{$p}")) {
			return $p;
		}

		// PR_EC_USER_LANGUAGE may be a bare language code, which has no directory of
		// its own; prefer the administrator's territory of it, then the usual one.
		$base = strtolower($p->language);
		$aliases = ['no' => 'nb', 'in' => 'id', 'iw' => 'he', 'tl' => 'fil'];
		$base = $aliases[$base] ?? $base;
		if (!preg_match('/^[a-z]{2,3}$/', $base)) {
			return false;
		}
		$admin = new XpgLocale(LANG);
		$admin->codeset = "";
		if (strtolower($admin->language) === $base && is_dir(LANGUAGE_DIR . "/{$admin}")) {
			return $admin;
		}
		$candidates = glob(LANGUAGE_DIR . '/' . $base . '_' . strtoupper($base)) ?: glob(LANGUAGE_DIR . '/' . $base . '_*') ?: [];
		sort($candidates);
		if (!empty($candidates)) {
			return new XpgLocale(basename($candidates[0]));
		}

		return false;
	}

	/**
	 * @param string $lang XPG locale identifier
	 *
	 * @return bool true if translations for the language are installed
	 */
	public function isLanguage($lang) {
		return $this->findLanguage($lang) !== false;
	}

	/**
	 * Bind the gettext text domain for the given language.
	 *
	 * The JavaScript client receives its translation table from
	 * getTranslations(). Templates, modules and plugins output strings
	 * through gettext directly, which needs the text domain bound.
	 *
	 * @param XpgLocale $lang
	 */
	private function bindTextDomain($lang) {
		if (!function_exists('bindtextdomain') || !defined('LC_MESSAGES')) {
			return;
		}
		// No failure below may leave another request's language active in this worker.
		$this->resetLocale();

		// bindtextdomain() resolves a relative path against the working directory at
		// lookup time, which is not ours to rely on, so hand it an absolute one.
		$dir = realpath(LANGUAGE_DIR);
		if ($dir === false) {
			return;
		}

		// LC_CTYPE is set elsewhere!

		$lang = clone $lang;
		$lang->codeset = "UTF-8";
		if (setlocale(LC_MESSAGES, $lang) === false) {
			return;
		}

		bindtextdomain('grommunio_web', $dir);
		bind_textdomain_codeset('grommunio_web', 'UTF-8');
		textdomain('grommunio_web');
	}

	/**
	 * Return the process to the untranslated state. The locale is process-wide and a
	 * PHP-FPM worker outlives the request, so one request's language would otherwise
	 * still be active in the next one, served to a different user. LANGUAGE is
	 * cleared because glibc consults it before LC_MESSAGES. It must never be set per
	 * user, as glibc does not notice a changed LANGUAGE within the same process.
	 */
	private function resetLocale() {
		if (!function_exists('bindtextdomain') || !defined('LC_MESSAGES')) {
			return;
		}
		setlocale(LC_MESSAGES, 'C');
		putenv('LANGUAGE=');
	}

	public static function getstring($string) {
		if (isset($GLOBALS['translations'], $GLOBALS['translations'][$string])) {
			return $GLOBALS['translations'][$string];
		}

		return $string;
	}

	/**
	 * Return a list of supported languages.
	 *
	 * Returns an associative array in the format langid -> langname, for example "nl_NL.utf8" -> "Nederlands"
	 *
	 * @return array List of supported languages
	 */
	public function getLanguages() {
		$this->loadLanguages();

		return $this->languages;
	}

	/**
	 * Returns the $getLanguages and formats in JSON so it can be parsed
	 * by the javascript.
	 *
	 * @return string The javascript string
	 */
	public function getJSON() {
		$json = [];
		$languages = $this->getLanguages();
		foreach ($languages as $key => $lang) {
			$json[] = [
				"lang" => $key,
				"name" => $lang,
			];
		}

		return json_encode($json);
	}

	/**
	 * @return null|XpgLocale the selected language, null if none is set
	 */
	public function getSelected() {
		return $this->lang;
	}

	/**
	 * @return string the selected language in RFC 5646 notation
	 */
	public function getSelectedIetf() {
		$l = clone $this->lang;
		$l->codeset = $l->modifier = "";

		return $l->toString('-');
	}

	/**
	 * Populate the shared memory segment with all translations and yield
	 * the translations of the currently selected language.
	 */
	public function getTranslations() {
		$selected_lang = (string) $this->getSelected();
		$memid = @shm_attach(self::CACHE_KEY, self::CACHE_SIZE, 0644);
		if ($memid && @shm_has_var($memid, 0)) {
			$cache_table = @shm_get_var($memid, 0);
			// An empty array is a valid table: a host without compiled catalogs
			// would otherwise destroy and rebuild the segment on every request.
			if (is_array($cache_table)) {
				if (!empty($cache_table[$selected_lang])) {
					$translations = @shm_get_var($memid, $cache_table[$selected_lang]);
					if (!empty($translations)) {
						@shm_detach($memid);

						return $translations;
					}

					/*
					 * The table promises a payload the segment does not hold, so the
					 * write behind it failed unnoticed - running out of room in the
					 * segment does that. Dropping only the table would leave every
					 * payload allocated, so the rebuild would run out of room again
					 * and again while still advertising its entries, and this language
					 * would stay untranslated until the segment is removed by hand.
					 */
					$memid = $this->resetCache($memid);

					return $this->buildTranslations($memid);
				}

				/*
				 * A usable table that simply does not list this language. Read it from
				 * disk rather than rebuilding: a rebuild would write a second copy of
				 * every other language into a segment that already holds them.
				 */
				@shm_detach($memid);

				return $this->selectedTranslations($this->parseLanguage($selected_lang));
			}
			// The table itself is unusable, for instance left behind by another PHP
			// version, whose serialized data this one cannot read back.
			$memid = $this->resetCache($memid);
		}

		return $this->buildTranslations($memid);
	}

	/**
	 * Discard the translation cache in its entirety and start a new one.
	 *
	 * shm_remove_var() frees a single variable, which is not enough once the segment
	 * is in a state the code cannot read: the payloads stay allocated and the next
	 * rebuild has nowhere to put its own. Removing the segment releases everything.
	 *
	 * @param resource|SysvSharedMemory $memid the segment to discard
	 *
	 * @return bool|resource|SysvSharedMemory a fresh segment, or false without one
	 */
	private function resetCache($memid) {
		@shm_remove($memid);
		@shm_detach($memid);

		return @shm_attach(self::CACHE_KEY, self::CACHE_SIZE, 0644);
	}

	/**
	 * Read every installed language from disk, caching what fits in the segment.
	 *
	 * @param bool|resource|SysvSharedMemory $memid the segment to fill, or false to skip caching
	 *
	 * @return array the translations for the selected language
	 */
	private function buildTranslations($memid) {
		$handle = opendir(LANGUAGE_DIR);
		if ($handle === false) {
			error_log(sprintf("Cannot read translations from '%s'", LANGUAGE_DIR));
			if ($memid) {
				@shm_detach($memid);
			}

			return ['grommunio_web' => []];
		}
		$last_id = 1;
		$cache_table = [];
		$ret_val = false;
		while (false !== ($entry = readdir($handle))) {
			if (strcmp($entry, ".") == 0 ||
				strcmp($entry, "..") == 0) {
				continue;
			}
			$translations = $this->parseLanguage($entry);
			if ($translations === false) {
				continue;
			}
			// Answer this request from what was just read, whether or not it caches.
			if (strcmp($entry, (string) $this->getSelected()) == 0) {
				$ret_val = $translations;
			}
			if (!$memid) {
				continue;
			}
			// Advertise only what the segment really holds. An entry pointing at a
			// payload that failed to store makes every later request resolve it to
			// nothing, which is served as an untranslated interface.
			if (@shm_put_var($memid, $last_id, $translations)) {
				$cache_table[$entry] = $last_id;
				++$last_id;
			}
		}
		closedir($handle);
		if ($memid) {
			@shm_put_var($memid, 0, $cache_table);
			@shm_detach($memid);
		}

		return $this->selectedTranslations($ret_val);
	}

	/**
	 * Read one language's translations, including those of the plugins.
	 *
	 * @param string $entry name of the directory in LANGUAGE_DIR
	 *
	 * @return array|bool the translations per domain, or false if there are none
	 */
	private function parseLanguage($entry) {
		$file = LANGUAGE_DIR . $entry . '/LC_MESSAGES/grommunio_web.mo';
		$translations = [];
		$translations['grommunio_web'] = $this->getTranslationsFromFile($file);
		if (!$translations['grommunio_web']) {
			return false;
		}
		$etag = [$entry, @filemtime($file), @filesize($file)];
		if (isset($GLOBALS['PluginManager'])) {
			// What we did above, we are also now going to do for each plugin that has translations.
			$pluginTranslationPaths = $GLOBALS['PluginManager']->getTranslationFilePaths();
			foreach ($pluginTranslationPaths as $pluginname => $path) {
				$pluginFile = $path . '/' . $entry . '/LC_MESSAGES/plugin_' . $pluginname . '.mo';
				$plugin_translations = $this->getTranslationsFromFile($pluginFile);
				if ($plugin_translations) {
					$translations['plugin_' . $pluginname] = $plugin_translations;
					$etag[] = $pluginname . '@' . @filemtime($pluginFile);
				}
			}
		}
		// Derived from the files rather than the clock, so a language served from
		// disk keeps a stable Etag and clients can still revalidate with 304.
		$translations['_etag'] = 'M' . md5(implode('|', $etag));

		return $translations;
	}

	/**
	 * Hand back the translations that were found, and say so when there are none.
	 *
	 * An empty set means the entire interface falls back to its English msgids, which
	 * is worth a line in the log: it is otherwise indistinguishable from a user who
	 * selected English, and the .mo files themselves are usually fine.
	 *
	 * @param array|bool $translations the translations found for the selected language
	 *
	 * @return array
	 */
	private function selectedTranslations($translations) {
		if (!empty($translations)) {
			return $translations;
		}
		error_log(sprintf("No translations available for language '%s'", (string) $this->getSelected()));

		return ['grommunio_web' => []];
	}

	/**
	 * getTranslationsFromFile.
	 *
	 * This file reads the translations from the binary .mo file and returns
	 * them in an array containing the original and the translation variant.
	 * The .mo file format is described on the following URL.
	 * http://www.gnu.org/software/gettext/manual/gettext.html#MO-Files
	 *
	 *          byte
	 *               +------------------------------------------+
	 *            0  | magic number = 0x950412de                |
	 *               |                                          |
	 *            4  | file format revision = 0                 |
	 *               |                                          |
	 *            8  | number of strings                        |  == N
	 *               |                                          |
	 *           12  | offset of table with original strings    |  == O
	 *               |                                          |
	 *           16  | offset of table with translation strings |  == T
	 *               |                                          |
	 *           20  | size of hashing table                    |  == S
	 *               |                                          |
	 *           24  | offset of hashing table                  |  == H
	 *               |                                          |
	 *               .                                          .
	 *               .    (possibly more entries later)         .
	 *               .                                          .
	 *               |                                          |
	 *            O  | length & offset 0th string  ----------------.
	 *        O + 8  | length & offset 1st string  ------------------.
	 *                ...                                    ...   | |
	 *  O + ((N-1)*8)| length & offset (N-1)th string           |  | |
	 *               |                                          |  | |
	 *            T  | length & offset 0th translation  ---------------.
	 *        T + 8  | length & offset 1st translation  -----------------.
	 *                ...                                    ...   | | | |
	 *  T + ((N-1)*8)| length & offset (N-1)th translation      |  | | | |
	 *               |                                          |  | | | |
	 *            H  | start hash table                         |  | | | |
	 *                ...                                    ...   | | | |
	 *    H + S * 4  | end hash table                           |  | | | |
	 *               |                                          |  | | | |
	 *               | NUL terminated 0th string  <----------------' | | |
	 *               |                                          |    | | |
	 *               | NUL terminated 1st string  <------------------' | |
	 *               |                                          |      | |
	 *                ...                                    ...       | |
	 *               |                                          |      | |
	 *               | NUL terminated 0th translation  <---------------' |
	 *               |                                          |        |
	 *               | NUL terminated 1st translation  <-----------------'
	 *               |                                          |
	 *                ...                                    ...
	 *               |                                          |
	 *               +------------------------------------------+
	 *
	 * @param $filename string Name of the .mo file.
	 *
	 * @return array|bool false when file is missing otherwise array with
	 *                    translations
	 */
	public function getTranslationsFromFile($filename) {
		if (!is_file($filename)) {
			return false;
		}

		$fp = fopen($filename, 'r');
		if (!$fp) {
			return false;
		}

		// Get number of strings in .mo file
		fseek($fp, 8, SEEK_SET);
		$num_of_str = unpack('Lnum', fread($fp, 4));
		$num_of_str = $num_of_str['num'];

		// Get offset to table with original strings
		fseek($fp, 12, SEEK_SET);
		$offset_orig_tbl = unpack('Loffset', fread($fp, 4));
		$offset_orig_tbl = $offset_orig_tbl['offset'];

		// Get offset to table with translation strings
		fseek($fp, 16, SEEK_SET);
		$offset_transl_tbl = unpack('Loffset', fread($fp, 4));
		$offset_transl_tbl = $offset_transl_tbl['offset'];

		// The following arrays will contain the length and offset of the strings
		$data_orig_strs = [];
		$data_transl_strs = [];

		/*
		 * Get the length and offset to the original strings by using the table
		 * with original strings
		 */
		// Set pointer to start of orig string table
		fseek($fp, $offset_orig_tbl, SEEK_SET);
		for ($i = 0; $i < $num_of_str; ++$i) {
			// Length 4 bytes followed by offset 4 bytes
			$length = unpack('Llen', fread($fp, 4));
			$offset = unpack('Loffset', fread($fp, 4));
			$data_orig_strs[$i] = ['length' => $length['len'], 'offset' => $offset['offset']];
		}

		/*
		 * Get the length and offset to the translation strings by using the table
		 * with translation strings
		 */
		// Set pointer to start of translations string table
		fseek($fp, $offset_transl_tbl, SEEK_SET);
		for ($i = 0; $i < $num_of_str; ++$i) {
			// Length 4 bytes followed by offset 4 bytes
			$length = unpack('Llen', fread($fp, 4));
			$offset = unpack('Loffset', fread($fp, 4));
			$data_transl_strs[$i] = ['length' => $length['len'], 'offset' => $offset['offset']];
		}

		// This array will contain the actual original and translation strings
		$translation_data = [];

		// Get the original strings using the length and offset
		for ($i = 0, $len = count($data_orig_strs); $i < $len; ++$i) {
			$translation_data[$i] = [];

			// Set pointer to the offset of the string
			fseek($fp, $data_orig_strs[$i]['offset'], SEEK_SET);

			// Set default values for context and plural forms
			$translation_data[$i]['msgctxt'] = false;
			$translation_data[$i]['msgid_plural'] = false;

			if ($data_orig_strs[$i]['length'] > 0) {	// fread does not accept length=0
				$length = $data_orig_strs[$i]['length'];
				$orig_str = unpack('a' . $length . 'str', fread($fp, $length));
				$translation_data[$i]['msgid'] = $orig_str['str'];	// unpack converts to array :S

				// Find context in the original string
				if (str_contains((string) $translation_data[$i]['msgid'], "\004")) {
					$contextSplit = explode("\004", (string) $translation_data[$i]['msgid']);
					$translation_data[$i]['msgctxt'] = $contextSplit[0];
					$translation_data[$i]['msgid'] = $contextSplit[1];
				}
				// Find plural forms in the original string
				if (str_contains((string) $translation_data[$i]['msgid'], "\0")) {
					$original = explode("\0", (string) $translation_data[$i]['msgid']);
					$translation_data[$i]['msgid'] = $original[0];
					$translation_data[$i]['msgid_plural'] = $original[1];
				}
			}
			else {
				$translation_data[$i]['msgid'] = '';
			}
		}

		// Get the translation strings using the length and offset
		for ($i = 0, $len = count($data_transl_strs); $i < $len; ++$i) {
			// Set pointer to the offset of the string
			fseek($fp, $data_transl_strs[$i]['offset'], SEEK_SET);
			if ($data_transl_strs[$i]['length'] > 0) {	// fread does not accept length=0
				$length = $data_transl_strs[$i]['length'];
				$trans_str = unpack('a' . $length . 'str', fread($fp, $length));
				$translation_data[$i]['msgstr'] = $trans_str['str'];	// unpack converts to array :S

				// If there are plural forms in the source string,
				// then the translated string must contain plural
				// forms as well.  We cannot depend on a \0 being
				// present at all times, because languages that
				// have only one plural form won't have this
				// (e.g. Japanese)
				if ($translation_data[$i]['msgid_plural'] !== false) {
					$translation_data[$i]['msgstr'] = explode("\0", (string) $translation_data[$i]['msgstr']);
				}
			}
			else {
				$translation_data[$i]['msgstr'] = '';
			}
		}

		return $translation_data;
	}
}
