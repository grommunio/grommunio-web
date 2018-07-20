<?php
define('ICONSETS_PATH', 'client/resources/iconsets');

/**
 * This class provides some functionality for theming the WebApp
 */
class Iconsets {
	/**
	 * A hash that is used to cache the properties of iconsets
	 * @property
	 */
	private static $iconsetsCache = [];

	/**
	 * Retrieves all installed iconsets
	 * @return Array An array with the directory names of the iconsets as keys and their display names
	 * as values
	 */
	public static function getIconsets() {
		if ( empty(Iconsets::$iconsetsCache) ) {
			$baseDirs = [
				BASE_PATH . constant('ICONSETS_PATH'),
				BASE_PATH . PATH_PLUGIN_DIR
			];
			foreach ( $baseDirs as $dir ){
				$directoryIterator = new DirectoryIterator($dir);
				foreach ( $directoryIterator as $info ) {
					if ( $info->isDot() || !$info->isDir() ) {
						continue;
					}

					if ( !is_file($info->getPathname() . DIRECTORY_SEPARATOR . 'iconset.json') ){
						continue;
					}

					$props = Iconsets::getProps($info->getPathname(), $info->getFileName());
					if ( !$props ) {
						continue;
					}
					if ( !isset($props['stylesheet']) ) {
						// We cannot do anything with an iconset without a stylesheet
						continue;
					}

					if ( !isset($props['display-name']) ) {
						$props['display-name'] = $info->getFileName();
					}

					$props['stylesheet'] = substr($info->getPathname(), strlen(BASE_PATH)) . DIRECTORY_SEPARATOR . $props['stylesheet'];

					Iconsets::$iconsetsCache[$info->getFileName()] = $props;
				}
			}
		}

		return Iconsets::$iconsetsCache;
	}

	/**
	 * Returns the name of the active iconset if one was found, and false otherwise.
	 * The active iconset can be set by the admin in the config.php, or by
	 * the user in his settings.
	 * @return String|Boolean
	 */
	public static function getActiveIconset() {
		$iconset = false;
		$installedIconsets = Iconsets::getIconsets();

		// First check if a iconset was set by this user in his settings
		if ( WebAppAuthentication::isAuthenticated() ) {
			$iconset = $GLOBALS['settings']->get('zarafa/v1/main/active_iconset');

			if ( !isset($iconset) || empty($iconset) || !array_key_exists($iconset, $installedIconsets) ){
				$iconset = false;
			}
		}

		// If a valid iconset was not found in the settings of the user, let's see if a one
		// was defined by the admin.
		if ( !$iconset && defined('ICONSET') && ICONSET && array_key_exists(ICONSET, $installedIconsets) ){
			$iconset = ICONSET;
		}

		// If no valid iconset was found, we'll use the default one
		if ( !$iconset ) {
			$iconset = 'classic';
		}

		return $iconset;
	}

	/**
	 * Returns the stylesheet of the active icon set
	 * @return String The stylesheet of the active icon set
	 */
	public static function getActiveStylesheet() {
		$iconsets = Iconsets::getIconsets();
		$activeIconset = Iconsets::getActiveIconset();
		return $iconsets[$activeIconset]['stylesheet'];
	}

	/**
	 * Returns an array with the about texts of the iconsets
	 * @return Array An array with the ids of the iconsets as keys and
	 * an array with the display name and the about text as values.
	 */
	public static function getAboutTexts() {
		$iconsets = Iconsets::getIconsets();
		$about = [];
		foreach ( $iconsets as $i ) {
			if ( !empty($i['about']) ) {
				$about[$i['id']] = Array(
					'displayName' => $i['display-name'],
					'about' => $i['about'],
				);
			}
		}

		return $about;
	}

	/**
	 * Retrieves the properties set in the iconset.json file of the iconset.
	 * @param String $dir The directory of the iconset for which the properties should be retrieved
	 * @return Array The array of properties defined in the iconset.json file or false if the json
	 * was unparsable.
	 */
	public static function getProps($dir, $id) {
		// Check if we have the props in the cache before reading the file
		if ( !isset(Iconsets::$iconsetsCache[$id]) ) {
			$json = file_get_contents($dir . DIRECTORY_SEPARATOR . '/iconset.json');
			$props = json_decode($json, true);

			if ( json_last_error() !== JSON_ERROR_NONE ) {
				error_log("The iconset '$id' does not have a valid iconset.json file. " . json_last_error_msg());
				return false;
			}
		}

		return $props;
	}
}
?>
