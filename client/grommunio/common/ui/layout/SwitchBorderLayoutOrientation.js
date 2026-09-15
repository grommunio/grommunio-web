/**
 * #dependsFile client/grommunio/common/ui/layout/SwitchBorderLayout.js
 */
Ext.namespace('Grommunio.common.ui.layout');

/**
 * @class Grommunio.common.ui.layout.SwitchBorderLayout.Orientation
 * @extends Grommunio.core.Enum
 *
 * The different orientations which are available for the
 * {@link Grommunio.common.ui.layout.SwitchBorderLayout}
 *
 * @singleton
 */
Grommunio.common.ui.layout.SwitchBorderLayout.Orientation = Grommunio.core.Enum.create({
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
