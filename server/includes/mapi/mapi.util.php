<?php
/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * SPDX-FileCopyrightText: Copyright 2005-2016 Zarafa Deutschland GmbH
 * SPDX-FileCopyrightText: Copyright 2020-2022 grommunio GmbH
 */

/**
 * Function to make a MAPIGUID from a php string.
 * The C++ definition for the GUID is:
 *  typedef struct _GUID
 *  {
 *   unsigned long        Data1;
 *   unsigned short       Data2;
 *   unsigned short       Data3;
 *   unsigned char        Data4[8];
 *  } GUID;.
 *
 * A GUID is normally represented in the following form:
 * 	{00062008-0000-0000-C000-000000000046}
 *
 * @param string GUID
 * @param mixed $guid
 */
function makeGuid($guid) {
	return pack("vvvv", hexdec(substr($guid, 5, 4)), hexdec(substr($guid, 1, 4)), hexdec(substr($guid, 10, 4)), hexdec(substr($guid, 15, 4))) . hex2bin(substr($guid, 20, 4)) . hex2bin(substr($guid, 25, 12));
}

/**
 * Function to get a human readable string from a MAPI error code.
 *
 *@param int $errcode the MAPI error code, if not given, we use mapi_last_hresult
 *
 *@return string The defined name for the MAPI error code
 */
function get_mapi_error_name($errcode = null) {
	if ($errcode === null) {
		$errcode = mapi_last_hresult();
	}

	if ($errcode !== 0) {
		// Retrieve constants categories, MAPI error names are defined
		// in the 'user' category, since the grommunio code defines it in mapicode.php.
		foreach (get_defined_constants(true)['user'] as $key => $value) {
			/*
			 * If PHP encounters a number beyond the bounds of the integer type,
			 * it will be interpreted as a float instead, so when comparing these error codes
			 * we have to manually typecast value to integer, so float will be converted in integer,
			 * but still its out of bound for integer limit so it will be auto adjusted to minus value
			 */
			if ($errcode == (int) $value) {
				// Check that we have an actual MAPI error or warning definition
				$prefix = substr($key, 0, 7);
				if ($prefix == "MAPI_E_" || $prefix == "MAPI_W_") {
					return $key;
				}
			}
		}
	}
	else {
		return "NOERROR";
	}

	// error code not found, return hex value (this is a fix for 64-bit systems, we can't use the dechex() function for this)
	$result = unpack("H*", pack("N", $errcode));

	return "0x" . $result[1];
}

/**
 * Parses properties from an array of strings. Each "string" may be either an ULONG, which is a direct property ID,
 * or a string with format "PT_TYPE:{GUID}:StringId" or "PT_TYPE:{GUID}:0xXXXX" for named
 * properties.
 *
 * @returns array of properties
 *
 * @param mixed $store
 * @param mixed $mapping
 */
function getPropIdsFromStrings($store, $mapping) {
	$props = [];

	$ids = ["name" => [], "id" => [], "guid" => [], "type" => []]; // this array stores all the information needed to retrieve a named property
	$num = 0;

	// caching
	$guids = [];

	foreach ($mapping as $name => $val) {
		if (is_string($val)) {
			$split = explode(":", $val);

			if (count($split) != 3) { // invalid string, ignore
				trigger_error(sprintf("Invalid property: %s \"%s\"", $name, $val), E_USER_NOTICE);

				continue;
			}

			if (substr($split[2], 0, 2) == "0x") {
				$id = hexdec(substr($split[2], 2));
			}
			else {
				$id = $split[2];
			}

			// have we used this guid before?
			if (!defined($split[1])) {
				if (!array_key_exists($split[1], $guids)) {
					$guids[$split[1]] = makeguid($split[1]);
				}
				$guid = $guids[$split[1]];
			}
			else {
				$guid = constant($split[1]);
			}

			// temp store info about named prop, so we have to call mapi_getidsfromnames just one time
			$ids["name"][$num] = $name;
			$ids["id"][$num] = $id;
			$ids["guid"][$num] = $guid;
			$ids["type"][$num] = $split[0];
			++$num;
		}
		else {
			// not a named property
			$props[$name] = $val;
		}
	}

	if (empty($ids["id"])) {
		return $props;
	}

	// get the ids
	$named = mapi_getidsfromnames($store, $ids["id"], $ids["guid"]);
	foreach ($named as $num => $prop) {
		$props[$ids["name"][$num]] = mapi_prop_tag(constant($ids["type"][$num]), mapi_prop_id($prop));
	}

	return $props;
}

/**
 * Check whether a call to mapi_getprops returned errors for some properties.
 * mapi_getprops function tries to get values of properties requested but somehow if
 * if a property value can not be fetched then it changes type of property tag as PT_ERROR
 * and returns error for that particular property, probable errors
 * that can be returned as value can be MAPI_E_NOT_FOUND, MAPI_E_NOT_ENOUGH_MEMORY.
 *
 * @param long  $property  Property to check for error
 * @param array $propArray An array of properties
 *
 * @return mixed Gives back false when there is no error, if there is, gives the error
 */
function propIsError($property, $propArray) {
	if (array_key_exists(mapi_prop_tag(PT_ERROR, mapi_prop_id($property)), $propArray)) {
		return $propArray[mapi_prop_tag(PT_ERROR, mapi_prop_id($property))];
	}

	return false;
}

/* Macro Functions for PR_DISPLAY_TYPE_EX values */
/**
 * check addressbook object is a remote mailuser.
 *
 * @param mixed $value
 */
function DTE_IS_REMOTE_VALID($value) {
	return (bool) ($value & DTE_FLAG_REMOTE_VALID);
}

/**
 * check addressbook object is able to receive permissions.
 *
 * @param mixed $value
 */
function DTE_IS_ACL_CAPABLE($value) {
	return (bool) ($value & DTE_FLAG_ACL_CAPABLE);
}

function DTE_REMOTE($value) {
	return ($value & DTE_MASK_REMOTE) >> 8;
}

function DTE_LOCAL($value) {
	return $value & DTE_MASK_LOCAL;
}

/**
 * Note: Static function, more like a utility function.
 *
 * Gets all the items (including recurring items) in the specified calendar in the given timeframe. Items are
 * included as a whole if they overlap the interval <$start, $end> (non-inclusive). This means that if the interval
 * is <08:00 - 14:00>, the item [6:00 - 8:00> is NOT included, nor is the item [14:00 - 16:00>. However, the item
 * [7:00 - 9:00> is included as a whole, and is NOT capped to [8:00 - 9:00>.
 *
 * @param $store resource The store in which the calendar resides
 * @param $calendar resource The calendar to get the items from
 * @param $viewstart int Timestamp of beginning of view window
 * @param $viewend int Timestamp of end of view window
 * @param $propsrequested array Array of properties to return
 * @param $rows array Array of rowdata as if they were returned directly from mapi_table_queryrows. Each recurring item is
 *                    expanded so that it seems that there are only many single appointments in the table.
 */
function getCalendarItems($store, $calendar, $viewstart, $viewend, $propsrequested) {
	$result = [];
	$properties = getPropIdsFromStrings($store, [
		"duedate" => "PT_SYSTIME:PSETID_Appointment:0x820e",
		"startdate" => "PT_SYSTIME:PSETID_Appointment:0x820d",
		"enddate_recurring" => "PT_SYSTIME:PSETID_Appointment:0x8236",
		"recurring" => "PT_BOOLEAN:PSETID_Appointment:0x8223",
		"recurring_data" => "PT_BINARY:PSETID_Appointment:0x8216",
		"timezone_data" => "PT_BINARY:PSETID_Appointment:0x8233",
		"label" => "PT_LONG:PSETID_Appointment:0x8214",
	]);

	// Create a restriction that will discard rows of appointments that are definitely not in our
	// requested time frame

	$table = mapi_folder_getcontentstable($calendar);

	$restriction =
		// OR
		[
			RES_OR,
			[
				[RES_AND,	// Normal items: itemEnd must be after viewStart, itemStart must be before viewEnd
					[
						[
							RES_PROPERTY,
							[
								RELOP => RELOP_GT,
								ULPROPTAG => $properties["duedate"],
								VALUE => $viewstart,
							],
						],
						[
							RES_PROPERTY,
							[
								RELOP => RELOP_LT,
								ULPROPTAG => $properties["startdate"],
								VALUE => $viewend,
							],
						],
					],
				],
				// OR
				[
					RES_PROPERTY,
					[
						RELOP => RELOP_EQ,
						ULPROPTAG => $properties["recurring"],
						VALUE => true,
					],
				],
			],	// EXISTS OR
		];		// global OR

	// Get requested properties, plus whatever we need
	$proplist = [PR_ENTRYID, $properties["recurring"], $properties["recurring_data"], $properties["timezone_data"]];
	$proplist = array_merge($proplist, $propsrequested);

	$rows = mapi_table_queryallrows($table, $proplist, $restriction);

	// $rows now contains all the items that MAY be in the window; a recurring item needs expansion before including in the output.

	foreach ($rows as $row) {
		$items = [];

		if (isset($row[$properties["recurring"]]) && $row[$properties["recurring"]]) {
			// Recurring item
			$rec = new Recurrence($store, $row);

			// GetItems guarantees that the item overlaps the interval <$viewstart, $viewend>
			$occurrences = $rec->getItems($viewstart, $viewend);
			foreach ($occurrences as $occurrence) {
				// The occurrence takes all properties from the main row, but overrides some properties (like start and end obviously)
				$item = $occurrence + $row;
				array_push($items, $item);
			}
		}
		else {
			// Normal item, it matched the search criteria and therefore overlaps the interval <$viewstart, $viewend>
			array_push($items, $row);
		}

		$result = array_merge($result, $items);
	}

	// All items are guaranteed to overlap the interval <$viewstart, $viewend>. Note that we may be returning a few extra
	// properties that the caller did not request (recurring, etc). This shouldn't be a problem though.
	return $result;
}

	/**
	 * Compares two entryIds. It is possible to have two different entryIds that should match as they
	 * represent the same object (in multiserver environments).
	 *
	 * @param {String} entryId1 EntryID
	 * @param {String} entryId2 EntryID
	 * @param mixed $entryId1
	 * @param mixed $entryId2
	 *
	 * @return {Boolean} Result of the comparison
	 */
	function compareEntryIds($entryId1, $entryId2) {
		if (!is_string($entryId1) || !is_string($entryId2)) {
			return false;
		}

		if ($entryId1 === $entryId2) {
			// if normal comparison succeeds then we can directly say that entryids are same
			return true;
		}

		return false;
	}

	/**
	 * Creates a goid from an ical uuid.
	 *
	 * @param $uid
	 *
	 * @return string binary string representation of goid
	 */
	function getGoidFromUid($uid) {
		return hex2bin("040000008200E00074C5B7101A82E0080000000000000000000000000000000000000000" .
					bin2hex(pack("V", 12 + strlen($uid)) . "vCal-Uid" . pack("V", 1) . $uid));
	}

	/**
	 * Creates an ical uuid from a goid.
	 *
	 * @param $goid
	 *
	 * @return string ical uuid
	 */
	function getUidFromGoid($goid) {
		// check if "vCal-Uid" is somewhere in outlookid case-insensitive
		$uid = stristr($goid, "vCal-Uid");
		if ($uid !== false) {
			// get the length of the ical id - go back 4 position from where "vCal-Uid" was found
			$begin = unpack("V", substr($goid, strlen($uid) * (-1) - 4, 4));
			// remove "vCal-Uid" and packed "1" and use the ical id length
			return substr($uid, 12, ($begin[1] - 12));
		}

		return null;
	}
