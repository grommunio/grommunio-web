/*
 * #dependsFile client/zarafa/core/MessageClass.js
 */
Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.ContainerClass
 *
 * Special utility class for manipulation and comparisons
 * of Container Class Strings
 *
 * @singleton
 */
Zarafa.core.ContainerClass = {

	/**
	 * Check if the given containerclass property on this record matches the given 'expectedClass'.
	 * This comparison is done in a case-insensite way. This function can be used
	 * for comparing the value of 'container_class' safely.
	 *
	 * @param {String} className The className which should be checked,
	 * @param {String|Array} expectedClass The expected class against which the className
	 * must be compared
	 * @param {Boolean} baseOnly (optional) Only compare the start of the className,
	 * this can be used for partial comparison (e.g. record.isClass('message_class', 'IPM', true)
	 * will return true when the actual message_class is 'IPM.Note'). Defaults to false.
	 * @return {Boolean} True when the className matches.
	 */
	// Implementation is exactly that of the Zarafa.core.MessageClass...
	isClass : Zarafa.core.MessageClass.isClass,

	/**
	 * Test if the containerClass is compatible with the give messageClass.
	 * An IPF.Note is for example compatible with IPM.Note messageClass.
	 *
	 * @param {String} containerClass The Container Class to compare 
	 * @param {String} messageClass The Message Class to compare
	 * @return {Boolean} True when the containerClass is compatible with the given messsageClass
	 */
	isMessageClassCompatible : function(containerClass, messageClass)
	{
		// Implementation is exact inverse of Zarafa.core.MessageClass, so simply swap arguments.
		return Zarafa.core.MessageClass.isContainerClassCompatible(messageClass, containerClass);
	},

	/**
	 * Function will return default folder type from the hierarchy
	 * for the supplied container_class to the function.
	 * 
	 * @param {String} containerClass The container_class of the mapi record.
	 * @return {String} The foldertype of the default folder for the supplied message_class
	 */
	getDefaultFolderTypeFromContainerClass : function(containerClass)
	{
		containerClass = containerClass.toUpperCase();

		switch (containerClass) {
			case 'IPF.APPOINTMENT':
				return 'calendar';
			case 'IPF.STICKYNOTE':
				return 'note';
			case 'IPF.CONTACT':
				return 'contact';
			case 'IPF.TASK':
				return 'task';
			case 'IPF.NOTE':
				return 'inbox';
		}

		// Our fallthrough, the switch didn't catch any container class,
		// so perhaps we should cut of everything after the last dot (.)
		// and then we just retry by calling this function recursively.
		var index = containerClass.lastIndexOf('.');
		if (index > 0) {
			containerClass = containerClass.substr(0, index);
			return this.getDefaultFolderTypeFromContainerClass(containerClass);
		}
		
		return '';
	}
};
