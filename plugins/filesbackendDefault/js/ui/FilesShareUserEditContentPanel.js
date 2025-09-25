Ext.namespace('Zarafa.plugins.files.backend.Default.ui');

/**
 * @class Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype filesplugin.default.filesshareusereditcontentpanel
 *
 * This content panel contains the sharing edit panel.
 */
Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditContentPanel =
	Ext.extend(Zarafa.core.ui.ContentPanel, {
		/**
		 * The load mask for this content panel
		 * @property
		 * @type Ext.LoadMask
		 */
		loadMask: undefined,

		/**
		 * @constructor
		 * @param config
		 */
		constructor: function (config) {
			Ext.applyIf(config, {
				layout: 'fit',
				title: _('Share Details'),
				closeOnSave: true,
				model: true,
				autoSave: false,
				width: 550,
				height: 445,
				items: {
					xtype: 'filesplugin.default.filesshareusereditpanel',
					record: config.record,
					store: config.store,
					recordId: config.recordId,
				},
			});
			Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditContentPanel.superclass.constructor.call(
				this,
				config,
			);
		},
	});

Ext.reg(
	'filesplugin.default.filesshareusereditcontentpanel',
	Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditContentPanel,
);
