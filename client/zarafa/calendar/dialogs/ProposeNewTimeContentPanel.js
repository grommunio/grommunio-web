Ext.namespace('Zarafa.calendar.dialogs');

/**
 * @class Zarafa.calendar.dialogs.ProposeNewTimeContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.proposenewtimecontentpanel
 */
Zarafa.calendar.dialogs.ProposeNewTimeContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Zarafa.core.ui.IPMRecord} record The record for which the
	 * propose new time panel is opened.
	 */
	record : undefined,

	/**
	 * @cfg {Boolean} autoSave Automatically save all changes on the
	 * {@link Zarafa.core.data.IPMRecord IPMRecord} to the
	 * {@link Zarafa.core.data.IPMStore IPMStore}.
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.proposenewtimecontentpanel',
			layout: 'fit',
			title : _('Propose New Time'),
			width : 375,
			height: 200,
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true
			}),
			items: [{

				xtype: 'zarafa.proposenewtimepanel',
				record: config.record,
				ref: 'proposeNewTimePanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.onCancel,
					scope: this
				}]
			}]
		});
		
		Zarafa.calendar.dialogs.ProposeNewTimeContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 * @private
	 */
	onOk : function()
	{
		this.proposeNewTimePanel.updateRecord(this.record);
		this.close();
	},

	/**
	 * Event handler which is raised when the user clicks the "Cancel" {@link Ext.Button button}
	 *
	 * This will close the panel.
	 * @private
	 */
	onCancel : function()
	{
		this.close();
	}
});

Ext.reg('zarafa.proposenewtimecontentpanel', Zarafa.calendar.dialogs.ProposeNewTimeContentPanel);
