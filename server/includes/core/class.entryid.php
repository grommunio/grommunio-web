<?php
	class EntryId
	{
		/* Bit definitions for abFlags[3] of ENTRYID */
		const ZARAFA_FAVORITE = '01';

		/* GUID of root public folder */
		const STATIC_GUID_PUBLICFOLDER = '00000000000000000000000000000003';
		/* GUID of root favorite folder */
		const STATIC_GUID_FAVORITE = '00000000000000000000000000000002';
		/* GUID of ipm_subtree of public store*/
		const STATIC_GUID_FAVSUBTREE = '00000000000000000000000000000001';
		/* GUID of Global Addressbook */
		const MUIDECSAB = 'AC21A95040D3EE48B319FBA753304425';
		/* GUID of Contact Provider */
		const MUIDZCSAB = '727F0430E3924FDAB86AE52A7FE46571';
		/* GUID for OneOff entryid */
		const MAPI_ONE_OFF_UID = '812B1FA4BEA310199D6E00DD010F5402';
		/* GUID for Address book recipient */
		const MUIDEMSAB = 'DCA740C8C042101AB4B908002B2FE182';

		/* Hardcoded ID used for generating entryid of addressbook container */
		const ZARAFA_UID_ADDRESS_BOOK = '00000000';
		/* Hardcoded ID used for generating entryid of global addressbook container */
		const ZARAFA_UID_GLOBAL_ADDRESS_BOOK = '01000000';
		/* Hardcoded ID used for generating entryid of global addresslists container */
		const ZARAFA_UID_GLOBAL_ADDRESS_LISTS = '02000000';

		public function __construct()
		{
		}

		// Detect padding (max 3 bytes) from the entryId
		private function getPadding($entryId)
		{
			$len = strlen($entryId);
			$padding = '';
			$offset = 0;

			for ($iterations = 4; $iterations > 0; $iterations--) {
				if (substr($entryId, $len - ($offset + 2), $len - $offset) == '00') {
					$padding .= '00';
					$offset += 2;
				} else {
					// if non-null character found then break the loop
					break;
				}
			}

			return $padding;
		}

		// Entryid from version 6
		private function getEIDVersion($entryid)
		{
			// always make entryids in uppercase so comparison will be case insensitive
			$entryId = strtoupper($entryid);

			$res = array(
				'abFlags'	=> '',		// BYTE[4],   4 bytes,  8 hex characters
				'guid'		=> '',		// GUID,     16 bytes, 32 hex characters
				'version'	=> '',		// ULONG,     4 bytes,  8 hex characters
				'type'		=> '',		// ULONG,     4 bytes,  8 hex characters
				'uniqueId'	=> '',		// ULONG,    16 bytes,  32 hex characters
				'server'	=> '',		// CHAR,     variable length
				'padding'	=> '',		// TCHAR[3],  4 bytes,  8 hex characters (upto 4 bytes)
			);

			$res['length'] = strlen($entryId);
			$offset = 0;

			// First determine padding, and remove if from the entryId
			$res['padding'] = $this->getPadding($entryId);
			$entryId = substr($entryId, 0, strlen($entryId) - strlen($res['padding']));

			$res['abFlags'] = substr($entryId, $offset, 8);
			$offset =+ 8;

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

		// The entryid from the begin of zarafa till 5.20
		private function getEID_V0Version($entryid)
		{
			// always make entryids in uppercase so comparison will be case insensitive
			$entryId = strtoupper($entryid);

			$res = array(
				'abFlags'	=> '',		// BYTE[4],   4 bytes,  8 hex characters
				'guid'		=> '',		// GUID,     16 bytes, 32 hex characters
				'version'	=> '',		// ULONG,     4 bytes,  8 hex characters
				'type'		=> '',		// ULONG,     4 bytes,  8 hex characters
				'id'		=> '',		// ULONG,     4 bytes,  8 hex characters
				'server'	=> '',		// CHAR,     variable length
				'padding'	=> '',		// TCHAR[3],  4 bytes,  8 hex characters (upto 4 bytes)
			);

			$res['length'] = strlen($entryId);
			$offset = 0;

			// First determine padding, and remove if from the entryId
			$res['padding'] = $this->getPadding($entryId);
			$entryId = substr($entryId, 0, strlen($entryId) - strlen($res['padding']));

			$res['abFlags'] = substr($entryId, $offset, 8);
			$offset =+ 8;

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

		// wrapped store entryid
		private function getWrappedSEID($storeEntryId)
		{
			$res = array();

			$res['name'] = 'WrappedSEID';
			$res['length'] = strlen($storeEntryId);

			// always make entryids in uppercase so comparison will be case insensitive
			$storeEntryId = strtoupper($storeEntryId);

			$offset = 0;

			$res['flags'] = substr($storeEntryId, $offset, 8);
			$offset += 8;

			$res['providerUID'] = substr($storeEntryId, $offset, 32);
			$offset += 32;

			$res['version'] = substr($storeEntryId, $offset, 2);
			$offset += 2;

			$res['type'] = substr($storeEntryId, $offset, 2);
			$offset += 2;

			// find length of dll name, find null character which indicates end of dll name after the current offset
			$termCharIndex = strpos(substr($storeEntryId, $offset), '00');
			$res['DLLFileName'] = substr($storeEntryId, $offset, $termCharIndex);
			$offset += $termCharIndex;

			$res['terminationChar'] = substr($storeEntryId, $offset, 2);
			$offset += 2;

			$res['unWrappedEntryId'] = substr($storeEntryId, $offset);

			// unwrapped entryid is actually an object entryid so decompose it
			$res['unWrappedEntryId'] = $this->createEntryIdObj($res['unWrappedEntryId']);

			return $res;
		}

		// Addressbook Entryid
		private function getABEIDVersion($entryId)
		{
			// always make entryids in uppercase so comparison will be case insensitive
			$entryId = strtoupper($entryId);

			$res = array(
				'abFlags'	=> '',		// BYTE[4],   4 bytes,  8 hex characters
				'guid'		=> '',		// GUID,     16 bytes, 32 hex characters
				'version'	=> '',		// ULONG,     4 bytes,  8 hex characters
				'type'		=> '',		// ULONG,     4 bytes,  8 hex characters
				'id'		=> '',		// ULONG,    16 bytes,  32 hex characters
				'extid'		=> '',		// CHAR,     variable length
				'padding'	=> '',		// TCHAR[3],  4 bytes,  8 hex characters (upto 4 bytes)
			);

			$res['length'] = strlen($entryId);
			$offset = 0;

			// First determine padding, and remove if from the entryId
			$res['padding'] = $this->getPadding($entryId);
			$entryId = substr($entryId, 0, strlen($entryId) - strlen($res['padding']));

			$res['abFlags'] = substr($entryId, $offset, 8);
			$offset =+ 8;

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
		 * @param {String} entryid Entryid
		 * @return {Object} EntryID object
		 */
		private function createEntryIdObj($entryid)
		{
			// check if we are dealing with old or new object entryids
			$versionString = substr($entryid, 40, 8);

			if($versionString == '00000000') {
				// use EID_V0 struct
				$eidObj = $this->getEID_V0Version($entryid);
			} else {
				// use EID struct
				$eidObj = $this->getEIDVersion($entryid);
			}

			return $eidObj;
		}

		/**
		 * Compares two entryIds. It is possible to have two different entryIds that should match as they
		 * represent the same object (in multiserver environments).
		 * @param {String} entryId1 EntryID
		 * @param {String} entryId2 EntryID
		 * @return {Boolean} Result of the comparison
		 */
		public function compareEntryIds($entryId1, $entryId2)
		{
			if(!is_string($entryId1) || !is_string($entryId2)) {
				return false;
			}

			if($entryId1 === $entryId2) {
				// if normal comparison succeeds then we can directly say that entryids are same
				return true;
			}
			return false;
		}

		/**
		 * Creates an object that has split up all the components of a store entryid.
		 * @param {String} storeEntryId unwrapped store entryid.
		 * @return {Object} store entryid object.
		 */
		private function createStoreEntryIdObj($storeEntryId)
		{
			return $this->getWrappedSEID($storeEntryId);
		}

		/**
		 * Compares two entryIds. It is possible to have two different entryIds that should match as they
		 * represent the same object (in multiserver environments).
		 * @param {String} storeEntryId1 store entryid
		 * @param {String} storeEntryId2 store entryid
		 * @return {Boolean} Result of the comparison
		 */
		public function compareStoreEntryIds($storeEntryId1, $storeEntryId2)
		{
			if(!is_string($storeEntryId1) || !is_string($storeEntryId2)) {
				return false;
			}

			if($storeEntryId1 === $storeEntryId2) {
				// if normal comparison succeeds then we can directly say that entryids are same
				return true;
			}
			return false;
		}

		/**
		 * Creates an object that has split up all the components of an addressbook entryid.
		 * @param {String} abEntryId unwrapped addressbook entryid.
		 * @return {Object} addresbook entryid object.
		 */
		public function createABEntryIdObj($abEntryId)
		{
			return $this->getABEIDVersion($abEntryId);
		}

		/**
		 * Creates an object that has wrapped a normal entryid using the AddressBook Provider GUID
		 * @param {String} entryId unwrapped entryid.
		 * @param {Number} objType The ObjectType which represents the object
		 * @return {String} wrapped addresbook entryid object.
		 */
		public function wrapABEntryIdObj($entryId, $objType)
		{
			$objType = dechex($objType);

			// add padding for the type, which is of 4 bytes (8 characters)
			$objType = str_pad($objType, 2, '0', STR_PAD_LEFT);
			$objType = str_pad($objType, 8, '0', STR_PAD_RIGHT);

			return '00000000' . self::MUIDZCSAB . $objType . '00000000' . $entryId;
		}

		/**
		 * Unwrap a Address Book Provider Entryid to a normal entryid
		 * @param {String} abEntryId wrapped entryid
		 * @return {Object} unwrapped entryid
		 */
		public function unwrapABEntryIdObj($abEntryId)
		{
			// Remove ulVersion (8 char), muid (32 char), ulObjType (8 char) and ulOffset (8 char)
			return substr($abEntryId, 56);
		}

		/**
		 * Compares two entryIds. It is possible to have two different entryIds that should match as they
		 * represent the same object (in multiserver environments).
		 * @param {String} entryId1 EntryID
		 * @param {String} entryId2 EntryID
		 * @return {Boolean} Result of the comparison
		 */
		public function compareABEntryIds($entryId1, $entryId2)
		{
			if(!is_string($entryId1) || !is_string($entryId2)) {
				return false;
			}

			if($entryId1 === $entryId2) {
				// if normal comparison succeeds then we can directly say that entryids are same
				return true;
			}
			return false;
		}

		/**
		 * Checks if the passed folder entryid is a folder in the favorites folder, favorites folder
		 * contains 0x01 in the abFlags[3] flag.
		 * @param {String} entryId folder entryid
		 * @return {Boolean} true of folder is a favorite folder else false
		 */
		public function isFavoriteFolder($entryId)
		{
			$entryIdObj = $this->createEntryIdObj($entryId);

			return (substr($entryIdObj['abFlags'], 6, 8) == self::ZARAFA_FAVORITE);
		}

		/**
		 * Checks if the given entryid is a oneoff entryid.
		 * @param {String} entryId The entryid
		 * @return {Boolean} true if the entryid is a oneoff
		 */
		public function isOneOffEntryId($entryId)
		{
			$entryIdObj = $this->createEntryIdObj($entryId);

			return $entryIdObj['guid'] == self::MAPI_ONE_OFF_UID;
		}

		/**
		 * Checks if the passed folder entryid is root favorites folder.
		 * @param {String} entryId folder entryid
		 * @return {Boolean} true of folder is a root favorite folder else false
		 */
		public function isFavoriteRootFolder($entryId)
		{
			$entryIdObj = $this->createEntryIdObj($entryId);

			return $entryIdObj['uniqueId'] == self::STATIC_GUID_FAVORITE;
		}

		/**
		 * Checks if the passed folder entryid is root public folder.
		 * @param {String} entryId folder entryid
		 * @return {Boolean} true of folder is a root public folder else false
		 */
		public function isPublicRootFolder($entryId)
		{
			$entryIdObj = $this->createEntryIdObj($entryId);

			return $entryIdObj['uniqueId'] == self::STATIC_GUID_PUBLICFOLDER;
		}

		/**
		 * Checks if the passed folder entryid is public subtree folder.
		 * @param {String} entryId folder entryid
		 * @return {Boolean} true of folder is a root public folder else false
		 */
		public function isPublicSubtreeFolder($entryId)
		{
			$entryIdObj = $this->createEntryIdObj($entryId);

			return $entryIdObj['uniqueId'] == self::STATIC_GUID_FAVSUBTREE;
		}

		/**
		 * Checks if the given entryid
		 * @param {String} entryId Addressbook entryid
		 *
		 */
		public function hasContactProviderGUID($entryId)
		{
			$entryIdObj = $this->createABEntryIdObj($entryId);

			return $entryIdObj['guid'] == self::MUIDZCSAB;
		}

		/**
		 * Checks if the GUID part of the entryid is of the Global Addressbook.
		 * @param {String} $entryId Address Book entryid
		 * @return {Boolean} true if guid matches the Global Addressbook else false
		 */
		public function hasAddressBookGUID($entryId)
		{
			$entryIdObj = $this->createABEntryIdObj($entryId);

			return $entryIdObj['guid'] == self::MUIDECSAB;
		}

		/**
		 * Checks if the GUID part of the entryid is of the Address book recipient.
		 * @param {String} $entryId Address Book entryid
		 * @return {Boolean} true if guid matches the Ab recipient else false
		 */
		public function hasAddressBookRecipientGUID($entryId)
		{
			$entryIdObj = $this->createABEntryIdObj($entryId);

			return $entryIdObj['guid'] == self::MUIDEMSAB;
		}

		/**
		 * Checks if the GUID part of the entryid is of the Global Addressbook Container.
		 * @param {String} $entryId Address Book entryid
		 * @return {Boolean} true if guid matches the Global Addressbook Container else false
		 */
		public function isGlobalAddressbookContainer($entryId)
		{
			// check for global addressbook entryid
			if($this->hasAddressBookGUID($entryId) === false) {
				return false;
			}

			$entryIdObj = $this->createABEntryIdObj($entryId);

			// check for object_type == MAPI_ABCONT and id == 1
			return ($entryIdObj['type'] == '04000000' && $entryIdObj['id'] == self::ZARAFA_UID_GLOBAL_ADDRESS_BOOK);
		}

		/**
		 * Creates an object that has split up all the components of an message store entryid.
		 * @param {String} $entryId message store entryid
		 * @return {Object} message store entryid object
		 */
		public function createMsgStoreEntryIdObj($entryId) {
			$res = array(
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
				'V2' => array(
					'Magic' => '',
					'Size' => '',
					'Version' => '',
					'OffsetDN' => '',
					'OffsetFQDN' => '',
					'ServerDN' => '',
					'ServerFQDN' => '',
					'ReservedBlock' => ''
				),
				'V3' => array(
					'Magic' => '',
					'Size' => '',
					'Version' => '',
					'OffsetSmtpAddress' => '',
					'SmtpAddress' => '',
				)
			);

			if (!$entryId) {
				return $res;
			}

			$offset = 0;
			if (!$this->getAndCheckComponents($entryId, $offset, 4, 0x0, $res, 'Flags')) {
				return $res;
			};
			$offset += 4;

			if (!$this->getAndCheckComponents($entryId, $offset, 16, MUID_STORE_WRAP_GUID, $res, 'ProviderUID')) {
				return $res;
			};
			$offset += 16;

			if (!$this->getAndCheckComponents($entryId, $offset, 1, 0x0, $res, 'Version')) {
				return $res;
			};
			$offset += 1;

			if (!$this->getAndCheckComponents($entryId, $offset, 1, 0x0, $res, 'Flag')) {
				return $res;
			};
			$offset += 1;

			if (!$this->getAndCheckComponents($entryId, $offset, 10, 'emsmdb.dll', $res, 'DLLFileName')) {
				return $res;
			};
			$offset += 14;

			if (!$this->getAndCheckComponents($entryId, $offset, 4, 0x0, $res, 'WrappedFlags')) {
				return $res;
			};
			$offset += 4;

			if (!$this->getAndCheckComponents($entryId, $offset, 16, array(MUID_STORE_PRIVATE_GUID, MUID_STORE_PUBLIC_GUID), $res, 'WrappedProviderUID')) {
				return $res;
			};
			$offset += 16;

			if (!$this->getAndCheckComponents($entryId, $offset, 4, array_map('hex2bin', array('0C000000', '06000000')), $res, 'WrappedType')) {
				return $res;
			};
			$offset += 4;

			$zeroBytePos = strpos($entryId, "\0", $offset);
			if ($zeroBytePos !== false) {
				$res['ServerShortname'] = trim(substr($entryId, $offset, $zeroBytePos - $offset));
				$offset = $zeroBytePos + 1;
			}

			$zeroBytePos = strpos($entryId, "\0", $offset);
			if ($zeroBytePos !== false) {
				$res['MailboxDN'] = trim(substr($entryId, $offset, $zeroBytePos - $offset));
				$offset = $zeroBytePos + 1;
			}

			// TODO V2 and V3 structs

			return $res;
		}

		/**
		 * Reads $len bytes beginning from $start of the $entryid,
		 * checks if the value of resulting string is expected and adds it
		 * to $res object in such case.
		 * @param {String} $entryId message store entryid
		 * @param {int} $start start position of the value to get
		 * @param {int} $len length in bytes of the value to get
		 * @param {Object} $checkValue value to check against
		 * @param {Object} $res message store entryid object
		 * @param {String} $key component name
		 * @return {Boolean} true if the component has the expected value, false otherwise.
		 */
		private function getAndCheckComponents($entryId, $start, $len, $checkValue, &$res, $key) {
			$val = substr($entryId, $start, $len);
			if (is_array($checkValue)) {
				 if (!in_array($val, $checkValue)) {
					error_log(sprintf("Unexpected value in store entryid for user %s. Entryid: %s key: '%s' value: '%s' expected: %s",
						$GLOBALS["mapisession"]->getUserName(), bin2hex($entryId), $key, $val, print_r(array_map('bin2hex', $checkValue), 1)));
					return false;
				 }
			}
			elseif ($checkValue !== null && $val != $checkValue) {
				$user = $GLOBALS["mapisession"] !== null ? $GLOBALS["mapisession"]->getUserName() :
				        "<mapisession not yet initialized>";
				error_log(sprintf("Unexpected value in store entryid for user %s. Entryid: %s key: '%s' value: '%s' expected: %s",
				          $user, bin2hex($entryId), $key, $val, $checkValue));
				return false;
			}

			$res[$key] = $val;
			return true;
		}

		/**
		 * Creates an object that has split up all the components of a message entryid.
		 * @param {String} $entryId message entryid
		 * @return {Object} message entryid object
		 */
		public function createMessageEntryIdObj($entryId)
		{
			// always make entryids in uppercase so comparison will be case insensitive
			$entryId = strtoupper($entryId);

			$res = array(
				'providerguid' => '',			// GUID,     16 bytes, 32 hex characters
				'messagetype' => '',			// UINT,      2 bytes,  4 hex characters
				'folderdbguid' => '',			// GUID,     16 bytes, 32 hex characters
				'foldercounter'	=> '',		// ULONG,     6 bytes, 12 hex characters
				'padding'	=> '',					// TCHAR[3],  2 bytes,  4 hex characters
				'messagedbguid' => '',		// GUID,     16 bytes, 32 hex characters
				'messagecounter'	=> '',	// ULONG,     6 bytes, 12 hex characters
			);

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
		 * @param $providerguid {String} provider guid
		 * @param $foldertype {int} folder type flag
		 * @param $folderdbguid {String} folder db guid
		 * @param $foldercounter {String} folder counter
		 * @return {String} folder entryid
		 */
		public function createFolderEntryId($providerguid, $foldertype, $folderdbguid, $foldercounter)
		{
			return strtoupper('00000000' . $providerguid . $foldertype . $folderdbguid . $foldercounter . '0000');
		}

		/**
		 * Creates an object that has split up all the components of a folder entryid.
		 * @param {String} $entryId folder entryid
		 * @return {Object} folder entryid object
		 */
		public function createFolderEntryIdObj($entryId)
		{
			// always make entryids in uppercase so comparison will be case insensitive
			$entryId = strtoupper($entryId);

			$res = array(
				'abflags'	=> '',					// BYTE[4],   4 bytes,  8 hex characters
				'providerguid' => '',			// GUID,     16 bytes, 32 hex characters
				'foldertype' => '',				// UINT,      2 bytes,  4 hex characters
				'folderdbguid' => '',			// GUID,     16 bytes, 32 hex characters
				'foldercounter'	=> '',		// ULONG,     6 bytes, 12 hex characters
				'padding'	=> '',					// TCHAR[3],  2 bytes,  4 hex characters
			);

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
	}

	// Create global entryId object
	$GLOBALS["entryid"] = new EntryId();
?>
