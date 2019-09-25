Ext.namespace('Zarafa.common.ui');

/**
 * This class is especially created to hold the recipient fields.
 * Since recipient fields can resize dynamically (in height) based on contents, 
 * so should this composite field.
 * 
 * @class Zarafa.common.ui.ResizableCompositeField
 * @extends Zarafa.common.ui.CompositeField
 * @xtype zarafa.resizablecompositefield
 */
Zarafa.common.ui.ResizableCompositeField = Ext.extend(Zarafa.common.ui.CompositeField, {

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'zarafa.resizablecompositefield'
		});
		config.cls = config.cls ? config.cls + ' zarafa-resizable-compositefield' : 'zarafa-resizable-compositefield';

		Ext.apply(this, config);

		Zarafa.common.ui.ResizableCompositeField.superclass.constructor.call(this, config);
	},

	/**
	 * This function is overridden to be able to make sure the items in the hbox layout are stretched.
	 */
    initComponent: function() {
        var labels = [],
            items  = this.items,
            item;

        for (var i=0, j = items.length; i < j; i++) {
            item = items[i];
            
            if (!Ext.isEmpty(item.ref)){
                item.ref = '../' + item.ref;
            }

            labels.push(item.fieldLabel);

            //apply any defaults
            Ext.applyIf(item, this.defaults);

            //apply default margins to each item except the last
            if (!(i == j - 1 && this.skipLastItemMargin)) {
                Ext.applyIf(item, {margins: this.defaultMargins});
            }
        }

        this.fieldLabel = this.fieldLabel || this.buildLabel(labels);

        /**
         * @property fieldErrors
         * @type Ext.util.MixedCollection
         * MixedCollection of current errors on the Composite's subfields. This is used internally to track when
         * to show and hide error messages at the Composite level. Listeners are attached to the MixedCollection's
         * add, remove and replace events to update the error icon in the UI as errors are added or removed.
         */
        this.fieldErrors = new Ext.util.MixedCollection(true, function(item) {
            return item.field;
        });

        this.fieldErrors.on({
            scope  : this,
            add    : this.updateInvalidMark,
            remove : this.updateInvalidMark,
            replace: this.updateInvalidMark
        });

        Ext.form.Field.prototype.initComponent.apply(this);
        
        this.innerCt = new Ext.Container({
            layout  : 'hbox',
            layoutConfig: {
            	pack: 'start',
            	align: 'stretch'
            },
            items   : this.items,
            cls     : 'x-form-composite',
            defaultMargins: '0 3 0 0',
            ownerCt: this
        });
        delete this.innerCt.ownerCt;

        var fields = this.innerCt.findBy(function(c) {
            return c.isFormField;
        }, this);

        /**
         * @property items
         * @type Ext.util.MixedCollection
         * Internal collection of all of the subfields in this Composite
         */
        this.items = new Ext.util.MixedCollection();
        this.items.addAll(fields);

		// Ext.form.CompositeField removes references to components which are not form fields
		// but we should support adding non form fields to composite field also
        fields = this.innerCt.findBy(function(c) {
			return c.isXType('box');
        }, this);

        this.items.addAll(fields);

		// Correct the ownerCt reference of the container, so we can use findParentBy
		// on the items in the innerCt to reach the compositefield (and its parents).
		this.innerCt.ownerCt = this;
        
        // Set a listener on boxfield items
        Ext.each( this.items.items, function(item){
        	if ( item.isXType('zarafa.boxfield') ){
        		item.mon(item, 'resizeheight', function(){
        			this.onResize();
        			this.ownerCt.doLayout(false);
        		}, this, { delay: 0 });
        	}
        }, this);
    },

	/**
	 * Overwrite this to give the inner container the correct height when the composite field
	 * is resized.
	 * 
     * @param {Number} adjWidth The box-adjusted width that was set
     * @param {Number} adjHeight The box-adjusted height that was set
     * @param {Number} rawWidth The width that was originally specified
     * @param {Number} rawHeight The height that was originally specified
	 */
    onResize: function(adjWidth, adjHeight, rawWidth, rawHeight) {
    	// Store the padding because getting it is an expensive operation
    	if ( !Ext.isDefined(this.padding) ){
    		this.padding = this.getEl().getPadding('tb');
    	}
    	
        var innerCt = this.innerCt;

        // Now check the heights of all items because they might have been resized
        // And then we should resize this container accordingly
        var height = 0;
        var items = innerCt.items;
        if ( items.items ){
        	items = items.items;
        }
        Ext.each(items, function(item){
        	var itemHeight = 0;
        	var itemPadding = 0;
        	if ( item.getResizeEl && item.getResizeEl() ){
	        	itemHeight = item.getResizeEl().getHeight();
	        	itemPadding = item.getResizeEl().getPadding('tb');
	        }
        	if ( itemHeight + itemPadding > height ){
        		height = itemHeight + itemPadding;
        	}
        }, this);
        
        height += this.padding;
        
        if ( height !== adjHeight ){
        	adjHeight = height;
        }

        if (this.rendered && innerCt.rendered) {
            innerCt.setSize(adjWidth, adjHeight);
        }
        
       Zarafa.common.ui.ResizableCompositeField.superclass.onResize.apply(this, [adjWidth, adjHeight, rawWidth, rawHeight]);
    }
	
});

Ext.reg('zarafa.resizablecompositefield', Zarafa.common.ui.ResizableCompositeField);
