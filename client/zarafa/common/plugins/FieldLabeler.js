Ext.ns('Zarafa.common.plugins');

/**
 * @class Zarafa.common.plugins.FieldLabeler
 * @extends Ext.util.Observable
 * @ptype zarafa.fieldlabeler
 *
 * <p>A plugin for Field Components which renders standard Ext form wrapping and labels
 * round the Field at render time regardless of the layout of the Container.</p>
 * <p>Usage:</p>
 * <pre><code>
    {
        xtype: 'combo',
        plugins: [{
            ptype : 'zarafa.fieldlabeler'
        }],
        triggerAction: 'all',
        fieldLabel: 'Select type',
        store: typeStore
    }
 * </code></pre>
 */
Zarafa.common.plugins.FieldLabeler = Ext.extend(Ext.util.Observable, {
	/**
	 * Initialize the plugin for the given {@link Ext.form.Field field}
	 * @param {Ext.form.Field} field The field on which the plugin is placed
	 */
	init : function(field)
	{
		field.onRender = field.onRender.createSequence(this.onRender);
		field.onResize = this.onResize;
		field.adjustPosition = this.adjustPosition;
		field.onDestroy = field.onDestroy.createSequence(this.onDestroy);
	},

	/**
	 * Renders the component
	 * @private
	 */
	onRender : function()
	{
		// Do nothing if being rendered by a form layout
		if (this.ownerCt) {
			if (this.ownerCt.layout instanceof Ext.layout.FormLayout) {
				return;
			}
		}

		//  Pulls a named property down from the first ancestor Container it's found in
		function getParentProperty(propName) {
			for (var p = this.ownerCt; p; p = p.ownerCt) {
				if (p[propName]) {
					return p[propName];
				}
			}
		}

		this.resizeEl = (this.wrap || this.el).wrap({
			cls: 'x-form-element',
			style: (Ext.isIE9m && !Ext.isIE9 || Ext.isOpera) ? 'position:absolute;top:0;left:0;overflow:visible' : ''
		});
		this.positionEl = this.itemCt = this.resizeEl.wrap({
			cls: 'x-form-item '
		});
		if (this.nextSibling()) {
			this.margins = {
				top: 0,
				right: 0,
				bottom: this.positionEl.getMargins('b'),
				left: 0
			};
		}
		this.actionMode = 'itemCt';

		// If our Container is hiding labels, then we're done!
		if (!Ext.isDefined(this.hideLabels)) {
			this.hideLabels = getParentProperty.call(this, 'hideLabels');
		}
		if (this.hideLabels) {
			this.resizeEl.setStyle('padding-left', '0px');
			return;
		}

		// Collect the info we need to render the label from our Container.
		if (!Ext.isDefined(this.labelSeparator)) {
			this.labelSeparator = getParentProperty.call(this, 'labelSeparator');
		}
		if (!Ext.isDefined(this.labelPad)) {
			this.labelPad = getParentProperty.call(this, 'labelPad');
		}
		if (!Ext.isDefined(this.labelAlign)) {
			this.labelAlign = getParentProperty.call(this, 'labelAlign') || 'left';
		}
		this.itemCt.addClass('x-form-label-' + this.labelAlign);

		if(this.labelAlign == 'top'){
			if (!this.labelWidth) {
				this.labelWidth = 'auto';
			}
			this.resizeEl.setStyle('padding-left', '0px');
		} else {
			if (!Ext.isDefined(this.labelWidth)) {
				this.labelWidth = getParentProperty.call(this, 'labelWidth') || 100;
			}
			this.resizeEl.setStyle('padding-left', (this.labelWidth + (this.labelPad || 5)) + 'px');
			this.labelWidth += 'px';
		}

		this.label = this.itemCt.insertFirst({
			tag: 'label',
			cls: 'x-form-item-label',
			style: {
				width: this.labelWidth
			},
			html: this.fieldLabel + (this.labelSeparator || ':')
		});
	},

	/**
	 * Ensure the input field is sized to fit in the content area of the resizeEl (to the right of its padding-left)
	 * We perform all necessary sizing here. We do NOT call the current class's onResize because we need this control
	 * we skip that and go up the hierarchy to {@link Ext.form.Field Field}
	 *
	 * @param {Number} adjWidth The box-adjusted width that was set
	 * @param {Number} adjHeight The box-adjusted height that was set
	 * @param {Number} rawWidth The width that was originally specified
	 * @param {Number} rawHeight The height that was originally specified
	 * @private
	 */
	onResize : function(adjWidth, adjHeight, rawWidth, rawHeight)
	{
		var width = adjWidth;
		var height = adjHeight;
		var widthCt = adjWidth;
		var heightCt = adjHeight;

		// If this field is not placed on a FormLayout, and this
		// field has the 'flex' property set, then the padding
		// (better known as the labelWidth + padding) must be
		// removed from the width.
		if (!(this.layout instanceof Ext.layout.FormLayout)) {
			if (!Ext.isEmpty(this.flex) || !Ext.isEmpty(this.columnWidth)) {
				width -= this.resizeEl.getPadding('l');
			} else {
				widthCt += this.resizeEl.getPadding('l');
			}
		}

		// If there is an inner Container (in other words, was this a CompositeField)
		// then we must resize this accordingly. Note that the fieldLabel comes before
		// the innerContainer, so the width excluding the label must be used.
		if (this.innerCt) {
			this.innerCt.setSize(width, heightCt);
		}

		Ext.form.Field.prototype.onResize.apply(this, arguments);

		if (this.resizeEl)
			this.resizeEl.setWidth(heightCt);
		if (this.itemCt)
			this.itemCt.setWidth(widthCt);

		if (this.getTriggerWidth) {
			this.wrap.setWidth(width);
			this.el.setWidth(width - this.getTriggerWidth());
		} else {
			this.el.setWidth(width);
		}

		if (this.el.dom.tagName.toLowerCase() == 'textarea') {
			height = this.resizeEl.getHeight(true);
			if (!this.hideLabels && (this.labelAlign == 'top')) {
				height -= this.label.getHeight();
			}
			this.el.setHeight(height);
		}

		if (this instanceof Ext.form.ComboBox) {
			if (!isNaN(width) && this.isVisible() && this.list) {
				this.doResize(width);
			} else {
				this.bufferSize = width;
			}
		}
	},

	/**
	 * If the owner is a HBox, we must compensate for the
	 * resizing of the container element of the _previous_
	 * item. This if the current item is not the first item,
	 * we must change the offset to the left-offset + size of the
	 * previous item.
	 * @param {Number} x The suggested X offset for the component
	 * @param {Number} y The suggested Y offset for the component
	 * @private
	 */
	adjustPosition : function(x, y)
	{
		if (this.ownerCt.layout instanceof Ext.layout.HBoxLayout) {
			x = 0;
			this.ownerCt.items.each(function(item) {
				if (item === this)
					return false;

				x += item.getActionEl().getWidth();
			}, this);
		}

		return { x: x, y: y};
	},

	/**
	 * Remove elements created by this plugin
	 * @private
	 */
	onDestroy: function()
	{
		if(this.ownerCt) {
			Ext.destroy(this.ownerCt);
			this.ownerCt.remove();
		}
	}
});

Ext.preg('zarafa.fieldlabeler', Zarafa.common.plugins.FieldLabeler);
