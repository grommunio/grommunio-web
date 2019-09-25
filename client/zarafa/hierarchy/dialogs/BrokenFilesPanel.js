Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.common.attachment.dialogs.MixAttachItemPanel
 * @extends Ext.Panel
 * @xtype zarafa.brokenfilespanel
 *
 * Panel to list out the broken eml while import from PC-drive.
 */
Zarafa.hierarchy.dialogs.BrokenFilesPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Array} records The {@link Zarafa.core.data.IPMRecord record(s)} which are being
	 * used in this panel
	 */
	records : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.brokenfilespanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			items: this.getMixAttachComponents()
		});

		Zarafa.hierarchy.dialogs.BrokenFilesPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Prepare all the components of warning dialog.
	 * @return {Array} Array containing all the required components
	 */
	getMixAttachComponents : function()
	{
		return [{
			xtype: 'displayfield',
			value: _('Unable to import:'),
			hideLabel : true,
			htmlEncode : true
		}, {
			xtype: 'textarea',
			hideLabel: true,
			flex: 1,
			readOnly : true,
			listeners: {
				afterrender : this.onAfterRenderTextArea,
				scope: this
			}
		}, {
			xtype: 'displayfield',
			value: _('The files are not valid'),
			hideLabel : true,
			htmlEncode : true
		}];
	},

	/**
	 * Handler which is called when 'textarea' is rendered. it prepares a list of all the unsupported attachments,
	 * which is to be shown in the text area, line by line.
	 * @param {Ext.form.TextArea} leftoutTextArea The textarea
	 * @return {String} list of unsupported attachments, separated by escaping sequence
	 */
	onAfterRenderTextArea : function(leftOutTextArea)
	{
		var leftOutList = "";

		Ext.each(this.records, function(record) {
			leftOutList += record.name + "\n" ;
		});

		leftOutTextArea.setValue(leftOutList);
	}
});

Ext.reg('zarafa.brokenfilespanel', Zarafa.hierarchy.dialogs.BrokenFilesPanel);
