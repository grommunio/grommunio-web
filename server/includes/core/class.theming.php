<?php

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

		return $theme;
	}
	
	/**
	 * Returns the path to the favicon if included with the theme. If found the 
	 * path to it will be returned. Otherwise false.
	 * @param String the name of the theme for which the css will be returned.
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
	 * @param String the name of the theme for which the css will be returned.
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
}
