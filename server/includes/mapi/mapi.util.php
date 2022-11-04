<?php
/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * SPDX-FileCopyrightText: Copyright 2005-2016 Zarafa Deutschland GmbH
 * SPDX-FileCopyrightText: Copyright 2020-2022 grommunio GmbH
 */

define('NOERROR', 0);

// Load all mapi defs
mapi_load_mapidefs(1);

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
 * @param string $guid
 *
 * @return false|string
 */
function makeGuid($guid) {
	return pack("vvvv", hexdec(substr($guid, 5, 4)), hexdec(substr($guid, 1, 4)), hexdec(substr($guid, 10, 4)), hexdec(substr($guid, 15, 4))) . hex2bin(substr($guid, 20, 4)) . hex2bin(substr($guid, 25, 12));
}

/**
 * Function to get a human readable string from a MAPI error code.
 *
 * @param mixed $errcode the MAPI error code, if not given, we use mapi_last_hresult
 *
 * @return string The defined name for the MAPI error code
 */
function get_mapi_error_name($errcode = null) {
	if ($errcode === null) {
		$errcode = mapi_last_hresult();
	}

	if (strcasecmp(substr($errcode, 0, 2), '0x') === 0) {
		$errcode = hexdec($errcode);
	}

	if ($errcode !== 0) {
		// Retrieve constants categories, MAPI error names are defined in gromox.
		foreach (get_defined_constants(true)['Core'] as $key => $value) {
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
				$prefix = substr($key, 0, 2);
				if ($prefix == "ec") {
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
 * @param mixed $store
 * @param mixed $mapping
 *
 * @return array
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
			elseif (preg_match('/^[1-9][0-9]{0,12}$/', $split[2])) {
				$id = (int) $split[2];
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
 * @param int   $property  Property to check for error
 * @param array $propArray An array of properties
 *
 * @return bool|mixed Gives back false when there is no error, if there is, gives the error
 */
function propIsError($property, $propArray) {
	if (array_key_exists(mapi_prop_tag(PT_ERROR, mapi_prop_id($property)), $propArray)) {
		return $propArray[mapi_prop_tag(PT_ERROR, mapi_prop_id($property))];
	}

	return false;
}

/**
 * Note: Static function, more like a utility function.
 *
 * Gets all the items (including recurring items) in the specified calendar in the given timeframe. Items are
 * included as a whole if they overlap the interval <$start, $end> (non-inclusive). This means that if the interval
 * is <08:00 - 14:00>, the item [6:00 - 8:00> is NOT included, nor is the item [14:00 - 16:00>. However, the item
 * [7:00 - 9:00> is included as a whole, and is NOT capped to [8:00 - 9:00>.
 *
 * @param resource $store          The store in which the calendar resides
 * @param resource $calendar       The calendar to get the items from
 * @param int      $viewstart      Timestamp of beginning of view window
 * @param int      $viewend        Timestamp of end of view window
 * @param array    $propsrequested Array of properties to return
 *
 * @return array
 */
function getCalendarItems($store, $calendar, $viewstart, $viewend, $propsrequested) {
	$result = [];
	$properties = getPropIdsFromStrings($store, [
		"duedate" => "PT_SYSTIME:PSETID_Appointment:" . PidLidAppointmentEndWhole,
		"startdate" => "PT_SYSTIME:PSETID_Appointment:" . PidLidAppointmentStartWhole,
		"enddate_recurring" => "PT_SYSTIME:PSETID_Appointment:" . PidLidClipEnd,
		"recurring" => "PT_BOOLEAN:PSETID_Appointment:" . PidLidRecurring,
		"recurring_data" => "PT_BINARY:PSETID_Appointment:" . PidLidAppointmentRecur,
		"timezone_data" => "PT_BINARY:PSETID_Appointment:" . PidLidTimeZoneStruct,
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
 * @param mixed $entryId1 EntryID
 * @param mixed $entryId2 EntryID
 *
 * @return bool Result of the comparison
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
 * @param string $uid
 *
 * @return string binary string representation of goid
 */
function getGoidFromUid($uid) {
	return hex2bin("040000008200E00074C5B7101A82E0080000000000000000000000000000000000000000" .
				bin2hex(pack("V", 12 + strlen($uid)) . "vCal-Uid" . pack("V", 1) . $uid));
}

/**
 * Returns zero terminated goid. It is required for backwards compatibility.
 * 
 *
 * @param string $icalUid an appointment uid as HEX
 *
 * @return string an OL compatible GlobalObjectID
 */
function getGoidFromUidZero($uid) {
	if (strlen($uid) <= 64) {
		return hex2bin("040000008200E00074C5B7101A82E0080000000000000000000000000000000000000000" .
			bin2hex(pack("V", 13 + strlen($uid)) . "vCal-Uid" . pack("V", 1) . $uid) . "00");
	}

	return hex2bin($uid);
}

/**
 * Creates an ical uuid from a goid.
 *
 * @param string $goid
 *
 * @return null|string ical uuid
 */
function getUidFromGoid($goid) {
	// check if "vCal-Uid" is somewhere in outlookid case-insensitive
	$uid = stristr($goid, "vCal-Uid");
	if ($uid !== false) {
		// get the length of the ical id - go back 4 position from where "vCal-Uid" was found
		$begin = unpack("V", substr($goid, strlen($uid) * (-1) - 4, 4));
		// remove "vCal-Uid" and packed "1" and use the ical id length
		return trim(substr($uid, 12, $begin[1] - 12));
	}

	return null;
}

/**
 * Returns an error message from error code.
 *
 * @param int $e error code
 *
 * @return string error message
 */
function mapi_strerror($e) {
	switch ($e) {
		case 0: return "success";

		case MAPI_E_CALL_FAILED: return "An error of unexpected or unknown origin occurred";

		case MAPI_E_NOT_ENOUGH_MEMORY: return "Not enough memory was available to complete the operation";

		case MAPI_E_INVALID_PARAMETER: return "An invalid parameter was passed to a function or remote procedure call";

		case MAPI_E_INTERFACE_NOT_SUPPORTED: return "MAPI interface not supported";

		case MAPI_E_NO_ACCESS: return "An attempt was made to access a message store or object for which the user has insufficient permissions";

		case MAPI_E_NO_SUPPORT: return "Function is not implemented";

		case MAPI_E_BAD_CHARWIDTH: return "An incompatibility exists in the character sets supported by the caller and the implementation";

		case MAPI_E_STRING_TOO_LONG: return "In the context of this method call, a string exceeds the maximum permitted length";

		case MAPI_E_UNKNOWN_FLAGS: return "One or more values for a flags parameter were not valid";

		case MAPI_E_INVALID_ENTRYID: return "invalid entryid";

		case MAPI_E_INVALID_OBJECT: return "A method call was made using a reference to an object that has been destroyed or is not in a viable state";

		case MAPI_E_OBJECT_CHANGED: return "An attempt to commit changes failed because the object was changed separately";

		case MAPI_E_OBJECT_DELETED: return "An operation failed because the object was deleted separately";

		case MAPI_E_BUSY: return "A table operation failed because a separate operation was in progress at the same time";

		case MAPI_E_NOT_ENOUGH_DISK: return "Not enough disk space was available to complete the operation";

		case MAPI_E_NOT_ENOUGH_RESOURCES: return "Not enough system resources were available to complete the operation";

		case MAPI_E_NOT_FOUND: return "The requested object could not be found at the server";

		case MAPI_E_VERSION: return "Client and server versions are not compatible";

		case MAPI_E_LOGON_FAILED: return "A client was unable to log on to the server";

		case MAPI_E_SESSION_LIMIT: return "A server or service is unable to create any more sessions";

		case MAPI_E_USER_CANCEL: return "An operation failed because a user cancelled it";

		case MAPI_E_UNABLE_TO_ABORT: return "A ropAbort or ropAbortSubmit ROP request was unsuccessful";

		case MAPI_E_NETWORK_ERROR: return "An operation was unsuccessful because of a problem with network operations or services";

		case MAPI_E_DISK_ERROR: return "There was a problem writing to or reading from disk";

		case MAPI_E_TOO_COMPLEX: return "The operation requested is too complex for the server to handle (often w.r.t. restrictions)";

		case MAPI_E_BAD_COLUMN: return "The column requested is not allowed in this type of table";

		case MAPI_E_EXTENDED_ERROR: return "extended error";

		case MAPI_E_COMPUTED: return "A property cannot be updated because it is read-only, computed by the server";

		case MAPI_E_CORRUPT_DATA: return "There is an internal inconsistency in a database, or in a complex property value";

		case MAPI_E_UNCONFIGURED: return "unconfigured";

		case MAPI_E_FAILONEPROVIDER: return "failoneprovider";

		case MAPI_E_UNKNOWN_CPID: return "The server is not configured to support the code page requested by the client";

		case MAPI_E_UNKNOWN_LCID: return "The server is not configured to support the locale requested by the client";

		case MAPI_E_PASSWORD_CHANGE_REQUIRED: return "password change required";

		case MAPI_E_PASSWORD_EXPIRED: return "password expired";

		case MAPI_E_INVALID_WORKSTATION_ACCOUNT: return "invalid workstation account";

		case MAPI_E_INVALID_ACCESS_TIME: return "The operation failed due to clock skew between servers";

		case MAPI_E_ACCOUNT_DISABLED: return "account disabled";

		case MAPI_E_END_OF_SESSION: return "The server session has been destroyed, possibly by a server restart";

		case MAPI_E_UNKNOWN_ENTRYID: return "The EntryID passed to OpenEntry was created by a different MAPI provider";

		case MAPI_E_MISSING_REQUIRED_COLUMN: return "missing required column";

		case MAPI_W_NO_SERVICE: return "no service";

		case MAPI_E_BAD_VALUE: return "bad value";

		case MAPI_E_INVALID_TYPE: return "invalid type";

		case MAPI_E_TYPE_NO_SUPPORT: return "type no support";

		case MAPI_E_UNEXPECTED_TYPE: return "unexpected_type";

		case MAPI_E_TOO_BIG: return "The table is too big for the requested operation to complete";

		case MAPI_E_DECLINE_COPY: return "The provider implements this method by calling a support object method, and the caller has passed the MAPI_DECLINE_OK flag";

		case MAPI_E_UNEXPECTED_ID: return "unexpected id";

		case MAPI_W_ERRORS_RETURNED: return "The call succeeded, but the message store provider has error information available";

		case MAPI_E_UNABLE_TO_COMPLETE: return "A complex operation such as building a table row set could not be completed";

		case MAPI_E_TIMEOUT: return "An asynchronous operation did not succeed within the specified time-out";

		case MAPI_E_TABLE_EMPTY: return "A table essential to the operation is empty";

		case MAPI_E_TABLE_TOO_BIG: return "The table is too big for the requested operation to complete";

		case MAPI_E_INVALID_BOOKMARK: return "The bookmark passed to a table operation was not created on the same table";

		case MAPI_W_POSITION_CHANGED: return "position changed";

		case MAPI_W_APPROX_COUNT: return "approx count";

		case MAPI_E_WAIT: return "A wait time-out has expired";

		case MAPI_E_CANCEL: return "The operation had to be canceled";

		case MAPI_E_NOT_ME: return "not me";

		case MAPI_W_CANCEL_MESSAGE: return "cancel message";

		case MAPI_E_CORRUPT_STORE: return "corrupt store";

		case MAPI_E_NOT_IN_QUEUE: return "not in queue";

		case MAPI_E_NO_SUPPRESS: return "The server does not support the suppression of read receipts";

		case MAPI_E_COLLISION: return "A folder or item cannot be created because one with the same name or other criteria already exists";

		case MAPI_E_NOT_INITIALIZED: return "The subsystem is not ready";

		case MAPI_E_NON_STANDARD: return "non standard";

		case MAPI_E_NO_RECIPIENTS: return "A message cannot be sent because it has no recipients";

		case MAPI_E_SUBMITTED: return "A message cannot be opened for modification because it has already been sent";

		case MAPI_E_HAS_FOLDERS: return "A folder cannot be deleted because it still contains subfolders";

		case MAPI_E_HAS_MESSAGES: return "A folder cannot be deleted because it still contains messages";

		case MAPI_E_FOLDER_CYCLE: return "A folder move or copy operation would create a cycle";

		case MAPI_W_PARTIAL_COMPLETION: return "The call succeeded, but not all entries were successfully operated on";

		case MAPI_E_AMBIGUOUS_RECIP: return "An unresolved recipient matches more than one directory entry";

		case MAPI_E_STORE_FULL: return "Store full";

		default: return sprintf("%xh", $e);
	}
}
