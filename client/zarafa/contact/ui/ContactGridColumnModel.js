/*
 * #dependsFile client/zarafa/common/ui/grid/Renderers.js
 */
Ext.namespace('Zarafa.contact.ui');

/**
 * @class Zarafa.contact.ui.ContactGridColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 *
 * The {@link Zarafa.contact.ui.ContactGridColumnModel ContactGridColumnModel}
 * is the default {@link Ext.grid.ColumnModel ColumnModel} for the
 * {@link Zarafa.contact.ui.ContactGrid ContactGrid}.
 */
Zarafa.contact.ui.ContactGridColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			columns : this.createColumns(),
			defaults : {
				sortable : true,
				width : 150
			}
		});

		Zarafa.contact.ui.ContactGridColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which must be visible within
	 * the default view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createColumns : function()
	{
		return [{
			dataIndex : 'icon_index',
			headerCls: 'zarafa-icon-column icon',
			header : '<p class="icon_index">&nbsp;<span class="title">' + _('Icon') + '</span></p>',
			tooltip : _('Sort by: Icon'),
			width : 25,
			fixed : true,
			renderer : Zarafa.common.ui.grid.Renderers.icon
		},{ // @TODO add attachment column
			dataIndex : 'fileas',
			id : 'fileas',			// gridPanel.autoExpandColumn config will reference to this id
			header : _('File As'),
			tooltip : _('Sort by: File As'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'display_name',
			header : _('Full Name'),
			tooltip : _('Sort by: Full Name'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'email_address_1',
			header : _('Email'),
			hidden : true,
			tooltip : _('Sort by: Email Address 1'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'email_address_2',
			header : _('Email 2'),
			hidden: true,
			tooltip: _('Sort by: Email Address 2'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'email_address_3',
			header : _('Email 3'),
			hidden : true,
			tooltip : _('Sort by: Email Address 3'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'home_telephone_number',
			header : _('Home Phone'),
			tooltip : _('Sort by: Home Phone'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'cellular_telephone_number',
			header : _('Mobile Phone'),
			tooltip : _('Sort by: Mobile Phone'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'categories',
			header : _('Categories'),
			tooltip : _('Sort by: Categories'),
			renderer	: Zarafa.common.ui.grid.Renderers.text
		},{
			dataIndex : 'business_telephone_number',
			header : _('Business Phone'),
			tooltip : _('Sort by: Business Phone'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'business_fax_number',
			header : _('Business Fax'),
			tooltip : _('Sort by: Business Fax'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'company_name',
			header : _('Company Name'),
			tooltip : _('Sort by: Company Name'),
			hidden : true,
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'title',
			header : _('Job Title'),
			tooltip : _('Sort by: Job Title'),
			hidden : true,
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'department_name',
			header : _('Department Name'),
			hidden : true,
			tooltip : _('Sort by: Department Name'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'office_location',
			header : _('Office Location'),
			hidden : true,
			tooltip : _('Sort by: Office Location'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'profession',
			header : _('Profession'),
			hidden : true,
			tooltip : _('Sort by: Profession'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'manager_name',
			header : _('Manager Name'),
			hidden : true,
			tooltip : _('Sort by: Manager Name'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'assistant',
			header : _("Assistant's Name"),
			hidden : true,
			tooltip : _("Sort by: Assistant's Name"),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'nickname',
			header : _('Nickname'),
			hidden : true,
			tooltip : _('Sort by: Nickname'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'spouse_name',
			header : _('Spouse/Partner'),
			hidden : true,
			tooltip : _('Sort by: Spouse/Partner Name'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'birthday',
			header : _('Birthday'),
			hidden : true,
			tooltip : _('Sort by: Birthday'),
			renderer : Zarafa.common.ui.grid.Renderers.date
		},{
			dataIndex : 'wedding_anniversary',
			header : _('Anniversary'),
			hidden : true,
			tooltip : _('Sort by: Anniversary'),
			renderer : Zarafa.common.ui.grid.Renderers.date
		},{
			dataIndex : 'business_address',
			header : _('Business Address'),
			hidden : true,
			tooltip : _('Sort by: Business Address'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'home_address',
			header : _('Home Address'),
			hidden : true,
			tooltip : _('Sort by: Home Address'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'other_address',
			header : _('Other Address'),
			hidden : true,
			tooltip : _('Sort by: Office Address'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'mailing_address',
			header : _('Mailing Address'),
			hidden : true,
			tooltip : _('Sort by: Mailing Address'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'im',
			header : _('IM Address'),
			hidden : true,
			tooltip : _('Sort by: IM Address'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'webpage',
			header : _('Webpage'),
			hidden : true,
			tooltip : _('Sort by: Webpage'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'assistant_telephone_number',
			header : _("Assistant's Phone"),
			hidden : true,
			tooltip : _("Sort by: Assistant's Phone"),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'business2_telephone_number',
			header : _('Business Phone 2'),
			hidden : true,
			tooltip : _('Sort by: Business Phone 2'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'callback_telephone_number',
			header : _('Callback Phone'),
			hidden : true,
			tooltip : _('Sort by: Callback'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'car_telephone_number',
			header : _('Car Phone'),
			hidden : true,
			tooltip : _('Sort by: Car Phone'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'company_telephone_number',
			header : _('Company Phone'),
			hidden : true,
			tooltip : _('Sort by: Company Main Phone'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'home2_telephone_number',
			header : _('Home Phone 2'),
			hidden : true,
			tooltip : _('Sort by: Home Phone 2'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'home_fax_number',
			header : _('Home Fax'),
			hidden : true,
			tooltip : _('Sort by: Home Fax'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'isdn_number',
			header : _('ISDN'),
			hidden : true,
			tooltip : _('Sort by: ISDN'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'other_telephone_number',
			header : _('Other Phone'),
			hidden : true,
			tooltip : _('Sort by: Other Phone'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'radio_telephone_number',
			header : _('Radio Phone'),
			hidden : true,
			tooltip : _('Sort by: Radio Phone'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'ttytdd_telephone_number',
			header : _('TTY/TDD Phone'),
			hidden : true,
			tooltip : _('Sort by: TTY/TDD Phone'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'telex_telephone_number',
			header : _('Telex'),
			hidden : true,
			tooltip : _('Sort by: Telex Phone'),
			renderer	: Ext.util.Format.htmlEncode
		},{
			dataIndex : 'pager_telephone_number',
			header : _('Pager'),
			hidden : true,
			tooltip : _('Sort by: Pager'),
			renderer	: Ext.util.Format.htmlEncode
		}];
	}
});
