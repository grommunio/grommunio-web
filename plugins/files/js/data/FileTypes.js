Ext.namespace('Grommunio.plugins.files.data');

/**
 * @class Grommunio.plugins.files.data.FileTypes
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different file types of the files context.
 *
 * @singleton
 */
Grommunio.plugins.files.data.FileTypes = Grommunio.core.Enum.create({

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