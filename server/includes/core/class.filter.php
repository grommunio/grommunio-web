<?php
	require_once(__DIR__ . '/htmlfilter.php');

	/**
	 * Filters text messages for various uses
	 *
	 * @package core
	 */
	class filter
	{
		/**
		 * Create script-safe HTML from raw HTML
		 *
		 * @param string $html The HTML text
		 * @return string safe html
		 */
		function safeHTML($html)
		{
			// Save all "<" symbols
			$html = preg_replace("/<(?=[^a-zA-Z\/\!\?\%])/", "&lt;", $html);

			if(!DISABLE_HTMLBODY_FILTER){
				// Filter '<script>'
				$html = magicHTML($html);
			}

			return $html;
		}

		/**
		 * Filter scripts from HTML
		 *
		 * @access private
		 * @param string $str string which should be filtered
		 * @return string string without any script tags
		 */
		function filterScripts($str)
		{
			return magicHTML($str, 0);
		}
	}
?>
