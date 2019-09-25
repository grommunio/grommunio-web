/*
 * #dependsFile client/zarafa/common/ui/grid/Renderers.js
 */
Ext.namespace('Zarafa.addressbook.ui');

/**
 * @class Zarafa.addressbook.ui.GABColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 *
 * Column model which should be used in the Global Addressbook for
 * normal containers.
 */
Zarafa.addressbook.ui.GABColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration option
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			name : 'globaladdressbook',
			columns : this.getColumns()
		});

		Zarafa.addressbook.ui.GABColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Gets the columns for the GAB, including from the insertion point \
	 * @returns {Array} An array of objects with column configurations
	 *
	 * @private
	 */
	getColumns : function()
	{
		var items = container.populateInsertionPoint('context.addressbook.gridpanel', this);
		var defaultItems = [{
			dataIndex : 'icon_index',
			headerCls: 'zarafa-icon-column',
			header : '<p class="icon_index">&nbsp;</p>',
			sortable : true,
			tooltip : _('Sort by: Icon'),
			width : 25,
			fixed : true,
			renderer : Zarafa.common.ui.grid.Renderers.icon
		},{
			dataIndex : 'full_name',
			// gridPanel.autoExpandColumn config will reference to this id
			id : 'full_name',
			header : _('Name'),
			sortable : true,
			tooltip : _('Sort by: Name'),
			renderer : Ext.util.Format.htmlEncode
		},{
			dataIndex : 'display_name',
			header : _('Display Name'),
			sortable : true,
			tooltip : _('Sort by: Display Name'),
			renderer : Zarafa.common.ui.grid.Renderers.displayName,
			width: 250
		},{
			dataIndex : 'fileas',
			header : _('File as'),
			hidden : true,
			sortable : true,
			tooltip : _('Sort by: File As'),
			renderer : Ext.util.Format.htmlEncode,
			width: 250
		},{
			dataIndex : 'given_name',
			header : _('First Name'),
			sortable : true,
			hidden: true,
			tooltip: _('Sort by: First Name'),
			renderer : Ext.util.Format.htmlEncode,
			width: 150
		},{
			dataIndex : 'surname',
			header : _('Last Name'),
			sortable : true,
			hidden: true,
			tooltip: _('Sort by: Last Name'),
			renderer : Ext.util.Format.htmlEncode,
			width: 150
		},{
			dataIndex : 'smtp_address',
			header : _('Email Address'),
			sortable : true,
			tooltip: _('Sort by: Email Address'),
			renderer : Ext.util.Format.htmlEncode,
			width: 250
		},{
			dataIndex : 'department_name',
			header : _('Department'),
			sortable : true,
			hidden : true,
			tooltip : _('Sort by: Department'),
			renderer : Ext.util.Format.htmlEncode,
			width : 150
		},{
			dataIndex : 'office_telephone_number',
			header : _('Office Phone'),
			sortable : true,
			tooltip : _('Sort by: Office Phone'),
			renderer : Ext.util.Format.htmlEncode,
			width : 150
		},{
			dataIndex : 'mobile_telephone_number',
			header : _('Mobile'),
			sortable : true,
			hidden : true,
			tooltip: _('Sort by: Mobile'),
			renderer : Ext.util.Format.htmlEncode,
			width: 150
		},{
			dataIndex : 'home_telephone_number',
			header : _('Home Phone'),
			sortable : true,
			hidden : true,
			tooltip: _('Sort by: Home Phone'),
			renderer : Ext.util.Format.htmlEncode,
			width: 150
		},{
			dataIndex : 'pager_telephone_number',
			header : _('Pager'),
			sortable : true,
			hidden : true,
			tooltip: _('Sort by: Pager'),
			renderer : Ext.util.Format.htmlEncode,
			width: 150
		},{
			dataIndex : 'office_location',
			header : _('Location'),
			sortable : true,
			hidden : true,
			tooltip : _('Sort by: Location'),
			renderer : Ext.util.Format.htmlEncode,
			width : 150
		},{
			dataIndex : 'primary_fax_number',
			header : _('Fax'),
			sortable : true,
			hidden : true,
			tooltip : _('Sort by: Fax'),
			renderer : Ext.util.Format.htmlEncode,
			width : 150
		}];

		// FIXME: find an alternative way to add columns from insertion point
		if(Array.isArray(items))
		{
			var pos = 1;
			items.forEach(function(item) {
				if (Ext.isObject(items[0])) {
					defaultItems.splice(pos, 0, item);
					pos += 1;
				}
			});
		}

		return defaultItems;
	}
});
