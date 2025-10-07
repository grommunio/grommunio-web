Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.EntryId
 *
 * Class for decoding entryids and for comparison between two entryids
 * we have basically two types of entryids object and store entryids.
 *
 * object entryids uses structure EID for entryids created
 * and for older entryids it uses structure EID_V0. Store entryids are generally wrapped
 * with some extra information (like guid for provider, dll name) which should be removed
 * before comparing two store entryids, after removing this wrapping the unwrapped entryid
 * uses the format same as object entryids (EID or EID_V0).
 *
 * version flag in EID and EID_V0 are specific flags and indicate which structure is used
 * to create that entryid, EID always contains version as '01000000' and EID_V0 always contains
 * '00000000' as version flag.
 *
 * server part of EID and EID_V0 indicates server name and it can be variable length, padding can be
 * upto 3 bytes so it can be anything between 0 to 3 bytes.
 *
 * in public store public root folder, ipm_subtree and favorites folder are custom folders
 * so they have static uniqueids.
 *
 * @singleton
 */
Zarafa.core.EntryId = (function()
{
	/* Bit definitions for abFlags[3] of ENTRYID */
	var ZARAFA_FAVORITE = '01';

	/* GUID of root public folder */
	var STATIC_GUID_PUBLICFOLDER = '00000000000000000000000000000003';
	/* GUID of root favorite folder */
	var STATIC_GUID_FAVORITE = '00000000000000000000000000000002';
	/* GUID of ipm_subtree of public store*/
	var STATIC_GUID_FAVSUBTREE = '00000000000000000000000000000001';
	/* GUID of Global Addressbook */
	var MUIDECSAB = 'AC21A95040D3EE48B319FBA753304425';
	/* GUID of Contact Provider */
	var MUIDZCSAB = '727F0430E3924FDAB86AE52A7FE46571';
	/* GUID for OneOff entryid */
	var MAPI_ONE_OFF_UID = '812B1FA4BEA310199D6E00DD010F5402';
	/* GUID for Address book recipient */
	var MUIDEMSAB = 'DCA740C8C042101AB4B908002B2FE182';

	/* Hardcoded ID used for generating entryid of addressbook container */
	var ZARAFA_UID_GLOBAL_ADDRESS_BOOK = '01000000';

	var BASE_EID = Ext.extend(Object, {

		// The entryid which this object represents
		entryId: '',

		// The length of the entryid
		length: 0,

		// Constructor
		// param: Entryid The entryid represented by this object
		constructor: function(entryId)
		{
			if(entryId) {
				// always make entryids in uppercase so comparison will be case insensitive
				this.entryId = entryId.toUpperCase();
				this.length = entryId.length;

				this.decomposeEntryId(this.entryId);
			}
		},

		// Detect padding (max 3 bytes) from the entryId
		getPadding: function(entryId)
		{
			var padding = '';
			var offset = 0;

			for (var iterations = 4; iterations > 0; iterations--) {
				if (entryId.substring(entryId.length - (offset + 2), entryId.length - offset) === '00') {
					padding += '00';
					offset += 2;
				} else {
					// if non-null character found then break the loop
					break;
				}
			}

			return padding;
		}

	});

	// Entryid from version 6
	var EID = Ext.extend(BASE_EID, {
		abFlags: '',      // BYTE[4],  4 bytes, 8 hex characters
		guid: '',       // GUID,   16 bytes, 32 hex characters
		version: '',      // ULONG,   4 bytes, 8 hex characters
		type: '',       // ULONG,   4 bytes, 8 hex characters
		uniqueId: '',     // GUID,   16 bytes, 32 hex characters
		server: '',      // CHAR,   variable length
		padding: '',      // TCHAR[3], 4 bytes, 8 hex characters (upto 4 bytes)

		MIN_LENGTH: 88,
		name: 'EID',

		// decompose the entryid and populate all flags of entryid
		decomposeEntryId: function(entryId)
		{
			var offset = 0;

			// First determine padding, and remove if from the entryId
			this.padding = this.getPadding(entryId);
			entryId = entryId.substring(0, entryId.length - this.padding.length);

			this.abFlags = entryId.substr(offset, 8);
			offset =+ 8;

			this.guid = entryId.substr(offset, 32);
			offset += 32;

			this.version = entryId.substr(offset, 8);
			offset += 8;

			this.type = entryId.substr(offset, 8);
			offset += 8;

			this.uniqueId = entryId.substr(offset, 32);
			offset += 32;

			this.server = entryId.substr(offset);
		}
	});

	// The entryid from the begin
	var EID_V0 = Ext.extend(BASE_EID, {
		abFlags: '',      // BYTE[4],  4 bytes, 8 hex characters
		guid: '',       // GUID,   16 bytes, 32 hex characters
		version: '',      // ULONG,   4 bytes, 8 hex characters
		type: '',       // ULONG,   4 bytes, 8 hex characters
		id: '',        // ULONG,   4 bytes, 8 hex characters
		server: '',      // CHAR,   variable length
		padding: '',      // TCHAR[3], 4 bytes, 8 hex characters (upto 4 bytes)

		MIN_LENGTH: 64,
		name: 'EID_V0',

		// decompose the entryid and populate all flags of entryid
		decomposeEntryId: function(entryId)
		{
			var offset = 0;

			// First determine padding, and remove if from the entryId
			this.padding = this.getPadding(entryId);
			entryId = entryId.substring(0, entryId.length - this.padding.length);

			this.abFlags = entryId.substr(offset, 8);
			offset =+ 8;

			this.guid = entryId.substr(offset, 32);
			offset += 32;

			this.version = entryId.substr(offset, 8);
			offset += 8;

			this.type = entryId.substr(offset, 8);
			offset += 8;

			this.id = entryId.substr(offset, 8);
			offset += 8;

			this.server = entryId.substr(offset);
		}
	});

	// wrapped store entryid
	var WrappedSEID = Ext.extend(BASE_EID, {
		flags: '',       // BYTE[4],   4 bytes, 8 hex characters
		providerUID: '',    // GUID,    16 bytes, 32 hex characters
		version: '',      // ULONG,    1 bytes, 2 hex characters	// zero
		type: '',       // ULONG,    1 bytes, 2 hex characters	// zero
		DLLFileName: '',    // BYTE,    variable length
		terminationChar: '',  // BYTE[1],   1 bytes, 2 hex characters	// zero
		unWrappedEntryId: '', // EID/EID_V0, variable length because it contains server name

		name: 'WrappedSEID',

		// decompose the entryid and populate all flags of entryid
		decomposeEntryId: function(storeEntryId)
		{
			var offset = 0;

			this.flags = storeEntryId.substr(offset, 8);
			offset += 8;

			this.providerUID = storeEntryId.substr(offset, 32);
			offset += 32;

			this.version = storeEntryId.substr(offset, 2);
			offset += 2;

			this.type = storeEntryId.substr(offset, 2);
			offset += 2;

			// find length of dll name, find null character which indicates end of dll name after the current offset
			var termCharIndex = storeEntryId.slice(offset).indexOf('00');
			this.DLLFileName = storeEntryId.substr(offset, termCharIndex);
			offset += termCharIndex;

			this.terminationChar = storeEntryId.substr(offset, 2);
			offset += 2;

			this.unWrappedEntryId = storeEntryId.substr(offset);

			// unwrapped entryid is actually an object entryid so decompose it
			this.unWrappedEntryId = Zarafa.core.EntryId.createEntryIdObj(this.unWrappedEntryId);
		}
	});

	// The entryid for addressbook items
	var ABEID = Ext.extend(BASE_EID, {
		abFlags: '',      // BYTE[4],  4 bytes, 8 hex characters
		guid: '',       // GUID,   16 bytes, 32 hex characters
		version: '',      // ULONG,   4 bytes, 8 hex characters
		type: '',       // ULONG,   4 bytes, 8 hex characters
		id: '',        // ULONG,   4 bytes, 8 hex characters
		extid: '',       // CHAR,   variable length
		padding: '',      // TCHAR[3], 4 bytes, 8 hex characters (upto 4 bytes)

		MIN_LENGTH: 64,
		name: 'ABEID',

		// decompose the entryid and populate all flags of entryid
		decomposeEntryId: function(entryId)
		{
			var offset = 0;

			// First determine padding, and remove if from the entryId
			this.padding = this.getPadding(entryId);
			entryId = entryId.substring(0, entryId.length - this.padding.length);

			this.abFlags = entryId.substr(offset, 8);
			offset =+ 8;

			this.guid = entryId.substr(offset, 32);
			offset += 32;

			this.version = entryId.substr(offset, 8);
			offset += 8;

			this.type = entryId.substr(offset, 8);
			offset += 8;

			this.id = entryId.substr(offset, 8);
			offset += 8;

			this.extid = entryId.substr(offset);
		}
	});

	// The entryid for local addressbook items
	var WrappedABEID = Ext.extend(BASE_EID, {
		ulVersion: '',     // ULONG,   4 bytes, 8 hex characters
		muid: '',       // MAPIUID, 16 bytes, 32 hex characters
		ulObjType: '',     // ULONG,   4 bytes, 8 hex characters
		ulOffset: '',     // ULONG,   4 bytes, 8 hex characters
		unWrappedEntryId: '', // EID/EID_V0, variable length because it contains server name

		name: 'WrappedABEID',

		// decompose the entryid and populate all flags of entryid
		decomposeEntryId: function(ABEntryId)
		{
			var offset = 0;

			this.ulVersion = ABEntryId.substr(offset, 8);
			offset += 8;

			this.muid = ABEntryId.substr(offset, 32);
			offset += 32;

			this.ulObjType = ABEntryId.substr(offset, 8);
			offset += 8;

			this.ulOffset = ABEntryId.substr(offset, 8);
			offset += 8;

			this.unWrappedEntryId = ABEntryId.substr(offset);

			// unwrapped entryid is actually an object entryid so decompose it
			this.unWrappedEntryId = Zarafa.core.EntryId.createEntryIdObj(this.unWrappedEntryId);
		}
	});

	// Wrap an entryid into a Contact Provider entryid
	// @static
	WrappedABEID.wrapABEID = function(entryId, objType)
	{
		objType = objType.toString(16);

		// add padding for the type, which is of 4 bytes (8 characters)
		objType = objType.padStart(2, '0');
		objType = objType.padEnd(8, '0');

		return '00000000' + MUIDZCSAB + objType + '00000000' + entryId;
	};

	// Unwrap an Contact Provider entryid
	// @static
	WrappedABEID.unwrapABEID = function(entryId)
	{
		// Remove ulVersion (8 char), muid (32 char), ulObjType (8 char) and ulOffset (8 char)
		return entryId.substring(56);
	};

	return {
		/**
		 * Compares two AB entryIds. It is possible to have two different entryIds that should match as they
		 * represent the same object (in multiserver environments).
		 * @param {String} entryId1 EntryID
		 * @param {String} entryId2 EntryID
		 * @return {Boolean} Result of the comparison
		 */
		compareABEntryIds: function(entryId1, entryId2)
		{
			if(!Ext.isString(entryId1) || !Ext.isString(entryId2)) {
				return false;
			}

			if(entryId1 === entryId2) {
				// if normal comparison succeeds then we can directly say that entryids are same
				return true;
			}
			return false;
		},

		/**
		 * Creates an object that has split up all the components of an entryID.
		 * @param {String} entryid Entryid
		 * @return {Object} EntryID object
		 */
		createEntryIdObj: function(entryid)
		{
			// check if we are dealing with old or new object entryids
			var versionString = entryid.substr(40, 8);
			var eidObj;

			if(versionString === '00000000') {
				// use EID_V0 struct
				eidObj = new EID_V0(entryid);
			} else {
				// use EID struct
				eidObj = new EID(entryid);
			}

			return eidObj;
		},

		/**
		 * Compares two entryIds. It is possible to have two different entryIds that should match as they
		 * represent the same object (in multiserver environments).
		 * @param {String} entryId1 EntryID
		 * @param {String} entryId2 EntryID
		 * @return {Boolean} Result of the comparison
		 */
		compareEntryIds: function(entryId1, entryId2)
		{
			if(!Ext.isString(entryId1) || !Ext.isString(entryId2)) {
				return false;
			}

			if(entryId1 === entryId2) {
				// if normal comparison succeeds then we can directly say that entryids are same
				return true;
			}
			return false;
		},

		/**
		 * Creates an object that has split up all the components of a store entryid.
		 * @param {String} storeEntryId unwrapped store entryid.
		 * @return {Object} store entryid object.
		 */
		createStoreEntryIdObj: function(storeEntryId)
		{
			return new WrappedSEID(storeEntryId);
		},

		/**
		 * Compares two entryIds. It is possible to have two different entryIds that should match as they
		 * represent the same object (in multiserver environments).
		 * @param {String} storeEntryId1 store entryid
		 * @param {String} storeEntryId2 store entryid
		 * @return {Boolean} Result of the comparison
		 */
		compareStoreEntryIds: function(storeEntryId1, storeEntryId2)
		{
			if(!Ext.isString(storeEntryId1) || !Ext.isString(storeEntryId2)) {
				return false;
			}

			if(storeEntryId1 === storeEntryId2) {
				// if normal comparison succeeds then we can directly say that entryids are same
				return true;
			}
			return false;
		},

		/**
		 * Unwrap an Entryid which is of the Contact Provider ({@link #hasContactProviderGUID}
		 * returned true for this entryid}.
		 * @param {String} entryId the Address Book entryid.
		 * @return {String} The unwrapped entryId
		 */
		unwrapContactProviderEntryId: function(entryId)
		{
			return WrappedABEID.unwrapABEID(entryId);
		},

		/**
		 * Wrap an EntryId which should be wrapped using the Contact Provider
		 * @param {String} entryId The entryid
		 * @return {String} The wrapped entryId
		 */
		wrapContactProviderEntryId: function(entryId, objType)
		{
			return WrappedABEID.wrapABEID(entryId, objType);
		},

		/**
		 * Create a one-off entryid from the applied parameters.
		 * @param {String} displayname displaye name as configured in record.
		 * @param {String} addrtype weather the record is of type SMTP.
		 * @param {String} emailaddress email address as configured in record.
		 * @return {String} The oneoff entryId
		 */
		createOneOffEntryId: function(displayname, addrtype, emailaddress)
		{
			return '00000000' + MAPI_ONE_OFF_UID + '00000080' + Zarafa.core.Util.encode_utf16(displayname) + '0000' + Zarafa.core.Util.encode_utf16(addrtype) + '0000' + Zarafa.core.Util.encode_utf16(emailaddress) + '0000';
		},

		/**
		 * Checks if the passed folder entryid is a folder in the favorites folder, favorites folder
		 * contains 0x01 in the abFlags[3] flag.
		 * @param {String} entryId folder entryid
		 * @return {Boolean} true of folder is a favorite folder else false
		 */
		isFavoriteFolder: function(entryId)
		{
			var entryIdObj = Zarafa.core.EntryId.createEntryIdObj(entryId);

			return (entryIdObj.abFlags.substr(6, 8) === ZARAFA_FAVORITE);
		},

		/**
		 * Checks if the given entryid is a oneoff entryid.
		 * @param {String} entryId The entryid
		 * @return {Boolean} true if the entryid is a oneoff
		 */
		isOneOffEntryId: function(entryId)
		{
			var entryIdObj = Zarafa.core.EntryId.createEntryIdObj(entryId);

			return entryIdObj.guid === MAPI_ONE_OFF_UID;
		},

		/**
		 * Checks if the GUID part of the entryid is of the Contact Provider.
		 * @param {String} entryId Address Book entryid
		 * @return {Boolean} true if guid matches the Contact Provider else false
		 */
		hasContactProviderGUID: function(entryId)
		{
			var entryIdObj = Zarafa.core.EntryId.createEntryIdObj(entryId);

			return entryIdObj.guid === MUIDZCSAB;
		},

		/**
		 * Checks if the GUID part of the entryid is of the AB Provider.
		 * @param {String} entryId Address Book entryid
		 * @return {Boolean} true if guid matches the AB Provider else false
		 */
		hasABProviderGUID: function(entryId)
		{
			var entryIdObj = Zarafa.core.EntryId.createEntryIdObj(entryId);

			return entryIdObj.guid === MUIDEMSAB;
		},

		/**
		 * Format an entryid into the Object ID text shown in the mail properties dialog.
		 * @param {String} entryId Entryid of the message record
		 * @return {String|undefined} Object ID representation or undefined when formatting fails
		 */
		formatObjectId: function(entryId)
		{
			if (!Ext.isString(entryId) || entryId.length < 136) {
				return undefined;
			}

			var provider = entryId.substr(8, 32);
			var folderGcvHex = entryId.substr(76, 12);
			var databaseGuid = entryId.substr(92, 32);
			var messageGcvHex = entryId.substr(124, 12);

			var folderGcv = parseInt(folderGcvHex, 16);
			var messageGcv = parseInt(messageGcvHex, 16);

			if (isNaN(folderGcv) || isNaN(messageGcv)) {
				return undefined;
			}

			return messageGcv + '/0x' + messageGcv.toString(16) +
				'; folder=' + folderGcv + '/0x' + folderGcv.toString(16) +
				'; dbguid=' + databaseGuid + '; store=' + provider;
		},
	};
})();
