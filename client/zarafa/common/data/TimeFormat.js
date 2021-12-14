Ext.namespace('Zarafa.common.data');

/**
 * @class Zarafa.common.data.TimeFormat
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different filters for the stores.
 *
 * @singleton
 */
Zarafa.common.data.TimeFormat = Zarafa.core.Enum.create({
	/**
	 * TWELVEHOUR which used to for 'g:i A' format.
	 *
	 * @property
	 * @type Number
	 */
  TWELVEHOUR: 'g:i A',

  /**
	 * TWENTYFOURHOUR which used to for 'G:i' format.
	 *
	 * @property
	 * @type Number
	 */
  TWENTYFOURHOUR: 'G:i'
});