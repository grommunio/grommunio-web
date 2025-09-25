Ext.namespace('Zarafa.plugins.files.backend.Seafile.ui');

/**
 * Lightweight content panel that hosts the Seafile share editor grid.
 */
Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserEditContentPanel =
	Ext.extend(Zarafa.core.ui.ContentPanel, {
		loadMask: undefined,
		constructor: function (e) {
			Ext.applyIf(e, {
				layout: 'fit',
				title: _('Share Details'),
				closeOnSave: true,
				model: true,
				autoSave: false,
				width: 480,
				height: 445,
				items: {
					xtype: 'filesplugin.seafile.filesshareusereditpanel',
					record: e.record,
					store: e.store,
					recordId: e.recordId,
				},
			});
			Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserEditContentPanel.superclass.constructor.call(
				this,
				e,
			);
		},
	});
Ext.reg(
	'filesplugin.seafile.filesshareusereditcontentpanel',
	Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserEditContentPanel,
);
