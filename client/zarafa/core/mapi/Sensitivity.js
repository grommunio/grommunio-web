Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.Sensitivity
 * @extends Zarafa.core.Enum
 * 
 * @singleton
 */
Zarafa.core.mapi.Sensitivity = Zarafa.core.Enum.create({
	/**
	 * Denotes that the message has no special sensitivity.
	 * @property
	 * @type Number
	 */
	'NONE' : 0x00000000,
	
	/**
	 * Denotes that the message is personal.
	 * @property
	 * @type Number
	 */
	'PERSONAL' : 0x00000001,
	
	/**
	 * Denotes that the message is private.
	 * @property
	 * @type Number
	 */
	'PRIVATE' : 0x00000002,

	/**
	 * Denotes that the message is designated company confidential.
	 * @property
	 * @type Number
	 */
	'COMPANY_CONFIDENTIAL' : 0x00000003,

	/**
	 * Return the display name for the given sensitivity
	 * @param {Zarafa.core.mapi.Sensitivity} sensitivity The given sensitivity
	 * @return {String} The display name for the sensitivity
	 */
	getDisplayName : function(sensitivity)
	{
		switch (sensitivity) {
			case Zarafa.core.mapi.Sensitivity.NONE:
				return _("None");
			case Zarafa.core.mapi.Sensitivity.PERSONAL:
				return _("Personal");
			case Zarafa.core.mapi.Sensitivity.PRIVATE:
				return _("Private");
			case Zarafa.core.mapi.Sensitivity.COMPANY_CONFIDENTIAL:
				return _("Confidential");
		}
		return '';
	}
});
