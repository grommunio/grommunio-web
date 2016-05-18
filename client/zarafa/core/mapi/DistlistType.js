Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.DistlistType
 * @extends Zarafa.core.Enum
 * 
 * @singleton
 */
Zarafa.core.mapi.DistlistType = Zarafa.core.Enum.create({

	/**
	 * Denotes contact members in distlist from contact folders.
	 * @property
	 * @type Number
	 */
	'DL_USER' : 0x000000C3,
	
	/**
	 * Denotes contact members in distlist from contact folders.
	 * @property
	 * @type Number
	 */
	'DL_USER2' : 0x000000D3,
	
	/**
	 * Denotes contact members in distlist from contact folders.
	 * @property
	 * @type Number
	 */
	'DL_USER3' : 0x000000E3,

	/**
	 * Denotes External members in distlist.
	 * @property
	 * @type Number
	 */
	'DL_EXTERNAL_MEMBER' : 0x00000000,

	/**
	 * Denotes distribution list from contact folders.
	 * @property
	 * @type Number
	 */
	'DL_DIST' : 0x000000B4,

	/**
	 * Denotes addressbook users.
	 * @property
	 * @type Number
	 */
	'DL_USER_AB' : 0x000000B5,

	/**
	 * Denotes addressbook user groups.
	 * @property
	 * @type Number
	 */
	'DL_DIST_AB' : 0x000000B6
});

