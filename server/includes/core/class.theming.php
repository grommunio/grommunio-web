<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once __DIR__ . '/class.colors.php';
require_once __DIR__ . '/class.jsonthemestyles.php';

// The themes are moved to a different location when released
// so we will define these constants for their location
define('THEME_PATH_' . LOAD_SOURCE, 'client/grommunio/core/themes');
define('THEME_PATH_' . LOAD_DEBUG, 'client/themes');
define('THEME_PATH_' . LOAD_RELEASE, 'client/themes');

/**
 * This class provides some functionality for theming grommunio Web.
 */
class Theming {
	/**
	 * A hash that is used to cache if a theme is a json theme.
	 *
	 * @var array<string, bool>
	 */
	private static $isJsonThemeCache = [];

	/**
	 * A hash that is used to cache the properties of json themes.
	 *
	 * @var array
	 */
	private static $jsonThemePropsCache = [];

	/**
	 * The title and favicon override of the requested host: false until
	 * looked up, then null or an array.
	 *
	 * @var null|array|false
	 */
	private static $brandCache = false;

	/**
	 * Retrieves all installed json themes.
	 *
	 * @return array An array with the directory names of the json themes as keys and their display names
	 *               as values
	 */
	public static function getJsonThemes() {
		$themes = [];
		$directoryIterator = new DirectoryIterator(BASE_PATH . PATH_PLUGIN_DIR);
		foreach ($directoryIterator as $info) {
			if ($info->isDot() || !$info->isDir()) {
				continue;
			}

			if (!Theming::isJsonTheme($info->getFileName())) {
				continue;
			}

			$themeProps = Theming::getJsonThemeProps($info->getFileName());
			if (empty($themeProps)) {
				continue;
			}

			$themes[$info->getFileName()] = $themeProps['display-name'] ?? $info->getFileName();
		}

		return $themes;
	}

	/**
	 * Returns the name of the active theme if one was found, and false otherwise.
	 * The active theme can be set by the admin in the config.php, or by
	 * the user in his settings.
	 *
	 * @return bool|string
	 */
	public static function getActiveTheme() {
		$theme = false;
		$themePath = BASE_PATH . constant('THEME_PATH_' . DEBUG_LOADER);

		// List of unified themes that don't require separate directories
		$unifiedThemes = ['purple', 'orange', 'lime', 'magenta', 'highcontrast', 'blue', 'teal', 'indigo', 'red', 'green', 'amber', 'brown', 'cyan'];

		// First check if a theme was set by this user in his settings
		if (WebAppAuthentication::isAuthenticated()) {
			if (ENABLE_THEMES === false) {
				$theme = THEME !== "" ? THEME : 'basic';
			}
			else {
				$theme = $GLOBALS['settings']->get('grommunio/v1/main/active_theme');
			}

			// Migrate legacy "dark" theme users: the dark theme directory
			// has been removed. Switch them to basic theme + dark mode.
			if ($theme === 'dark') {
				$darkMode = $GLOBALS['settings']->get('grommunio/v1/main/dark_mode');
				if (empty($darkMode) || $darkMode === 'light') {
					$GLOBALS['settings']->set('grommunio/v1/main/dark_mode', 'dark');
				}
				$GLOBALS['settings']->set('grommunio/v1/main/active_theme', 'basic');
				$GLOBALS['settings']->saveSettings();
				$theme = 'basic';
			}

			// If a theme was found, check if the theme is still installed
			// Remember that 'basic' is not a real theme, but the name for the default look of grommunio Web
			// Unified themes don't require directories, so we skip the directory check for them
			if (
				isset($theme) && !empty($theme) && $theme !== 'basic' &&
				!in_array($theme, $unifiedThemes) &&
				!is_dir($themePath . '/' . $theme) &&
				!is_dir(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme)
			) {
				$theme = false;
			}
		}

		// If a valid theme was not found in the settings of the user, let's see if a valid theme
		// was defined by the admin.
		if (!$theme && defined('THEME') && THEME) {
			// Check if it's a unified theme or if the directory exists
			if (in_array(THEME, $unifiedThemes)) {
				$theme = THEME;
			}
			else {
				$theme = is_dir($themePath . '/' . THEME) || is_dir(BASE_PATH . PATH_PLUGIN_DIR . '/' . THEME) ? THEME : false;
			}
		}

		if (Theming::isJsonTheme($theme) && !is_array(Theming::getJsonThemeProps($theme))) {
			// Someone made an error, we cannot read this json theme
			return false;
		}

		return $theme;
	}

	/**
	 * Returns the path to the favicon if included with the theme. If found the
	 * path to it will be returned. Otherwise false.
	 *
	 * @param string $theme the name of the theme for which the css will be returned.
	 *                      Note: This is the directory name of the theme plugin.
	 *
	 * @return false|string favicon path, or false when the theme has no favicon
	 */
	public static function getFavicon($theme) {
		$themePath = constant('THEME_PATH_' . DEBUG_LOADER);

		// First check if we can find a core theme with this name
		// A theme package can replace its icon without a grommunio Web release, so the
		// file's own mtime is the cache buster
		if ($theme && is_dir(BASE_PATH . $themePath . '/' . $theme) && is_file(BASE_PATH . $themePath . '/' . $theme . '/favicon.ico')) {
			return $themePath . '/' . $theme . '/favicon.ico?' . filemtime(BASE_PATH . $themePath . '/' . $theme . '/favicon.ico');
		}

		// If no core theme was found, let's try to find a theme plugin with this name
		if ($theme && is_dir(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme) && is_file(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme . '/favicon.ico')) {
			return PATH_PLUGIN_DIR . '/' . $theme . '/favicon.ico?' . filemtime(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme . '/favicon.ico');
		}

		return false;
	}

	/**
	 * Returns the host name of the request, lower-case and without the port.
	 *
	 * @return string empty when the header is missing or malformed
	 */
	public static function getRequestHost() {
		$host = strtolower(trim((string) ($_SERVER['HTTP_HOST'] ?? '')));
		$host = preg_replace('/:\d+$/', '', $host);

		return preg_match('/^[a-z0-9.-]+$/', $host) ? $host : '';
	}

	/**
	 * Returns the title and favicon that apply to the requested host, or
	 * null when none is installed. Hosts are matched exactly, then by the
	 * longest "*.suffix" pattern, then by "*". The title is HTML-escaped,
	 * the favicon is a same-origin absolute path.
	 *
	 * @return null|array{title: string, favicon: string}
	 */
	public static function getBrand() {
		if (self::$brandCache !== false) {
			return self::$brandCache;
		}
		self::$brandCache = null;

		$file = '/run/grommunio-brand/brand/brand.json';
		if (!is_readable($file)) {
			return null;
		}
		$data = json_decode((string) file_get_contents($file), true);
		$hosts = is_array($data['hosts'] ?? null) ? $data['hosts'] : [];
		$host = self::getRequestHost();

		$entry = $host !== '' ? ($hosts[$host] ?? null) : null;
		if (!is_array($entry)) {
			$suffixLength = 0;
			foreach ($hosts as $pattern => $values) {
				$pattern = (string) $pattern;
				if (!is_array($values) || !str_starts_with($pattern, '*.')) {
					continue;
				}
				$suffix = substr($pattern, 1);
				if (strlen($suffix) > $suffixLength && strlen($host) > strlen($suffix) && str_ends_with($host, $suffix)) {
					$entry = $values;
					$suffixLength = strlen($suffix);
				}
			}
		}
		if (!is_array($entry)) {
			$entry = $hosts['*'] ?? null;
		}
		if (!is_array($entry)) {
			return null;
		}

		$title = $entry['title'] ?? '';
		$title = is_string($title) ? trim(preg_replace('/[\x00-\x1f\x7f]/', '', strip_tags($title))) : '';
		$title = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
		$favicon = $entry['favicon'] ?? '';
		if (!is_string($favicon) || !preg_match('#^/(?!/)[A-Za-z0-9._~/%-]+$#', $favicon)) {
			$favicon = '';
		}
		if ($title === '' && $favicon === '') {
			return null;
		}
		self::$brandCache = ['title' => $title, 'favicon' => $favicon];

		return self::$brandCache;
	}

	/**
	 * Returns the CSS files provided by the theme.
	 *
	 * @param string $theme the name of the theme for which the css will be returned.
	 *                      Note: This is the directory name of the theme plugin.
	 *
	 * @return string[] paths relative to the application root
	 */
	public static function getCss($theme) {
		$themePathCoreThemes = BASE_PATH . constant('THEME_PATH_' . DEBUG_LOADER);
		$cssFiles = [];

		// Unified themes (purple, orange, lime, magenta, highcontrast, blue, teal, indigo, red, green, amber, brown, cyan) are now in grommunio.css
		// Only the dark theme still loads its own CSS file
		$unifiedThemes = ['purple', 'orange', 'lime', 'magenta', 'highcontrast', 'blue', 'teal', 'indigo', 'red', 'green', 'amber', 'brown', 'cyan'];
		if (in_array($theme, $unifiedThemes)) {
			return [];
		}

		// First check if this is a core theme, and if it isn't, check if it is a theme plugin
		if ($theme && is_dir($themePathCoreThemes . '/' . $theme)) {
			$themePath = $themePathCoreThemes . '/' . $theme;
		}
		elseif ($theme && is_dir(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme)) {
			if (Theming::isJsonTheme($theme)) {
				return [];
			}
			$themePath = BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme;
		}

		// A theme does not have to bring style sheets - one which only replaces the
		// favicon is enough - and the iterator below throws on a missing directory.
		if (isset($themePath) && is_dir($themePath . '/css/')) {
			// Use SPL iterators to recursively traverse the css directory and find all css files
			$directoryIterator = new RecursiveDirectoryIterator($themePath . '/css/', FilesystemIterator::SKIP_DOTS);
			$iterator = new RecursiveIteratorIterator($directoryIterator, RecursiveIteratorIterator::SELF_FIRST);

			// Always rewind an iterator before using it!!! See https://bugs.php.net/bug.php?id=62914 (it might save you a couple of hours debugging)
			$iterator->rewind();
			while ($iterator->valid()) {
				$file = $iterator->current();
				$fileName = $file->getFilename();
				if (!$file->isDir() && (strtolower($file->getExtension()) === 'css' || str_ends_with($fileName, '.css.php'))) {
					$cssFiles[] = substr((string) $iterator->key(), strlen(BASE_PATH));
				}
				$iterator->next();
			}
		}

		// Sort the array alphabetically before adding the css
		sort($cssFiles);

		return $cssFiles;
	}

	/**
	 * Returns the value that is assigned to a property by the active theme
	 * or null otherwise.
	 * Currently only implemented for JSON themes.
	 *
	 * @param mixed $propName
	 *
	 * @return mixed the configured value, or false when the theme or property is unavailable
	 */
	public static function getThemeProperty($propName) {
		$theme = Theming::getActiveTheme();
		if (!Theming::isJsonTheme($theme)) {
			return false;
		}

		$props = Theming::getJsonThemeProps($theme);
		if (!isset($props[$propName])) {
			return false;
		}

		return $props[$propName];
	}

	/**
	 * Returns the color that the active theme has set for the primary color
	 * of the icons. Currently only supported for JSON themes.
	 * Note: Only SVG icons of an iconset that has defined the primary color
	 * can be 'recolored'.
	 *
	 * @return false|string primary icon color, or false when it is not configured
	 */
	public static function getPrimaryIconColor() {
		$val = Theming::getThemeProperty('icons-primary-color');

		return $val ?? false;
	}

	/**
	 * Returns the color that the active theme has set for the secondary color
	 * of the icons. Currently only supported for JSON themes.
	 * Note: Only SVG icons of an iconset that has defined the secondary color
	 * can be 'recolored'.
	 *
	 * @return false|string secondary icon color, or false when it is not configured
	 */
	public static function getSecondaryIconColor() {
		$val = Theming::getThemeProperty('icons-secondary-color');

		return $val ?? false;
	}

	/**
	 * Checks if a theme is a JSON theme. (Basically this means that it checks if a
	 * directory with the theme name exists and if that directory contains a file
	 * called theme.json).
	 *
	 * @param string $theme The name of the theme to check
	 *
	 * @return bool True if the theme is a json theme, false otherwise
	 */
	public static function isJsonTheme($theme) {
		if (empty($theme)) {
			return false;
		}

		if (!isset(Theming::$isJsonThemeCache[$theme])) {
			$themePathCoreThemes = BASE_PATH . constant('THEME_PATH_' . DEBUG_LOADER);

			// First check if this is a core theme, and if it isn't, check if it is a theme plugin
			if (is_dir($themePathCoreThemes . '/' . $theme)) {
				// We don't have core json themes, so return false
				Theming::$isJsonThemeCache[$theme] = false;
			}
			elseif (is_dir(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme) && is_file(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme . '/theme.json')) {
				Theming::$isJsonThemeCache[$theme] = true;
			}
			else {
				Theming::$isJsonThemeCache[$theme] = false;
			}
		}

		return Theming::$isJsonThemeCache[$theme];
	}

	/**
	 * Retrieves the properties set in the theme.json file of the theme.
	 *
	 * @param string $theme The theme for which the properties should be retrieved
	 *
	 * @return array|false the decoded properties, or false when the theme is not a JSON theme
	 */
	public static function getJsonThemeProps($theme) {
		if (!Theming::isJsonTheme($theme)) {
			return false;
		}

		// Check if we have the props in the cache before reading the file
		if (!isset(Theming::$jsonThemePropsCache[$theme])) {
			$json = file_get_contents(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme . '/theme.json');
			$props = json_decode($json, true);

			if (!is_array($props) || json_last_error() !== JSON_ERROR_NONE) {
				$reason = json_last_error() === JSON_ERROR_NONE ? 'The root value must be an object.' : json_last_error_msg();
				error_log("The theme '{$theme}' does not have a valid theme.json file. {$reason}");
				$props = false;
			}

			Theming::$jsonThemePropsCache[$theme] = $props;
		}

		return Theming::$jsonThemePropsCache[$theme];
	}

	/**
	 * Retrieves the styles that should be added to the page for the json theme.
	 *
	 * @param string $theme The theme for which the properties should be retrieved
	 *
	 * @return string The styles (between <style> tags)
	 */
	public static function getStyles($theme) {
		$styles = '';
		if (!Theming::isJsonTheme($theme)) {
			$css = Theming::getCss($theme);
			foreach ($css as $file) {
				$styles .= '<link rel="stylesheet" type="text/css" href="' . versionedUrl($file) . '" />' . "\n";
			}

			return $styles;
		}

		// Convert the json theme to css styles
		$themeProps = Theming::getJsonThemeProps($theme);
		if (!$themeProps) {
			return $styles;
		}

		return JsonThemeStyles::render($theme, $themeProps);
	}
}
