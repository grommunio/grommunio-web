Ext.namespace('Zarafa.plugins.files.ui');

Zarafa.plugins.files.ui.FilesRecordViewPanel = Ext.extend(Ext.Panel, {

	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'filesplugin.filesrecordviewpanel',
			border: false,
			cls   : 'zarafa-filesviewpanel',
			layout: 'zarafa.collapsible',
			items : [{
				xtype: 'filesplugin.filesrecorddetailspanel'
			}]
		});

		Zarafa.plugins.files.ui.FilesRecordViewPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.filesrecordviewpanel', Zarafa.plugins.files.ui.FilesRecordViewPanel);
