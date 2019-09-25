Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.Rights
 * @extends Zarafa.core.Enum
 * 
 * Enumerates the different rights
 * 
 * @singleton
 */
Zarafa.core.mapi.Rights = Zarafa.core.Enum.create({
	/**
	 * Denotes that no rights are given
	 * @property
	 * @type Number
	 */
	RIGHTS_NONE				: 0x00000000,
	/**
	 * Denotes that read rights are given
	 * @property
	 * @type Number
	 */
	RIGHTS_READ_ANY 		: 0x00000001,
	/**
	 * Denotes that create rights are given
	 * @property
	 * @type Number
	 */
	RIGHTS_CREATE			: 0x00000002,
	/**
	 * Denotes that edit rights are given for items owned by the user
	 * @property
	 * @type Number
	 */
	RIGHTS_EDIT_OWNED		: 0x00000008,
	/**
	 * Denotes that delete rights are given for items owned by the user
	 * @property
	 * @type Number
	 */
	RIGHTS_DELETE_OWNED		: 0x00000010,
	/**
	 * Denotes that edit rights are given for all items
	 * @property
	 * @type Number
	 */
	RIGHTS_EDIT_ANY			: 0x00000020,
	/**
	 * Denotes that delete rights are given for all items
	 * @property
	 * @type Number
	 */
	RIGHTS_DELETE_ANY		: 0x00000040,
	/**
	 * Denotes that create subfolders rights are given
	 * @property
	 * @type Number
	 */
	RIGHTS_CREATE_SUBFOLDER	: 0x00000080,
	/**
	 * Denotes that folder access rights are given
	 * @property
	 * @type Number
	 */
	RIGHTS_FOLDER_ACCESS	: 0x00000100,
	/**
	 * Denotes that folder visibility rights are given
	 * @property
	 * @type Number
	 */
	RIGHTS_FOLDER_VISIBLE	: 0x00000400
});

/**
 * Denotes that no rights are granted, the user can only {@link #RIGHTS_FOLDER_VISIBLE see folders}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_NO_RIGHTS		= Zarafa.core.mapi.Rights.RIGHTS_FOLDER_VISIBLE;

/**
 * Denotes that readonly rights are granted, this extends {@link #RIGHTS_NO_RIGHTS} with
 * the extra {@link #RIGHTS_READ_ANY read permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_READONLY			= Zarafa.core.mapi.Rights.RIGHTS_NO_RIGHTS |
												  Zarafa.core.mapi.Rights.RIGHTS_READ_ANY;

/**
 * Denotes that secretary rights are granted, this extends {@link #RIGHTS_READONLY} with some extra
 * {@link #RIGHTS_CREATE create}, {@link #RIGHTS_EDIT_OWNED edit own}, {@link #RIGHTS_DELETE_OWNED delete own},
 * {@link #RIGHTS_EDIT_ANY edit any}, {@link #RIGHTS_DELETE_ANY delete any} permissions.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_SECRETARY		= Zarafa.core.mapi.Rights.RIGHTS_READONLY |
												  Zarafa.core.mapi.Rights.RIGHTS_CREATE |
												  Zarafa.core.mapi.Rights.RIGHTS_EDIT_OWNED |
												  Zarafa.core.mapi.Rights.RIGHTS_DELETE_OWNED |
												  Zarafa.core.mapi.Rights.RIGHTS_EDIT_ANY |
												  Zarafa.core.mapi.Rights.RIGHTS_DELETE_ANY;

/**
 * Denotes that full control rights are granted, this extends {@link #RIGHTS_SECRETARY} with the
 * extra {@link #RIGHTS_CREATE_SUBFOLDER create subfolder permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_FULL_CONTROL		= Zarafa.core.mapi.Rights.RIGHTS_SECRETARY |
												  Zarafa.core.mapi.Rights.RIGHTS_CREATE_SUBFOLDER;

/**
 * Denotes that ownership rights are granted, this extends {@link #RIGHTS_FULL_CONTROL} with
 * the {@link #RIGHTS_FOLDER_ACCESS folder acccess permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_OWNER			= Zarafa.core.mapi.Rights.RIGHTS_FULL_CONTROL |
												  Zarafa.core.mapi.Rights.RIGHTS_FOLDER_ACCESS;
