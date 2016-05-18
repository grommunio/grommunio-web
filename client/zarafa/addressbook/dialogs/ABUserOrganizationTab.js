Ext.namespace('Zarafa.addressbook.dialogs');

/**
 * @class Zarafa.addressbook.dialogs.ABUserOrganizationTab
 * @extends Ext.form.FormPanel
 * @xtype zarafa.abuserorganizationtab
 *
 * This class is used to create layout of Organization tab of tab panel.
 */
Zarafa.addressbook.dialogs.ABUserOrganizationTab = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype : 'zarafa.abuserorganizationtab',
			title : _('Organization'),
			selModel	: this.initSelectionModel(),
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			autoScroll : true,
			items : [
				this.createManagerFieldset(),
				this.createDirectReportFieldset()
			]
		});
		
		Zarafa.addressbook.dialogs.ABUserOrganizationTab.superclass.constructor.call(this, config);
	},

	/**
	 * Creates manager fieldset for organization tab 
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createManagerFieldset : function()
	{
		return [{
			xtype : 'displayfield',
			value : _('Manager') + ':',
			hideLabel : true
		},{
			xtype : 'zarafa.abitemgrid',
			ref : 'managerList',
			autoHeight : true
		}];
	},

	/**
	 * creates and returns a selection model object, used in {@link Ext.grid.GridPanel.selModel selModel} config
	 * @return {Ext.grid.RowSelectionModel} selection model object
	 * @private
	 */
	initSelectionModel : function()
	{
		return new Ext.grid.RowSelectionModel({
			singleSelect : false
		});
	},
	
	/**
	 * Creates the direct report fieldset for organization tab of form panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createDirectReportFieldset : function()
	{
		return [{
			xtype : 'displayfield',
			value : _('Direct reports') + ':',
			hideLabel : true
		},{
			xtype : 'zarafa.abitemgrid',
			ref : 'reportList',
			flex: 1
		}];
	},

	/**
	 * Function is used to update values of form fields when ever
	 * an updated {@link Zarafa.core.data.MAPIRecord record} is received
	 * @param {Zarafa.core.data.MAPIRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update : function(record, contentReset)
	{
		this.getForm().loadRecord(record);
		var managerSubStore = record.getSubStore('ems_ab_manager');
		if (managerSubStore && this.managerList.getStore() !== managerSubStore) {
			this.managerList.reconfigure(managerSubStore, this.managerList.getColumnModel());
		}

		var reportsSubStore = record.getSubStore('ems_ab_reports');
		if (reportsSubStore && this.reportList.getStore() !== reportsSubStore) {
			this.reportList.reconfigure(reportsSubStore, this.reportList.getColumnModel());
		}
	}
});

Ext.reg('zarafa.abuserorganizationtab', Zarafa.addressbook.dialogs.ABUserOrganizationTab);
