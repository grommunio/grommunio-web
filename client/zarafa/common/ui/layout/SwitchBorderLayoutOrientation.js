/**
 * #dependsFile client/zarafa/common/ui/layout/SwitchBorderLayout.js
 */
Ext.namespace('Zarafa.common.ui.layout');

/**
 * @class Zarafa.common.ui.layout.SwitchBorderLayout.Orientation
 * @extends Zarafa.core.Enum
 *
 * The different orientations which are available for the
 * {@link Zarafa.common.ui.layout.SwitchBorderLayout}
 *
 * @singleton
 */
Zarafa.common.ui.layout.SwitchBorderLayout.Orientation = Zarafa.core.Enum.create({
	/**
	 * Denotes that non-center panel is disabled
	 * @property
	 * @type String
	 */
	OFF		: 'off',
	/**
	 * Denotes that the non-center panel is placed above or below the center panel
	 * @property
	 * @type String
	 */
	VERTICAL	: 'vertical',
	/**
	 * Denotes that the non-center panel is placed left or right the center panel
	 * @property
	 * @type String
	 */
	HORIZONTAL	: 'horizontal'
});
