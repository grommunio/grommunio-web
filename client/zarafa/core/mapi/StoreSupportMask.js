Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.StoreSupportMask
 * @extends Zarafa.core.Enum
 * 
 * Enumerates the different flgas used in store's property PR_SUPPORT_MASK
 * 
 * @singleton
 */
Zarafa.core.mapi.StoreSupportMask = Zarafa.core.Enum.create({
	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports properties containing ANSI (8-bit) characters.
	 */
	STORE_ANSI_OK : 0x00020000,

	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports attachments (OLE or non-OLE) to messages.
	 */
	STORE_ATTACH_OK : 0x00000020,

	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports categorized views of tables.
	 */
	STORE_CATEGORIZE_OK : 0x00000400,

	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports creation of new messages.
	 */
	STORE_CREATE_OK : 0x00000010,

	/**
	 * @property
	 * @type Number
	 * Entry identifiers for the objects in the {@link Zarafa.core.MAPIStore MAPIStore} are unique,
	 * that is, never reused during the life of the {@link Zarafa.core.MAPIStore MAPIStore}.
	 */
	STORE_ENTRYID_UNIQUE : 0x00000001,

	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports Hypertext Markup Language (HTML) messages,
	 * stored in the PR_BODY_HTML property.
	 */
	STORE_HTML_OK : 0x00010000,

	/**
	 * @property
	 * @type Number
	 * This flag is reserved and should not be used.
	 */
	STORE_LOCALSTORE : 0x00080000,

	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports modification of its existing messages.
	 */
	STORE_MODIFY_OK : 0x00000008,

	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports multivalued properties,
	 * guarantees the stability of value order in a multivalued property throughout a save operation,
	 * and supports instantiation of multivalued properties in tables.
	 */
	STORE_MV_PROPS_OK : 0x00000200,

	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports notifications.
	 */
	STORE_NOTIFY_OK : 0x00000100,

	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports OLE attachments.
	 */
	STORE_OLE_OK : 0x00000040,

	/**
	 * @property
	 * @type Number
	 * The folders in this {@link Zarafa.core.MAPIStore MAPIStore} are public (multi-user),
	 * not private (possibly multi-instance but not multi-user).
	 */
	STORE_PUBLIC_FOLDERS : 0x00004000,

	/**
	 * @property
	 * @type Number
	 * All interfaces for the {@link Zarafa.core.MAPIStore MAPIStore} have a read-only access level.
	 */
	STORE_READONLY : 0x00000002,

	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports restrictions.
	 */
	STORE_RESTRICTION_OK : 0x00001000,

	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports Rich Text Format (RTF) messages,
	 * usually stored compressed, and the {@link Zarafa.core.MAPIStore MAPIStore} itself keeps PR_BODY and PR_RTF_COMPRESSED synchronized.
	 */
	STORE_RTF_OK : 0x00000800,

	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports search-results folders.
	 */
	STORE_SEARCH_OK : 0x00000004,
	
	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports sorting views of tables.
	 */
	STORE_SORT_OK : 0x00002000,

	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports marking a message for submission.
	 */
	STORE_SUBMIT_OK : 0x00000080,

	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports storage of
	 * Rich Text Format (RTF) messages in uncompressed form.
	 */
	STORE_UNCOMPRESSED_RTF : 0x00008000,

	/**
	 * @property
	 * @type Number
	 * The {@link Zarafa.core.MAPIStore MAPIStore} supports properties containing Unicode characters.
	 */
	STORE_UNICODE_OK : 0x00040000,

	/**
	 * Convinience method to check if {@link Zarafa.core.MAPIStore MAPIStore} supports creation of
	 * search folders.
	 * @param {Number} storeSupportMask value of property PR_STORE_SUPPORT_MASK.
	 * @return {Boolean} true if {@link Zarafa.core.MAPIStore MAPIStore} supports creation of
	 * search folders else false.
	 */
	hasSearchSupport : function(storeSupportMask)
	{
		if (!Ext.isNumber(storeSupportMask)) {
			storeSupportMask = parseInt(storeSupportMask, 10);
		}

		if (!Ext.isNumber(storeSupportMask)) {
			return false;
		}

		if (storeSupportMask & this.STORE_SEARCH_OK) {
			return true;
		}

		return false;
	}
});
