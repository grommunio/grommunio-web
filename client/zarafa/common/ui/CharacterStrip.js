Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.CharacterStrip
 * @extends Ext.Container
 * @xtype zarafa.characterstrip
 *
 * This class will add a vertical character strip to any container which is specified
 * in renderTo config option, it will maintain selection for character, view can register on selectionchanged
 * event to change data if selection is changed in this strip.
 */
Zarafa.common.ui.CharacterStrip = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Array} characterData array of characters that will be used to render view
	 */
	characterData : ['...', '123', 'a', 'b', 'c', 'd', 'e', 'f', 
						'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 
						'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 
						'y', 'z'],

	/**
	 * @cfg {String} selectedChar character that is currently selected.
	 * defaults to null.
	 */
	selectedChar : null,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.characterstrip',
			layout : {
				type : 'vbox',
				align : 'stretchmax'
			},
			border : false,
			autoWidth : true
		});

		this.addEvents(
			/**
			 * @event selectionchanged
			 * Event handler will be called when selection of selected character will be changed.
			 * @param {Zarafa.common.ui.CharacterStrip} CharacterStrip object of {@link Zarafa.common.ui.CharacterStrip}
			 * @param {String} character character that is selected currently
			 */
			'selectionchanged',
			/**
			 * @event selectioncleared
			 * Event handler will be called when selection of selected character will be cleared.
			 * @param {Zarafa.common.ui.CharacterStrip} CharacterStrip object of {@link Zarafa.common.ui.CharacterStrip}
			 */
			'selectioncleared'
		);

		Zarafa.common.ui.CharacterStrip.superclass.constructor.call(this, config);
	},
	
	/**
	 * Initializes the component.
	 */
	initComponent: function() {
		// create buttons for all characters
		this.items = [];

		Ext.each(this.characterData, function(character) {
			this.items.push(
				new Ext.Button({
					text : character,
					enableToggle : true,
					scale : 'small',
					toggleGroup : 'chargroup',
					handler : this.onButtonClick,
					scope : this,
					flex : 1,
					pressed : this.selectedChar == character,
					allowDepress : false,
					ref : 'char_' + character
				})
			);
		}, this);

		Zarafa.common.ui.CharacterStrip.superclass.initComponent.call(this, arguments);
	},

	/**
	 * Event handler will be called on toggle vent of any button.
	 * @param {Ext.Button} button button component
	 * @param {Boolean} pressed state of the button which is toggled
	 * @private
	 */
	onButtonClick : function(button, eventObj)
	{
		if(button.pressed) {
			this.selectedChar = button.getText();
			this.fireEvent('selectionchanged', this, this.selectedChar);
		}
	},

	/**
	 * Function will be used to clear selection of any character.
	 */
	clearSelection : function()
	{
		// find currently selected button and remove selection
		var button = this['char_' + this.selectedChar];
		button.toggle(false);

		this.selectedChar = null;

		this.fireEvent('selectioncleared', this);
	}
});

Ext.reg('zarafa.characterstrip', Zarafa.common.ui.CharacterStrip);
