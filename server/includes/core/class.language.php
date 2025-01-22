<?php

/**
 * Language handling class.
 */
class Language {
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
		$lang = (empty($lang) || substr($lang, 0, 1) == '.' || $lang == "C") ? LANG : $lang; // default language fix

		if ($this->is_language($lang)) {
			$this->lang = $lang;
			$tmp_translations = $this->getTranslations();
			$translations = [];
			foreach ($tmp_translations as $resources) {
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
		else {
			error_log(sprintf("Unknown language: '%s'", $lang));
		}
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
		$memid = @shm_attach(0x950412DE, 16 * 1024 * 1024, 0666);
		if (@shm_has_var($memid, 0)) {
			$cache_table = @shm_get_var($memid, 0);
			$selected_lang = $this->getSelected();
			if (empty($cache_table) || empty($cache_table[$selected_lang])) {
				@shm_remove_var($memid, 0);
				@shm_detach($memid);

				return ['grommunio_web' => []];
			}
			$translation_id = $cache_table[$selected_lang];
			if (empty($translation_id)) {
				@shm_remove_var($memid, 0);
				@shm_detach($memid);

				return ['grommunio_web' => []];
			}
			$translations = @shm_get_var($memid, $translation_id);
			if (empty($translations)) {
				@shm_remove_var($memid, 0);
				@shm_detach($memid);
				return ['grommunio_web' => []];
			}
			@shm_detach($memid);

			return $translations;
		}
		$handle = opendir(LANGUAGE_DIR);
		if ($handle == false) {
			@shm_detach($memid);

			return ['grommunio_web' => []];
		}
		$last_id = 1;
		$cache_table = [];
		while (false !== ($entry = readdir($handle))) {
			if (strcmp($entry, ".") == 0 ||
				strcmp($entry, "..") == 0) {
				continue;
			}
			$translations = [];
			$translations['grommunio_web'] = $this->getTranslationsFromFile(LANGUAGE_DIR . $entry . '/LC_MESSAGES/grommunio_web.mo');
			if (!$translations['grommunio_web']) {
				continue;
			}
			if (isset($GLOBALS['PluginManager'])) {
				// What we did above, we are also now going to do for each plugin that has translations.
				$pluginTranslationPaths = $GLOBALS['PluginManager']->getTranslationFilePaths();
				foreach ($pluginTranslationPaths as $pluginname => $path) {
					$plugin_translations = $this->getTranslationsFromFile($path . '/' . $entry . '/LC_MESSAGES/plugin_' . $pluginname . '.mo');
					if ($plugin_translations) {
						$translations['plugin_' . $pluginname] = $plugin_translations;
					}
				}
			}
			$cache_table[$entry] = $last_id;
			@shm_put_var($memid, $last_id, $translations);
			if (strcmp($entry, $this->getSelected()) == 0) {
				$ret_val = $translations;
			}
			++$last_id;
		}
		closedir($handle);
		@shm_put_var($memid, 0, $cache_table);
		@shm_detach($memid);
		if (empty($ret_val)) {
			return ['grommunio_web' => []];
		}

		return $ret_val;
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
				if (strpos($translation_data[$i]['msgid'], "\004") !== false) {
					$contextSplit = explode("\004", $translation_data[$i]['msgid']);
					$translation_data[$i]['msgctxt'] = $contextSplit[0];
					$translation_data[$i]['msgid'] = $contextSplit[1];
				}
				// Find plural forms in the original string
				if (strpos($translation_data[$i]['msgid'], "\0") !== false) {
					$original = explode("\0", $translation_data[$i]['msgid']);
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
					$translation_data[$i]['msgstr'] = explode("\0", $translation_data[$i]['msgstr']);
				}
			}
			else {
				$translation_data[$i]['msgstr'] = '';
			}
		}

		return $translation_data;
	}
}
