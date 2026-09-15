<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once __DIR__ . '/class.colors.php';

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
	 * Normalizes all defined colors in a JSON theme to valid hex colors.
	 *
	 * @param array $themeProps A hash with the properties defined a theme.json file
	 */
	private static function normalizeColors($themeProps) {
		$colorKeys = [
			'primary-color',
			'primary-color:hover',
			'primary-color:dark',
			'gradient-start',
			'gradient-end',
			'mainbar-text-color',
			'action-color',
			'action-color:hover',
			'selection-color',
			'selection-text-color',
			'focus-color',
		];
		foreach ($colorKeys as $ck) {
			$themeProps[$ck] = isset($themeProps[$ck]) ? Colors::getHexColorFromCssColor($themeProps[$ck]) : null;
		}

		return $themeProps;
	}

	/**
	 * Utility function to fix relative urls in JSON themes.
	 *
	 * @param string $url   the url to be fixed
	 * @param string $theme the name of the theme the url is part of
	 */
	private static function fixUrl($url, $theme) {
		// the url is absolute we don't have to fix anything
		if (preg_match('/^https?:\/\//', $url)) {
			return $url;
		}

		return versionedUrl(PATH_PLUGIN_DIR . '/' . $theme . '/' . $url);
	}

	/**
	 * The custom properties a theme feeds. grommunio.css is written against these and
	 * uses them far more widely than the fixed selectors below, so a theme that sets
	 * none of them only reaches the handful of places those selectors name.
	 *
	 * The built-in themes declare the same properties in grommunio.css; a json theme
	 * gets no rule of its own there, so they are emitted here instead. One theme is
	 * active per request, which is why plain "body" is specific enough.
	 *
	 * @param array $themeProps A hash with the properties defined in a theme.json file
	 *
	 * @return string a css rule, or an empty string when the theme sets no colors
	 */
	private static function getVariables($themeProps) {
		$variables = [
			'--theme-primary-color' => $themeProps['primary-color'] ?? null,
			'--theme-primary-hover' => $themeProps['primary-color:hover'] ?? null,
			'--theme-primary-dark' => $themeProps['primary-color:dark'] ?? null,
			'--theme-gradient-start' => $themeProps['gradient-start'] ?? null,
			'--theme-gradient-end' => $themeProps['gradient-end'] ?? null,
			'--theme-selection-bg' => $themeProps['selection-color'] ?? null,
			'--theme-spinner-image' => isset($themeProps['spinner-image']) ? 'url(' . $themeProps['spinner-image'] . ')' : null,
		];

		$declarations = '';
		foreach ($variables as $name => $value) {
			if ($value) {
				$declarations .= "\n\t\t\t\t" . $name . ': ' . htmlspecialchars((string) $value) . ';';
			}
		}

		if (empty($declarations)) {
			return '';
		}

		return "\n\t\t\t/* The palette grommunio.css is written against */\n\t\t\tbody {" . $declarations . "\n\t\t\t}\n";
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

		$themeProps = Theming::normalizeColors($themeProps);

		if ($themeProps['primary-color']) {
			if (!$themeProps['primary-color:hover']) {
				$hsl = Colors::rgb2hsl($themeProps['primary-color']);
				if ($hsl['l'] > 20) {
					$themeProps['primary-color:hover'] = Colors::darker($themeProps['primary-color'], 10);
				}
				else {
					$themeProps['primary-color:hover'] = Colors::lighter($themeProps['primary-color'], 20);
				}
			}

			if (!$themeProps['mainbar-text-color']) {
				// Check if the main bar is not too light for white text (i.e. the default color)
				if (Colors::getLuma($themeProps['primary-color']) > 155) {
					$themeProps['mainbar-text-color'] = '#000000';
				}
			}

			if (!$themeProps['selection-color']) {
				$themeProps['selection-color'] = Colors::setLuminance($themeProps['primary-color'], 80);
			}

			if (!$themeProps['primary-color:dark']) {
				$themeProps['primary-color:dark'] = Colors::darker($themeProps['primary-color'], 20);
			}

			// The top bar is a flat primary-color unless the theme asks for a gradient,
			// which is what the key has always promised.
			if (!$themeProps['gradient-start']) {
				$themeProps['gradient-start'] = $themeProps['primary-color'];
			}
			if (!$themeProps['gradient-end']) {
				$themeProps['gradient-end'] = $themeProps['gradient-start'];
			}
		}
		if ($themeProps['action-color'] && !$themeProps['action-color:hover']) {
			$themeProps['action-color:hover'] = Colors::darker($themeProps['action-color'], 10);
		}
		if (isset($themeProps['selection-color']) && !isset($themeProps['selection-text-color'])) {
			// Set a text color for the selection-color
			$hsl = Colors::rgb2hsl($themeProps['selection-color']);
			if ($hsl['l'] > 50) {
				$hsl['l'] = 5;
			}
			else {
				$hsl['l'] = 95;
			}
			$themeProps['selection-text-color'] = Colors::colorObject2string(Colors::hsl2rgb($hsl));
		}

		if (isset($themeProps['background-image'])) {
			$themeProps['background-image'] = Theming::fixUrl($themeProps['background-image'], $theme);
		}
		if (isset($themeProps['logo-large'])) {
			$themeProps['logo-large'] = Theming::fixUrl($themeProps['logo-large'], $theme);
		}
		if (isset($themeProps['logo-small'])) {
			$themeProps['logo-small'] = Theming::fixUrl($themeProps['logo-small'], $theme);
		}
		if (isset($themeProps['logo-large']) && !isset($themeProps['logo-small'])) {
			$themeProps['logo-small'] = $themeProps['logo-large'];
		}
		if (isset($themeProps['logo-small:dark'])) {
			$themeProps['logo-small:dark'] = Theming::fixUrl($themeProps['logo-small:dark'], $theme);
		}
		elseif (isset($themeProps['logo-small'])) {
			$themeProps['logo-small:dark'] = $themeProps['logo-small'];
		}
		if (isset($themeProps['spinner-image'])) {
			$themeProps['spinner-image'] = Theming::fixUrl($themeProps['spinner-image'], $theme);
		}
		$styles = '<style>' . Theming::getVariables($themeProps);
		foreach ($themeProps as $k => $v) {
			if ($v && isset(Theming::$styles[$k])) {
				$styles .= str_replace("{{{$k}}}", htmlspecialchars((string) $v), Theming::$styles[$k]);
			}
		}
		$styles .= '</style>' . "\n";

		// Add the defined stylesheets
		if (isset($themeProps['stylesheets'])) {
			$stylesheets = [];
			if (is_string($themeProps['stylesheets'])) {
				$stylesheets = explode(' ', $themeProps['stylesheets']);
			}
			elseif (is_array($themeProps['stylesheets'])) {
				$stylesheets = $themeProps['stylesheets'];
			}
			foreach ($stylesheets as $stylesheet) {
				if (is_string($stylesheet)) {
					$stylesheet = trim($stylesheet);
					if (empty($stylesheet)) {
						continue;
					}
					$styles .= "\t\t" . '<link rel="stylesheet" type="text/css" href="' . htmlspecialchars((string) Theming::fixUrl($stylesheet, $theme)) . '" />' . "\n";
				}
			}
		}

		return $styles;
	}

	/**
	 * The templates of the styles that a json theme can add to the page.
	 *
	 * @var array<string, string>
	 */
	private static $styles = [
		'primary-color' => '
			/* The Sign in button of the login screen */
			body.login #form-container #submitbutton,
			#loading-mask #form-container #submitbutton {
				background: {{primary-color}};
			}

			/* The top bar of the Welcome dialog */
			.grommunio-welcome-body > .x-panel-bwrap > .x-panel-body div.grommunio-welcome-title {
				border-left: 1px solid {{primary-color}};
				border-right: 1px solid {{primary-color}};
				background: {{primary-color}};
			}

			/* The border line under the top menu bar */
			body #grommunio-mainmenu {
				border-color: {{primary-color}};
			}
			/* The background color of the top menu bar */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct {
				background-color: {{primary-color}};
			}
			/* Unread items */
			.k-unreadborders .x-grid3-row.x-grid3-row-collapsed.mail_unread > table,
			.k-unreadborders .x-grid3-row.x-grid3-row-expanded.mail_unread > table {
		        	border-left: 4px solid {{primary-color}} !important;
			}
		',

		'primary-color:hover' => '
			/* Hover state and active state of the Sign in button */
			body.login #form-container #submitbutton:hover,
			#loading-mask #form-container #submitbutton:hover,
			body.login #form-container #submitbutton:active,
			#loading-mask #form-container #submitbutton:active {
				background: {{primary-color:hover}};
			}

			/* Background color of the hover state of the buttons in the top menu bar */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .x-btn.x-btn-over,
			/* Background color of the active state of the buttons (i.e. when the buttons get clicked) */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .x-btn.x-btn-over.x-btn-click,
			/* Background color of the selected button */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .grommunio-maintabbar-maintab-active,
			/* Background color of the hover state of selected button */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .grommunio-maintabbar-maintab-active.x-btn-over,
			/* Background color of the active state of selected button */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .grommunio-maintabbar-maintab-active.x-btn-over.x-btn-click {
				background-color: {{primary-color:hover}} !important;
			}
		',

		'mainbar-text-color' => '
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct,
			/* Text color of the buttons in the top menu bar */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .x-btn button.x-btn-text,
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .x-btn-over button.x-btn-text,
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .x-btn-over.x-btn-click button.x-btn-text,
			/* Text color of the selected button in the top menu bar */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .grommunio-maintabbar-maintab-active button.x-btn-text,
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .grommunio-maintabbar-maintab-active.x-btn-over button.x-btn-text,
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .grommunio-maintabbar-maintab-active.x-btn-over.x-btn-click button.x-btn-text {
				color: {{mainbar-text-color}} !important;
			}
		',

		'action-color' => '
			/****************************************************************************
			 *  Action color
			 * ===============
			 * Some elements have a different color than the default color of these elements
			 * to get extra attention, e.g. "call-to-action buttons", the current day
			 * in the calendar, etc.
			 ****************************************************************************/
			/* Buttons, normal state */
			.x-btn.grommunio-action .x-btn-small,
			.x-btn.grommunio-action .x-btn-medium,
			.x-btn.grommunio-action .x-btn-large,
			/* Buttons, active state */
			.x-btn.grommunio-action.x-btn-over.x-btn-click .x-btn-small,
			.x-btn.grommunio-action.x-btn-over.x-btn-click .x-btn-medium,
			.x-btn.grommunio-action.x-btn-over.x-btn-click .x-btn-large,
			.x-btn.grommunio-action.x-btn-click .x-btn-small,
			.x-btn.grommunio-action.x-btn-click .x-btn-medium,
			.x-btn.grommunio-action.x-btn-click .x-btn-large,
			/* Special case: Popup, Windows, or Messageboxes (first button is by default styled as the action button) */
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-large,
			/* action button in reminder popout */
			.k-reminderpanel .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-small,
			.k-reminderpanel .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.k-reminderpanel .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-small,
			/* Current day in the calendar */
			.grommunio-freebusy-panel .x-freebusy-timeline-container .x-freebusy-header .x-freebusy-header-body .x-freebusy-timeline-day.x-freebusy-timeline-day-current,
			.grommunio-freebusy-panel .x-freebusy-timeline-container .x-freebusy-header .x-freebusy-header-body .x-freebusy-timeline-day.x-freebusy-timeline-day-current table,
			.grommunio-freebusy-panel .x-freebusy-timeline-container .x-freebusy-header .x-freebusy-header-body .x-freebusy-timeline-day.x-freebusy-timeline-day-current table tr.x-freebusy-timeline-day td,
			/* The date pickers */
			.x-date-picker .x-date-inner td.x-date-today a,
			.x-date-picker .x-date-mp table td.x-date-mp-sel a,
			.x-date-picker .x-date-mp table tr.x-date-mp-btns td button.x-date-mp-ok {
				background: {{action-color}} !important;
			}
			/* Focused Action button */
			.x-btn.grommunio-action.x-btn-focus .x-btn-small, .x-btn.grommunio-action.x-btn-focus .x-btn-medium, .x-btn.grommunio-action.x-btn-focus .x-btn-large {
				background: {{action-color}} !important;
			}
			/* Selected calendar */
			.grommunio-calendar-tabarea-stroke.grommunio-calendar-tab-selected {
				border-top-color: {{action-color}};
			}
			.x-date-picker .x-date-inner td.x-date-weeknumber a,
			.grommunio-hierarchy-node-total-count span.grommunio-hierarchy-node-counter,
			.grommunio-hierarchy-node-unread-count span.grommunio-hierarchy-node-counter {
				color: {{action-color}};
			}
			.x-date-picker .x-date-inner td.x-date-today a {
				border-color: {{action-color}};
			}
			.grommunio-freebusy-panel .x-freebusy-timeline-container .x-freebusy-header .x-freebusy-header-body .x-freebusy-timeline-day.x-freebusy-timeline-day-current,
			.grommunio-freebusy-panel .x-freebusy-timeline-container .x-freebusy-body .x-freebusy-background .x-freebusy-timeline-day.x-freebusy-timeline-day-current {
				border-right-color: {{action-color}};
			}
			.grommunio-freebusy-panel .x-freebusy-timeline-container .x-freebusy-header .x-freebusy-header-body .x-freebusy-timeline-day.x-freebusy-timeline-day-current table tr.x-freebusy-timeline-hour td:first-child,
			.grommunio-freebusy-panel .x-freebusy-timeline-container .x-freebusy-body .x-freebusy-background .x-freebusy-timeline-day.x-freebusy-timeline-day-current td:first-child {
				border-left-color: {{action-color}};
			}
		',

		'action-color:hover' => '
			/* Buttons, hover state */
			.x-btn.grommunio-action.x-btn-over .x-btn-small,
			.x-btn.grommunio-action.x-btn-over .x-btn-medium,
			.x-btn.grommunio-action.x-btn-over .x-btn-large,
			/* Special case: Popup, Windows, or Messageboxes */
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-large,
			/* action button in reminder popout */
			.k-reminderpanel .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-small,
			/* The date pickers */
			.x-date-picker .x-date-mp table tr.x-date-mp-btns td button.x-date-mp-ok:hover {
				background: {{action-color:hover}} !important;
			}
		',

		'selection-color' => '
			/*********************************************************************
			 * Selected items in grids and trees
			 * =================================
			 * The background color of the selected items in grids and trees can
			 * be changed to better suit the theme.
			 *********************************************************************/
			/* selected item in grids */
			.x-grid3-row.x-grid3-row-selected,
			.x-grid3 .x-grid3-row-selected .grommunio-grid-button-container,
			/* selected item in tree hierarchies */
			.x-tree-node .grommunio-hierarchy-node.x-tree-selected,
			/* selected items in boxfields (e.g. the recipient fields) */
			.x-grommunio-boxfield ul .x-grommunio-boxfield-item-focus,
			.x-grommunio-boxfield ul .x-grommunio-boxfield-recipient-item.x-grommunio-boxfield-item-focus,
			/* selected items in card view of Contacts context */
			div.grommunio-contact-cardview-selected,
			/* selected items in icon view of Notes context */
			.grommunio-note-iconview-selected,
			/* selected category in the Settings context */
			#grommunio-mainpanel-contentpanel-settings .grommunio-settings-category-panel .grommunio-settings-category-tab-active,
			/* selected date in date pickers */
			.x-date-picker .x-date-inner td.x-date-selected:not(.x-date-today) a,
			.x-date-picker .x-date-inner td.x-date-selected:not(.x-date-today) a:hover {
				background-color: {{selection-color}} !important;
				border-color: {{selection-color}};
			}

			/* Selected x-menu */
			.x-menu-item-selected {
			background-color: {{selection-color}};
			}

			/*********************************************************************
			 * Extra information about items
			 * =================================
			 * Sometimes extra information is shown in opened items. (e.g. "You replied
			 * to this message etc"). This can be styled with the following rules.
			 *********************************************************************/
			.preview-header-extrainfobox,
			.preview-header-extrainfobox-item,
			.k-appointmentcreatetab .grommunio-calendar-appointment-extrainfo div,
			.k-taskgeneraltab .grommunio-calendar-appointment-extrainfo div,
			.grommunio-mailcreatepanel > .x-panel-bwrap > .x-panel-body .grommunio-mailcreatepanel-extrainfo div {
				background: {{selection-color}} !important;
			}

			/* Selected mail item */
			.k-unreadborders .x-grid3-row.x-grid3-row-expanded.mail_read.x-grid3-row-selected > table {
			        border-left: 4px solid {{selection-color}} !important;
			}

			/* Hover selected item */
			.k-unreadborders .x-grid3-row.x-grid3-row-expanded.mail_read.x-grid3-row-selected.x-grid3-row-over > table,
			.k-unreadborders .x-grid3-row.x-grid3-row-collapsed.mail_read.x-grid3-row-selected > table {
			        border-left: 4px solid {{selection-color}} !important;
			}
		',

		'selection-text-color' => '
			/*********************************************************************
			 * Extra information about items
			 * =================================
			 * Sometimes extra information is shown in opened items. (e.g. "You replied
			 * to this message etc"). This can be styled with the following rules.
			 *********************************************************************/
			.preview-header-extrainfobox,
			.preview-header-extrainfobox-item,
			.k-appointmentcreatetab .grommunio-calendar-appointment-extrainfo div,
			.k-taskgeneraltab .grommunio-calendar-appointment-extrainfo div,
			.grommunio-mailcreatepanel > .x-panel-bwrap > .x-panel-body .grommunio-mailcreatepanel-extrainfo div {
				color: {{selection-text-color}};
			}
		',

		'focus-color' => '
			/*********************************************************************
			 * Focused items
			 * =================================
			 *********************************************************************/
			/* Normal button */
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) ~ .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-focus:not(.grommunio-action):not(.x-btn-over):not(.x-btn-click) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) ~ .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-focus:not(.grommunio-action):not(.x-btn-over):not(.x-btn-click) .x-btn-small,
			.x-btn.x-btn-focus:not(.grommunio-action):not(.x-btn-click) .x-btn-small,
			.x-btn.x-btn-focus:not(.grommunio-action):not(.x-btn-click) .x-btn-medium,
			.x-btn.x-btn-focus:not(.grommunio-action):not(.x-btn-click) .x-btn-large,
			.x-toolbar .x-btn.x-btn-focus:not(.grommunio-action):not(.x-btn-noicon) .x-btn-small {
			border: 1px solid {{focus-color}} !important;
			}
			/* Login */
			body.login #form-container input:focus,
			#loading-mask #form-container input:focus {
			border-color: {{focus-color}};
			}
			input:focus {
				border-color: {{focus-color}};
			}
			/* Form elements */
			.x-form-text.x-form-focus:not(.x-trigger-noedit) {
				border-color: {{focus-color}} !important;
			}
			.x-form-field-wrap.x-trigger-wrap-focus:not(.x-freebusy-userlist-container) {
				border-color: {{focus-color}};
			}
			input.x-form-text.x-form-field.x-form-focus {
				border-color: {{focus-color}} !important;
			}
			.x-form-field-wrap.x-trigger-wrap-focus:not(.x-freebusy-userlist-container) input.x-form-text.x-form-field.x-form-focus {
			border-color: {{focus-color}} !important;
			}
		',

		'logo-large' => '
			/* The logo in the Login screen. Maximum size of the logo image is 220x60px. */
			body.login #form-container #logo,
			#loading-mask #form-container #logo {
				background: url({{logo-large}}) no-repeat right center;
				background-size: contain;
			}
		',

		'logo-small' => '
			/****************************************************************************
			 * The logo (shown on the right below the top bar)
			 * ===============================================
			 * The maximum height of the image that can be shown is 45px.
			 ****************************************************************************/
			.grommunio-maintoolbar {
				background-image: url({{logo-small}});
				background-size: auto 38px;
			}
		',

		/* Dark mode gives the stock logo a light variant; a branded deployment has its
		   own. The selector matches the one in darkmode.css and this block comes after
		   it, so it wins without !important. */
		'logo-small:dark' => '
			body.dark-mode .grommunio-maintoolbar {
				background-image: url({{logo-small:dark}});
				background-size: auto 38px;
			}
		',

		'background-image' => '
			/*********************************************************************************************
			 * The Login screen and the Welcome screen
			 * =======================================
			 ********************************************************************************************/
			/* Background image of the login screen */
			body.login,
			#loading-mask,
			#bg,
			/* Background image of the Welcome screen */
			body.grommunio-welcome {
				background: url({{background-image}}) no-repeat center center;
				background-size: cover;
			}
		',

		'spinner-image' => '
			/* The spinner of the login/loading screen. The one inside the application
			   is drawn from --theme-spinner-image, which getVariables() sets. */
			body.login #form-container.loading .right,
			#loading-mask #form-container.loading .right {
				background: url({{spinner-image}}) no-repeat center center;
			}
		',
	];
}
