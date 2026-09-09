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
	public const MESSAGE_CLASS = 'IPM.Configuration.CategoryList';

	/**
	 * grommunio Web's placeholder colour for "no colour chosen". Categories
	 * carrying it are treated as uncoloured rather than mapped to the palette.
	 */
	public const DEFAULT_COLOR = '#BDC3C7';

	/**
	 * Outlook OlCategoryColor palette: index (as written in the XML `color`
	 * attribute) => RGB hex used to render the swatch.
	 */
	private static $palette = [
		0  => '#d6252e', // Red
		1  => '#f06c15', // Orange
		2  => '#ffca4c', // Peach
		3  => '#fffe3d', // Yellow
		4  => '#4ab63f', // Green
		5  => '#40bd95', // Teal
		6  => '#859a52', // Olive
		7  => '#3267b8', // Blue
		8  => '#613db4', // Purple
		9  => '#a34e78', // maroon
		10 => '#c4ccdd', // Steel
		11 => '#8c9cbd', // Dark Steel
		12 => '#c4c4c4', // Gray
		13 => '#a5a5a5', // Dark Gray
		14 => '#1c1c1c', // Black
		15 => '#af1e25', // Dark Red
		16 => '#b14f0d', // Dark Orange
		17 => '#ab7b05', // Dark Peach
		18 => '#999400', // Dark Yellow
		19 => '#35792b', // Dark Green
		20 => '#2e7d64', // Dark Teal
		21 => '#5f6c3a', // Dark Olive
		22 => '#2a5191', // Dark Blue
		23 => '#50328f', // Dark Purple
		24 => '#82375f', // Dark Maroon
	];

	/**
	 * Return the Outlook category colour palette in display order.
	 *
	 * @return string[] RGB hex colours
	 */
	public static function getPalette() {
		return array_values(self::$palette);
	}

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
	 * @var resource the message store whose category list this instance manages
	 */
	private $store;

	/**
	 * @var false|resource cached Calendar folder, or false before it is opened
	 */
	private $calendar = false;

	/**
	 * @var null|bool whether the FAI config message exists; null until known
	 */
	private $exists;

	/**
	 * @var array Root element attributes of the stored XML (e.g. Outlook's
	 *            Quick Click category in 'default'), preserved across saves.
	 */
	private $rootAttributes = [];

	/**
	 * @param resource $store the (own or shared) message store to operate on
	 */
	public function __construct($store) {
		$this->store = $store;
	}

	/**
	 * Open the store's Calendar folder, where the list is stored.
	 *
	 * @return false|resource the Calendar folder, or false when unavailable
	 */
	private function getCalendarFolder() {
		if ($this->calendar === false) {
			try {
				$root = mapi_msgstore_openentry($this->store);
				if ($root === false) {
					return false;
				}
				$props = mapi_getprops($root, [PR_IPM_APPOINTMENT_ENTRYID]);
				if (empty($props[PR_IPM_APPOINTMENT_ENTRYID])) {
					return false;
				}

				/** @var false|resource $calendar php-mapi Calendar folder */
				$calendar = /** @scrutinizer ignore-type */ mapi_msgstore_openentry($this->store, $props[PR_IPM_APPOINTMENT_ENTRYID]);
				if ($calendar === false) {
					return false;
				}
				$this->calendar = $calendar;
			}
			catch (MAPIException $e) {
				// A store without an accessible Calendar (e.g. the public
				// store) simply has no category list; treat it as empty.
				$e->setHandled();

				return false;
			}
		}

		return /** @scrutinizer ignore-type */ $this->calendar;
	}

	/**
	 * Find the FAI configuration message that holds the list.
	 *
	 * @param bool $create create the message when it does not exist yet
	 *
	 * @return false|resource the message, or false when absent (and not created)
	 */
	private function findConfigMessage($create = false) {
		$calendar = $this->getCalendarFolder();
		if (/** @scrutinizer ignore-type */ $calendar === false) {
			return false;
		}

		try {
			$table = mapi_folder_getcontentstable($calendar, MAPI_ASSOCIATED);
			$restriction = [RES_PROPERTY, [
				RELOP => RELOP_EQ,
				ULPROPTAG => PR_MESSAGE_CLASS,
				VALUE => [PR_MESSAGE_CLASS => self::MESSAGE_CLASS],
			]];
			mapi_table_restrict($table, $restriction);
			$rows = mapi_table_queryallrows($table, [PR_ENTRYID]);

			if (!empty($rows)) {
				$this->exists = true;

				return mapi_msgstore_openentry($this->store, $rows[0][PR_ENTRYID]);
			}
			$this->exists = false;

			if ($create) {
				$message = mapi_folder_createmessage($calendar, MAPI_ASSOCIATED);
				mapi_setprops($message, [PR_MESSAGE_CLASS => self::MESSAGE_CLASS]);

				return $message;
			}
		}
		catch (MAPIException $e) {
			// A save must not silently misreport success when the message
			// cannot be created (e.g. a read-only share).
			if ($create) {
				throw $e;
			}
			// No accessible associated store / config message; treat as empty.
			$e->setHandled();
		}

		return false;
	}

	/**
	 * Whether a category list is stored in the mailbox at all. False both for
	 * a mailbox never touched by categories and one whose Calendar is
	 * inaccessible; distinguishes "seed a first list" from "list is empty".
	 *
	 * @return bool
	 */
	public function listExists() {
		if ($this->exists === null) {
			$this->findConfigMessage(false);
		}

		return $this->exists === true;
	}

	/**
	 * Read the raw category-list XML.
	 *
	 * @return string the XML document, or '' when no list is stored yet
	 */
	public function getXml() {
		$message = $this->findConfigMessage(false);
		if ($message === false) {
			return '';
		}

		$props = mapi_getprops($message, [PR_ROAMING_XMLSTREAM]);
		if (isset($props[PR_ROAMING_XMLSTREAM]) && is_string($props[PR_ROAMING_XMLSTREAM])) {
			return $props[PR_ROAMING_XMLSTREAM];
		}

		// Large binaries come back as an error placeholder; read via a stream.
		$stream = mapi_openproperty($message, PR_ROAMING_XMLSTREAM, IID_IStream, 0, 0);
		if ($stream === false) {
			return '';
		}
		$xml = '';
		$stat = mapi_stream_stat($stream);
		mapi_stream_seek($stream, 0, STREAM_SEEK_SET);
		for ($read = 0; $read < $stat['cb'];) {
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
		if ($message === false) {
			// no accessible Calendar folder, the save must not silently no-op
			throw new MAPIException("Cannot store the category list.", MAPI_E_NOT_FOUND, null, _("Cannot store the category list in this mailbox."));
		}
		mapi_setprops($message, [
			PR_MESSAGE_CLASS => self::MESSAGE_CLASS,
			PR_ROAMING_XMLSTREAM => $xml,
		]);
		mapi_savechanges($message);
		$this->exists = true;
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
				'standardIndex' => isset($node['x-standardindex']) && $node['x-standardindex'] !== '' ?
					(int) $node['x-standardindex'] : self::hexToStandardIndex($hex),
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
			// MS-OXOCFG requires color to be an integer in [-1,24]; -1 = none.
			$hex = isset($category['color']) ? strtolower($category['color']) : '';
			$prevIndex = isset($node['color']) && $node['color'] !== '' ? (int) $node['color'] : -1;
			if ($hex === '' || $hex === strtolower(self::DEFAULT_COLOR)) {
				$node['color'] = (string) $prevIndex;
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
			// keep the flag mapping stable when a standard category is recoloured
			if (isset($category['standardIndex']) && $category['standardIndex'] !== null && $category['standardIndex'] !== '') {
				$node['x-standardindex'] = (string) (int) $category['standardIndex'];
			}

			$nodes[] = $node;
		}

		$this->setXml($this->buildXml($nodes));
	}

	/**
	 * Map an Outlook colour index to an RGB hex string.
	 *
	 * @param int $index palette index, or -1 for no colour
	 *
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
	 *
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
	 *
	 * @return null|int the standardIndex, or null when not a standard colour
	 */
	public static function hexToStandardIndex($hex) {
		$hex = strtolower($hex);

		return isset(self::$standardIndexByHex[$hex]) ? self::$standardIndexByHex[$hex] : null;
	}

	/**
	 * Convert a hex colour to an [r, g, b] triplet.
	 *
	 * @param string $hex hex string without a leading #
	 *
	 * @return null|array [r, g, b], or null when malformed
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
	 *
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

		// Remember the root attributes (e.g. Outlook's Quick Click category
		// in 'default') so buildXml can write them back.
		if ($doc->documentElement) {
			foreach ($doc->documentElement->attributes as $attribute) {
				$this->rootAttributes[$attribute->name] = $attribute->value;
			}
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
	 *
	 * @return string the XML document
	 */
	private function buildXml($nodes) {
		$root = array_merge([
			'default' => '',
			'lastSavedSession' => '00000000',
		], $this->rootAttributes);
		$root['lastSavedTime'] = gmdate('Y-m-d\TH:i:s.000');
		$root['xmlns'] = 'CategoryList.xsd';

		$xml = '<?xml version="1.0"?>' . "\n";
		$xml .= '<categories';
		foreach ($root as $name => $value) {
			$xml .= ' ' . $name . '="' . self::xmlAttribute($value) . '"';
		}
		$xml .= '>';
		foreach ($nodes as $node) {
			$xml .= '<category';
			foreach ($node as $name => $value) {
				$xml .= ' ' . $name . '="' . self::xmlAttribute($value) . '"';
			}
			$xml .= '/>';
		}
		$xml .= '</categories>';

		return $xml;
	}

	/**
	 * Escape a value for use in an XML attribute. Also strips characters that
	 * are illegal in XML 1.0 (raw control characters), which htmlspecialchars
	 * passes through and which would make the whole document unparseable.
	 *
	 * @param string $value the attribute value
	 *
	 * @return string the escaped value
	 */
	private static function xmlAttribute($value) {
		$value = preg_replace('/[^\x{09}\x{0A}\x{0D}\x{20}-\x{D7FF}\x{E000}-\x{FFFD}\x{10000}-\x{10FFFF}]/u', '', (string) $value);
		// a non-UTF-8 byte sequence makes preg_replace return null
		if ($value === null) {
			$value = '';
		}

		return htmlspecialchars($value, ENT_QUOTES | ENT_XML1, 'UTF-8');
	}
}
