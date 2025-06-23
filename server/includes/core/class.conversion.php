<?php

/**
 * Conversion utility functions for converting various data types and structures.
 */
class Conversion {
	/**
	 * Converts a COleDateTime binary string to an unix timestamp.
	 *
	 * The time component of the returned timestamp is 00:00:00
	 *
	 * @param int $cOleDateTime is a binary string which represents the number of
	 *                          days since 30-12-1899
	 *
	 * @return int unix timestamp of given date
	 */
	public static function COleDateTimeToUnixTime($cOleDateTime) {
		$days = unpack("d", $cOleDateTime);

		return ($days[1] - 25569) * 24 * 60 * 60; // 25569 is the number of days between 30-12-1899 and 01-01-1970
	}

	/**
	 * Converts an unix timestamp to a COleDateTime binary string.
	 *
	 * The time component of the unix timestamp is discarded before conversion
	 *
	 * @param int $unixtime The unix timestamp to convert
	 *
	 * @return int COleDateTime binary string representing the same day
	 */
	public static function UnixTimeToCOleDateTime($unixtime) {
		$days = ($unixtime / (60 * 60 * 24)) + 25569;

		return pack("d", $days);
	}

	/**
	 * Convert XML properties into MAPI properties.
	 *
	 * This function converts an XML array to a MAPI array. For example:
	 * $props["subject"] = "Meeting" --> $props[PR_SUBJECT] = "Meeting"
	 *
	 * If a mapping between a property name ('subject') and a property tag (PR_SUBJECT) cannot be found,
	 * it is ignored and will not be returned in the return array.
	 *
	 * The return value of this function is suitable for direct use in mapi_setprops() or related functions.
	 *
	 * Note that a conversion is done between utf-8 and windows-1252 here since all XML data is assumed to be
	 * utf-8 and all data written to MAPI is windows-1252.
	 *
	 * @param array &$props              Mapping of property name to MAPI property tag
	 * @param array &$message_properties Properties to be converted
	 *
	 * @return array MAPI property array
	 *
	 * @todo This function is slow. Since it is used very very frequently, we could get some speedup from
	 *       optimising this function.
	 * @todo This function does more than just converting, most notably doing something with 'body'. This needs
	 *       commenting.
	 */
	public static function mapXML2MAPI(&$props, &$message_properties) {
		$properties = [];

		foreach ($message_properties as $key => $value) {
			// HACK alert !: frontend may send back partial record (eg when setting 'read' when record is not fully loaded). Ignore for now
			if (isset($props[$key])) {
				$mapi_property = $props[$key];

				switch (mapi_prop_type($mapi_property)) {
					case PT_LONG:
						$properties[$mapi_property] = (int) $value;
						break;

					case PT_DOUBLE:
						$properties[$mapi_property] = (float) $value;
						break;

					case PT_MV_STRING8:
					case PT_MV_STRING8 | MVI_FLAG:
						$mv_values = explode(";", (string) $value);
						$values = [];

						foreach ($mv_values as $mv_value) {
							if (!empty($mv_value)) {
								$values[] = ltrim($mv_value);
							}
						}

						$properties[$mapi_property & ~MV_INSTANCE] = !empty($values) ? $values : [];
						break;

					case PT_MV_BINARY:
						// TODO: not supported at the moment
						break;

					case PT_BINARY:
						if (!empty($value)) {
							$properties[$mapi_property] = hex2bin((string) $value);
						}
						break;

					case PT_SRESTRICTION:
						if (!empty($value)) {
							$properties[$mapi_property] = Conversion::json2restriction($props, $value);
						}
						break;

					case PT_ACTIONS:
						if (!empty($value)) {
							$properties[$mapi_property] = Conversion::json2actions($props, $value);
						}
						break;

					default:
						$properties[$mapi_property] = $value;
						break;
				}
			}
		}

		// The body is a bit special, as we have to consider the HTML body and the plain-text body
		$isHTML = isset($message_properties["isHTML"]) && $message_properties["isHTML"] == true;
		if (isset($message_properties["html_body"]) && $isHTML) {
			$properties[PR_INTERNET_CPID] = 65001; // always write UTF-8 codepage
			$properties[PR_HTML] = $message_properties["html_body"];
		}
		elseif (isset($message_properties["body"]) && !$isHTML) {
			$properties[PR_INTERNET_CPID] = 65001; // always write UTF-8 codepage
			$properties[PR_BODY] = $message_properties["body"];
		}

		return $properties;
	}

	/**
	 * Convert MAPI properties to XML array.
	 *
	 * This function converts a MAPI property array to a XML array. For example:
	 * $props[PR_SUBJECT] = "Meeting" --> $props["subject"] = "Meeting"
	 *
	 * <b>WARNING</b> Properties in PT_STRING8 are assumed to be in windows-1252. This is true
	 * for all PT_STRING8 properties in MAPI. The data in $props is UTF-8, so the conversion is done
	 * here.
	 *
	 * Conversion is done as the reverse of mapXML2MAPI.
	 *
	 * @see Conversion::mapXML2MAPI()
	 *
	 * @param array &$props              List of MAPI properties
	 * @param array &$message_properties MAPI array
	 *
	 * @return array list of properties which will be sent back to the client
	 */
	public static function mapMAPI2XML(&$props, &$message_properties) {
		$idProps = [PR_ENTRYID => 1, PR_PARENT_ENTRYID => 1, PR_STORE_ENTRYID => 1, PR_RULE_ID => 1];
		$properties = ["props" => []];

		foreach ($props as $name => $property) {
			if (isset($message_properties[$property & ~MVI_FLAG])) {
				$property = ($property & ~MVI_FLAG);
			}
			elseif (!isset($message_properties[$property])) {
				continue;
			}

			// inlined below function for speed (only used here anyway)
			$value = $message_properties[$property];

			switch (mapi_prop_type($property)) {
				case PT_BINARY:
					$value = bin2hex((string) $value);
					break;

				case PT_MV_BINARY:
					$value = array_map("bin2hex", $value);
					break;

				case PT_MV_STRING8:
					$result = "";
					foreach ($value as $entry) {
						if (!empty($entry)) {
							$result .= $entry . "; ";
						}
					}
					$value = $result;
					break;

				case PT_SRESTRICTION:
					$value = Conversion::restriction2json($value);
					break;

				case PT_ACTIONS:
					$value = Conversion::actions2json($value);
					break;
			}

			if (isset($idProps[$property])) {
				// put identification properties to root level
				$properties[$name] = $value;
			}
			else {
				$properties["props"][$name] = $value;
			}
		}

		if (empty($properties["props"])) {
			unset($properties["props"]);
		}

		return $properties;
	}

	/* JSON related functions */

	/**
	 * Convert a JSON reference to a property into a MAPI property tag.
	 *
	 * Note that this depends on the definition of the property tag constants
	 * in mapitags.php
	 * Mappings are defined per module in class.properties.php
	 *
	 * @example json2property('subject') => 0x0037001e
	 * @example this also works json2property('PR_SUBJECT') => 0x0037001e
	 *
	 * @param array  $mapping               props A mapping of property names to their corresponding MAPI property tags
	 * @param string $prop                  property name
	 * @param bool   $convertToSingleValued whether to convert the multi valued property tag to single valued or not
	 *
	 * @return int The property tag
	 */
	public static function json2property($mapping, $prop, $convertToSingleValued = false) {
		$propTag = false;

		if (isset($mapping[$prop])) {
			// Normally we would go for this case, where the property is defined in our mapping
			$propTag = $mapping[$prop];
		}
		elseif (defined($prop)) {
			// This is for cases where the proptag reference is defined as a constant, e.g. PR_BODY
			$propTag = constant($prop);
		}
		elseif (substr_count($prop, ':') == 2) {
			// This is for named properties, e.g. 'PT_STRING8:PSETID_Address:0x8005'
			$props = getPropIdsFromStrings($GLOBALS["mapisession"]->getDefaultMessageStore(), [$prop]);
			$propTag = $props[0];
		}
		else {
			// In this case we expect the string to be a hex id of the proptag
			$propTag = hexdec($prop);
		}

		// if getting multi valued property then sometimes we need to convert it to
		// its single valued counterpart to use in VALUES structure of restriction
		if ($convertToSingleValued) {
			$propTag = Conversion::convertToSingleValuedProperty($propTag);
		}

		return $propTag;
	}

	/**
	 * Convert a MAPI property tag into a JSON reference.
	 *
	 * Note that this depends on the definition of the property tag constants
	 * in mapitags.php
	 *
	 * @example property2json(0x0037001e) => 'PR_SUBJECT'
	 *
	 * @param int The property tag
	 * @param mixed $property
	 *
	 * @return string the symbolic name of the property tag
	 */
	public static function property2json($property) {
		if (is_integer($property)) {
			// Retrieve constants categories, zcore provides them in 'Core'
			foreach (get_defined_constants(true)['Core'] as $key => $value) {
				if ($property == $value && str_starts_with($key, 'PR_')) {
					return $key;
				}
			}

			return sprintf("0x%08X", $property);
		}

		return $property;
	}

	/**
	 * Convert an JSON restriction structure into a MAPI SRestriction array.
	 *
	 * @param array $mapping An associative array mapping property keys to MAPI proptags
	 * @param array $json    The parsed JSON array data
	 *
	 * @return array MAPI restriction array compatible with MAPI extension restriction format
	 */
	public static function json2restriction($mapping, $json) {
		if (!is_array($json)) {
			return $json;
		}

		switch ($json[0]) {
			case RES_AND:
			case RES_OR:
				if (isset($json[1][0]) && is_array($json[1][0])) {
					foreach ($json[1] as &$res) {
						$res = Conversion::json2restriction($mapping, $res);
					}
					unset($res);
				}
				elseif (!empty($json[1])) {
					$json[1] = Conversion::json2restriction($mapping, $json[1]);
				}
				break;

			case RES_NOT:
				// Note that a normal RES_NOT restriction should not be placed
				// in an array, but the php-ext does expect an array to be
				// given, so we wrap it here.
				$json[1] = [Conversion::json2restriction($mapping, $json[1])];
				break;

			case RES_COMMENT:
				$props = [];
				foreach ($json[1][PROPS] as $propTag => $propValue) {
					$propTag = Conversion::json2property($mapping, $propTag);
					if (mapi_prop_type($propTag) === PT_BINARY) {
						$propValue = hex2bin((string) $propValue);
					}
					$props[$propTag] = $propValue;
				}

				$json[1][PROPS] = $props;
				$json[1][RESTRICTION] = Conversion::json2restriction($mapping, $json[1][RESTRICTION]);
				break;

			case RES_PROPERTY:
			case RES_CONTENT:
				$json[1][ULPROPTAG] = Conversion::json2property($mapping, $json[1][ULPROPTAG]);
				$value = [];

				foreach ($json[1][VALUE] as $propTag => $propValue) {
					$propTag = Conversion::json2property($mapping, $propTag);
					$type = mapi_prop_type($propTag);

					if ($type === PT_BINARY) {
						$propValue = hex2bin((string) $propValue);
					}
					elseif ($type === PT_MV_STRING8) {
						// Convert multivalued strings to arrays
						$mv_values = explode(";", (string) $propValue);
						$values = [];

						foreach ($mv_values as $mv_value) {
							if (!empty($mv_value)) {
								$values[] = ltrim($mv_value);
							}
						}

						$propValue = !empty($values) ? $values : [];
					}

					$value[$propTag] = $propValue;
				}

				unset($json[1][VALUE]);
				$json[1][VALUE] = $value;
				break;

			case RES_COMPAREPROPS:
				$json[1][ULPROPTAG1] = Conversion::json2property($mapping, $json[1][ULPROPTAG1]);
				$json[1][ULPROPTAG2] = Conversion::json2property($mapping, $json[1][ULPROPTAG2]);
				break;

			case RES_BITMASK:
			case RES_SIZE:
			case RES_EXIST:
				$json[1][ULPROPTAG] = Conversion::json2property($mapping, $json[1][ULPROPTAG]);
				break;

			case RES_SUBRESTRICTION:
				$json[1][ULPROPTAG] = Conversion::json2property($mapping, $json[1][ULPROPTAG]);
				$json[1][RESTRICTION] = Conversion::json2restriction($mapping, $json[1][RESTRICTION]);
				break;
		}

		return $json;
	}

	/**
	 * Convert a MAPI SRestriction array into an JSON restriction structure.
	 *
	 * @param mixed $restriction The MAPI Restriction array
	 *
	 * @return array Array structure that can be easily serialized to JSON format
	 */
	public static function restriction2json($restriction) {
		if (!is_array($restriction)) {
			return $restriction;
		}

		switch ($restriction[0]) {
			case RES_AND:
			case RES_OR:
				if (!empty($restriction[1][0])) {
					foreach ($restriction[1] as &$res) {
						$res = Conversion::restriction2json($res);
					}
					unset($res);
				}
				elseif (!empty($restriction[1])) {
					$restriction[1] = Conversion::restriction2json($restriction[1]);
				}
				break;

			case RES_NOT:
				// Note that a normal RES_NOT restriction should not be placed
				// in an array, but the php-ext does put it in one, so unwrap it here.
				$restriction[1] = Conversion::restriction2json($restriction[1][0]);
				break;

			case RES_COMMENT:
				$restriction[1][RESTRICTION] = Conversion::restriction2json($restriction[1][RESTRICTION]);
				$props = [];

				foreach ($restriction[1][PROPS] as $propTag => $propValue) {
					if (mapi_prop_type($propTag) === PT_BINARY) {
						$propValue = bin2hex((string) $propValue);
					}
					$props[Conversion::property2json($propTag)] = is_array($propValue) ? $propValue[$propTag] : $propValue;
				}

				unset($restriction[1][PROPS]);
				$restriction[1][PROPS] = $props;
				break;

			case RES_COMPAREPROPS:
				$restriction[1][ULPROPTAG1] = Conversion::property2json($restriction[1][ULPROPTAG1]);
				$restriction[1][ULPROPTAG2] = Conversion::property2json($restriction[1][ULPROPTAG2]);
				break;

			case RES_PROPERTY:
			case RES_CONTENT:
				$restriction[1][ULPROPTAG] = Conversion::property2json($restriction[1][ULPROPTAG]);
				$value = [];

				foreach ($restriction[1][VALUE] as $propTag => $propValue) {
					if (mapi_prop_type($propTag) === PT_BINARY) {
						$propValue = bin2hex((string) $propValue);
					}

					$value[Conversion::property2json($propTag)] = $propValue;
				}

				// remove non restriction data
				unset($restriction[1][VALUE]);
				$restriction[1][VALUE] = $value;
				break;

			case RES_BITMASK:
			case RES_SIZE:
			case RES_EXIST:
				$restriction[1][ULPROPTAG] = Conversion::property2json($restriction[1][ULPROPTAG]);
				break;

			case RES_SUBRESTRICTION:
				$restriction[1][ULPROPTAG] = Conversion::property2json($restriction[1][ULPROPTAG]);
				$restriction[1][RESTRICTION] = Conversion::restriction2json($restriction[1][RESTRICTION]);
				break;
		}

		return $restriction;
	}

	/**
	 * Retrieves singlevalued counterpart of a multivalued property.
	 *
	 * Multivalued properties has different property tags in VALUES part
	 * so we need to find that singlevalued property tag
	 *
	 * @param int $propTag The multivalued property tag in string
	 *
	 * @return int The singlevalued property tag
	 */
	public static function convertToSingleValuedProperty($propTag) {
		if (is_string($propTag)) {
			// if the string starts with '0x' then we have
			// an acceptable propTag on which we can work
			// to change the MV_flag value
			if (str_starts_with($propTag, '0x')) {
				$propTag = hexdec($propTag);
				$propTag &= ~MV_FLAG;
				$propTag = '0x' . strtoupper(str_pad((string) dechex_32($propTag), 8, '0', STR_PAD_LEFT));
			}
		}
		else {
			// If numeric, just remove the MV_FLAG
			$propTag &= ~MV_FLAG;
		}

		return $propTag;
	}

	/**
	 * Converts a JSON Representation of PT_ACTIONS value array to its MAPI form.
	 *
	 * @param array $actions JSON representation PT_ACTIONS structure
	 * @param mixed $mapping
	 *
	 * @return array Converted PT_ACTIONS structure that can be used in MAPI
	 */
	public static function json2actions($mapping, $actions) {
		foreach ($actions as &$action) {
			foreach ($action as $key => $value) {
				switch ($key) {
					case 'storeentryid':
					case 'folderentryid':
					case 'replyentryid':
					case 'replyguid':
					case 'dam':
						$action[$key] = hex2bin((string) $value);
						break;

					case 'adrlist':
						$recipients = [];

						foreach ($value as $addr) {
							$recipient = [];

							foreach ($addr as $addrkey => $addrval) {
								$addrkey = Conversion::json2property($mapping, $addrkey);

								if (mapi_prop_type($addrkey) === PT_BINARY) {
									$addrval = hex2bin((string) $addrval);
								}

								$recipient[$addrkey] = $addrval;
							}
							unset($addrval);

							$recipients[] = $recipient;
						}
						unset($addr);

						$action[$key] = $recipients;
						break;
				}
			}
		}

		return $actions;
	}

	/**
	 * Converts a MAPI PT_ACTIONS value array to its JSON representation.
	 *
	 * @param array $actions MAPI PT_ACTIONS structure
	 *
	 * @return array Converted PT_ACTIONS structure that can be used in javascript
	 */
	public static function actions2json($actions) {
		foreach ($actions as &$action) {
			foreach ($action as $key => $value) {
				switch ($key) {
					case 'storeentryid':
					case 'folderentryid':
					case 'replyentryid':
					case 'replyguid':
					case 'dam':
						$action[$key] = bin2hex((string) $value);
						break;

					case 'adrlist':
						$recipients = [];

						foreach ($value as $addr) {
							$recipient = [];

							foreach ($addr as $addrkey => $addrval) {
								if (mapi_prop_type($addrkey) === PT_BINARY) {
									$addrval = bin2hex((string) $addrval);
								}

								$recipient[Conversion::property2json($addrkey)] = $addrval;
							}
							unset($addrval);

							$recipients[] = $recipient;
						}
						unset($addr);

						$action[$key] = $recipients;
						break;
				}
			}
		}

		return $actions;
	}

	/**
	 * Mapping of code page identifiers to character sets
	 * Table taken from common/codepage.cpp.
	 *
	 * @see http://msdn.microsoft.com/en-us/library/dd317756(VS.85).aspx
	 * Note: The order is done like this because we use this array in the findCharSet
	 * function, which is called when a message identifies itself with a charset that
	 * it isn't in. Because this mostly happens with iso-8859-1 that says they are in
	 * utf-8, we use this order to first check if it isn't iso-8859-1.
	 *
	 * @property
	 */
	private static $_CODEPAGES = [
		37 => "IBM037",
		437 => "IBM437",
		500 => "IBM500",
		708 => "ASMO-708",
		720 => "DOS-720",
		737 => "ibm737",
		775 => "ibm775",
		850 => "ibm850",
		852 => "ibm852",
		855 => "IBM855",
		857 => "ibm857",
		858 => "IBM00858",
		860 => "IBM860",
		861 => "ibm861",
		862 => "DOS-862",
		863 => "IBM863",
		864 => "IBM864",
		865 => "IBM865",
		866 => "cp866",
		869 => "ibm869",
		870 => "IBM870",
		874 => "windows-874",
		875 => "cp875",
		932 => "shift_jis",
		936 => "gb2312",
		936 => "gbk",
		949 => "cp949",
		950 => "big5",
		1026 => "IBM1026",
		1047 => "IBM01047",
		1140 => "IBM01140",
		1141 => "IBM01141",
		1142 => "IBM01142",
		1143 => "IBM01143",
		1144 => "IBM01144",
		1145 => "IBM01145",
		1146 => "IBM01146",
		1147 => "IBM01147",
		1148 => "IBM01148",
		1149 => "IBM01149",
		1200 => "utf-16",
		1201 => "unicodeFFFE",
		1250 => "windows-1250",
		1251 => "windows-1251",
		1252 => "windows-1252",
		1253 => "windows-1253",
		1254 => "windows-1254",
		1255 => "windows-1255",
		1256 => "windows-1256",
		1257 => "windows-1257",
		1258 => "windows-1258",
		1361 => "Johab",
		10000 => "macintosh",
		10001 => "x-mac-japanese",
		10002 => "x-mac-chinesetrad",
		10003 => "x-mac-korean",
		10004 => "x-mac-arabic",
		10005 => "x-mac-hebrew",
		10006 => "x-mac-greek",
		10007 => "x-mac-cyrillic",
		10008 => "x-mac-chinesesimp",
		10010 => "x-mac-romanian",
		10017 => "x-mac-ukrainian",
		10021 => "x-mac-thai",
		10029 => "x-mac-ce",
		10079 => "x-mac-icelandic",
		10081 => "x-mac-turkish",
		10082 => "x-mac-croatian",
		12000 => "utf-32",
		12001 => "utf-32BE",
		20000 => "x-Chinese_CNS",
		20001 => "x-cp20001",
		20002 => "x_Chinese-Eten",
		20003 => "x-cp20003",
		20004 => "x-cp20004",
		20005 => "x-cp20005",
		20105 => "x-IA5",
		20106 => "x-IA5-German",
		20107 => "x-IA5-Swedish",
		20108 => "x-IA5-Norwegian",
		20127 => "us-ascii",
		20261 => "x-cp20261",
		20269 => "x-cp20269",
		20273 => "IBM273",
		20277 => "IBM277",
		20278 => "IBM278",
		20280 => "IBM280",
		20284 => "IBM284",
		20285 => "IBM285",
		20290 => "IBM290",
		20297 => "IBM297",
		20420 => "IBM420",
		20423 => "IBM423",
		20424 => "IBM424",
		20833 => "x-EBCDIC-KoreanExtended",
		20838 => "IBM-Thai",
		20866 => "koi8-r",
		20871 => "IBM871",
		20880 => "IBM880",
		20905 => "IBM905",
		20924 => "IBM00924",
		20932 => "EUC-JP",
		20936 => "x-cp20936",
		20949 => "x-cp20949",
		21025 => "cp1025",
		21866 => "koi8-u",
		28591 => "iso-8859-1",
		28592 => "iso-8859-2",
		28593 => "iso-8859-3",
		28594 => "iso-8859-4",
		28595 => "iso-8859-5",
		28596 => "iso-8859-6",
		28597 => "iso-8859-7",
		28598 => "iso-8859-8",
		28599 => "iso-8859-9",
		28603 => "iso-8859-13",
		28605 => "iso-8859-15",
		29001 => "x-Europa",
		38598 => "iso-8859-8-i",
		50220 => "iso-2022-jp",
		50221 => "csISO2022JP",
		50222 => "iso-2022-jp",
		50225 => "iso-2022-kr",
		50227 => "x-cp50227",
		51932 => "euc-jp",
		51936 => "EUC-CN",
		51949 => "euc-kr",
		52936 => "hz-gb-2312",
		54936 => "GB18030",
		57002 => "x-iscii-de",
		57003 => "x-iscii-be",
		57004 => "x-iscii-ta",
		57005 => "x-iscii-te",
		57006 => "x-iscii-as",
		57007 => "x-iscii-or",
		57008 => "x-iscii-ka",
		57009 => "x-iscii-ma",
		57010 => "x-iscii-gu",
		57011 => "x-iscii-pa",
		65000 => "utf-7",
		65001 => "utf-8",
	];

	/**
	 * Get charset name from a codepage.
	 *
	 * @param int codepage Codepage
	 * @param mixed $codepage
	 *
	 * @return string iconv-compatible charset name
	 */
	public static function getCodepageCharset($codepage) {
		// Defaulting to iso-8859-15 since it is more likely for someone to make a mistake in the codepage
		// when using west-european charsets then when using other charsets since utf-8 is binary compatible
		// with the bottom 7 bits of west-european
		return Conversion::$_CODEPAGES[$codepage] ?? "iso-8859-15";
	}

	/**
	 * Tries to find the character set of a given string.
	 *
	 * @param string $string The string for which a charset is requested
	 *
	 * @return string
	 */
	private static function findCharSet($string) {
		// Let's try mb_detect_encoding first
		$charset = mb_detect_encoding($string, "auto");

		if ($charset !== false) {
			return $charset;
		}

		// Trying every encoding from $_CODEPAGES is pointless. There
		// is at least one encoding where all imaginable input byte
		// sequences are valid, and a heuristic would pick that even if
		// it is completely inaccurate. So just return a fixed charset
		// here.
		//
		// With
		// https://en.wikipedia.org/wiki/Popularity_of_text_encodings
		// in mind, we want to pick an ASCII-compatible encoding so
		// that not everything becomes illegible (like with "cp037"),
		// but where codepage mismatch is otherwise apparent. This
		// necessitates a non-poular charset, so iso-8859-1/15,
		// cp1251/1252, utf-8 are all ruled out.
		//
		return "cp850";
	}

	/**
	 * Converts a string with a given codepage to utf-8.
	 *
	 * @param int    $codepage The codepage of the given string
	 * @param string $string   The string that must be converted
	 *
	 * @return string
	 */
	public static function convertCodepageStringToUtf8($codepage, $string) {
		$charset = Conversion::getCodepageCharset($codepage);

		// Sometimes a mail identifies itself with a charset that it really isn't, so let's do an extra check
		// Only do the extra check if iconv was able to convert string. See grommunio-web#142
		$converted = iconv($charset, $charset, $string);
		if ($converted !== false && strlen($converted) !== strlen($string)) {
			$foundCharset = Conversion::findCharSet($string);
			if ($foundCharset) {
				$charset = $foundCharset;
			}
		}

		return iconv($charset, "utf-8", $string);
	}
}
