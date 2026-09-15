/*
 * #dependsFile client/grommunio/common/ui/grid/Renderers.js
 */
Ext.namespace('Grommunio.contact.dialogs');

/**
 * @class Grommunio.contact.dialogs.DistlistMemberGridColumnModel
 * @extends Ext.grid.ColumnModel
 *
 * The {@link Grommunio.contact.dialogs.DistlistMemberGridColumnModel DistlistMemberGridColumnModel}
 * is the default {@link Ext.grid.ColumnModel ColumnModel} for the Distlist Member grid
 */
Grommunio.contact.dialogs.DistlistMemberGridColumnModel = Ext.extend(Ext.grid.ColumnModel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			columns: this.createColumns(),
			defaults: {
				sortable: true
			}
		});

		Grommunio.contact.dialogs.DistlistMemberGridColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which must be visible within
	 * the default view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createColumns: function()
	{
		return [{
					dataIndex: 'icon_index',
					headerCls: 'grommunio-icon-column',
					header: '<p class="icon_index">&nbsp;<span class="title">Icon</span></p>',
					tooltip: _('Sort by: Icon'),
					width: 24,
					renderer: Grommunio.common.ui.grid.Renderers.icon
				},{
					dataIndex: 'display_name',
					id: 'display_name',
					header: _('Name'),
					tooltip: _('Sort by: Name'),
					renderer: Grommunio.common.ui.grid.Renderers.text
				},{
					dataIndex: 'smtp_address',
					header: _('Email Address'),
					tooltip: _('Sort by: Email Address'),
					width: 350,
					renderer: Grommunio.common.ui.grid.Renderers.text
				}];
	}
});
