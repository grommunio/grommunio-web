Ext.namespace('Zarafa.contact.ui');

/**
 * @class Zarafa.contact.ui.ContactCardView
 * @extends Zarafa.common.ui.DraggableDataView
 * @xtype zarafa.contactcardview
 *
 * this class creates layout of the cards view
 * dataview doesn't automatically manage the scrollbars itself
 * so we are adding a div as a container for card layout and giving it scrollbars manually
 */
Zarafa.contact.ui.ContactCardView = Ext.extend(Zarafa.common.ui.DraggableDataView, {
	/**
	 * @cfg {Zarafa.contact.ContactContext} context The context to which this view belongs
	 */
	context: undefined,

	/**
	 * The {@link Zarafa.contact.ContactContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.contact.ContactContextModel
	 */
	model: undefined,

	/**
	 * The {@link Zarafa.contact.ContactStore} which is obtained from the {@link #model}.
	 * @property
	 * @type Zarafa.contact.ContactStore
	 */
	store: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}
		if (!Ext.isDefined(config.store) && Ext.isDefined(config.model)) {
			config.store = config.model.getStore();
		}

		config.store = Ext.StoreMgr.lookup(config.store);

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.icondragselectorplugin');

		Ext.apply(this, config, {
			xtype: 'zarafa.contactcardview',
			border: false,
			loadingText: _('Loading contacts') + '...',
			deferEmptyText: false,
			emptyText: '<div class="emptytext-context">' +_('There are no items to show in this list. Update the filter for more results.') +'</div>',
			tpl: this.initTemplate(config.store),

			/*
			 * this is a required property
			 * itemSelector is used as an element selector query and it guides dataview to start re-rendering
			 * all elements that are child of this element, so without this property dataview will not know
			 * from which element it has to re-render elements so it will give error on refresh or store update
			 */
			itemSelector: 'div.zarafa-contact-cardview-card',
			multiSelect: true,
			selectedClass: 'zarafa-contact-cardview-card-selected',
			enableDrag: true,
			ddGroup: 'dd.mapiitem'
		});

		Zarafa.contact.ui.ContactCardView.superclass.constructor.call(this, config);

		this.initEvents();
	},

	/**
	 * initialize events for the card view
	 * @private
	 */
	initEvents: function()
	{
		this.on({
			'dblclick': this.onNodeDblClick,
			'contextmenu': this.onNodeContextMenu,
			'selectionchange': this.onSelectionChange,
			'afterrender': this.onAfterRender,
			scope: this
		});
	},

	/**
	 * Event handler called when contact card view rendered properly.
	 */
	onAfterRender: function()
	{
		var cardViewEl = Ext.get('contact-cardview');
		cardViewEl.on({
			'mouseenter': this.onMouseEnter.createDelegate(this, [cardViewEl], true),
			'mouseleave': this.onMouseLeave,
			scope: this
		});
	},

	/**
	 * Event handler which is triggered when user opens context menu
	 * @param {Zarafa.contact.ContactCardView} dataView data view object
	 * @param {Number} index index of node
	 * @param {HTMLElement} node node object
	 * @param {Ext.EventObject} event event object
	 * @private
	 */
	onNodeContextMenu: function(dataView, index, node, event)
	{
		// check row is already selected or not, if its not selected then select it first
		if (!dataView.isSelected(node)) {
			dataView.select(node);
		}

		Zarafa.core.data.UIFactory.openDefaultContextMenu(dataView.getSelectedRecords(), { position: event.getXY() });
	},

	/**
	 * Event handler function will be called when any node is double clicked.
	 * @param {Zarafa.contact.ContactCardView} dataView data view object
	 * @param {Number} index index of node
	 * @param {HTMLElement} node node object
	 * @param {Ext.EventObject} event event object
	 * @private
	 */
	onNodeDblClick: function(dataView, index, node, event)
	{
		Zarafa.contact.Actions.openDialog(dataView.getSelectedRecords());
	},

	/**
	 * Event handler which is triggered when the {@link Zarafa.contact.ui.ContactCardView ContactCardView}
	 * {@link Zarafa.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Zarafa.contact.ContactContextModel contextmodel} about the change.
	 *
	 * @param {Zarafa.contact.ui.ContactCardView} dataView The view object.
	 * @param {HTMLElement[]} selection Array of selected nodes.
	 * @private
	 */
	onSelectionChange: function(dataView, selections)
	{
		this.model.setSelectedRecords(dataView.getSelectedRecords());
	},

	/**
	 * Function will initialize {@link Ext.XTemplate XTemplate} and create layout for data view
	 *
	 * @param {Zarafa.contact.ContactStore} store The {@link Zarafa.contact.ContactStore} which contains all contacts.
	 * @return {Ext.XTemplate} xtemplate for layout
	 * @private
	 */
	initTemplate: function(store)
	{
		var templateStrArr = [
			'<div class="zarafa-contact-cardview">',
				'<tpl for=".">',
					'<div class="zarafa-contact-cardview-card">',
						'<div class="x-panel">',
							'<div class="x-panel-tl">',
								'<div class="x-panel-tr">',
									'<div class="x-panel-tc">',
										'<div class="x-panel-header">',
											'<span class="x-panel-header-text">',
												'<tpl if="values.message_class==\'IPM.DistList\'">' + _('[Group]') + " " +'</tpl>{fileas:htmlEncodeUndef}',
											'</span>',
										'</div>',
									'</div>',
								'</div>',
							'</div>',
							'<div class="x-panel-bwrap">',
								'<div class="x-panel-body zarafa-card-body">',
									// content
									'<p class="zarafa-contact-cardview-card-title">{display_name:htmlEncode}</p>',
									'<p>{company_name:htmlEncodeUndef}</p>',
									'<table>',
										'<tpl if="!Ext.isEmpty(values.title)"><td><p>{title:htmlEncodeUndef}</p></td></tpl>',
										'<tpl if="!Ext.isEmpty(values.department_name) && Ext.isEmpty(values.title)">',
											'<td><p>{department_name:htmlEncodeUndef}</p></td>',
										'</tpl>',
										'<tpl if="!Ext.isEmpty(values.business_telephone_number)">',
											'<tr><td class="contact-card-label">' + _('Work:') + ' {business_telephone_number:htmlEncode}</td></tr>',
										'</tpl>',
										'<tpl if="!Ext.isEmpty(values.business2_telephone_number) && Ext.isEmpty(values.business_telephone_number)">',
											'<tr><td class="contact-card-label">' + _('Work:') + ' {business2_telephone_number:htmlEncode}</td></tr>',
										'</tpl>',
										'<tpl if="!Ext.isEmpty(values.primary_telephone_number) && Ext.isEmpty(values.business_telephone_number)',
											'&& Ext.isEmpty(values.business2_telephone_number)">',
											'<tr><td class="contact-card-label">' + _('Primary:') + ' {primary_telephone_number:htmlEncode}</td></tr>',
										'</tpl>',
										'<tpl if="!Ext.isEmpty(values.cellular_telephone_number)">',
											'<tr><td class="contact-card-label">' + _('Mobile:') + ' {cellular_telephone_number:htmlEncode}</td></tr>',
										'</tpl>',
										'<tpl if="!Ext.isEmpty(values.email_address_1)"><tr><td>{email_address_1:htmlEncode}</td></tr></tpl>',
										'<tpl if="!Ext.isEmpty(values.email_address_2) && Ext.isEmpty(values.email_address_1)">',
											'<tr><td>{email_address_2:htmlEncode}</td></tr>',
										'</tpl>',
										'<tpl if="!Ext.isEmpty(values.email_address_3) && Ext.isEmpty(values.email_address_2) && Ext.isEmpty(values.email_address_1)">',
											'<tr><td>{email_address_3:htmlEncode}</td></tr>',
										'</tpl>',
										'<tr><td>{[this.getCategories(values)]}</td></tr>',
									'</table>',
								'</div>',
								'{[this.getInitials(values)]}',
							'</div>',
						'</div>',
					'</div>',
				'</tpl>',
			'</div>'
		];

		return new Ext.XTemplate(templateStrArr.join(''), {
			compiled: true, // compile immediately

			store: store,

			getInitials: function(values)
			{
				var record = this.store.getById(values.entryid);
				if (record.isOpened() && record.get('has_picture')){
					var attachmentStore = record.getAttachmentStore();
					var index = attachmentStore.findBy(function(item) {
						return item.get('attachment_contactphoto') === true && item.get('hidden') === true;
					});
					var contactPhoto = attachmentStore.getAt(index);

					return `<div class="k-contact_cardview_photo">
						<img src=${contactPhoto.getInlineImageUrl()} alt = "contact photo">
					</div>`;
				} else if (values.contact_photo_attach_num !== -1){
					var url = container.getBaseURL();
					url = Ext.urlAppend(url, 'store=' + values.store_entryid);
					url = Ext.urlAppend(url, 'entryid=' + values.entryid);
					url = Ext.urlAppend(url, 'load=download_attachment');
					url = Ext.urlAppend(url, 'attachNum[]=' + values.contact_photo_attach_num);
					url = Ext.urlAppend(url, 'contentDispositionType=inline');

					return `<div class="k-contact_cardview_photo">
						<img src=${url} alt = "contact photo">
					</div>`;
				} else {
					// Contacts can have empty display names. Fall back to question mark.
					var contactInitials = "?";
					var displayName = `${values.given_name} ${values.surname}`;
					if (!Ext.isEmpty(displayName)) {
						 displayName = displayName.replace(/\(.*?\)/g, '').trim().split(' ');
						contactInitials = displayName.length > 1 ? displayName.shift().charAt(0) + displayName.pop().charAt(0) : displayName.shift().charAt(0);
					}
					return `<div class="k-contact-cardview-initials"> ${contactInitials.toUpperCase()} </div>`;
				}
			},

			getCategories: function(values)
			{
				var record = this.store.getById(values.entryid);
				var categories = Zarafa.common.categories.Util.getCategories(record);
				return Zarafa.common.categories.Util.getCategoriesHtml(categories);
			}
		});
	}
});

Ext.reg('zarafa.contactcardview', Zarafa.contact.ui.ContactCardView);

