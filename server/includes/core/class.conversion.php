<?php	

/**
* Conversion utility functions for converting various data types and structures.
*
* @package core
*/
class Conversion {

	/**
	* Converts a COleDateTime binary string to an unix timestamp
	*
	* The time component of the returned timestamp is 00:00:00
	*
	* @param int $cOleDateTime is a binary string which represents the number of
	*               days since 30-12-1899.
	* @return int unix timestamp of given date
	*/
	public static function COleDateTimeToUnixTime($cOleDateTime)
	{
		$days = unpack("d", $cOleDateTime);
		$unixtime = ($days[1]-25569)*24*60*60; // 25569 is the number of days between 30-12-1899 and 01-01-1970
		return $unixtime;
	}
	
	/**
	* Converts an unix timestamp to a COleDateTime binary string
	*
	* The time component of the unix timestamp is discarded before conversion
	*
	* @param int $unixtime The unix timestamp to convert
	* @return int COleDateTime binary string representing the same day
	*/
	public static function UnixTimeToCOleDateTime($unixtime)
	{
		$days = ($unixtime/(60*60*24))+25569;
		$cOleDateTime = pack("d", $days);
		return $cOleDateTime;
	}
	
	/**
	 * Convert XML properties into MAPI properties
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
	 * @param array &$props Mapping of property name to MAPI property tag
	 * @param array &$message_properties Properties to be converted
	 * @return array MAPI property array
	 *
	 * @todo This function is slow. Since it is used very very frequently, we could get some speedup from
	 *       optimising this function.
	 * @todo This function does more than just converting, most notably doing something with 'body'. This needs
	 *       commenting.
	 */
	public static function mapXML2MAPI(&$props, &$message_properties)
	{
		$properties = array();

		foreach($message_properties as $key => $value)
		{
			// HACK alert !: frontend may send back partial record (eg when setting 'read' when record is not fully loaded). Ignore for now
			if (isset($props[$key])) {
				$mapi_property = $props[$key];

				switch(mapi_prop_type($mapi_property))
				{
					case PT_LONG:
						$properties[$mapi_property] = (int) $value;
						break;
					case PT_DOUBLE:
						$properties[$mapi_property] = (float) $value;
						break;
					case PT_MV_STRING8:
					case (PT_MV_STRING8 | MVI_FLAG):
						$mv_values = explode(";", $value);
						$values = array();

						foreach($mv_values as $mv_value)
						{
							if(!empty($mv_value)) {
								$values[] = ltrim($mv_value);
							}
						}

						$properties[($mapi_property &~ MV_INSTANCE)] = !empty($values) ? $values : array();
						break;
					case PT_MV_BINARY:
						// TODO: not supported at the moment	
						break;
					case PT_BINARY:
						if (!empty($value)) {
							$properties[$mapi_property] = hex2bin($value);
						}
						break;
					case PT_SRESTRICTION:
						if(!empty($value)) {
							$properties[$mapi_property] = Conversion::json2restriction($props, $value);
						}
						break;
					case PT_ACTIONS:
						if(!empty($value)) {
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
			$properties[PR_BODY] = $message_properties["html_body"];
		} else if (isset($message_properties["body"]) && !$isHTML) {
			$properties[PR_INTERNET_CPID] = 65001; // always write UTF-8 codepage
			$properties[PR_BODY] = $message_properties["body"];
		}

		return $properties;
	}
	
	/**
	 * Convert MAPI properties to XML array
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
	 * @param array &$props List of MAPI properties
	 * @param array &$message_properties MAPI array
	 * @return array list of properties which will be sent back to the client		  
	 */
	public static function mapMAPI2XML(&$props, &$message_properties)
	{
		$idProps = array(PR_ENTRYID => 1, PR_PARENT_ENTRYID => 1, PR_STORE_ENTRYID => 1, PR_RULE_ID => 1);
		$properties = array("props" => array());

		foreach($props as $name => $property)
		{
			if(isset($message_properties[($property &~ MVI_FLAG)])) {
				$property = ($property &~ MVI_FLAG);
			} else if(!isset($message_properties[$property])) {
				continue;
			}

                        // inlined below function for speed (only used here anyway)
                        $value = $message_properties[$property];

		        switch(mapi_prop_type($property))
		        {
				case PT_BINARY:
					$value = bin2hex($value);
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
				case PT_SYSTIME:
					# NOTE:
					# This is a nice PHP bug. values smaller than this will produce a segfault in the strftime() call on 64bit systems.
					# So, we cap it on this number. I've only seen it in irrelevant properties (FlagDueBy), which have a PT_SYSTIME of 0,
					# which should represent 1-1-1601 00:00:00, which seems to be a default in a PST file?
					# on 32bit systems, this is in other manners broken, but at least it doesn't segfault.
					if ($value < -6847761600) {
						$value = -6847761600;
					}
					break;
				case PT_SRESTRICTION:
					$value = Conversion::restriction2json($value);
					break;
				case PT_ACTIONS:
					$value = Conversion::actions2json($value);
					break;
				default:
					// One-to-one mapping for all other types
                        }

			if(isset($idProps[$property])) {
				// put identification properties to root level
				$properties[$name] = $value;
			} else {
				$properties["props"][$name] = $value;
			}
		}

		if (empty($properties["props"])) {
			unset($properties["props"]);
		}

		return $properties;
	}

	/******** JSON related functions **********/

	/**
	 * Convert a JSON reference to a property into a MAPI property tag
	 *
	 * Note that this depends on the definition of the property tag constants
	 * in mapitags.php
	 * Mappings are defined per module in class.properties.php
	 *
	 * @example json2property('subject') => 0x0037001e
	 * @example this also works json2property('PR_SUBJECT') => 0x0037001e
	 * @param Array props A mapping of property names to their corresponding MAPI property tags
	 * @param String property name
	 * @param Boolean $convertToSingleValued wether to convert the multi valued property tag to single valued or not
	 * @return int The property tag
	 */
	public static function json2property($mapping, $prop, $convertToSingleValued = false)
	{
		$propTag = false;

		if (isset($mapping[$prop])) {
			// Normally we would go for this case, where the property is defined in our mapping
			$propTag = $mapping[$prop];
		} else if (defined($prop)) {
			// This is for cases where the proptag reference is defined as a constant, e.g. PR_BODY
			$propTag = constant($prop);
		} else {
			// In this case we expect the string to be a hex id of the proptag
			$propTag = hexdec($prop);
		}

		// if getting multi valued property then sometimes we need to convert it to
		// its single valued counterpart to use in VALUES structure of restriction
		if($convertToSingleValued) {
			$propTag = Conversion::convertToSingleValuedProperty($propTag);
		}

		return $propTag;
	}

	/**
	 * Convert a MAPI property tag into a JSON reference
	 *
	 * Note that this depends on the definition of the property tag constants
	 * in mapitags.php
	 *
	 * @example property2json(0x0037001e) => 'PR_SUBJECT'
	 * @param int The property tag
	 * @return string the symbolic name of the property tag
	 */
	public static function property2json($property)
	{
		if (is_integer($property)) {
			// Retrieve constants categories, mapi error names are defined
			// in the 'user' category, since the WebApp code defines it in mapitags.php.
			foreach (get_defined_constants(true)['user'] as $key => $value) {
				if ($property == $value) {
					$prefix = substr($key, 0, 3);
					if ($prefix == 'PR_') {
						return $key;
					}
				}
			}

			return '0x' . strtoupper(str_pad(dechex_32($property), 8, '0', STR_PAD_LEFT));
		}

		return $property;
	}

	/**
	 * Convert an JSON restriction structure into a MAPI SRestriction array
	 *
	 * @access private
	 * @param {Array} $mapping An associative array mapping property keys to MAPI proptags
	 * @param {Array} $json The parsed JSON array data
	 * @return {Array} MAPI restriction array compatible with MAPI extension restriction format
	 */
	public static function json2restriction($mapping, $json)
	{
		if (!is_array($json)){
			return $json;
		}

		switch($json[0]){
			case RES_AND:
			case RES_OR:
				if(isset($json[1][0]) && is_array($json[1][0])) {
					foreach($json[1] as &$res) {
						$res = Conversion::json2restriction($mapping, $res);
					}
					unset($res);
				} else if(!empty($json[1])) {
					$json[1] = Conversion::json2restriction($mapping, $json[1]);
				}
				break;
			case RES_NOT:
				// Note that a normal RES_NOT restriction should not be placed
				// in an array, but the php-ext does expect an array to be
				// given, so we wrap it here.
				$json[1] = array( Conversion::json2restriction($mapping, $json[1]) );
				break;
			case RES_COMMENT:
				$props = array();
				foreach($json[1][PROPS] as $propTag => $propValue){
					$propTag = Conversion::json2property($mapping, $propTag);
					if (mapi_prop_type($propTag) === PT_BINARY) {
						$propValue = hex2bin($propValue);
					}
					$props[$propTag] = $propValue;
				}

				$json[1][PROPS] = $props;
				$json[1][RESTRICTION] = Conversion::json2restriction($mapping, $json[1][RESTRICTION]);
				break;
			case RES_PROPERTY:
			case RES_CONTENT:
				$json[1][ULPROPTAG] = Conversion::json2property($mapping, $json[1][ULPROPTAG]);
				$value = array();

				foreach ($json[1][VALUE] as $propTag => $propValue) {
					$propTag = Conversion::json2property($mapping, $propTag, true);
					$type = mapi_prop_type($propTag);

					if ($type === PT_BINARY) {
						$propValue = hex2bin($propValue);
					} else if ($type === PT_MV_STRING8) {
						// Convert multivalued strings to arrays
						$mv_values = explode(";", $propValue);
						$values = array();

						foreach($mv_values as $mv_value)
						{
							if(!empty($mv_value)) {
								$values[] = ltrim($mv_value);
							}
						}

						$propValue = !empty($values) ? $values : array();
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
	 * @access private
	 * @param {MAPISRestriction} $restriction The MAPI Restriction array
	 * @return {Array} Array structure that can be easily serialized to JSON format
	 */
	public static function restriction2json($restriction)
	{
		if (!is_array($restriction)){
			return $restriction;
		}

		switch($restriction[0]){
			case RES_AND:
			case RES_OR:
				if(!empty($restriction[1][0])) {
					foreach($restriction[1] as &$res) {
						$res = Conversion::restriction2json($res);
					}
					unset($res);
				} else if(!empty($restriction[1])) {
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
				$props = Array();

				foreach($restriction[1][PROPS] as $propTag => $propValue) {
					if (mapi_prop_type($propTag) === PT_BINARY) {
						$propValue = bin2hex($propValue);
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
				$value = array();

				foreach ($restriction[1][VALUE] as $propTag => $propValue) {
					if (mapi_prop_type($propTag) === PT_BINARY) {
						$propValue = bin2hex($propValue);
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
	 * Retrieves singlevalued counterpart of a multivalued property
	 *
	 * Multivalued properties has different property tags in VALUES part
	 * so we need to find that singlevalued property tag
	 *
	 * @param {Number} $propTag The multivalued property tag in string
	 * @return {Number} The singlevalued property tag
	 */
	public static function convertToSingleValuedProperty($propTag)
	{
		if  (is_string($propTag)) {
			// if the string starts with '0x' then we have
			// an acceptable propTag on which we can work
			// to change the MV_flag value
			if (substr($propTag, 0, 2) == '0x') {
				$propTag = hexdec($propTag);
				$propTag &= ~MV_FLAG;
				$propTag = '0x' . strtoupper(str_pad(dechex_32($propTag), 8, '0', STR_PAD_LEFT));
			}
		} else {
			// If numeric, just remove the MV_FLAG
			$propTag &= ~MV_FLAG;
		}

		return $propTag;
	}

	/**
	 * Converts a JSON Representation of PT_ACTIONS value array to its MAPI form.
	 *
	 * @param {Array} $actions JSON representation PT_ACTIONS structure
	 * @return {Array} Converted PT_ACTIONS structure that can be used in MAPI
	 */
	public static function json2actions($mapping, $actions)
	{
		foreach($actions as &$action) {
			foreach($action as $key => $value) {
				switch($key) {
					case 'storeentryid':
					case 'folderentryid':
					case 'replyentryid':
					case 'replyguid':
					case 'dam':
						$action[$key] = hex2bin($value);
						break;
					case 'adrlist':
						$recipients = Array();

						foreach($value as $addr) {
							$recipient = Array();

							foreach($addr as $addrkey => $addrval) {
								$addrkey = Conversion::json2property($mapping, $addrkey);

								if (mapi_prop_type($addrkey) === PT_BINARY) {
									$addrval = hex2bin($addrval);
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
	 * Converts a MAPI PT_ACTIONS value array to its JSON representation
	 *
	 * @param {Array} $actions MAPI PT_ACTIONS structure
	 * @return {Array} Converted PT_ACTIONS structure that can be used in javascript
	 */
	public static function actions2json($actions)
	{
		foreach($actions as &$action) {
			foreach($action as $key => $value) {
				switch($key) {
					case 'storeentryid':
					case 'folderentryid':
					case 'replyentryid':
					case 'replyguid':
					case 'dam':
						$action[$key] = bin2hex($value);
						break;
					case 'adrlist':
						$recipients = Array();

						foreach($value as $addr) {
							$recipient = Array();

							foreach($addr as $addrkey => $addrval) {
								if (mapi_prop_type($addrkey) === PT_BINARY) {
									$addrval = bin2hex($addrval);
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
	 * Table taken from common/codepage.cpp
	 * @see http://msdn.microsoft.com/en-us/library/dd317756(VS.85).aspx
	 * Note: The order is done like this because we use this array in the findCharSet
	 * function, which is called when a message identifies itself with a charset that
	 * it isn't in. Because this mostly happens with iso-8859-1 that says they are in
	 * utf-8, we use this order to first check if it isn't iso-8859-1.
	 * @property
	 */
	private static $_CODEPAGES = array(
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
		65001 => "utf-8",
		20106 => "DIN_66003",
		20108 => "NS_4551-1",
		20107 => "SEN_850200_B",
		950 => "big5",
		50221 => "csISO2022JP",
		51932 => "euc-jp",
		51936 => "euc-cn",
		51949 => "euc-kr",
		949 => "euc-kr",
		936 => "gb18030",
		52936 => "csgb2312",
		852 => "ibm852",
		866 => "ibm866",
		50220 => "iso-2022-jp",
		50222 => "iso-2022-jp",
		50225 => "iso-2022-kr",
		1252 => "windows-1252",
		20866 => "koi8-r",
		21866 => "koi8-u",
		932 => "shift-jis",
		1200 => "unicode",
		1201 => "unicodebig",
		65000 => "utf-7",
		1250 => "windows-1250",
		1251 => "windows-1251",
		1253 => "windows-1253",
		1254 => "windows-1254",
		1255 => "windows-1255",
		1256 => "windows-1256",
		1257 => "windows-1257",
		1258 => "windows-1258",
		874 => "windows-874",
		20127 => "us-ascii"
	);

	/**
	 * Get charset name from a codepage
	 *
	 * @param integer codepage Codepage
	 * @return string iconv-compatible charset name
	 */
	public static function getCodepageCharset($codepage)
	{
		if(isset(Conversion::$_CODEPAGES[$codepage])) {
			return Conversion::$_CODEPAGES[$codepage];
		} else {
			// Defaulting to iso-8859-15 since it is more likely for someone to make a mistake in the codepage
			// when using west-european charsets then when using other charsets since utf-8 is binary compatible
			// with the bottom 7 bits of west-european
			return "iso-8859-15";
		}
	}

	/**
	 * Tries to find the character set of a given string
	 * 
	 * @param string $string The string for which a charset is requested
	 * @return string
	 */
	private static function findCharSet($string)
	{
		// Let's try mb_detect_encoding first
		$charset = mb_detect_encoding($string, "auto");
		
		if ( $charset !== false ){
			return $charset;
		} else {
			// Let's try them all
			foreach ( Conversion::$_CODEPAGES as $code=>$cs ){
				if ( strlen(iconv($cs, $cs, $string)) === strlen($string) ){
					return $cs;
				}
			}
		}

		// No charset found
		return false; 
	}

	/**
	 * Converts a string with a given codepage to utf-8
	 * 
	 * @param integer $codepage The codepage of the given string
	 * @param string $string The string that must be converted
	 * @return string
	 */
	public static function convertCodepageStringToUtf8($codepage, $string)
	{	
		$charset = Conversion::getCodepageCharset($codepage);
		
		// Sometimes a mail identifies itself with a charset that it really isn't, so let's do an extra check
		if ( strlen(iconv($charset, $charset, $string)) !== strlen($string) ) {
			$foundCharset = Conversion::findCharSet($string);
			if ( $foundCharset ){
				$charset = $foundCharset;
			}
		};
		
		return iconv($charset, "utf-8", $string);
	}
}
