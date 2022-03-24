Ext.namespace('Zarafa.plugins.files.backend.Owncloud.ui');

/**
 * @class Zarafa.plugins.files.backend.Owncloud.ui.FilesShareUserGridColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 *
 * The Column model for the share grid.
 */
Zarafa.plugins.files.backend.Owncloud.ui.FilesShareUserGridColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function (config) {
		config = config || {};

		this.defaultColumns = this.createDefaultColumns(config.fileType);

		Ext.applyIf(config, {
			columns : this.defaultColumns,
			defaults: {
				sortable: true
			}
		});
		Ext.apply(this, config);

		Zarafa.plugins.files.backend.Owncloud.ui.FilesShareUserGridColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which must be visible within
	 * the default view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 * @param {Zarafa.plugins.files.data.FileTypes} fileType folder or file
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createDefaultColumns: function (fileType) {
		var columns = [
			{
				header   : dgettext('plugin_filesbackendOwncloud', 'Name'),
				dataIndex: 'shareWithDisplayname',
				flex     : 1,
				sortable : true,
				tooltip  : dgettext('plugin_filesbackendOwncloud', 'Sort by: Name')
			}, {
				header   : dgettext('plugin_filesbackendOwncloud', 'Type'),
				dataIndex: 'type',
				flex	   : 1,
				align	   : 'center',
				sortable : true,
				renderer : this.shareTypeRenderer,
				tooltip  : dgettext('plugin_filesbackendOwncloud', 'Sort by: Type')
			}, {
				header   : dgettext('plugin_filesbackendOwncloud', 'Re-share'),
				dataIndex: 'permissionShare',
				flex	   : 1,
				align	   : 'center',
				sortable : false,
				renderer : this.yesNoRenderer
			}, {
				header   : dgettext('plugin_filesbackendOwncloud', 'Change'),
				dataIndex: 'permissionChange',
				flex 	   : 1,
				align    : 'center',
				sortable : false,
				renderer : this.yesNoRenderer
			}];
			if (fileType === Zarafa.plugins.files.data.FileTypes.FOLDER) {
				columns.push(
				{
					header   : dgettext('plugin_filesbackendOwncloud', 'Create'),
					dataIndex: 'permissionCreate',
					flex     : 1,
					align    : 'center',
					sortable : false,
					renderer : this.yesNoRenderer
				}, {
					header   : dgettext('plugin_filesbackendOwncloud', 'Delete'),
					dataIndex: 'permissionDelete',
					flex     : 1,
					align    : 'center',
					sortable : false,
					renderer : this.yesNoRenderer
				});
			}
		return columns;
	},

	/**
	 * This renderer will render the type column. It will set the css class either to group or user.
	 *
	 * @param value
	 * @param p
	 * @param record
	 * @return {string}
	 */
	shareTypeRenderer: function (value, p, record) {

		p.css = "shareicon_16_" + value;

		// add extra css class for empty cell
		p.css += ' zarafa-grid-empty-cell';

		return '';
	},

	/**
	 * This renderer will render the boolean columns.
	 * It will show nice icons for true and false.
	 *
	 * @param value
	 * @param p
	 * @param record
	 * @return {string}
	 */
	yesNoRenderer: function (value, p, record) {

		if (value) {
			p.css = "shareicon_16_yes";
		} else {
			p.css = "shareicon_16_no";
		}

		// add extra css class for empty cell
		p.css += ' zarafa-grid-empty-cell';

		return '';
	}
});
