<?php
namespace Files\Backend\Webdav;

require_once __DIR__ . "/../class.abstract_css_loader.php";

use Files\Backend\AbstractCSSLoader;

class BackendCSSLoader extends AbstractCSSLoader
{
	function __construct()
	{
		$this->CSS_PATH = __DIR__ . "/css/";
	}

	/**
	 * Returns a combined CSS String
	 *
	 * @param bool $debug
	 * @return string
	 */
	public function get_combined_css($debug = false)
	{
		// Populate the list of directories to check against
		if (($directoryHandle = opendir($this->CSS_PATH)) !== FALSE) {
			while (($file = readdir($directoryHandle)) !== false) {
				// Make sure we're not dealing with a folder or a link to the parent directory
				if (is_dir($this->CSS_PATH . $file) || ($file == '.' || $file == '..') === true) {
					continue;
				}

				// Add file content to our buffer
				$this->cssBuffer .= file_get_contents($this->CSS_PATH . $file);
			}
		}

		return $this->cssBuffer;
	}
}