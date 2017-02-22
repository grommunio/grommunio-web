Ext.ns('Zarafa.common.plugins');

/**
 * @class Zarafa.common.plugins.splitFieldLabeler
 * @extends Ext.util.Observable
 * @ptype zarafa.splitfieldlabeler
 *
 * This plugin functions similarly as the {@link Zarafa.common.plugins.FieldLabeler FieldLabeler}.
 * This plugin should be attached to an {@link Ext.Container container} or anything which
 * has an 'items' field containing components. And is therefor primarily intended for
 * splitting a label for more then one component.
 * On the {@link Ext.Container container} the fieldLabel must be set consisting
 * of a string which can be split into multiple substrings.
 * Each component should have the {@link Zarafa.common.plugins.FieldLabeler.labelSplitter labelSplitter}
 * field set to indicate which variable it represents in the fieldLabel string of the container.
 *
 * Before rendering this plugin will breakup the fieldLabel on the {@link Ext.Container container}
 * and adds {@link Ext.form.Label Label} components and the original {@link Ext.form.Field Fields}
 * into the items array of the container.
 */
Zarafa.common.plugins.SplitFieldLabeler = Ext.extend(Ext.util.Observable, {
	/**
	 * @cfg {Object} labelCfg The labelConfiguration which must be
	 * applied to all generated labels.
	 */
	labelCfg : {
		style: 'text-align: left; padding: 3px 3px 3px 3px'
	},
	/**
	 * @cfg {Object} firstLabelCfg The labelConfiguration which must be
	 * applied to the first generated label (if this is also the first
	 * displayed item inside the field!). This configuration applied after
	 * the {@link #labelCfg}.
	 */
	firstLabelCfg : {
		style: 'text-align: left; padding: 3px 3px 3px 0px'
	},
	/**
	 * @cfg {Object} lastLabelCfg The labelConfiguration which must be
	 * applied to the last generated label (if this is also the last
	 * displayed item inside the field!). This configuration applied after
	 * the {@link #labelCfg}.
	 */
	lastLabelCfg : {
		style: 'text-align: left; padding: 3px 3px 3px 3px'
	},
	/**
	 * Plugin initializer for the SplitFieldLabeler.
	 * @param {Ext.Component} field The field for which the fieldlabeler is initialized
	 */
	init : function(field)
	{
		// This is not a container, or no label has been assigned.
		if (!Ext.isDefined(field.items) || !Ext.isDefined(field.fieldLabel) || field.hideLabel === true) {
			return;
		}

		var labelPieces = this.createLabelDistribution(field.items, field.fieldLabel);
		var labeledItems = this.applyLabelDistribution(field.items, labelPieces);

		this.applyLabelWidths(field.labelWidth, labeledItems);

		// Overwrite the items, be careful not to change the type
		// of the items object (it could be an array or MixedCollection).
		if (Array.isArray(field.items)) {
			field.items = labeledItems;
		} else {
			field.items.clear();
			field.items.addAll(labeledItems);
			// The innerCt has already been created at this point so the items 
			// need to be added to that Component as well
			field.innerCt.items.clear();
			field.innerCt.items.addAll(labeledItems);
		}

		// The main field must not display any labels
		field.hideLabel = true;
		delete field.fieldLabel;
	},

	/**
	 * Create a list of all sub-labels which can be constructed from the given label.
	 * This will return a list of all sub-labels, including the seperator string which
	 * indicates the correct position of an item.
	 *
	 * @param {Array/MixedCollection} items The items for which the label distribution
	 * is required.
	 * @param {String} label The label which must be distributed over the items.
	 * @return {Array} The array of labelstrings which must be applied to the components.
	 */
	createLabelDistribution : function(items, label)
	{
		var splitters = [];
		var generateSplitters = function(item) {   
			if (Ext.isDefined(item.labelSplitter)) {
				splitters.push(item.labelSplitter);
			}
		};

		// Items can be an Array or MixedCollection, depending
		// on the current state of the field for which we are generating
		// the labels.
		if (Array.isArray(items)) {
			Ext.each(items, generateSplitters, this);
		} else {
			items.each(generateSplitters, this);
		}

		return Zarafa.util.Translations.MultiSplitTranslation(label, splitters);
	},

	/**
	 * Apply the label distribution which was generated with the
	 * {@link #createLabelDistribution createLabelDistribution}
	 * function. This will construct an array of {@link Ext.Component Components} with the
	 * labels and components in the order of which they should be displayed.
	 *
	 * @param {Array/MixedCollection} items The items for which the labels must be applied.
	 * @param {Array} labels The array of labels which must be applied to the items.
	 * @return {Array} items The array of items with the labels applied, and in the
	 * order in which they must be shown.
	 */
	applyLabelDistribution : function(items, labels)
	{
		var labeledItems = [];

		for (var i = 0; i < labels.length; i++) {
			var foundItem = undefined;
			var label = labels[i];

			var findItem = function(item) {
				if (item.labelSplitter === labels[i]) {
					foundItem = item;
					return false;
				}
			};

			// Items can be an Array or MixedCollection, depending
			// on the current state of the field for which we are generating
			// the labels.
			if (Array.isArray(items)) {
				Ext.each(items, findItem, this);
			} else {
				items.each(findItem, this);
			}

			// If the label was recognized as labelSplitter,
			// we must insert the component itself, otherwise
			// generate the label.
			if (Ext.isDefined(foundItem)) {
				labeledItems.push(foundItem);
			} else {
				labeledItems.push(Ext.apply({}, this.labelCfg, {
					xtype: 'displayfield',
					value: label
				}));
			}
		}

		// Apply special configurations to the first and last items.
		if (labeledItems[0].xtype == 'displayfield') {
			Ext.apply(labeledItems[0], this.firstLabelCfg);
		}
		if (labeledItems[labeledItems.length - 1].xtype == 'displayfield') {
			Ext.apply(labeledItems[labeledItems.length - 1], this.lastLabelCfg);
		}

		for (var i = 0; i < labeledItems.length; i++) {
			labeledItems[i] = Ext.create(labeledItems[i]);
		}

		return labeledItems;
	},

	/**
	 * Calculate the {@link Ext.form.Label.width labelWidths} which
	 * must be applied to each individual component which doesn't have the
	 * {@link Ext.form.Label.width labelWidth} set explicitely.
	 *
	 * @param {Number} totalWidth The total width which can be used to
	 * for all the labels combined.
	 * @param {Ext.Component} labeledItems The components which contain the
	 * fieldLabels for which the lengths must be calculated.
	 */
	applyLabelWidths : function(totalWidth, labeledItems)
	{
		// No width configured, all labels have autoWidth
		if (!Ext.isNumber(totalWidth)) {
			return;
		}

		// The combined length of all labels
		var labelLength = 0;

		// Loop over all items to see what labels have been
		// applied, and if a width has already been specified. 
		for (var i = 0; i < labeledItems.length; i++) {
			var item = labeledItems[i];

			if (item.xtype == 'displayfield') {
				// If no width is configured, but a label is provided,
				// increase the labelLength to have this label be part
				// of the labelWidth calculations.
				// If a width was provided, we reduce the totalWidth
				// because we must only calculate the labelWidth for
				// the non-fixed labels.
				if ((!Ext.isDefined(item.width) || item.width === 0) && !Ext.isEmpty(item.text)) {
					labelLength += item.text.length;
				} else {
					totalWidth -= item.width;
				}
			}
		}

		// Calculate the labelWidth 
		for (var i = 0; i < labeledItems.length; i++) {
			var item = labeledItems[i];

			if (item.xtype == 'displayfield') {
				if ((!Ext.isDefined(item.width) || item.width === 0) && !Ext.isEmpty(item.text)) {
					item.width = Math.round(totalWidth * (item.text.length / labelLength));
				}
			}
		}
	}
});

Ext.preg('zarafa.splitfieldlabeler', Zarafa.common.plugins.SplitFieldLabeler);
