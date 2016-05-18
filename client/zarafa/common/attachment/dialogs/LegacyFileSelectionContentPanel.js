Ext.namespace('Zarafa.common.attachment.dialogs');

/**
 * @class Zarafa.common.attachment.dialogs.LegacyFileSelectionContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.legacyfileselectioncontentpanel
 */
Zarafa.common.attachment.dialogs.LegacyFileSelectionContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Function} callback The callback function which must be called when the
	 * {@link Ext.ux.form.FileUploadField File Input field} has been changed. It will
	 * receive the {@link Ext.form.BasicForm BasicForm} in which the input field is located
	 * as argument.
	 */
	callback : Ext.emptyFn,

	/**
	 * @cfg {Object} scope The scope for the {@link #callback} function
	 */
	scope : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Select file'),
			layout : 'fit',
			width : 500,
			height : 75,
			items : [{
				xtype : 'form',
				layout: 'fit',
				fileUpload : true,
				padding : 5,
				items : [{
					xtype : 'fileuploadfield',
					buttonText: _('Browse') + '...',
					name : 'attachments[]',
					listeners : {
						'fileselected' : this.onFileSelected,
						'scope' : this
					}
				}],
				buttons : [{
					text : _('Cancel'),
					handler : this.close,
					scope : this
				}]
			}]
		});

		Zarafa.common.attachment.dialogs.LegacyFileSelectionContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event which is fired when the {@link Ext.ux.form.FileUploadField#fileselected fileselected} was fired.
	 * This will invoke the {@link #callback} function.
	 */
	onFileSelected : function(field)
	{
		var form = field.ownerCt.getForm();

		// Immediately hide the dialog, we will close
		// it (destroying the HTML elements) once the
		// upload has completed.
		this.hide();

		this.callback.call(this.scope, form);

		form.on('actioncomplete', this.close, this, { delay : 5 });
		form.on('actionfailed', this.close, this, { delay : 5 });
	}
});

Ext.reg('zarafa.legacyfileselectioncontentpanel', Zarafa.common.attachment.dialogs.LegacyFileSelectionContentPanel);
