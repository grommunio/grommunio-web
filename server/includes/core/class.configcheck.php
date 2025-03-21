<?php

/**
 * This class will check the server configuration and it stops the
 * webapp from working until this is fixed.
 */
class ConfigCheck {
	public $result;
	public $siteconfig;
	public $phpini;

	public function __construct(public $haltOnError = true) {
		$this->result = true;

		// here we check our settings, changes to the config and
		// additional checks must be added/changed here
		$this->checkPHP("5.4", "You must upgrade PHP");
		$this->checkExtension("mapi", "", "If you have upgraded Gromox, please restart nginx/php-fpm");
		$this->checkExtension("gettext", "", "Install the gettext extension for PHP");
		$this->checkPHPsetting("session.auto_start", "0", "Modify this setting in '%s'");
		$this->checkPHPsetting("output_handler", "", "With this option set, it is unsure if the grommunio Web will work correctly");
		$this->checkPHPsetting("zlib.output_handler", "", "With this option set, it is unsure if the grommunio Web will work correctly");

		# Replicate value logic from php-src/ext/zlib/zlib.c
		$sv = ini_get("zlib.output_compression");
		$sv = strcasecmp($sv, "on") == 0 ? 1 : (strcasecmp($sv, "off") == 0 ? 0 : intval($sv));
		if ($sv != 0) {
			$this->error_config("zlib.output_compression", "off", "With this option enabled, it could occur that XMLHTTP requests will fail");
		}

		if (CONFIG_CHECK_COOKIES_HTTP) {
			$this->checkPHPsecurity("session.cookie_httponly", "on", "Modify this setting in '%s'");
		}
		if (CONFIG_CHECK_COOKIES_SSL) {
			$this->checkPHPsecurity("session.cookie_secure", "on", "Modify this setting in '%s'");
		}

		# More custom logic needed :(
		# When save_path is left unset/empty, ini_get reports it as empty,
		# even though PHP uses some directory anyway (usually /tmp).
		$sp = ini_get("session.save_path");
		if (strlen($sp) > 0 && !$this->checkDirectory(
			$sp,
			"w",
			"session.save_path is not writable. This means PHP is practically running stateless, which is incompatible with the requirements of grommunio-web."
		)) {
			error_log("session.save_path ({$sp}) is not writable");
		}

		$this->checkDirectory(TMP_PATH, "rw", "Please make sure this directory exists and is writable for nginx/php-fpm");
		$this->checkFunction("iconv", "Install the 'iconv' module for PHP, or else you don't have euro-sign support.");
		$this->checkFunction("gzencode", "You don't have zlib support: <a href=\"https://php.net/manual/en/ref.zlib.php#zlib.installation\">https://php.net/manual/en/ref.zlib.php#zlib.installation</a>");
		$this->checkLoader(DEBUG_LOADER, "Your 'DEBUG_LOADER' configuration isn't valid for the current folder");

		// check if there were *any* errors and we need to stop grommunio Web
		if (!$this->result && $this->haltOnError) {
			?>
				<p style="font-weight: bold;">grommunio Web can't start because of incompatible configuration.</p>
				<p>Please correct above errors, a good start is by checking your '<tt><?php echo $this->get_php_ini(); ?></tt>' file.</p>
				<p>You can disable this configuration check by editing the file '<tt><?php echo dirname((string) $_SERVER["SCRIPT_FILENAME"]); ?>/config.php</tt>', but this is not recommended.</p>
			<?php
			exit;
		}
	}

	/**
	 * This function throws all the errors, make sure that the check-function
	 * will call this in case of an error.
	 *
	 * @param mixed $string
	 * @param mixed $help
	 */
	public function error($string, $help) {
		if ($this->haltOnError) {
			printf("<div style=\"color: #f00;\">%s</div><div style=\"font-size: smaller; margin-left: 20px;\">%s</div>\n", $string, $help);
		}
		else {
			trigger_error(strip_tags((string) $string), E_USER_NOTICE);
		}
		$this->result = false;
	}

	/**
	 * See error().
	 *
	 * @param mixed $name
	 * @param mixed $needed
	 * @param mixed $found
	 * @param mixed $help
	 */
	public function error_version($name, $needed, $found, $help) {
		$this->error("<strong>Version error:</strong> {$name} {$found} found, but {$needed} needed.", $help);
	}

	/**
	 * See error().
	 *
	 * @param mixed $name
	 * @param mixed $help
	 */
	public function error_notfound($name, $help) {
		$this->error("<strong>Not Found:</strong> {$name} not found", $help);
	}

	/**
	 * See error().
	 *
	 * @param mixed $name
	 * @param mixed $needed
	 * @param mixed $help
	 */
	public function error_config($name, $needed, $help) {
		$help = sprintf($help, "<tt>" . $this->get_php_ini() . "</tt>");
		$this->error("<strong>PHP Config error:</strong> {$name} must be '{$needed}'", $help);
	}

	/**
	 * See error().
	 *
	 * @param mixed $name
	 * @param mixed $needed
	 * @param mixed $help
	 */
	public function error_security($name, $needed, $help) {
		$help = sprintf($help, "<tt>" . $this->get_site_config() . "</tt>");
		$this->error("<strong>PHP Security Config error:</strong> {$name} must be '{$needed}'", $help);
	}

	/**
	 * See error().
	 *
	 * @param mixed $dir
	 * @param mixed $msg
	 * @param mixed $help
	 */
	public function error_directory($dir, $msg, $help) {
		$this->error("<strong>Directory Error:</strong> {$dir} {$msg}", $help);
	}

	/**
	 * Retrieves the location of the apache site config.
	 */
	public function get_site_config() {
		if (isset($this->siteconfig)) {
			return $this->siteconfig;
		}

		// This is not 100% accurate, so it needs to be improved a bit.
		$result = "sites-enabled" . DIRECTORY_SEPARATOR . "grommunio-web";

		ob_start();
		phpinfo(INFO_MODULES);
		$phpinfo = ob_get_contents();
		ob_end_clean();

		preg_match("/<td class=\"e\">[\\s]*Server Root[\\s]*<\\/td>[\\s]*<td class=\"v\">[\\s]*(.*)[\\s]*<\\/td>/i", $phpinfo, $matches);
		if (isset($matches[1])) {
			$result = trim($matches[1]) . DIRECTORY_SEPARATOR . $result;
		}
		$this->siteconfig = $result;

		return $result;
	}

	/**
	 * Retrieves the location of php.ini.
	 */
	public function get_php_ini() {
		if (isset($this->phpini)) {
			return $this->phpini;
		}

		$result = "php.ini";

		ob_start();
		phpinfo(INFO_GENERAL);
		$phpinfo = ob_get_contents();
		ob_end_clean();

		preg_match("/<td class=\"v\">(.*php[45]?\\.ini)/i", $phpinfo, $matches);
		if (isset($matches[0])) {
			$result = $matches[0];
		}
		$this->phpini = $result;

		return $result;
	}

	/*\
	*  Check functions					   *
	\*/

	/**
	 * Checks for the PHP version.
	 *
	 * @param mixed $version
	 * @param mixed $help_msg
	 */
	public function checkPHP($version, $help_msg = "") {
		$result = true;
		if (version_compare(phpversion(), $version) == -1) {
			$this->error_version("PHP", $version, phpversion(), $help_msg);
			$result = false;
		}

		return $result;
	}

	/**
	 * Check if extension is loaded and if the version is what we need.
	 *
	 * @param mixed $name
	 * @param mixed $version
	 * @param mixed $help_msg
	 */
	public function checkExtension($name, $version = "", $help_msg = "") {
		$result = true;
		if (extension_loaded($name)) {
			if (version_compare(phpversion($name), $version) == -1) {
				$this->error_version("PHP " . $name . " extension", phpversion($name), $version, $help_msg);
				$result = false;
			}
		}
		else {
			$this->error_notfound("PHP " . $name . " extension", $help_msg);
			$result = false;
		}

		return $result;
	}

	/**
	 * Check if a function exists.
	 *
	 * @param mixed $name
	 * @param mixed $help_msg
	 */
	public function checkFunction($name, $help_msg = "") {
		$result = true;
		if (!function_exists($name)) {
			$this->error_notfound("PHP function '" . $name . "' ", $help_msg);
			$result = false;
		}

		return $result;
	}

	/**
	 * This function checks if a specific php setting (php.ini) is set to a
	 * value we need, for example register_globals.
	 *
	 * @param mixed $setting
	 * @param mixed $value_needed
	 * @param mixed $help_msg
	 */
	public function checkPHPsetting($setting, $value_needed, $help_msg = "") {
		$result = true;
		$inival = ini_get($setting);
		if (strcmp($inival, (string) $value_needed) != 0) {
			$this->error_config($setting, $value_needed, $help_msg . " (Current value: \"{$inival}\")");
			$result = false;
		}

		return $result;
	}

	/**
	 * This function checks if a specific php setting (php.ini) is set to a
	 * value we need, for example register_globals.
	 *
	 * @param mixed $setting
	 * @param mixed $value_needed
	 * @param mixed $help_msg
	 */
	public function checkPHPsecurity($setting, $value_needed, $help_msg = "") {
		$result = true;

		// convert $value_needed
		$value = match ($value_needed) {
			"on", "yes", "true" => 1,
			"off", "no", "false" => 0,
			default => $value_needed,
		};

		if (ini_get($setting) != $value) {
			$this->error_security($setting, $value_needed, $help_msg);
			$result = false;
		}

		return $result;
	}

	/**
	 * This functions checks if a directory exists and if requested also if
	 * this directory is readable/writable specified with the $states parameter.
	 *
	 * $states is a string which can contain these chars:
	 *	r  - check if directory is readable
	 *	w  - check if directory is writable
	 *
	 * @param mixed $dir
	 * @param mixed $states
	 * @param mixed $help_msg
	 */
	public function checkDirectory($dir, $states = "r", $help_msg = "") {
		$result = true;

		if (!is_dir($dir)) {
			if (@mkdir($dir) === false) {
				$this->error_directory($dir, "couldn't be created", $help_msg);
			}
		}

		if (is_dir($dir)) {
			$states = strtolower((string) $states);
			if (str_contains($states, "r")) {
				if (!is_readable($dir)) {
					$this->error_directory($dir, "isn't readable", $help_msg);
					$result = false;
				}
			}
			if (str_contains($states, "w")) {
				if (!is_writable($dir)) {
					$this->error_directory($dir, "isn't writable", $help_msg);
					$result = false;
				}
			}
		}
		else {
			$this->error_directory($dir, "doesn't exist", $help_msg);
			$result = false;
		}

		return $result;
	}

	/**
	 * Check if the correct files are present in the current folder based on the DEBUG_LOADER configuration
	 * option. This should prevent odd errors when the incorrect folders are present.
	 *
	 * @param mixed $loader
	 * @param mixed $help_msg
	 */
	public function checkLoader($loader, $help_msg = "") {
		$result = true;

		switch ($loader) {
			case LOAD_RELEASE:
				if (!is_file(BASE_PATH . '/client/grommunio.js')) {
					$this->error('<strong>LOAD_RELEASE configured, but no release files found</strong>', $help_msg);
					$result = false;
				}
				elseif (is_dir(BASE_PATH . '/client/zarafa')) {
					$this->error('<strong>LOAD_RELEASE configured, but source files were found</strong>', $help_msg);
					$result = false;
				}
				break;

			case LOAD_DEBUG:
				if (!is_file(BASE_PATH . '/client/zarafa-debug.js')) {
					$this->error('<strong>LOAD_DEBUG configured, but no debug files found</strong>', $help_msg);
					$result = false;
				}
				elseif (is_dir(BASE_PATH . '/client/zarafa')) {
					$this->error('<strong>LOAD_DEBUG configured, but source files were found</strong>', $help_msg);
					$result = false;
				}
				break;

			case LOAD_SOURCE:
				if (!is_dir(BASE_PATH . '/client/zarafa')) {
					$this->error('<strong>LOAD_SOURCE configured, but no source files found</strong>', $help_msg);
					$result = false;
				}
				elseif (is_file(BASE_PATH . '/client/grommunio.js') || is_file(BASE_PATH . '/client/zarafa-debug.js')) {
					$this->error('<strong>LOAD_SOURCE configured, but release & debug file were found</strong>', $help_msg);
					$result = false;
				}
				break;

			default:
				$this->error('<strong>Unknown \'DEBUG_LOADER\' value: ' . $loader . '</strong>', $help_msg);
				$result = false;
				break;
		}

		return $result;
	}
}

?>
