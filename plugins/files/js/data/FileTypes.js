Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.FileTypes
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different file types of the files context.
 *
 * @singleton
 */
Zarafa.plugins.files.data.FileTypes = Zarafa.core.Enum.create({

	/**
	 * Filetype: folder
	 *
	 * @property
	 * @type Number
	 */
	FOLDER: 0,

	/**
	 * Filetype: file
	 *
	 * @property
	 * @type Number
	 */
	FILE: 1
});