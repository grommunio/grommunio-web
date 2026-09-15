Ext.namespace('Grommunio.common.data');

/**
 * @class Grommunio.common.data.SizeUnits
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different sizes.
 *
 * @singleton
 */
Grommunio.common.data.SizeUnits = Grommunio.core.Enum.create({
  /**
   * For size in MB
   *
   * @property
   * @type String
   */
   MB: 'MB',

  /**
   * For size in KB
   *
   * @property
   * @type String
   */
   KB: 'KB',

  /**
   * For size in Bytes
   *
   * @property
   * @type String
   */
   BYTES: 'Bytes'
});
