<?php

class EntryId {
	/* Bit definitions for abFlags[3] of ENTRYID */
	public const ZARAFA_FAVORITE = '01';

	/* GUID of root public folder */
	public const STATIC_GUID_PUBLICFOLDER = '00000000000000000000000000000003';
	/* GUID of root favorite folder */
	public const STATIC_GUID_FAVORITE = '00000000000000000000000000000002';
	/* GUID of ipm_subtree of public store */
	public const STATIC_GUID_FAVSUBTREE = '00000000000000000000000000000001';
	/* GUID of Global Addressbook */
	public const MUIDECSAB = 'AC21A95040D3EE48B319FBA753304425';
	/* GUID of Contact Provider */
	public const MUIDZCSAB = '727F0430E3924FDAB86AE52A7FE46571';
	/* GUID for OneOff entryid */
	public const MAPI_ONE_OFF_UID = '812B1FA4BEA310199D6E00DD010F5402';
	/* GUID for Address book recipient */
	public const MUIDEMSAB = 'DCA740C8C042101AB4B908002B2FE182';

	/* Hardcoded ID used for generating entryid of addressbook container */
	public const ZARAFA_UID_ADDRESS_BOOK = '00000000';
	/* Hardcoded ID used for generating entryid of global addressbook container */
	public const ZARAFA_UID_GLOBAL_ADDRESS_BOOK = '01000000';
	/* Hardcoded ID used for generating entryid of global addresslists container */
	public const ZARAFA_UID_GLOBAL_ADDRESS_LISTS = '02000000';

	public function __construct() {}

	// Detect padding (max 3 bytes) from the entryId
	private function getPadding($entryId) {
		$len = strlen((string) $entryId);
		$padding = '';
		$offset = 0;

		for ($iterations = 4; $iterations > 0; --$iterations) {
			if (substr((string) $entryId, $len - ($offset + 2), $len - $offset) == '00') {
				$padding .= '00';
				$offset += 2;
			}
			else {
				// if non-null character found then break the loop
				break;
			}
		}

		return $padding;
	}

	/**
	 * Entryid from version 6.
	 *
	 * @param mixed $entryid
	 *
	 * @return array
	 */
	private function getEIDVersion($entryid) {
		// always make entryids in uppercase so comparison will be case insensitive
		$entryId = strtoupper((string) $entryid);

		$res = [
			'abFlags' => '',		// BYTE[4],   4 bytes,  8 hex characters
			'guid' => '',		// GUID,     16 bytes, 32 hex characters
			'version' => '',		// ULONG,     4 bytes,  8 hex characters
			'type' => '',		// ULONG,     4 bytes,  8 hex characters
			'uniqueId' => '',		// ULONG,    16 bytes,  32 hex characters
			'server' => '',		// CHAR,     variable length
			'padding' => '',		// TCHAR[3],  4 bytes,  8 hex characters (upto 4 bytes)
		];

		$res['length'] = strlen($entryId);
		$offset = 0;

		// First determine padding, and remove if from the entryId
		$res['padding'] = $this->getPadding($entryId);
		$entryId = substr($entryId, 0, strlen($entryId) - strlen((string) $res['padding']));

		$res['abFlags'] = substr($entryId, $offset, 8);
		$offset = +8;

		$res['guid'] = substr($entryId, $offset, 32);
		$offset += 32;

		$res['version'] = substr($entryId, $offset, 8);
		$offset += 8;

		$res['type'] = substr($entryId, $offset, 8);
		$offset += 8;

		$res['uniqueId'] = substr($entryId, $offset, 32);
		$offset += 32;

		$res['server'] = substr($entryId, $offset);

		$res['min_length'] = 88;
		$res['name'] = 'EID';

		return $res;
	}

	/**
	 * The entryid from the begin of zarafa till 5.20.
	 *
	 * @param mixed $entryid
	 *
	 * @return array
	 */
	private function getEID_V0Version($entryid) {
		// always make entryids in uppercase so comparison will be case insensitive
		$entryId = strtoupper((string) $entryid);

		$res = [
			'abFlags' => '',		// BYTE[4],   4 bytes,  8 hex characters
			'guid' => '',		// GUID,     16 bytes, 32 hex characters
			'version' => '',		// ULONG,     4 bytes,  8 hex characters
			'type' => '',		// ULONG,     4 bytes,  8 hex characters
			'id' => '',		// ULONG,     4 bytes,  8 hex characters
			'server' => '',		// CHAR,     variable length
			'padding' => '',		// TCHAR[3],  4 bytes,  8 hex characters (upto 4 bytes)
		];

		$res['length'] = strlen($entryId);
		$offset = 0;

		// First determine padding, and remove if from the entryId
		$res['padding'] = $this->getPadding($entryId);
		$entryId = substr($entryId, 0, strlen($entryId) - strlen((string) $res['padding']));

		$res['abFlags'] = substr($entryId, $offset, 8);
		$offset = +8;

		$res['guid'] = substr($entryId, $offset, 32);
		$offset += 32;

		$res['version'] = substr($entryId, $offset, 8);
		$offset += 8;

		$res['type'] = substr($entryId, $offset, 8);
		$offset += 8;

		$res['id'] = substr($entryId, $offset, 8);
		$offset += 8;

		$res['server'] = substr($entryId, $offset);

		$res['min_length'] = 64;
		$res['name'] = 'EID_V0';

		return $res;
	}

	/**
	 * Addressbook Entryid.
	 *
	 * @param mixed $entryId
	 *
	 * @return array
	 */
	private function getABEIDVersion($entryId) {
		// always make entryids in uppercase so comparison will be case insensitive
		$entryId = strtoupper((string) $entryId);

		$res = [
			'abFlags' => '',		// BYTE[4],   4 bytes,  8 hex characters
			'guid' => '',		// GUID,     16 bytes, 32 hex characters
			'version' => '',		// ULONG,     4 bytes,  8 hex characters
			'type' => '',		// ULONG,     4 bytes,  8 hex characters
			'id' => '',		// ULONG,    16 bytes,  32 hex characters
			'extid' => '',		// CHAR,     variable length
			'padding' => '',		// TCHAR[3],  4 bytes,  8 hex characters (upto 4 bytes)
		];

		$res['length'] = strlen($entryId);
		$offset = 0;

		// First determine padding, and remove if from the entryId
		$res['padding'] = $this->getPadding($entryId);
		$entryId = substr($entryId, 0, strlen($entryId) - strlen((string) $res['padding']));

		$res['abFlags'] = substr($entryId, $offset, 8);
		$offset = +8;

		$res['guid'] = substr($entryId, $offset, 32);
		$offset += 32;

		$res['version'] = substr($entryId, $offset, 8);
		$offset += 8;

		$res['type'] = substr($entryId, $offset, 8);
		$offset += 8;

		$res['id'] = substr($entryId, $offset, 8);
		$offset += 8;

		$res['extid'] = substr($entryId, $offset);

		$res['min_length'] = 88;
		$res['name'] = 'ABEID';

		return $res;
	}

	/**
	 * Creates an object that has split up all the components of an entryID.
	 *
	 * @param mixed $entryid
	 *
	 * @return array EntryID object
	 */
	private function createEntryIdObj($entryid) {
		// check if we are dealing with old or new object entryids
		$versionString = substr((string) $entryid, 40, 8);

		if ($versionString == '00000000') {
			// use EID_V0 struct
			$eidObj = $this->getEID_V0Version($entryid);
		}
		else {
			// use EID struct
			$eidObj = $this->getEIDVersion($entryid);
		}

		return $eidObj;
	}

	/**
	 * Compares two entryIds. It is possible to have two different entryIds that should match as they
	 * represent the same object (in multiserver environments).
	 *
	 * @param mixed $entryId1
	 * @param mixed $entryId2
	 *
	 * @return bool Result of the comparison
	 */
	public function compareEntryIds($entryId1, $entryId2) {
		// if normal comparison succeeds then we can directly say that entryids are same
		return is_string($entryId1) && is_string($entryId2) && $entryId1 === $entryId2;
	}

	/**
	 * Creates an object that has split up all the components of an addressbook entryid.
	 *
	 * @param mixed $abEntryId unwrapped addressbook entryid
	 *
	 * @return array addresbook entryid object
	 */
	public function createABEntryIdObj($abEntryId) {
		return $this->getABEIDVersion($abEntryId);
	}

	/**
	 * Creates an object that has wrapped a normal entryid using the AddressBook Provider GUID.
	 *
	 * @param mixed $entryId unwrapped entryid
	 * @param mixed $objType The ObjectType which represents the object
	 *
	 * @return string wrapped addresbook entryid object
	 */
	public function wrapABEntryIdObj($entryId, $objType) {
		$objType = dechex($objType);

		// add padding for the type, which is of 4 bytes (8 characters)
		$objType = str_pad($objType, 2, '0', STR_PAD_LEFT);
		$objType = str_pad($objType, 8, '0', STR_PAD_RIGHT);

		return '00000000' . self::MUIDZCSAB . $objType . '00000000' . $entryId;
	}

	/**
	 * Unwrap a Address Book Provider Entryid to a normal entryid.
	 *
	 * @param mixed $abEntryId wrapped entryid
	 *
	 * @return string unwrapped entryid
	 */
	public function unwrapABEntryIdObj($abEntryId) {
		// Remove ulVersion (8 char), muid (32 char), ulObjType (8 char) and ulOffset (8 char)
		return substr((string) $abEntryId, 56);
	}

	/**
	 * Checks if the passed folder entryid is a folder in the favorites folder, favorites folder
	 * contains 0x01 in the abFlags[3] flag.
	 *
	 * @param mixed $entryId folder entryid
	 *
	 * @return bool true of folder is a favorite folder else false
	 */
	public function isFavoriteFolder($entryId) {
		$entryIdObj = $this->createEntryIdObj($entryId);

		return substr((string) $entryIdObj['abFlags'], 6, 8) == self::ZARAFA_FAVORITE;
	}

	/**
	 * Checks if the GUID part of the entryid is of the contact provider.
	 *
	 * @param mixed $entryId Addressbook entryid
	 *
	 * @return bool true if guid matches contact provider else false
	 */
	public function hasContactProviderGUID($entryId) {
		$entryIdObj = $this->createABEntryIdObj($entryId);

		return $entryIdObj['guid'] == self::MUIDZCSAB;
	}

	/**
	 * Checks if the GUID part of the entryid is of the Global Addressbook.
	 *
	 * @param mixed $entryId Address Book entryid
	 *
	 * @return bool true if guid matches the Global Addressbook else false
	 */
	public function hasAddressBookGUID($entryId) {
		$entryIdObj = $this->createABEntryIdObj($entryId);

		return $entryIdObj['guid'] == self::MUIDECSAB;
	}

	/**
	 * Checks if the GUID part of the entryid is of the Address book recipient.
	 *
	 * @param mixed $entryId Address Book entryid
	 *
	 * @return bool true if guid matches the Ab recipient else false
	 */
	public function hasAddressBookRecipientGUID($entryId) {
		$entryIdObj = $this->createABEntryIdObj($entryId);

		return $entryIdObj['guid'] == self::MUIDEMSAB;
	}

	/**
	 * Checks if the GUID part of the entryid is of the OneOff.
	 *
	 * @param mixed $entryId Address Book entryid
	 *
	 * @return bool true if guid matches the OneOff else false
	 */
	public function hasAddressBookOneOff($entryId) {
		$entryIdObj = $this->createABEntryIdObj($entryId);

		return $entryIdObj['guid'] == self::MAPI_ONE_OFF_UID;
	}

	/**
	 * Creates an object that has split up all the components of an message store entryid.
	 *
	 * @param mixed $entryId message store entryid
	 *
	 * @return array message store entryid object
	 */
	public function createMsgStoreEntryIdObj($entryId) {
		$res = [
			'Flags' => '',
			'ProviderUID' => '',
			'Version' => '',
			'Flag' => '',
			'DLLFileName' => '',
			'WrappedFlags' => '',
			'WrappedProviderUID' => '',
			'WrappedType' => '',
			'ServerShortname' => '',
			'MailboxDN' => '',
			'V2' => [
				'Magic' => '',
				'Size' => '',
				'Version' => '',
				'OffsetDN' => '',
				'OffsetFQDN' => '',
				'ServerDN' => '',
				'ServerFQDN' => '',
				'ReservedBlock' => '',
			],
			'V3' => [
				'Magic' => '',
				'Size' => '',
				'Version' => '',
				'OffsetSmtpAddress' => '',
				'SmtpAddress' => '',
			],
		];

		if (!$entryId) {
			return $res;
		}

		$offset = 0;
		if (!$this->getAndCheckComponents($entryId, $offset, 4, 0x0, $res, 'Flags')) {
			return $res;
		}
		$offset += 4;

		if (!$this->getAndCheckComponents($entryId, $offset, 16, MUID_STORE_WRAP_GUID, $res, 'ProviderUID')) {
			return $res;
		}
		$offset += 16;

		if (!$this->getAndCheckComponents($entryId, $offset, 1, 0x0, $res, 'Version')) {
			return $res;
		}
		++$offset;

		if (!$this->getAndCheckComponents($entryId, $offset, 1, 0x0, $res, 'Flag')) {
			return $res;
		}
		++$offset;

		if (!$this->getAndCheckComponents($entryId, $offset, 10, 'emsmdb.dll', $res, 'DLLFileName')) {
			return $res;
		}
		$offset += 14;

		if (!$this->getAndCheckComponents($entryId, $offset, 4, 0x0, $res, 'WrappedFlags')) {
			return $res;
		}
		$offset += 4;

		if (!$this->getAndCheckComponents($entryId, $offset, 16, [MUID_STORE_PRIVATE_GUID, MUID_STORE_PUBLIC_GUID], $res, 'WrappedProviderUID')) {
			return $res;
		}
		$offset += 16;

		if (!$this->getAndCheckComponents($entryId, $offset, 4, array_map('hex2bin', ['0C000000', '06000000']), $res, 'WrappedType')) {
			return $res;
		}
		$offset += 4;

		$zeroBytePos = strpos((string) $entryId, "\0", $offset);
		if ($zeroBytePos !== false) {
			$res['ServerShortname'] = trim(substr((string) $entryId, $offset, $zeroBytePos - $offset));
			$offset = $zeroBytePos + 1;
		}

		$zeroBytePos = strpos((string) $entryId, "\0", $offset);
		if ($zeroBytePos !== false) {
			$res['MailboxDN'] = trim(substr((string) $entryId, $offset, $zeroBytePos - $offset));
			$offset = $zeroBytePos + 1;
		}

		// TODO V2 and V3 structs

		return $res;
	}

	/**
	 * Reads $len bytes beginning from $start of the $entryid,
	 * checks if the value of resulting string is expected and adds it
	 * to $res object in such case.
	 *
	 * @param string $entryId    message store entryid
	 * @param int    $start      start position of the value to get
	 * @param int    $len        length in bytes of the value to get
	 * @param mixed  $checkValue value to check against
	 * @param array  $res        message store entryid object
	 * @param string $key        component name
	 *
	 * @return bool true if the component has the expected value, false otherwise
	 */
	private function getAndCheckComponents($entryId, $start, $len, $checkValue, &$res, $key) {
		$val = substr($entryId, $start, $len);
		if (is_int($checkValue)) {
			$val = intval($val);
		}
		if (is_array($checkValue)) {
			if (!in_array($val, $checkValue)) {
				error_log(sprintf(
					"Unexpected value in store entryid for user %s. Entryid: %s key: '%s' value: '%s' expected: %s",
					$GLOBALS["mapisession"]->getUserName(),
					bin2hex($entryId),
					$key,
					$val,
					print_r(array_map('bin2hex', $checkValue), 1)
				));

				return false;
			}
		}
		elseif ($checkValue !== null && $val != $checkValue) {
			$user = $GLOBALS["mapisession"] !== null ? $GLOBALS["mapisession"]->getUserName() :
					"<mapisession not yet initialized>";
			error_log(sprintf(
				"Unexpected value in store entryid for user %s. Entryid: %s key: '%s' value: '%s' expected: %s",
				$user,
				bin2hex($entryId),
				$key,
				$val,
				/* @scrutinizer ignore-type */
				$checkValue
			));

			return false;
		}

		$res[$key] = $val;

		return true;
	}

	/**
	 * Creates an object that has split up all the components of a message entryid.
	 *
	 * @param mixed $entryId message entryid
	 *
	 * @return array message entryid object
	 */
	public function createMessageEntryIdObj($entryId) {
		// always make entryids in uppercase so comparison will be case insensitive
		$entryId = strtoupper((string) $entryId);

		$res = [
			'providerguid' => '',			// GUID,     16 bytes, 32 hex characters
			'messagetype' => '',			// UINT,      2 bytes,  4 hex characters
			'folderdbguid' => '',			// GUID,     16 bytes, 32 hex characters
			'foldercounter' => '',		// ULONG,     6 bytes, 12 hex characters
			'padding' => '',					// TCHAR[3],  2 bytes,  4 hex characters
			'messagedbguid' => '',		// GUID,     16 bytes, 32 hex characters
			'messagecounter' => '',	// ULONG,     6 bytes, 12 hex characters
		];

		if (!$entryId) {
			return $res;
		}

		$res['length'] = strlen($entryId);
		$offset = 0;

		$res['providerguid'] = substr($entryId, $offset, 32);
		$offset += 32;

		$res['messagetype'] = substr($entryId, $offset, 4);
		$offset += 4;

		$res['folderdbguid'] = substr($entryId, $offset, 32);
		$offset += 32;

		$res['foldercounter'] = substr($entryId, $offset, 12);
		$offset += 12;

		$res['padding'] = substr($entryId, $offset, 4);
		$offset += 4;

		$res['messagedbguid'] = substr($entryId, $offset, 32);
		$offset += 32;

		$res['messagecounter'] = substr($entryId, $offset, 12);
		$offset += 12;

		return $res;
	}

	/**
	 * Creates a folder entryid with provided parameters.
	 *
	 * @param string $providerguid  provider guid
	 * @param int    $foldertype    folder type flag
	 * @param string $folderdbguid  folder db guid
	 * @param string $foldercounter folder counter
	 *
	 * @return string folder entryid
	 */
	public function createFolderEntryId($providerguid, $foldertype, $folderdbguid, $foldercounter) {
		return strtoupper('00000000' . $providerguid . $foldertype . $folderdbguid . $foldercounter . '0000');
	}

	/**
	 * Creates an object that has split up all the components of a folder entryid.
	 *
	 * @param mixed $entryId folder entryid
	 *
	 * @return array folder entryid object
	 */
	public function createFolderEntryIdObj($entryId) {
		// always make entryids in uppercase so comparison will be case insensitive
		$entryId = strtoupper((string) $entryId);

		$res = [
			'abflags' => '',					// BYTE[4],   4 bytes,  8 hex characters
			'providerguid' => '',			// GUID,     16 bytes, 32 hex characters
			'foldertype' => '',				// UINT,      2 bytes,  4 hex characters
			'folderdbguid' => '',			// GUID,     16 bytes, 32 hex characters
			'foldercounter' => '',		// ULONG,     6 bytes, 12 hex characters
			'padding' => '',					// TCHAR[3],  2 bytes,  4 hex characters
		];

		if (!$entryId) {
			return $res;
		}

		$res['length'] = strlen($entryId);
		$offset = 0;

		$res['abflags'] = substr($entryId, $offset, 8);
		$offset += 8;

		$res['providerguid'] = substr($entryId, $offset, 32);
		$offset += 32;

		$res['foldertype'] = substr($entryId, $offset, 4);
		$offset += 4;

		$res['folderdbguid'] = substr($entryId, $offset, 32);
		$offset += 32;

		$res['foldercounter'] = substr($entryId, $offset, 12);
		$offset += 12;

		$res['padding'] = substr($entryId, $offset, 4);
		$offset += 4;

		return $res;
	}

	/**
	 * Creates an array that has split up all the components of a timezone
	 * definition binary.
	 *
	 * Timezone definition structure:
	 *
	 * Major ver : UINT, 1 byte,  2 hex characters
	 * Minor ver : UINT, 1 byte,  2 hex characters
	 * cbHeader  : UINT, 2 bytes, 4 hex characters
	 * Reserved  : UINT, 2 bytes, 4 hex characters
	 * cchKeyName: UINT, 2 bytes, 4 hex characters
	 * KeyName   : CHAR, variable length (defined by cckeyname value)
	 * cRules    : UINT, 2 bytes, 4 hex characters
	 * rules     : STRUCT, variable length (defined by cRules value):
	 *   Major ver     : UINT, 1 byte,  2 hex characters
	 *   Minor ver     : UINT, 1 byte,  2 hex characters
	 *   Reserved      : UINT, 2 bytes, 4 hex characters
	 *   TZRule flags  : UINT, 2 bytes, 4 hex characters
	 *   wYear         : UINT, 2 bytes, 4 hex characters
	 *   X             : TCHAR[14]
	 *   lBias         : LONG, 4 bytes, 8 hex characters
	 *   lStandardBias : LONG, 4 bytes, 8 hex characters
	 *   lDaylightBias : LONG, 4 bytes, 8 hex characters
	 *   stStandardDate: STRUCT
	 *   stDaylightDate: STRUCT
	 *
	 * stStandardDate/stDaylightDate:
	 *   wYear        : UINT, 2 bytes, 4 hex characters
	 *   wMonth       : UINT, 2 bytes, 4 hex characters
	 *   wDayOfWeek   : UINT, 2 bytes, 4 hex characters
	 *   wDay         : UINT, 2 bytes, 4 hex characters
	 *   wHour        : UINT, 2 bytes, 4 hex characters
	 *   wMinute      : UINT, 2 bytes, 4 hex characters
	 *   wSecond      : UINT, 2 bytes, 4 hex characters
	 *   wMilliseconds: UINT, 2 bytes, 4 hex characters
	 *
	 * @param string $tzdef Timezone definition binary
	 *
	 * @return array timezone definition array
	 */
	public function createTimezoneDefinitionObject($tzdef) {
		if (!$tzdef) {
			return [];
		}

		$offset = 0;

		$res = unpack("Cmajorver/Cminorver/vcbheader/vreserved/vcchkeyname", substr($tzdef, $offset, 8));
		$offset += 8;

		$cchKeyName = $res['cchkeyname'] * 2;
		$data = unpack("a{$cchKeyName}keyname/vcrules", substr($tzdef, $offset, $cchKeyName + 2));
		$res['keyname'] = $data['keyname'];
		$res['crules'] = $data['crules'];
		$offset += $cchKeyName + 2;

		for ($i = 0; $i < $res['crules']; ++$i) {
			$rule = [];
			$rule = unpack(
				"Cmajorver/Cminorver/vreserved/vtzruleflags/vwyear/a14x/lbias/lstdbias/ldstbias/",
				substr($tzdef, $offset, 34)
			);
			$offset += 34;

			$rule['stStandardDate'] = unpack(
				"vyear/vmonth/vdayofweek/vday/vhour/vminute/vsecond/vmiliseconds/",
				substr($tzdef, $offset, 16)
			);
			$offset += 16;

			$rule['stDaylightDate'] = unpack(
				"vyear/vmonth/vdayofweek/vday/vhour/vminute/vsecond/vmiliseconds/",
				substr($tzdef, $offset, 16)
			);
			$offset += 16;

			$res['rules'][] = $rule;
		}

		return $res;
	}

	/**
	 * Creates a Muidemsab entryid with provided parameters.
	 *
	 * @param string $user username
	 *
	 * @return string Muidemsab entryid
	 */
	public function createMuidemsabEntryid($user) {
		return "00000000dca740c8c042101ab4b908002b2fe1820100000000000000" . bin2hex($user);
	}

	/**
	 * Checks if the GUID part of the entryid has one of the known MUIDs.
	 *
	 * @param mixed $entryId Addressbook entryid
	 *
	 * @return bool true if guid matches one of the known MUIDs else false
	 */
	public function hasNoMuid($entryId) {
		$entryIdObj = $this->createABEntryIdObj($entryId);

		return $entryIdObj['guid'] != self::MUIDZCSAB &&
			$entryIdObj['guid'] != self::MUIDECSAB &&
			$entryIdObj['guid'] != self::MUIDEMSAB;
	}
}

// Create global entryId object

$GLOBALS["entryid"] = new EntryId();
