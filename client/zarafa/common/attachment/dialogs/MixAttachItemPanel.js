Ext.namespace('Zarafa.common.attachment.dialogs');

/**
 * @class Zarafa.common.attachment.dialogs.MixAttachItemPanel
 * @extends Ext.Panel
 * @xtype zarafa.mixattachitempanel
 *
 * Panel for users to list out the unsupported attachments while downloading all the attachments as ZIP.
 * It also allows user to provide his/her wish to show this warning again or not.
 */
Zarafa.common.attachment.dialogs.MixAttachItemPanel = Ext.extend(Ext.Panel, {
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
			xtype : 'zarafa.mixattachitempanel',
			border: false,
			items: [{
				xtype : 'fieldset',
				layout : 'form',
				anchor: '100% 30%',
				header : true,
				iconCls : 'mixattach-message-box-icon',
				border : false,
				items: this.getMixAttachComponents()
			}]
		});

		Zarafa.common.categories.dialogs.CategoriesPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Prepare all the components of warning dialog.
	 * @return {Array} Array containing all the required components
	 */
	getMixAttachComponents : function()
	{
		return [{
			xtype: 'displayfield',
			value: _('These attachments have an unsupported file type and can not be added to the ZIP file:'),
			hideLabel : true,
			htmlEncode : true
		}, {
			xtype: 'textarea',
			hideLabel: true,
			anchor: '100%',
			style: 'padding-left: 5px;',
			readOnly : true,
			listeners: {
				afterrender : this.onAfterRenderTextArea,
				scope: this
			}
		}, {
			xtype: 'displayfield',
			value: _("Would you like to continue downloading without adding these files?"),
			hideLabel : true,
			htmlEncode : true
		}, {
			xtype : 'checkbox',
			ref : '../../dontShowCheckBox',
			boxLabel : _('Always continue download of ZIP files without adding unsupported file types.'),
			hideLabel : true,
			scope : this
		}];
	},

	/**
	 * Handler which is called when 'textarea' is rendered. it prepares a list of all the unsupported attachments,
	 * which is to be shown in the text area, line by line.
	 * @param {Ext.form.TextArea} leftoutTextArea The textarea
	 * @return {String} list of unsupported attachments, separated by escaping sequence
	 */
	onAfterRenderTextArea : function(leftoutTextArea)
	{
		var leftOutList = "";

		Ext.each(this.records, function(record) {
			if(record.isEmbeddedMessage()){
				leftOutList += record.get('name') + "\n" ;
			}
		});

		leftoutTextArea.setValue(leftOutList);
	}
});

Ext.reg('zarafa.mixattachitempanel', Zarafa.common.attachment.dialogs.MixAttachItemPanel);
