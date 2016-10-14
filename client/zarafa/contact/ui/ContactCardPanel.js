/*
 * #dependsFile client/zarafa/contact/ui/ContactCardView.js
 * #dependsFile client/zarafa/common/ui/CharacterStrip.js
 */
Ext.namespace('Zarafa.contact.ui');

/**
 * @class Zarafa.contact.ui.ContactCardPanel
 * @extends Ext.Panel
 * @xtype zarafa.contactcardpanel
 *
 * This is a wrapper panel for contact card view as data view doesn't support adding paging bar
 * so we need to add a wrapper panel to handle that, this class will also add {@link Zarafa.common.ui.CharacterStrip CharacterStrip}
 * to right side of view.
 */
Zarafa.contact.ui.ContactCardPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.contact.ContactContext} context The context to which this panel belongs
	 */
	context : undefined,

	/**
	 * The {@link Zarafa.contact.ContactContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.contact.ContactContextModel
	 */
	model : undefined,

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

		Ext.applyIf(config, {
			xtype : 'zarafa.contactcardpanel',
			border : false,
			layout : 'border',
			layoutConfig : {
				targetCls : ''		// hack to remove background from panel
			},
			/*
			 * Providing extra container for scrolling. So that mouse events, like mouse up and mouse down, doesn't fire in scrollbar of contact card view.
			 * Because, IE9 does not fire the 'mouseup' event while clicking on scrollbar which cause an unnecessary drag start and selection.
			 * For more info : https://connect.microsoft.com/IE/feedback/details/783058/scrollbar-trigger-mousedown-but-not-mouseup
			 */
			items : [{
				xtype : 'container',
				autoScroll : true,
				region : 'center',
				items : [{
					xtype : 'zarafa.contactcardview',
					context : config.context
				}]
			}, {
				region : 'east',
				xtype : 'zarafa.characterstrip',
				ref : 'characterStrip',
				selectedChar : config.model.getRestrictionCharacter(),
				listeners : {
					selectionchanged : this.onSelectionChanged,
					selectioncleared : this.onSelectionCleared,
					scope : this
				}
			}]
		});

		Zarafa.contact.ui.ContactCardPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the {@link Zarafa.common.ui.CharacterStrip#selectionchanged} event.
	 * This will {@link Zarafa.contact.ContactContextModel#setRestrictionCharacter apply} the
	 * character on the {@link #model}.
	 *
	 * @param {Zarafa.common.ui.CharacterStrip} strip Instance of {@link Zarafa.common.ui.CharacterStrip}
	 * @param {String} character character that is selected currently
	 * @private
	 */
	onSelectionChanged : function(strip, character)
	{
		this.model.setRestrictionCharacter(character);
	},

	/**
	 * Event handler for the {@link Zarafa.common.ui.CharacterStrip#selectioncleared} event.
	 * This will {@link Zarafa.contact.ContactContextModel#setRestrictionCharacter reset} the
	 * character on the {@link #model}.
	 *
	 * @param {Zarafa.common.ui.CharacterStrip} strip Instance of {@link Zarafa.common.ui.CharacterStrip}
	 * @private
	 */
	onSelectionCleared : function(strip)
	{
		this.model.setRestrictionCharacter('');
	}
});

Ext.reg('zarafa.contactcardpanel', Zarafa.contact.ui.ContactCardPanel);
