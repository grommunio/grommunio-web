<?php

/**
 * CategoryList - the per-mailbox master category list.
 *
 * Outlook/Exchange store the list of available categories (name + colour) once
 * per mailbox, as a hidden associated (FAI) message of class
 * "IPM.Configuration.CategoryList" in the mailbox's Calendar folder. The
 * definitions live in the PR_ROAMING_XMLSTREAM property as an XML document.
 * Because it is stored in the mailbox itself, every client - and every user who
 * opens that mailbox - shares the same list. grommunio Web historically kept
 * its category list in per-user WebApp settings instead; this class reads and
 * writes the Outlook-compatible per-mailbox list so the two interoperate.
 *
 * The class speaks the grommunio Web category shape
 * ({name, color, standardIndex, quickAccess, sortIndex, used}) on its public
 * API and the Outlook XML shape on disk, translating between them. Outlook's
 * per-category bookkeeping (guid, usageCount, lastTimeUsed*, keyboardShortcut,
 * renameOnFirstUse) is preserved verbatim across web edits by merging incoming
 * categories onto the categories already stored, matched by guid then by name.
 */
class CategoryList {
	/**
	 * Message class of the FAI configuration message holding the list.
	 */
	const MESSAGE_CLASS = 'IPM.Configuration.CategoryList';

	/**
	 * grommunio Web's placeholder colour for "no colour chosen". Categories
	 * carrying it are treated as uncoloured rather than mapped to the palette.
	 */
	const DEFAULT_COLOR = '#BDC3C7';

	/**
	 * Outlook OlCategoryColor palette: index (as written in the XML `color`
	 * attribute) => RGB hex used to render the swatch. The first entries reuse
	 * grommunio Web's own hex values for the six flag-mapped colours so the UI
	 * renders them unchanged; the remainder are close approximations of
	 * Outlook's palette and can be tuned without touching any other code.
	 */
	private static $palette = [
		0  => '#e40023', // Red
		1  => '#f99406', // Orange
		2  => '#fbd5a6', // Peach
		3  => '#f7ca17', // Yellow
		4  => '#5ab556', // Green
		5  => '#26a0a0', // Teal
		6  => '#a4b34d', // Olive
		7  => '#0f70bd', // Blue
		8  => '#912887', // Purple
		9  => '#a6014e', // Maroon
		10 => '#9da3af', // Steel
		11 => '#64738b', // Dark Steel
		12 => '#b0b0b0', // Gray
		13 => '#6e6e6e', // Dark Gray
		14 => '#4c4c4c', // Black
		15 => '#8c1015', // Dark Red
		16 => '#c15a00', // Dark Orange
		17 => '#c79860', // Dark Peach
		18 => '#b8860b', // Dark Yellow
		19 => '#2e7d32', // Dark Green
		20 => '#00695c', // Dark Teal
		21 => '#6b7a2e', // Dark Olive
		22 => '#0a4c88', // Dark Blue
		23 => '#5e1a59', // Dark Purple
		24 => '#6e0033', // Dark Maroon
	];

	/**
	 * Hex colour => grommunio Web standardIndex (the colour-flag mapping used to
	 * show an old-style coloured flag as a category). Only the six standard
	 * flag colours have one.
	 */
	private static $standardIndexByHex = [
		'#e40023' => 6, // Red flag
		'#f99406' => 2, // Orange flag
		'#f7ca17' => 4, // Yellow flag
		'#5ab556' => 3, // Green flag
		'#0f70bd' => 5, // Blue flag
		'#912887' => 1, // Purple flag
	];

	/**
	 * @var resource The message store whose category list this instance manages.
	 */
	private $store;

	/**
	 * @var resource|false Cached Calendar folder, or false before it is opened.
	 */
	private $calendar = false;

	/**
	 * @param resource $store The (own or shared) message store to operate on.
	 */
	public function __construct($store) {
		$this->store = $store;
	}

	/**
	 * The proptag for PR_ROAMING_XMLSTREAM (Pt_BINARY, 0x7C08). php-mapi does
	 * not predefine it, so compute it once here.
	 *
	 * @return int
	 */
	private static function roamingXmlStreamTag() {
		return mapi_prop_tag(PT_BINARY, 0x7C08);
	}

	/**
	 * Open the store's Calendar folder, where the list is stored.
	 *
	 * @return resource|false The Calendar folder, or false when unavailable.
	 */
	private function getCalendarFolder() {
		if ($this->calendar === false) {
			$root = mapi_msgstore_openentry($this->store, null);
			if (!$root) {
				return false;
			}
			$props = mapi_getprops($root, [PR_IPM_APPOINTMENT_ENTRYID]);
			if (empty($props[PR_IPM_APPOINTMENT_ENTRYID])) {
				return false;
			}
			$this->calendar = mapi_msgstore_openentry($this->store, $props[PR_IPM_APPOINTMENT_ENTRYID]);
		}

		return $this->calendar;
	}

	/**
	 * Find the FAI configuration message that holds the list.
	 *
	 * @param bool $create create the message when it does not exist yet
	 * @return resource|false the message, or false when absent (and not created)
	 */
	private function findConfigMessage($create = false) {
		$calendar = $this->getCalendarFolder();
		if (!$calendar) {
			return false;
		}

		$table = mapi_folder_getcontentstable($calendar, MAPI_ASSOCIATED);
		$restriction = [RES_PROPERTY, [
			RELOP => RELOP_EQ,
			ULPROPTAG => PR_MESSAGE_CLASS,
			VALUE => [PR_MESSAGE_CLASS => self::MESSAGE_CLASS],
		]];
		mapi_table_restrict($table, $restriction);
		$rows = mapi_table_queryallrows($table, [PR_ENTRYID]);

		if (!empty($rows)) {
			return mapi_msgstore_openentry($this->store, $rows[0][PR_ENTRYID]);
		}

		if ($create) {
			$message = mapi_folder_createmessage($calendar, MAPI_ASSOCIATED);
			mapi_setprops($message, [PR_MESSAGE_CLASS => self::MESSAGE_CLASS]);

			return $message;
		}

		return false;
	}

	/**
	 * Read the raw category-list XML.
	 *
	 * @return string the XML document, or '' when no list is stored yet
	 */
	public function getXml() {
		$message = $this->findConfigMessage(false);
		if (!$message) {
			return '';
		}

		$tag = self::roamingXmlStreamTag();
		$props = mapi_getprops($message, [$tag]);
		if (isset($props[$tag]) && is_string($props[$tag])) {
			return $props[$tag];
		}

		// Large binaries come back as an error placeholder; read via a stream.
		$stream = mapi_openproperty($message, $tag, IID_IStream, 0, 0);
		if (!$stream) {
			return '';
		}
		$xml = '';
		$stat = mapi_stream_stat($stream);
		mapi_stream_seek($stream, 0, STREAM_SEEK_SET);
		for ($read = 0; $read < $stat['cb']; ) {
			$chunk = mapi_stream_read($stream, 8192);
			if ($chunk === '' || $chunk === false) {
				break;
			}
			$xml .= $chunk;
			$read += strlen($chunk);
		}

		return $xml;
	}

	/**
	 * Write the raw category-list XML, creating the FAI message if needed.
	 *
	 * @param string $xml the XML document to store
	 */
	public function setXml($xml) {
		$message = $this->findConfigMessage(true);
		if (!$message) {
			return;
		}
		mapi_setprops($message, [
			PR_MESSAGE_CLASS => self::MESSAGE_CLASS,
			self::roamingXmlStreamTag() => $xml,
		]);
		mapi_savechanges($message);
	}

	/**
	 * Return the categories in grommunio Web shape.
	 *
	 * @return array a list of associative arrays with keys name, color,
	 *               standardIndex, quickAccess, sortIndex, used, guid
	 */
	public function getCategories() {
		$nodes = $this->parseXml($this->getXml());
		$categories = [];
		foreach ($nodes as $index => $node) {
			$colorIndex = isset($node['color']) && $node['color'] !== '' ? (int) $node['color'] : -1;
			$hex = self::colorIndexToHex($colorIndex);
			$categories[] = [
				'name' => isset($node['name']) ? $node['name'] : '',
				'color' => $hex,
				'standardIndex' => self::hexToStandardIndex($hex),
				// grommunio-only fields are carried in custom x- attributes so
				// they survive a round trip through the shared list.
				'quickAccess' => isset($node['x-quickaccess']) ? $node['x-quickaccess'] === '1' : false,
				'sortIndex' => isset($node['x-sortindex']) ? (int) $node['x-sortindex'] : ($index + 1),
				'used' => isset($node['x-used']) ? $node['x-used'] === '1' : false,
				'guid' => isset($node['guid']) ? $node['guid'] : '',
			];
		}

		return $categories;
	}

	/**
	 * Store the given categories, preserving each existing category's Outlook
	 * bookkeeping (matched by guid, then by case-insensitive name).
	 *
	 * @param array $categories grommunio Web category dicts (name, color, ...)
	 */
	public function setCategories($categories) {
		$existing = $this->parseXml($this->getXml());
		$byGuid = [];
		$byName = [];
		foreach ($existing as $node) {
			if (!empty($node['guid'])) {
				$byGuid[strtolower($node['guid'])] = $node;
			}
			if (isset($node['name'])) {
				$byName[strtolower($node['name'])] = $node;
			}
		}

		$nodes = [];
		foreach ($categories as $i => $category) {
			$name = isset($category['name']) ? (string) $category['name'] : '';
			if ($name === '') {
				continue;
			}
			$guid = !empty($category['guid']) ? $category['guid'] : '';

			// Start from the existing node so Outlook's attributes are kept.
			$node = [];
			if ($guid !== '' && isset($byGuid[strtolower($guid)])) {
				$node = $byGuid[strtolower($guid)];
			}
			elseif (isset($byName[strtolower($name)])) {
				$node = $byName[strtolower($name)];
			}

			if (empty($node['guid'])) {
				$node['guid'] = $guid !== '' ? $guid : self::newGuid();
			}
			$node['name'] = $name;

			// Only recompute the colour index when the hex actually changed, so
			// an untouched Outlook colour keeps its exact original index.
			$hex = isset($category['color']) ? strtolower($category['color']) : '';
			$prevIndex = isset($node['color']) && $node['color'] !== '' ? (int) $node['color'] : -1;
			if ($hex === '' || $hex === strtolower(self::DEFAULT_COLOR)) {
				$node['color'] = $prevIndex >= 0 ? (string) $prevIndex : '';
			}
			elseif ($prevIndex >= 0 && strtolower(self::colorIndexToHex($prevIndex)) === $hex) {
				$node['color'] = (string) $prevIndex;
			}
			else {
				$node['color'] = (string) self::hexToColorIndex($hex);
			}

			// Sensible defaults for attributes Outlook expects.
			if (!isset($node['keyboardShortcut'])) {
				$node['keyboardShortcut'] = '0';
			}
			if (!isset($node['renameOnFirstUse'])) {
				$node['renameOnFirstUse'] = '0';
			}

			// grommunio-only fields, namespaced so Outlook ignores them.
			$node['x-quickaccess'] = !empty($category['quickAccess']) ? '1' : '0';
			$node['x-used'] = !empty($category['used']) ? '1' : '0';
			$node['x-sortindex'] = (string) (isset($category['sortIndex']) ? (int) $category['sortIndex'] : $i);

			$nodes[] = $node;
		}

		$this->setXml($this->buildXml($nodes));
	}

	/**
	 * Map an Outlook colour index to an RGB hex string.
	 *
	 * @param int $index palette index, or -1 for no colour
	 * @return string hex colour (grommunio's default placeholder when unmapped)
	 */
	public static function colorIndexToHex($index) {
		if (isset(self::$palette[$index])) {
			return self::$palette[$index];
		}

		return self::DEFAULT_COLOR;
	}

	/**
	 * Map an RGB hex string to the nearest Outlook colour index.
	 *
	 * @param string $hex the RGB hex string (with or without leading #)
	 * @return int the matching or nearest palette index
	 */
	public static function hexToColorIndex($hex) {
		$hex = strtolower(ltrim($hex, '#'));
		foreach (self::$palette as $index => $paletteHex) {
			if (ltrim($paletteHex, '#') === $hex) {
				return $index;
			}
		}

		// No exact match: pick the nearest palette colour by RGB distance.
		$target = self::hexToRgb($hex);
		if ($target === null) {
			return 0;
		}
		$best = 0;
		$bestDistance = PHP_INT_MAX;
		foreach (self::$palette as $index => $paletteHex) {
			$rgb = self::hexToRgb(ltrim($paletteHex, '#'));
			$distance = ($rgb[0] - $target[0]) ** 2 + ($rgb[1] - $target[1]) ** 2 + ($rgb[2] - $target[2]) ** 2;
			if ($distance < $bestDistance) {
				$bestDistance = $distance;
				$best = $index;
			}
		}

		return $best;
	}

	/**
	 * Map an RGB hex string to a grommunio Web standardIndex, if it is one of
	 * the six standard flag colours.
	 *
	 * @param string $hex the RGB hex string
	 * @return int|null the standardIndex, or null when not a standard colour
	 */
	public static function hexToStandardIndex($hex) {
		$hex = strtolower($hex);
		return isset(self::$standardIndexByHex[$hex]) ? self::$standardIndexByHex[$hex] : null;
	}

	/**
	 * Convert a hex colour to an [r, g, b] triplet.
	 *
	 * @param string $hex hex string without a leading #
	 * @return array|null [r, g, b], or null when malformed
	 */
	private static function hexToRgb($hex) {
		if (strlen($hex) !== 6 || !ctype_xdigit($hex)) {
			return null;
		}

		return [hexdec(substr($hex, 0, 2)), hexdec(substr($hex, 2, 2)), hexdec(substr($hex, 4, 2))];
	}

	/**
	 * Generate a category GUID in Outlook's brace-wrapped upper-case form.
	 *
	 * @return string e.g. {AABBCCDD-EEFF-0011-2233-445566778899}
	 */
	private static function newGuid() {
		$bytes = random_bytes(16);

		return sprintf(
			'{%s-%s-%s-%s-%s}',
			strtoupper(bin2hex(substr($bytes, 0, 4))),
			strtoupper(bin2hex(substr($bytes, 4, 2))),
			strtoupper(bin2hex(substr($bytes, 6, 2))),
			strtoupper(bin2hex(substr($bytes, 8, 2))),
			strtoupper(bin2hex(substr($bytes, 10, 6)))
		);
	}

	/**
	 * Parse the category-list XML into a list of attribute maps (one per
	 * <category>), keeping every attribute so nothing is lost on a round trip.
	 *
	 * @param string $xml the XML document
	 * @return array a list of associative arrays of attribute name => value
	 */
	private function parseXml($xml) {
		if (trim($xml) === '') {
			return [];
		}

		$previous = libxml_use_internal_errors(true);
		$doc = new DOMDocument();
		$loaded = $doc->loadXML($xml);
		libxml_clear_errors();
		libxml_use_internal_errors($previous);
		if (!$loaded) {
			return [];
		}

		$nodes = [];
		foreach ($doc->getElementsByTagName('category') as $element) {
			$attributes = [];
			foreach ($element->attributes as $attribute) {
				// Normalise our own custom attributes to lower case so lookups
				// are predictable; Outlook attributes keep their case.
				$name = $attribute->name;
				if (strpos($name, 'x-') === 0) {
					$name = strtolower($name);
				}
				$attributes[$name] = $attribute->value;
			}
			$nodes[] = $attributes;
		}

		return $nodes;
	}

	/**
	 * Build the category-list XML from a list of attribute maps.
	 *
	 * @param array $nodes a list of associative arrays of attribute name => value
	 * @return string the XML document
	 */
	private function buildXml($nodes) {
		$xml = '<?xml version="1.0"?>' . "\n";
		$xml .= '<categories default="" lastSavedSession="00000000" lastSavedTime="' .
			gmdate('Y-m-d\TH:i:s.000') . '" xmlns="CategoryList.xsd">';
		foreach ($nodes as $node) {
			$xml .= '<category';
			foreach ($node as $name => $value) {
				$xml .= ' ' . $name . '="' . htmlspecialchars((string) $value, ENT_QUOTES | ENT_XML1, 'UTF-8') . '"';
			}
			$xml .= '/>';
		}
		$xml .= '</categories>';

		return $xml;
	}
}
