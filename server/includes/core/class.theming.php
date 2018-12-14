<?php

require_once(__DIR__ . '/class.colors.php');

// The themes are moved to a different location when released
// so we will define these constants for their location
define('THEME_PATH_' . LOAD_SOURCE, 'client/zarafa/core/themes');
define('THEME_PATH_' . LOAD_DEBUG, 'client/themes');
define('THEME_PATH_' . LOAD_RELEASE, 'client/themes');

/**
 * This class provides some functionality for theming the WebApp
 */
class Theming
{
	/**
	 * A hash that is used to cache if a theme is a json theme
	 * @property
	 */
	private static $isJsonThemeCache = [];

	/**
	 * A hash that is used to cache the properties of json themes
	 * @property
	 */
	private static $jsonThemePropsCache = [];

	/**
	 * Retrieves all installed json themes
	 * @return Array An array with the directory names of the json themes as keys and their display names
	 * as values
	 */
	public static function getJsonThemes() {
		$themes = [];
		$directoryIterator = new DirectoryIterator(BASE_PATH . PATH_PLUGIN_DIR);
		foreach ( $directoryIterator as $info ) {
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

			$themes[$info->getFileName()] = isset($themeProps['display-name']) ? $themeProps['display-name'] : $info->getFileName();
		}

		return $themes;
	}

	/**
	 * Returns the name of the active theme if one was found, and false otherwise.
	 * The active theme can be set by the admin in the config.php, or by
	 * the user in his settings.
	 * @return String|Boolean
	 */
	public static function getActiveTheme() {
		$theme = false;
		$themePath = BASE_PATH . constant('THEME_PATH_' . DEBUG_LOADER);

		// First check if a theme was set by this user in his settings
		if ( WebAppAuthentication::isAuthenticated() ){
			$theme = $GLOBALS['settings']->get('zarafa/v1/main/active_theme');

			// If a theme was found, check if the theme is still installed
			// Remember that 'basic' is not a real theme, but the name for the default look of WebApp
			// Note 1: We will first try to find the a core theme with this name, only
			// when we don't find one, we will try to find a theme plugin.
			// Note 2: we do not use the pluginExists method of the PluginManager, because that
			// would not find packs with multiple plugins in it. So instead we just check if
			// the directory exists.
			if (
				isset($theme) && !empty($theme) && $theme!=='basic'
				&& !is_dir($themePath . '/' . $theme)
				&& !is_dir(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme)
			){
				$theme = false;
			}
		}


		// If a valid theme was not found in the settings of the user, let's see if a valid theme
		// was defined by the admin.
		if ( !$theme && defined('THEME') && THEME ){
			$theme = is_dir($themePath . '/' . THEME) || is_dir(BASE_PATH . PATH_PLUGIN_DIR . '/' . THEME) ? THEME : false;
		}

		if ( Theming::isJsonTheme($theme) && !is_array(Theming::getJsonThemeProps($theme)) ) {
			// Someone made an error, we cannot read this json theme
			return false;
		}

		return $theme;
	}

	/**
	 * Returns the path to the favicon if included with the theme. If found the
	 * path to it will be returned. Otherwise false.
	 * @param String $theme the name of the theme for which the css will be returned.
	 * Note: This is the directory name of the theme plugin.
	 * 	 * @return String|Boolean
	 */
	public static function getFavicon($theme) {
		$themePath = constant('THEME_PATH_' . DEBUG_LOADER);

		// First check if we can find a core theme with this name
		if ( $theme && is_dir(BASE_PATH . $themePath . '/' . $theme) && is_file(BASE_PATH . $themePath . '/' . $theme . '/favicon.ico') ){
			// Add a date as GET parameter, so we will fetch a new icon every day
			// This way themes can update the favicon and it will show the next day latest.
			return $themePath . '/' . $theme . '/favicon.ico?' . date('Ymd');
		}

		// If no core theme was found, let's try to find a theme plugin with this name
		if ( $theme && is_dir(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme) && is_file(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme . '/favicon.ico') ){
			// Add a date as GET parameter, so we will fetch a new icon every day
			// This way themes can update the favicon and it will show the next day latest.
			return PATH_PLUGIN_DIR . '/' . $theme . '/favicon.ico?' . date('Ymd');
		}

		return false;
	}

	/**
	 * Returns the contents of the css files in the $theme as a string
	 * @param String $theme the name of the theme for which the css will be returned.
	 * Note: This is the directory name of the theme plugin.
	 * @return String
	 */
	public static function getCss($theme) {
		$themePathCoreThemes = BASE_PATH . constant('THEME_PATH_' . DEBUG_LOADER);
		$cssFiles = array();

		// First check if this is a core theme, and if it isn't, check if it is a theme plugin
		if ( $theme && is_dir($themePathCoreThemes . '/' . $theme) ){
			$themePath = $themePathCoreThemes . '/' . $theme;
		} elseif ( $theme && is_dir(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme) ){
			if ( Theming::isJsonTheme($theme) ) {
				return [];
			}
			$themePath = BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme;
		}

		if ( isset($themePath) ){

			// Use SPL iterators to recursively traverse the css directory and find all css files
			$directoryIterator = new RecursiveDirectoryIterator($themePath . '/css/', FilesystemIterator::SKIP_DOTS);
			$iterator = new RecursiveIteratorIterator($directoryIterator, RecursiveIteratorIterator::SELF_FIRST);

			// Always rewind an iterator before using it!!! See https://bugs.php.net/bug.php?id=62914 (it might save you a couple of hours debugging)
			$iterator->rewind();
			while ( $iterator->valid() ) {
				$fileName = $iterator->getFilename();
				if ( !$iterator->isDir() && (strtolower($iterator->getExtension())==='css' || substr($fileName, -8)==='.css.php' ) ){
					$cssFiles[] = substr($iterator->key(), strlen(BASE_PATH));
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
	 * @return String The value that the active theme has set for the property,
	 * or NULL.
	 */
	public static function getThemeProperty($propName) {
		$theme = Theming::getActiveTheme();
		if ( !Theming::isJsonTheme($theme) ) {
			return false;
		}

		$props = Theming::getJsonThemeProps($theme);
		if ( !isset($props[$propName]) ) {
			return false;
		}

		return $props[$propName];
	}

	/**
	 * Returns the color that the active theme has set for the primary color
	 * of the icons. Currently only supported for JSON themes.
	 * Note: Only SVG icons of an iconset that has defined the primary color
	 * can be 'recolored'.
	 * @return String The color that the active theme has set for the primary
	 * color of the icons, or FALSE.
	 */
	public static function getPrimaryIconColor() {
		$val = Theming::getThemeProperty('icons-primary-color');

		return $val !== null ? $val : false;
	}

	/**
	 * Returns the color that the active theme has set for the secondary color
	 * of the icons. Currently only supported for JSON themes.
	 * Note: Only SVG icons of an iconset that has defined the secondary color
	 * can be 'recolored'.
	 * @return String The color that the active theme has set for the secondary
	 * color of the icons, or FALSE.
	 */
	public static function getSecondaryIconColor() {
		$val = Theming::getThemeProperty('icons-secondary-color');

		return $val !== null ? $val : false;
	}

	/**
	 * Checks if a theme is a JSON theme. (Basically this means that it checks if a
	 * directory with the theme name exists and if that directory contains a file
	 * called theme.json)
	 * @param String $theme The name of the theme to check
	 * @return Boolean True if the theme is a json theme, false otherwise
	 */
	public static function isJsonTheme($theme) {
		if ( empty($theme) ) {
			return false;
		}

		if ( !isset(Theming::$isJsonThemeCache[$theme]) ) {
			$themePathCoreThemes = BASE_PATH . constant('THEME_PATH_' . DEBUG_LOADER);

			// First check if this is a core theme, and if it isn't, check if it is a theme plugin
			if ( is_dir($themePathCoreThemes . '/' . $theme) ){
				// We don't have core json themes, so return false
				Theming::$isJsonThemeCache[$theme] = false;
			} elseif ( is_dir(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme) && is_file(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme . '/theme.json') ){
				Theming::$isJsonThemeCache[$theme] = true;
			} else {
				Theming::$isJsonThemeCache[$theme] = false;
			}
		}

		return Theming::$isJsonThemeCache[$theme];
	}

	/**
	 * Retrieves the properties set in the theme.json file of the theme.
	 * @param String $theme The theme for which the properties should be retrieved
	 * @return Array The decoded array of properties defined in the theme.json file
	 */
	public static function getJsonThemeProps($theme) {
		if ( !Theming::isJsonTheme($theme) ) {
			return false;
		}

		// Check if we have the props in the cache before reading the file
		if ( !isset(Theming::$jsonThemePropsCache[$theme]) ) {
			$json = file_get_contents(BASE_PATH . PATH_PLUGIN_DIR . '/' . $theme . '/theme.json');
			Theming::$jsonThemePropsCache[$theme] = json_decode($json, true);

			if ( json_last_error() !== JSON_ERROR_NONE ) {
				error_log("The theme '$theme' does not have a valid theme.json file. " . json_last_error_msg());
				Theming::$jsonThemePropsCache[$theme] = '';
			}
		}

		return Theming::$jsonThemePropsCache[$theme];
	}

	/**
	 * Normalizes all defined colors in a JSON theme to valid hex colors
	 * @param Array $themeProps A hash with the properties defined a theme.json file
	 */
	private static function normalizeColors($themeProps) {
		$colorKeys = [
			'primary-color',
			'primary-color:hover',
			'mainbar-text-color',
			'action-color',
			'action-color:hover',
			'selection-color',
			'selection-text-color',
			'focus-color',
		];
		foreach ( $colorKeys as $ck ) {
			$themeProps[$ck] = isset($themeProps[$ck]) ? Colors::getHexColorFromCssColor($themeProps[$ck]) : null;
		}

		return $themeProps;
	}

	/**
	 * Utility function to fix relative urls in JSON themes
	 * @param String $url the url to be fixed
	 * @param String $theme the name of the theme the url is part of
	 */
	private static function fixUrl($url, $theme) {
		// the url is absolute we don't have to fix anything
		if ( preg_match('/^https?:\/\//', $url) ) {
			return $url;
		}

		return PATH_PLUGIN_DIR . '/' . $theme .'/' . $url;
	}

	/**
	 * Retrieves the styles that should be added to the page for the json theme
	 * @param String $theme The theme for which the properties should be retrieved
	 * @return String The styles (between <style> tags)
	 */
	public static function getStyles($theme) {
		$styles = '';
		if ( !Theming::isJsonTheme($theme) ) {
			$css = Theming::getCss($theme);
			foreach ( $css as $file ){
				$styles .= '<link rel="stylesheet" type="text/css" href="'.$file.'" />'."\n";
			}
			return $styles;
		}

		// Convert the json theme to css styles
		$themeProps = Theming::getJsonThemeProps($theme);
		if ( !$themeProps ) {
			return $styles;
		}

		$themeProps = Theming::normalizeColors($themeProps);

		if ( $themeProps['primary-color'] ) {
			if ( !$themeProps['primary-color:hover'] ) {
				$themeProps['primary-color:hover'] = Colors::darker($themeProps['primary-color'], 10);
			}

			if ( !$themeProps['mainbar-text-color'] ) {
				// Check if the main bar is not too light for white text (i.e. the default color)
				if ( Colors::getLuma($themeProps['primary-color']) > 155 ) {
					$themeProps['mainbar-text-color'] = '#000000';
				}
			}

			if ( !$themeProps['selection-color'] ) {
				$themeProps['selection-color'] = Colors::setLuminance($themeProps['primary-color'], 80);
			}
		}
		if ( $themeProps['action-color'] && !$themeProps['action-color:hover'] ) {
			$themeProps['action-color:hover'] = Colors::darker($themeProps['action-color'], 10);
		}
		// Set a text color for the selection-color
		$hsl = Colors::rgb2hsl($themeProps['selection-color']);
		if ( $hsl['l'] > 50 ) {
			$hsl['l'] = 5;
		} else {
			$hsl['l'] = 95;
		}
		$themeProps['selection-text-color'] = Colors::colorObject2string(Colors::hsl2rgb($hsl));

		if ( isset($themeProps['background-image']) ) {
			$themeProps['background-image'] = Theming::fixUrl($themeProps['background-image'], $theme);
		}
		if ( isset($themeProps['logo-large']) ) {
			$themeProps['logo-large'] = Theming::fixUrl($themeProps['logo-large'], $theme);
		}
		if ( isset($themeProps['logo-small']) ) {
			$themeProps['logo-small'] = Theming::fixUrl($themeProps['logo-small'], $theme);
		}
		if ( isset($themeProps['logo-large']) && !isset($themeProps['logo-small']) ) {
			$themeProps['logo-small'] = $themeProps['logo-large'];
		}
		if ( isset($themeProps['spinner-image']) ) {
			$themeProps['spinner-image'] = Theming::fixUrl($themeProps['spinner-image'], $theme);
		}
		$styles = '<style>';
		foreach ( $themeProps as $k => $v ) {
			if ( $v && isset(Theming::$styles[$k]) ) {
				$styles .= str_replace("{{{$k}}}", htmlspecialchars($v), Theming::$styles[$k]);
			}
		}
		$styles .= '</style>'."\n";

		// Add the defined stylesheets
		if ( isset($themeProps['stylesheets']) ) {
			if ( is_string($themeProps['stylesheets']) ) {
				$stylesheets = explode(' ', $themeProps['stylesheets']);
			} elseif ( is_array($themeProps['stylesheets']) ) {
				$stylesheets = $themeProps['stylesheets'];
			}
			foreach ( $stylesheets as $stylesheet ) {
				if ( is_string($stylesheet) ) {
					$stylesheet = trim($stylesheet);
					if ( empty($stylesheet) ) {
						continue;
					}
					$styles .= "\t\t".'<link rel="stylesheet" type="text/css" href="'.htmlspecialchars(Theming::fixUrl($stylesheet, $theme)).'" />'."\n";
				}
			}
		}

		return $styles;
	}

	/**
	 * The templates of the styles that a json theme can add to the page
	 * @property
	 */
	private static $styles = array(
		'primary-color' => '
			/* The Sign in button of the login screen */
			body.login #form-container #submitbutton,
			#loading-mask #form-container #submitbutton {
				background: {{primary-color}};
			}

			/* The top bar of the Welcome dialog */
			.zarafa-welcome-body > .x-panel-bwrap > .x-panel-body div.zarafa-welcome-title {
				border-left: 1px solid {{primary-color}};
				border-right: 1px solid {{primary-color}};
				background: {{primary-color}};
			}

			/* The border line under the top menu bar */
			body #zarafa-mainmenu {
				border-color: {{primary-color}};
			}
			/* The background color of the top menu bar */
			body #zarafa-mainmenu.zarafa-maintabbar > .x-toolbar-ct {
				background-color: {{primary-color}};
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
			body #zarafa-mainmenu.zarafa-maintabbar > .x-toolbar-ct .x-btn.x-btn-over,
			/* Background color of the active state of the buttons (i.e. when the buttons get clicked) */
			body #zarafa-mainmenu.zarafa-maintabbar > .x-toolbar-ct .x-btn.x-btn-over.x-btn-click,
			/* Background color of the selected button */
			body #zarafa-mainmenu.zarafa-maintabbar > .x-toolbar-ct .zarafa-maintabbar-maintab-active,
			/* Background color of the hover state of selected button */
			body #zarafa-mainmenu.zarafa-maintabbar > .x-toolbar-ct .zarafa-maintabbar-maintab-active.x-btn-over,
			/* Background color of the active state of selected button */
			body #zarafa-mainmenu.zarafa-maintabbar > .x-toolbar-ct .zarafa-maintabbar-maintab-active.x-btn-over.x-btn-click {
				background-color: {{primary-color:hover}} !important;
			}
		',

		'mainbar-text-color' => '
			body #zarafa-mainmenu.zarafa-maintabbar > .x-toolbar-ct,
			/* Text color of the buttons in the top menu bar */
			body #zarafa-mainmenu.zarafa-maintabbar > .x-toolbar-ct .x-btn button.x-btn-text,
			body #zarafa-mainmenu.zarafa-maintabbar > .x-toolbar-ct .x-btn-over button.x-btn-text,
			body #zarafa-mainmenu.zarafa-maintabbar > .x-toolbar-ct .x-btn-over.x-btn-click button.x-btn-text,
			/* Text color of the selected button in the top menu bar */
			body #zarafa-mainmenu.zarafa-maintabbar > .x-toolbar-ct .zarafa-maintabbar-maintab-active button.x-btn-text,
			body #zarafa-mainmenu.zarafa-maintabbar > .x-toolbar-ct .zarafa-maintabbar-maintab-active.x-btn-over button.x-btn-text,
			body #zarafa-mainmenu.zarafa-maintabbar > .x-toolbar-ct .zarafa-maintabbar-maintab-active.x-btn-over.x-btn-click button.x-btn-text {
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
			.x-btn.zarafa-action .x-btn-small,
			.x-btn.zarafa-action .x-btn-medium,
			.x-btn.zarafa-action .x-btn-large,
			/* Buttons, active state */
			.x-btn.zarafa-action.x-btn-over.x-btn-click .x-btn-small,
			.x-btn.zarafa-action.x-btn-over.x-btn-click .x-btn-medium,
			.x-btn.zarafa-action.x-btn-over.x-btn-click .x-btn-large,
			.x-btn.zarafa-action.x-btn-click .x-btn-small,
			.x-btn.zarafa-action.x-btn-click .x-btn-medium,
			.x-btn.zarafa-action.x-btn-click .x-btn-large,
			/* Special case: Popup, Windows, or Messageboxes (first button is by default styled as the action button) */
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.zarafa-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.zarafa-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.zarafa-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.zarafa-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.zarafa-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.zarafa-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.zarafa-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.zarafa-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.zarafa-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.zarafa-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.zarafa-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.zarafa-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.zarafa-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.zarafa-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.zarafa-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.zarafa-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.zarafa-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.zarafa-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.zarafa-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.zarafa-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.zarafa-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.zarafa-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.zarafa-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.zarafa-normal) .x-btn-large,
			/* Current day in the calendar */
			.zarafa-calendar-container-header .zarafa-canvas-header-background .zarafa-styling-element-active,
			.zarafa-calendar-container-header .zarafa-canvas-header-background .zarafa-styling-element-current-day,
			/* Current day in the calendar */
			.zarafa-freebusy-panel .x-freebusy-timeline-container .x-freebusy-header .x-freebusy-header-body .x-freebusy-timeline-day.x-freebusy-timeline-day-current,
			.zarafa-freebusy-panel .x-freebusy-timeline-container .x-freebusy-header .x-freebusy-header-body .x-freebusy-timeline-day.x-freebusy-timeline-day-current table,
			.zarafa-freebusy-panel .x-freebusy-timeline-container .x-freebusy-header .x-freebusy-header-body .x-freebusy-timeline-day.x-freebusy-timeline-day-current table tr.x-freebusy-timeline-day td,
			/* The date pickers */
			.x-date-picker .x-date-inner td.x-date-today a,
			.x-date-picker .x-date-mp table td.x-date-mp-sel a,
			.x-date-picker .x-date-mp table tr.x-date-mp-btns td button.x-date-mp-ok {
				background: {{action-color}} !important;
			}
			/* Focussed Action button */
			.x-btn.zarafa-action.x-btn-focus .x-btn-small, .x-btn.zarafa-action.x-btn-focus .x-btn-medium, .x-btn.zarafa-action.x-btn-focus .x-btn-large {
				background: {{action-color}} !important;
			}
		',

		'action-color:hover' => '
			/* Buttons, hover state */
			.x-btn.zarafa-action.x-btn-over .x-btn-small,
			.x-btn.zarafa-action.x-btn-over .x-btn-medium,
			.x-btn.zarafa-action.x-btn-over .x-btn-large,
			/* Special case: Popup, Windows, or Messageboxes */
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.zarafa-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.zarafa-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.zarafa-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.zarafa-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.zarafa-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.zarafa-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.zarafa-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.zarafa-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.zarafa-normal) .x-btn-large,
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
			.x-grid3 .x-grid3-row-selected .zarafa-grid-button-container,
			/* selected item in tree hierarchies */
			.x-tree-node .zarafa-hierarchy-node.x-tree-selected,
			/* selected items in boxfields (e.g. the recipient fields) */
			.x-zarafa-boxfield ul .x-zarafa-boxfield-item-focus,
			.x-zarafa-boxfield ul .x-zarafa-boxfield-recipient-item.x-zarafa-boxfield-item-focus,
			/* selected items in card view of Contacts context */
			div.zarafa-contact-cardview-selected,
			/* selected items in icon view of Notes context */
			.zarafa-note-iconview-selected,
			/* selected category in the Settings context */
			#zarafa-mainpanel-contentpanel-settings .zarafa-settings-category-panel .zarafa-settings-category-tab-active,
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
			.k-appointmentcreatetab .zarafa-calendar-appointment-extrainfo div,
			.k-taskgeneraltab .zarafa-calendar-appointment-extrainfo div,
			.zarafa-mailcreatepanel > .x-panel-bwrap > .x-panel-body .zarafa-mailcreatepanel-extrainfo div {
				background: {{selection-color}} !important;
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
			.k-appointmentcreatetab .zarafa-calendar-appointment-extrainfo div,
			.k-taskgeneraltab .zarafa-calendar-appointment-extrainfo div,
			.zarafa-mailcreatepanel > .x-panel-bwrap > .x-panel-body .zarafa-mailcreatepanel-extrainfo div {
				color: {{selection-text-color}};
			}
		',

		'focus-color' => '
			/*********************************************************************
			 * Focused items
			 * =================================
			 *********************************************************************/
			/* Normal button */
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) ~ .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-focus:not(.zarafa-action):not(.x-btn-over):not(.x-btn-click) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) ~ .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-focus:not(.zarafa-action):not(.x-btn-over):not(.x-btn-click) .x-btn-small,
			.x-btn.x-btn-focus:not(.zarafa-action):not(.x-btn-click) .x-btn-small,
			.x-btn.x-btn-focus:not(.zarafa-action):not(.x-btn-click) .x-btn-medium,
			.x-btn.x-btn-focus:not(.zarafa-action):not(.x-btn-click) .x-btn-large,
			.x-toolbar .x-btn.x-btn-focus:not(.zarafa-action):not(.x-btn-noicon) .x-btn-small {
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
			.zarafa-maintoolbar {
				background-image: url({{logo-small}});
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
			body.zarafa-welcome {
				background: url({{background-image}}) no-repeat center center;
				background-size: cover;
			}
		',

		'spinner-image' => '
			/* The spinner of the login/loading screen */
			body.login #form-container.loading .right,
			#loading-mask #form-container.loading .right {
				background: url({{spinner-image}}) no-repeat center center;
			}
		'
	);
}
