Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.MessageClass
 *
 * Special utility class for manipulation and comparisons
 * of Message Class Strings
 * @singleton
 */
Zarafa.core.MessageClass = {

	/**
	 * Check if the given messageclass property on this record matches the given 'expectedClass'.
	 * This comparison is done in a case-insensite way. This function can be used
	 * for comparing the value of 'message_class' safely.
	 *
	 * @param {String} className The className which should be checked,
	 * @param {String|Array} expectedClass The expected class against which the className
	 * must be compared
	 * @param {Boolean} baseOnly (optional) Only compare the start of the className,
	 * this can be used for partial comparison (e.g. record.isClass('message_class', 'IPM', true)
	 * will return true when the actual message_class is 'IPM.Note'). Defaults to false.
	 * @return {Boolean} True when the className matches.
	 */
	isClass : function(className, expectedClass, baseOnly)
	{
		if (Ext.isEmpty(className)) {
			return false;
		}

		// Convert the className to uppercase
		className = className.toUpperCase();

		// If the expectedClass is an array, we check if the className
		// is either one of the names in expectedClas
		if (Array.isArray(expectedClass)) {
			for (var i = 0, len = expectedClass.length; i < len; i++) {
				if (this.isClass(className, expectedClass[i], baseOnly)) {
					return true;
				}
			}
			return false;
		}

		// If the expectedClass length is larger then the className,
		// then it can never be equal.
		if (expectedClass.length > className.length) {
			return false;
		}

		// If baseOnly is true, we only want to match expectedClass against
		// the start of the className. Although we can use className.search()
		// it is faster to create a substring to ensure className and expectedClass
		// have the same length.
		if (baseOnly === true) {
			className = className.substring(0, expectedClass.length);
		}

		// Now the entire string must match
		return className == expectedClass.toUpperCase();
	},

	/**
	 * Test if the messageClass is compatible with the give containerClass.
	 * An IPM.Note is for example compatible with IPF.Note containerClass.
	 *
	 * @param {String} messageClass The Message Class to compare
	 * @param {String} containerClass The Container Class to compare
	 * @return {Boolean} True when the messageClass is compatible with the given containerClass
	 */
	isContainerClassCompatible : function(messageClass, containerClass)
	{
		messageClass = messageClass.toUpperCase();
		containerClass = containerClass.toUpperCase();

		if (Ext.isEmpty(containerClass)) {
			return true;
		}

		switch (messageClass) {
			case 'IPM.APPOINTMENT':
			case 'IPM.OLE.CLASS.{00061055-0000-0000-C000-000000000046}':
				return Zarafa.core.ContainerClass.isClass(containerClass, 'IPF.Appointment', true);
			case 'IPM.STICKYNOTE':
				return Zarafa.core.ContainerClass.isClass(containerClass, 'IPF.StickyNote', true);
			case 'IPM.CONTACT':
			case 'IPM.DISTLIST':
				return Zarafa.core.ContainerClass.isClass(containerClass, 'IPF.Contact', true);
			case 'IPM.TASK':
				return Zarafa.core.ContainerClass.isClass(containerClass, 'IPF.Task', true);
			case 'IPM.NOTE':
			case 'REPORT.IPM':
			case 'IPM.SCHEDULE':
			case "IPM.TASKREQUEST":
				// These are all normal messages, so those should be in IPF.Note containers,
				// however the IPF.Note.OutlookHomepage is special (as it is used for RSS feeds),
				// and should thus be excluded.
				return this.isClass(containerClass, 'IPF.Note', true) && !this.isClass(containerClass, 'IPF.Note.OutlookHomepage', true);
		}

		// Our fallthrough, the switch didn't catch any message class,
		// so perhaps we should cut of everything after the last dot (.)
		// and then we just retry by calling this function recursively.
		var index = messageClass.lastIndexOf('.');
		if (index > 0) {
			messageClass = messageClass.substr(0, index);
			return this.isContainerClassCompatible(messageClass, containerClass);
		}

		return false;
	},

	/**
	 * Function will return default foldertype from the hierarchy
	 * for the supplied message_class to the function.
	 * 
	 * @param {String} messageClass The message_class of the mapi record.
	 * @return {String} The foldertype of the default folder for the supplied message_class
	 */
	getDefaultFolderTypeFromMessageClass : function(messageClass)
	{
		messageClass = messageClass.toUpperCase();

		switch (messageClass) {
			case 'IPM.APPOINTMENT':
			case 'IPM.OLE.CLASS.{00061055-0000-0000-C000-000000000046}':
				return 'calendar';
			case 'IPM.STICKYNOTE':
				return 'note';
			case 'IPM.CONTACT':
			case 'IPM.DISTLIST':
				return 'contact';
			case 'IPM.TASK':
				return 'task';
			case 'IPM.NOTE':
			case 'REPORT.IPM':
			case 'IPM.SCHEDULE':
			case "IPM.TASKREQUEST":
				return 'inbox';
		}

		// Our fallthrough, the switch didn't catch any message class,
		// so perhaps we should cut of everything after the last dot (.)
		// and then we just retry by calling this function recursively.
		var index = messageClass.lastIndexOf('.');
		if (index > 0) {
			messageClass = messageClass.substr(0, index);
			return this.getDefaultFolderTypeFromMessageClass(messageClass);
		}

		return '';
	}
};
