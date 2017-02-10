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
	context : undefined,

	/**
	 * The {@link Zarafa.contact.ContactContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.contact.ContactContextModel
	 */
	model : undefined,

	/**
	 * The {@link Zarafa.contact.ContactStore} which is obtained from the {@link #model}.
	 * @property
	 * @type Zarafa.contact.ContactStore
	 */
	store : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
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
			xtype : 'zarafa.contactcardview',
			border : false,
			loadingText : _('Loading contacts') + '...',
			deferEmptyText: false,
			emptyText: '<div class="emptytext">'+_('There are no items to show in this list')+'</div>',
			tpl : this.initTemplate(),

			/*
			 * this is a required property
			 * itemSelector is used as an element selector query and it guides dataview to start re-rendering
			 * all elements that are child of this element, so without this property dataview will not know
			 * from which element it has to re-render elements so it will give error on refresh or store update
			 */
			itemSelector : 'div.zarafa-contact-cardview-card',
			multiSelect	: true,
			selectedClass:'zarafa-contact-cardview-selected',
			enableDrag : true,
			ddGroup : 'dd.mapiitem'
		});

		Zarafa.contact.ui.ContactCardView.superclass.constructor.call(this, config);

		this.initEvents();
	},

	/**
	 * initialize events for the card view
	 * @private
	 */
	initEvents : function()
	{
		this.on({
			'dblclick': this.onNodeDblClick,
			'contextmenu': this.onNodeContextMenu,
			'selectionchange': this.onSelectionChange,
			scope : this
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
	onNodeContextMenu : function(dataView, index, node, event)
	{
		// check row is already selected or not, if its not selected then select it first
		if (!dataView.isSelected(node)) {
			dataView.select(node);
		}

		Zarafa.core.data.UIFactory.openDefaultContextMenu(dataView.getSelectedRecords(), { position : event.getXY() });
	},

	/**
	 * Event handler function will be called when any node is double clicked.
	 * @param {Zarafa.contact.ContactCardView} dataView data view object
	 * @param {Number} index index of node
	 * @param {HTMLElement} node node object
	 * @param {Ext.EventObject} event event object
	 * @private
	 */
	onNodeDblClick : function(dataView, index, node, event)
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
	onSelectionChange : function(dataView, selections)
	{
		this.model.setSelectedRecords(dataView.getSelectedRecords());
	},

	/**
	 * Function will initialize {@link Ext.XTemplate XTemplate} and create layout for data view
	 * @return {Ext.XTemplate} xtemplate for layout
	 * @private
	 */
	initTemplate : function()
	{
		var templateStrArr = [
			'<div class="zarafa-contact-cardview">',
				'<tpl for=".">',
					'<div class="zarafa-contact-cardview-card">',
						'<div id="{entryid}" class="x-panel">',
							'<div class="x-panel-tl">',
								'<div class="x-panel-tr">',
									'<div class="x-panel-tc">',
										'<div class="x-panel-header">',
											'<span class="x-panel-header-text">',
												'{fileas:htmlEncodeUndef}',
											'</span>',
										'</div>',
									'</div>',
								'</div>',
							'</div>',
							'<div class="x-panel-bwrap">',
								'<div class="x-panel-body zarafa-card-body">',
										// Photo or Icon
										'<p><tpl>{message_class:this.getIcon}</tpl></p>',
									'<div>',
										// content
										'<p class="zarafa-contact-cardview-card-title">{display_name:htmlEncode}</p>',
										'<p><tpl if="values.message_class==\'IPM.DistList\'">' + _('Group') + '</tpl></p>',
										'<p>{company_name:htmlEncodeUndef}</p>',
										'<p>{title:htmlEncodeUndef}</p>',
										'<p>{department_name:htmlEncodeUndef}</p>',
										'<table>',
										'<tpl if="!Ext.isEmpty(values.business_telephone_number)"><tr><td class="contact-card-label">' + _('Work') + ':</td><td>{business_telephone_number:htmlEncode}</td></tr></tpl>',
										'<tpl if="!Ext.isEmpty(values.business2_telephone_number)"><tr><td class="contact-card-label">' + _('Work') + ':</td><td>{business2_telephone_number:htmlEncode}</td></tr></tpl>',
										'<tpl if="!Ext.isEmpty(values.primary_telephone_number)"><tr><td class="contact-card-label">' + _('Primary') + ':</td><td>{primary_telephone_number:htmlEncode}</td></tr></tpl>',
										'<tpl if="!Ext.isEmpty(values.cellular_telephone_number)"><tr><td class="contact-card-label">' + _('Mobile') + ':</td><td>{cellular_telephone_number:htmlEncode}</td></tr></tpl>',
										'<tpl if="!Ext.isEmpty(values.home_telephone_number)"><tr><td class="contact-card-label">' + _('Home') + ':</td><td>{home_telephone_number:htmlEncode}</td></tr></tpl>',
										'</table>',
									'</div>',
								'</div>',
							'</div>',
						'</div>',
					'</div>',
				'</tpl>',
			'</div>'
		];

		return new Ext.XTemplate(templateStrArr.join(''), {
			compiled : true,		// compile immediately
			// Returns contact/distlist icon to show it in cardview.
			getIcon : function(message_class)
			{
				// TODO: Create new Icons for Distlist and contacts for cardview.
				if(message_class == "IPM.DistList") {
					return '<div class="zarafa-contact-cardview-distlist-card"></div>';
				} else {
					return '<div class="zarafa-contact-cardview-contact-card"></div>';
				}
			}
		});
	}
});

Ext.reg('zarafa.contactcardview', Zarafa.contact.ui.ContactCardView);
