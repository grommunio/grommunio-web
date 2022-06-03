<?php

	require_once __DIR__ . '/htmlfilter.php';

	/**
	 * Filters text messages for various uses.
	 */
	class filter {
		/**
		 * A boolean value set true to Filter html content forcefully default is false.
		 *
		 * @var bool
		 */
		private $forceFilterHTML;

		public function __construct($forceFilterHTML = false) {
			$this->forceFilterHTML = $forceFilterHTML;
		}

		/**
		 * Create script-safe HTML from raw HTML.
		 *
		 * @param string $html The HTML text
		 *
		 * @return string safe html
		 */
		public function safeHTML($html) {
			// Save all "<" symbols
			$html = preg_replace("/<(?=[^a-zA-Z\\/\\!\\?\\%])/", "&lt;", $html);

			if (ENABLE_HTMLBODY_FILTER && (!ENABLE_DOMPURIFY_FILTER || $this->forceFilterHTML)) {
				// Filter '<script>'
				$html = magicHTML($html);
			}
			else {
				$html = preg_replace("/<script.*>.*<\\/script>/isU ", " ", $html);
			}

			return $html;
		}

		/**
		 * Filter scripts from HTML.
		 *
		 * @param string $str string which should be filtered
		 *
		 * @return string string without any script tags
		 */
		public function filterScripts($str) {
			return magicHTML($str, 0);
		}
	}
