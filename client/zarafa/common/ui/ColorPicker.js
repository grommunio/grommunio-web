Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.ColorPicker
 * @extends Ext.form.Field
 * @xtype zarafa.colorpicker
 *
 * The ColorPicker is a component that can be used to have the user pick a color. It consists
 * of an squared area in the color of the currently selected color that can be clicked on to
 * open a {@link Ext.menu.ColorMenu} with predefined colors. The user can then pick one of these
 * colors by clicking on it.
 */
Zarafa.common.ui.ColorPicker = Ext.extend(Ext.form.Field, {
	/**
     * @cfg {String} value The default value of the color picker.
	 */
	value: 'BDC3C7',

	/**
     * @cfg {Boolean} border True to display a border around the colorpicker box
     * Can be useful if you want to use white.
	 */
	border: true,

    /**
     * @cfg {String} fieldClass The default CSS class for the field (defaults to 'x-form-field k-colorpicker')
     */
    fieldClass : 'x-form-field k-colorpicker',

	/**
     * @cfg {String[]} colors The colors that will be used for the colorpicker. Colors
     * should be in RGB hex format without the #. E.g. 'AA0000' for red. Defaults to
     * the default calendar colors used by the WebApp.
	 */
	colors : [
		'E30022', // cadmium red
		'F89406', // california
		'F7CA18', // yellow
		'F7B884', // apricot
		'5AB557', // green
		'1FA480', // mint
		'88D8C0', // pearl aqua
		'D3E28B', // soft green
		'912787', // purple
		'9A8BBC', // mauve
		'FF0099', // pink
		'F17DAA', // charm pink
		'0F70BD', // blue
		'00B3F0', // Kopano blue
		'86CFF5', // baby blue
		'BDC3C7'  // silver sand
	],

	/**
	 * The element that is rendered as a colored box on which a user
	 * can click to show {#menu the color picker menu}
	 * @type Ext.Element
	 * @property
	 */
	box : null,

	/**
	 * The contextmenu with the palette
     * @property
     * @type {Ext.menu.ColorMenu}
	 */
    menu : null,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
    constructor : function(config)
    {
    	this.addEvents(
			/**
			 * @event show
			 * Fired when the menu is shown.
			 *
			 * @param {Zarafa.common.ui.ColorPicker} this The color picker.
			 * @param {Ext.menu.ColorMenu} colorMenu The color menu of this color picker.
			 */
			'show',

			/**
			 * @event hideu
			 * Fired when the menu is hidden.
			 *
			 * @param {Zarafa.common.ui.ColorPicker} this The color picker.
			 * @param {Ext.menu.ColorMenu} colorMenu The color menu of this color picker.
			 */
			'hide',

			/**
			 * @event select
			 * Fired when a color was picked.
			 *
			 * @param {Zarafa.common.ui.ColorPicker} this The color picker.
			 * @param {String} color The color that was picked (hex rgb code)
			 */
			'select'
    	);

    	config = config || {};
    	Ext.applyIf(config, {
    		// setting defaultAutoCreate to true to have a simple div as element
    		// and not have Ext.form.Field create an input.
   			defaultAutoCreate : true
    	});

        Zarafa.common.ui.ColorPicker.superclass.constructor.call(this, config);
    },

	/**
	 * Renders the color picker.
	 */
	onRender : function()
	{
        if(!this.el){
            var cfg = this.getAutoCreate();

            if(!cfg.name){
                cfg.name = this.name || this.id;
            }
            this.autoEl = cfg;
        }
        Zarafa.common.ui.ColorPicker.superclass.onRender.apply(this, arguments);

        if ( this.border ){
        	this.cls = (this.cls || '') + ' zarafa-border';
        }

        this.el.addClass([this.fieldClass, this.cls]);

		// Create the clickable box. It is created inside the colorpicker div
		// to be able to use padding for better positioning
        this.box = Ext.get(Ext.DomHelper.createDom({tag: 'div', cls: 'k-colorpicker-box'}));
        this.el.appendChild(this.box);

		// Create the menu with the color palette
        this.createMenu();
	},

	/**
	 * Creates the menu with the color palette.
	 */
	createMenu : function()
	{
		this.menu = new Ext.menu.ColorMenu({
			cls: 'k-colorpicker-menu',
			handler: function(palette, color){
				this.setValue(color);
				this.fireEvent('select', this, color);
			},
			scope: this
		});

		this.menu.palette.colors = this.colors;

		this.relayEvents(this.menu, ['show', 'hide']);
	},

    /**
     * Initializes event handlers. Adds a handler for the click event
     * on {#box the colored box}
     */
    initEvents : function(){
        Zarafa.common.ui.ColorPicker.superclass.initEvents.call(this);

        this.mon(this.box, 'click', this.onClick, this);
    },

	/**
	 * Sets a value for this field
	 * @param {String} value The value to set. Should be an RGB
	 * hex color without the '#'. E.g. 'FF0000' for red.
	 * (# will be stripped if included)
	 * @return {Zarafa.common.ui.ColorPicker} this
	 */
	setValue : function(value) {
        if ( !Ext.isEmpty(value) ){
        	this.value = value.startsWith('#') ? value.replace('#', '') : value;
        }

        if(this.rendered){
            this.box.setStyle('background-color', '#' + this.value);
        }
        return this;
	},

	/**
	 * Returns the value of the field.
	 * @return {String} The RGB code of the color that has been picked
	 */
	getValue : function() {
		return this.value;
	},

	/**
	 * Handler for the click event of the box. Will trigger the menu
	 * with the color palette.
	 * @param {Ext.EventObject} event The normalized click event object
	 */
	onClick : function(event) {
		this.menu.showAt(event.getXY());

		var value = this.value.toUpperCase();
		if ( this.colors.indexOf(value) > -1 ){
			this.menu.palette.select(value, true);
		}
	}
});

Ext.reg('zarafa.colorpicker', Zarafa.common.ui.ColorPicker);
