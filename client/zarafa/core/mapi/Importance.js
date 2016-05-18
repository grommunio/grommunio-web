Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.Priority
 * @extends Zarafa.core.Enum
 * 
 * @singleton
 */
Zarafa.core.mapi.Importance = Zarafa.core.Enum.create({
	/**
	 * Denotes that the message has low importance.
	 * @property
	 * @type Number
	 */
	'NONURGENT' : 0x00000000,
	
	/**
	 * Denotes that the message has normal importance.
	 * @property
	 * @type Number
	 */
	'NORMAL' : 0x00000001,
	
	/**
	 * Denotes that the message has high importance.
	 * @property
	 * @type Number
	 */
	'URGENT' : 0x00000002,

	/**
	 * Return the display name for the given importance
	 * @param {Zarafa.core.mapi.Importance} importance The given importance
	 * @return {String} The display name for the importance
	 */
	getDisplayName : function(importance)
	{
		switch (importance) {
			case Zarafa.core.mapi.Importance.NONURGENT:
				return _('Low');
			case Zarafa.core.mapi.Importance.NORMAL:
				return _('Normal');
			case Zarafa.core.mapi.Importance.URGENT:
				return _('High');
		}
		return '';
	},

	/**
	 * Gets icon class based on importance level
	 * @param {Number} level importance level
	 * @param {String} prefix prefix to add before class name
	 * @return {String} icon class
	 */
	getClassName : function(level, prefix)
	{
		if(Ext.isEmpty(prefix)) {
			prefix = 'icon_importance';
		}

		// only allow numbers
		if(!Ext.isNumber(level)) {
			level = parseInt(level, 10);
		}

		// invalid values should be handled as normal priority
		if(!Ext.isNumber(level)) {
			return prefix + '_normal';
		}

		var className = this.getName(level).toLowerCase();

		if(!Ext.isEmpty(className)) {
			return prefix + '_' + className;
		}

		return prefix + '_normal';
	}
});
