Ext.namespace('Zarafa.common.data');

/**
 * @class Zarafa.common.data.SizeUnits
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different sizes.
 *
 * @singleton
 */
Zarafa.common.data.SizeUnits = Zarafa.core.Enum.create({
    /**
     * For size in MB
     *
     * @property
     * @type String
     */
     MB : 'MB',

    /**
     * For size in KB
     *
     * @property
     * @type String
     */
     KB : 'KB',

    /**
     * For size in Bytes
     *
     * @property
     * @type String
     */
     BYTES : 'Bytes'
});
