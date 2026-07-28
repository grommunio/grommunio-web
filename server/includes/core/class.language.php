<?php

/**
 * Language handling class.
 */
class Language {
	// Key and size of the shared memory segment the parsed translations live in.
	private const CACHE_KEY = 0x950412DE;
	private const CACHE_SIZE = 16 * 1024 * 1024;

	private $languages = ["en_US.UTF-8" => "English"];
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
	 * Also, the directory names must have a name that is:
	 * 1. Available to the server's locale system
	 * 2. In the UTF-8 charset
	 *
	 * For example, nl_NL.UTF-8
	 */
	public function loadLanguages() {
		if ($this->loaded) {
			return;
		}

		$languages = explode(";", ENABLED_LANGUAGES);
		$dh = opendir(LANGUAGE_DIR);
		while (($entry = readdir($dh)) !== false) {
			$langcode = str_ireplace(".UTF-8", "", $entry);
			if (in_array($langcode, $languages) || in_array($entry, $languages)) {
				if (is_dir(LANGUAGE_DIR . $entry . "/LC_MESSAGES") && is_file(LANGUAGE_DIR . $entry . "/language.txt")) {
					$fh = fopen(LANGUAGE_DIR . $entry . "/language.txt", "r");
					$lang_title = fgets($fh);
					fclose($fh);
					$this->languages[$entry] = "{$langcode}: " . trim($lang_title);
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
	 * @param string $lang Language code (eg nl_NL.UTF-8)
	 */
	public function setLanguage($lang) {
		if (isset($GLOBALS['translations'])) {
			return;
		}
		$lang = (empty($lang) || str_starts_with($lang, '.') || $lang == "C") ? LANG : $lang; // default language fix

		$available = $this->findLanguage($lang);
		if ($available === false) {
			error_log(sprintf("Unknown language: '%s'", $lang));
			$this->resetLocale();

			return;
		}
		if ($available !== $lang) {
			error_log(sprintf("Unknown language: '%s', falling back to '%s'", $lang, $available));
		}

		$this->lang = $available;
		$this->bindTextDomain($available);
		$tmp_translations = $this->getTranslations();
		$translations = [];
		foreach ($tmp_translations as $program => $resources) {
			if (substr($program, 0, 1) == '_')
				continue;
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
	 * Find an installed language directory for the requested language.
	 *
	 * The requested language does not always name a directory in LANGUAGE_DIR. gromox
	 * hands out PR_EC_USER_LANGUAGE as the `users.lang` column with ".UTF-8" appended,
	 * so a bare language code stored there - "de" rather than "de_DE" - arrives here as
	 * "de.UTF-8", for which no directory exists. Dropping such a value means serving a
	 * client with an empty translation set, i.e. an entirely English interface, and
	 * PR_EC_USER_LANGUAGE re-imposes the value on every login until the user explicitly
	 * re-picks a language in Settings, which writes the choice back to it. Prefer a
	 * territory variant of the same language over that.
	 *
	 * @param string $lang Language code (eg nl_NL.UTF-8)
	 *
	 * @return bool|string the language to use, or false if none is installed
	 */
	private function findLanguage($lang) {
		if ($this->is_language($lang)) {
			return $lang;
		}

		$resolved = self::resolveLanguage($lang);
		if ($resolved !== $lang && $this->is_language($resolved)) {
			return $resolved;
		}

		// Any variant of the same language beats English. Try the territory that
		// repeats the language code first ("de" -> "de_DE"), which is the usual
		// spelling, and settle for the first one installed otherwise.
		$base = strstr($lang, '_', true);
		if ($base === false) {
			$base = stristr($lang, '.', true);
		}
		if ($base === false) {
			$base = $lang;
		}
		if (preg_match('/^[a-z]{2,3}$/i', $base)) {
			$base = strtolower($base);
			// Legacy ISO 639 codes; the directories use the modern spelling.
			$aliases = ['no' => 'nb', 'in' => 'id', 'iw' => 'he', 'tl' => 'fil'];
			$base = $aliases[$base] ?? $base;
			// The language configured by the administrator wins when it is a variant
			// of the same language, so its territory is not silently overruled.
			if (strcasecmp($base, (string) strstr(LANG, '_', true)) == 0 && $this->is_language(LANG)) {
				return LANG;
			}
			$candidates = glob(LANGUAGE_DIR . $base . '_' . strtoupper($base) . '.UTF-8') ?: [];
			if (empty($candidates)) {
				$candidates = glob(LANGUAGE_DIR . $base . '_*.UTF-8') ?: [];
				sort($candidates);
			}
			if (!empty($candidates)) {
				return basename($candidates[0]);
			}
		}

		return $this->is_language(LANG) ? LANG : false;
	}

	/**
	 * Bind the gettext text domain for the given language.
	 *
	 * The JavaScript client receives its strings from getTranslations(), but the PHP
	 * side - templates, modules and plugins - calls _() directly, which is the gettext
	 * extension's function. gettext only returns a translation once LC_MESSAGES names
	 * an actual locale and the text domain is bound to the directory holding the .mo
	 * files; without both it hands back the msgid, so every server-rendered string
	 * stays English no matter which language the user selected.
	 *
	 * @param string $lang Language code (eg nl_NL.UTF-8)
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

		// Only the exact spelling can work: glibc normalizes codeset spellings by
		// itself, but composes the catalog path from the locale name, so only a
		// locale named like the directory in LANGUAGE_DIR loads a catalog.
		// On failure LC_MESSAGES stays "C" and gettext hands back the msgid.
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
	 * still be active in the next one - served to a different user. LANGUAGE is
	 * cleared because glibc consults it before LC_MESSAGES; it must never be set per
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
	 * Returns the ID of the currently selected language.
	 *
	 * @return string ID of selected language
	 */
	public function getSelected() {
		return $this->lang;
	}

	/**
	 * Returns if the specified language is valid or not.
	 *
	 * @param string $lang
	 *
	 * @return bool TRUE if the language is valid
	 */
	public function is_language($lang) {
		return $lang == "en_GB.UTF-8" || is_dir(LANGUAGE_DIR . "/" . $lang);
	}

	/**
	 * Returns the resolved language code, i.e. ending on UTF-8.
	 * Examples:
	 *  - en_GB => en.GB.UTF-8
	 *  - en_GB.utf8 => en_GB.UTF-8
	 *  - en_GB.UTF-8 => en_GB.UTF-8 (no changes).
	 *
	 * @param string $lang language code to resolve
	 *
	 * @return string resolved language name (i.e. language code ending on .UTF-8).
	 */
	public static function resolveLanguage($lang) {
		$normalizedLang = stristr($lang, '.utf-8', true);
		if (!empty($normalizedLang) && $normalizedLang !== $lang) {
			// Make sure we will use the format UTF-8 (capitals and hyphen)
			return $normalizedLang .= '.UTF-8';
		}

		$normalizedLang = stristr($lang, '.utf8', true);
		if (!empty($normalizedLang) && $normalizedLang !== $lang) {
			// Make sure we will use the format UTF-8 (capitals and hyphen)
			return $normalizedLang . '.UTF-8';
		}

		return $lang . '.UTF-8';
	}

	public function getTranslations() {
		$selected_lang = $this->getSelected();
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
