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
	RIGHTS_NONE			: 0x00000000,
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
	RIGHTS_CREATE_SUBFOLDER		: 0x00000080,
	/**
	 * Denotes that folder access rights are given
	 * @property
	 * @type Number
	 */
	RIGHTS_CREATE_FOLDER		: 0x00000100,
	/**
	 * Denotes that folder access rights are given
	 * @property
	 * @type Number
	 */
	RIGHTS_FOLDER_CONTACT		: 0x00000200,
	/**
	 * Denotes that folder visibility rights are given
	 * @property
	 * @type Number
	 */
	RIGHTS_FOLDER_VISIBLE		: 0x00000400,
	/**
	 * Denotes that detailed free/busy visibility rights are given
	 * @property
	 * @type Number
	 */
	RIGHTS_FBSIMPLE					: 0x00000800,
	/**
	 * Denotes that detailed free/busy visibility rights are given
	 * @property
	 * @type Number
	 */
	RIGHTS_FBDETAILED				: 0x00001000
});

/**
 * Denotes that no rights are granted, the user can only {@link #RIGHTS_FOLDER_VISIBLE see folders}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_NO_RIGHTS		= Zarafa.core.mapi.Rights.RIGHTS_NONE;

/**
 * Denotes that create rights are granted, this extends {@link #RIGHTS_NO_RIGHTS} with
 * the extra {@link #RIGHTS_CREATE permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_CONTRIBUTOR		= Zarafa.core.mapi.Rights.RIGHTS_FOLDER_VISIBLE |
												Zarafa.core.mapi.Rights.RIGHTS_CREATE;

/**
 * Denotes that readonly rights are granted, this extends {@link #RIGHTS_NO_RIGHTS} with
 * the extra {@link #RIGHTS_READ_ANY read permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_READONLY			= Zarafa.core.mapi.Rights.RIGHTS_FOLDER_VISIBLE |
												Zarafa.core.mapi.Rights.RIGHTS_READ_ANY;

/**
 * Denotes that readonly and folder visible rights are granted, this extends {@link #RIGHTS_READ_ANY} with
 * the extra {@link #RIGHTS_FOLDER_VISIBLE permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_REVIEWER			= Zarafa.core.mapi.Rights.RIGHTS_READ_ANY |
												Zarafa.core.mapi.Rights.RIGHTS_FOLDER_VISIBLE;

/**
 * Denotes that readonly, folder visible, delete own and create items rights are granted, this extends {@link #RIGHTS_REVIEWER} with
 * the extra {@link #RIGHTS_CREATE permission} and {@link #RIGHTS_DELETE_OWNED permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_NONEDITINGAUTHOR		= Zarafa.core.mapi.Rights.RIGHTS_REVIEWER |
												Zarafa.core.mapi.Rights.RIGHTS_CREATE |
												Zarafa.core.mapi.Rights.RIGHTS_DELETE_OWNED;

/**
 * Denotes that readonly, folder visible, delete, editing own and create items rights are granted,
 * this extends {@link #RIGHTS_NONEDITINGAUTHOR} with the extra {@link #RIGHTS_EDIT_OWNED permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_AUTHOR			= Zarafa.core.mapi.Rights.RIGHTS_NONEDITINGAUTHOR |
												Zarafa.core.mapi.Rights.RIGHTS_EDIT_OWNED;

/**
 * Denotes that readonly, folder visible, delete, editing own, create subfolder and create items rights are granted,
 * this extends {@link #RIGHTS_AUTHOR} with the extra {@link #RIGHTS_CREATE_SUBFOLDER permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_PUBLISHINGAUTHOR		= Zarafa.core.mapi.Rights.RIGHTS_AUTHOR |
												Zarafa.core.mapi.Rights.RIGHTS_CREATE_SUBFOLDER;

/**
 * Denotes that readonly, folder visible, deleting, editing and create items rights are granted,
 * this extends {@link #RIGHTS_AUTHOR} with the extra {@link #RIGHTS_DELETE_ANY permission} and {@link #RIGHTS_EDIT_ANY permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_EDITOR			= Zarafa.core.mapi.Rights.RIGHTS_AUTHOR |
												Zarafa.core.mapi.Rights.RIGHTS_DELETE_ANY |
												Zarafa.core.mapi.Rights.RIGHTS_EDIT_ANY;

/**
 * Denotes that readonly, folder visible, deleting, editing, create subfolder and create items rights are granted,
 * this extends {@link #RIGHTS_EDITOR} with the extra {@link #RIGHTS_CREATE_SUBFOLDER permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_PUBLISHINGEDITOR		= Zarafa.core.mapi.Rights.RIGHTS_EDITOR |
												Zarafa.core.mapi.Rights.RIGHTS_CREATE_SUBFOLDER;

/**
 * Denotes that secretary rights are granted, this extends {@link #RIGHTS_READONLY} with some extra
 * {@link #RIGHTS_CREATE create}, {@link #RIGHTS_EDIT_OWNED edit own}, {@link #RIGHTS_DELETE_OWNED delete own},
 * {@link #RIGHTS_EDIT_ANY edit any}, {@link #RIGHTS_DELETE_ANY delete any} permissions.
 * Note that RIGHTS_SECRETARY IS LEFT FOR COMPATIBILITY AS IT IS NOT RESPECTED WITH ACLS DIRECTLY ANYMORE
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
 * Note that RIGHTS_FULL_CONTROL IS LEFT FOR COMPATIBILITY AS IT IS NOT RESPECTED WITH ACLS DIRECTLY ANYMORE
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
Zarafa.core.mapi.Rights.RIGHTS_OWNER			= Zarafa.core.mapi.Rights.RIGHTS_PUBLISHINGEDITOR |
												Zarafa.core.mapi.Rights.RIGHTS_CREATE_FOLDER |
												Zarafa.core.mapi.Rights.RIGHTS_FOLDER_CONTACT;

/**
 * Denotes that simple free busy rights are granted, this extends {@link #RIGHTS_NO_RIGHTS} with
 * the extra {@link #RIGHTS_FBSIMPLE permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_CAL_FBSIMPLE		= Zarafa.core.mapi.Rights.RIGHTS_NONE |
												Zarafa.core.mapi.Rights.RIGHTS_FBSIMPLE;

/**
 * Denotes that create rights are granted, this extends {@link #RIGHTS_NO_RIGHTS} with
 * the extra {@link #RIGHTS_FBSIMPLE permission} and {@link #RIGHTS_FBDETAILED permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_CAL_FBDETAILED		= Zarafa.core.mapi.Rights.RIGHTS_NONE |
												Zarafa.core.mapi.Rights.RIGHTS_FBSIMPLE |
												Zarafa.core.mapi.Rights.RIGHTS_FBDETAILED;

/**
 * Denotes that create rights are granted, this extends {@link #RIGHTS_NO_RIGHTS} with
 * the extra {@link #RIGHTS_CREATE permission} and {@link #RIGHTS_FBSIMPLE permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_CAL_CONTRIBUTOR		= Zarafa.core.mapi.Rights.RIGHTS_FOLDER_VISIBLE |
												Zarafa.core.mapi.Rights.RIGHTS_FBSIMPLE |
												Zarafa.core.mapi.Rights.RIGHTS_CREATE;

/**
 * Denotes that readonly and folder visible rights are granted, this extends {@link #RIGHTS_READ_ANY} with
 * the extra {@link #RIGHTS_FOLDER_VISIBLE permission}, {@link #RIGHTS_FBSIMPLE permission} and {@link #RIGHTS_FBDETAILED permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_CAL_REVIEWER		= Zarafa.core.mapi.Rights.RIGHTS_READ_ANY |
												Zarafa.core.mapi.Rights.RIGHTS_FBSIMPLE |
												Zarafa.core.mapi.Rights.RIGHTS_FBDETAILED |
												Zarafa.core.mapi.Rights.RIGHTS_FOLDER_VISIBLE;

/**
 * Denotes that readonly, folder visible, delete own and create items rights are granted, this extends {@link #RIGHTS_REVIEWER} with
 * the extra {@link #RIGHTS_CREATE permission}, {@link #RIGHTS_DELETE_OWNED permission}, {@link #RIGHTS_FBSIMPLE permission} and {@link #RIGHTS_FBDETAILED permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_CAL_NONEDITINGAUTHOR	= Zarafa.core.mapi.Rights.RIGHTS_REVIEWER |
												Zarafa.core.mapi.Rights.RIGHTS_FBSIMPLE |
												Zarafa.core.mapi.Rights.RIGHTS_FBDETAILED |
												Zarafa.core.mapi.Rights.RIGHTS_CREATE |
												Zarafa.core.mapi.Rights.RIGHTS_DELETE_OWNED;

/**
 * Denotes that readonly, folder visible, delete, editing own and create items rights are granted,
 * this extends {@link #RIGHTS_NONEDITINGAUTHOR} with the extra {@link #RIGHTS_EDIT_OWNED permission}, {@link #RIGHTS_FBSIMPLE permission} and {@link #RIGHTS_FBDETAILED permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_CAL_AUTHOR		= Zarafa.core.mapi.Rights.RIGHTS_NONEDITINGAUTHOR |
												Zarafa.core.mapi.Rights.RIGHTS_FBSIMPLE |
												Zarafa.core.mapi.Rights.RIGHTS_FBDETAILED |
												Zarafa.core.mapi.Rights.RIGHTS_EDIT_OWNED;

/**
 * Denotes that readonly, folder visible, delete, editing own, create subfolder and create items rights are granted,
 * this extends {@link #RIGHTS_AUTHOR} with the extra {@link #RIGHTS_CREATE_SUBFOLDER permission}, {@link #RIGHTS_FBSIMPLE permission} and {@link #RIGHTS_FBDETAILED permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_CAL_PUBLISHINGAUTHOR	= Zarafa.core.mapi.Rights.RIGHTS_AUTHOR |
												Zarafa.core.mapi.Rights.RIGHTS_FBSIMPLE |
												Zarafa.core.mapi.Rights.RIGHTS_FBDETAILED |
												Zarafa.core.mapi.Rights.RIGHTS_CREATE_SUBFOLDER;

/**
 * Denotes that readonly, folder visible, deleting, editing and create items rights are granted,
 * this extends {@link #RIGHTS_AUTHOR} with the extra {@link #RIGHTS_DELETE_ANY permission}, {@link #RIGHTS_EDIT_ANY permission}, {@link #RIGHTS_FBSIMPLE permission} and {@link #RIGHTS_FBDETAILED permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_CAL_EDITOR		= Zarafa.core.mapi.Rights.RIGHTS_AUTHOR |
												Zarafa.core.mapi.Rights.RIGHTS_FBSIMPLE |
												Zarafa.core.mapi.Rights.RIGHTS_FBDETAILED |
												Zarafa.core.mapi.Rights.RIGHTS_DELETE_ANY |
												Zarafa.core.mapi.Rights.RIGHTS_EDIT_ANY;

/**
 * Denotes that readonly, folder visible, deleting, editing, create subfolder and create items rights are granted,
 * this extends {@link #RIGHTS_EDITOR} with the extra {@link #RIGHTS_CREATE_SUBFOLDER permission}, {@link #RIGHTS_FBSIMPLE permission} and {@link #RIGHTS_FBDETAILED permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_CAL_PUBLISHINGEDITOR	= Zarafa.core.mapi.Rights.RIGHTS_EDITOR |
												Zarafa.core.mapi.Rights.RIGHTS_FBSIMPLE |
												Zarafa.core.mapi.Rights.RIGHTS_FBDETAILED |
												Zarafa.core.mapi.Rights.RIGHTS_CREATE_SUBFOLDER;

/**
 * Denotes that ownership rights are granted, this extends {@link #RIGHTS_FULL_CONTROL} with
 * the {@link #RIGHTS_FOLDER_ACCESS folder acccess permission}, {@link #RIGHTS_FBSIMPLE permission} and {@link #RIGHTS_FBDETAILED permission}.
 * @property
 * @type Number
 */
Zarafa.core.mapi.Rights.RIGHTS_CAL_OWNER		= Zarafa.core.mapi.Rights.RIGHTS_PUBLISHINGEDITOR |
												Zarafa.core.mapi.Rights.RIGHTS_CREATE_FOLDER |
												Zarafa.core.mapi.Rights.RIGHTS_FBSIMPLE |
												Zarafa.core.mapi.Rights.RIGHTS_FBDETAILED |
												Zarafa.core.mapi.Rights.RIGHTS_FOLDER_CONTACT;
