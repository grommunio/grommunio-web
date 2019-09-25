Ext.namespace('Zarafa.common.checknames.dialogs');

/**
 * @class Zarafa.common.checknames.dialogs.CheckNamesContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.checknamescontentpanel
 */
Zarafa.common.checknames.dialogs.CheckNamesContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Array} array store
	 * array store of checknames, that will be populated in ListBox
	 */
	checkNamesData : undefined,

	/**
	 * @cfg {Zarafa.core.data.IPMRecipientRecord} record
	 * recipient record for which the content panel is to be created
	 */
	record : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};
		config = Ext.applyIf(config, {
			xtype : 'zarafa.checknamescontentpanel',
			layout: 'fit',
			title : _('Check Names'),
			border: false,
			width: 320,
			height: 300,
			items:[{
				xtype	: 'zarafa.checknamespanel',
				buttons : [{
					text	: _('Ok'),
					handler	:this.onOk,
					scope	: this
					},{
					text	: _('Cancel'),
					handler	: this.onCancel,
					scope	: this
				}]
			}]
		});

		Zarafa.common.checknames.dialogs.CheckNamesContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Called automatically when the contentpanel is being rendered. This
	 * will load the {@link #record} and {@link #checknamesData} into
	 * the  {@link Zarafa.common.checknames.dialogs.CheckNamesPanel CheckNamesPanel}.
	 * @private
	 */
	onRender : function()
	{
		Zarafa.common.checknames.dialogs.CheckNamesContentPanel.superclass.onRender.apply(this, arguments);

		this.get(0).update(this.record, this.checkNamesData);
	},

	/**
	 * event hadler for Ok button click for checkNames content panel
	 * this will set the selected display name to recipient record
	 * @param {Zarafa.core.data.IPMRecipientRecord} recipientrecord
	 * @private
	 */
	onOk : function()
	{
		if (this.get(0).updateRecord(this.record) !== false) {
			this.dialog.close();
		}
	},

	/**
	 * event hadler for Cancel button click for checkNames content panel
	 * this will close the checkNames content panel
	 * @private
	 */
	onCancel : function()
	{
		this.dialog.close();
	}
});

Ext.reg('zarafa.checknamescontentpanel', Zarafa.common.checknames.dialogs.CheckNamesContentPanel);
