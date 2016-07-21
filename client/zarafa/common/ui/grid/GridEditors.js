Ext.namespace('Zarafa.common.ui.grid');
/*
 * This file contains editors for editorgrid panel. These editors extends other Ext.form component to provide
 * custom functionality to grid inline editing.
 */

/**
 * @class Zarafa.common.ui.grid.PriorityPicker
 * @extends Ext.form.ComboBox
 * @xtype prioritypicker
 * 
 * Editor for Priority column.
 * Usage :
<pre><code>
		cm : new Ext.grid.ColumnModel([
				{
					...
					editor : Zarafa.common.ui.grid.PriorityPicker(),
					...
				},
				...
 </code></pre>
 * @constructor
 * @param {Object} object containing configuration properties for Zarafa.common.ui.grid.PriorityPicker editor.
 */
Zarafa.common.ui.grid.PriorityPicker = function (config)
{
	config = config || {};
	Ext.apply(this, config);
	Zarafa.common.ui.grid.PriorityPicker.superclass.constructor.call(this, arguments);
};

Ext.extend(Zarafa.common.ui.grid.PriorityPicker, Ext.form.ComboBox, {
	triggerAction : 'all',
	mode : 'local',
	lazyRenderer : true,
	scope : this,
	store : new Ext.data.ArrayStore({
		id : 0,
		fields : [
			'value',
			'displayText'
		],
		data : [
			[0, '<span class="importance_combobox icon_importance_nonurgent">'+ _('Low') +'</span>'],
			[1, '<span class="importance_combobox ">'+ _('Normal') +'</span>'],
			[2, '<span class="importance_combobox icon_importance_urgent">'+ _('High') +'</span>']
		]
	}),
	valueField : 'value',
	displayField : 'displayText',
	listeners : {
		'select' : function () { 
			// onSelection notify gridEditor that editing is complete.
			this.gridEditor.completeEdit();
		},
		'afterrender' : function () {
			// expand the list when this editor is rendered.
			this.expand();
		}
	}
});
Ext.reg('prioritypicker', Zarafa.common.ui.grid.PriorityPicker);

/**
 * @class Zarafa.common.ui.grid.CompleteSpinner
 * @extends Ext.ux.form.SpinnerField
 * @xtype completespinner
 * 
 * Editor for Percent Complete column.
 * Usage :
<pre><code>
		cm : new Ext.grid.ColumnModel([
				{
					...
					editor : Zarafa.common.ui.grid.CompleteSpinner(),
					...
				},
				...
 </code></pre>
 * @constructor
 * @param {Object} object containing configuration properties for Zarafa.common.ui.grid.CompleteSpinner editor.
 */
Zarafa.common.ui.grid.CompleteSpinner = function (config)
{
	config = config || {};
	Ext.apply(this, config);
	Ext.apply(this, {
		allowBlank : false,
		defaultValue : '0',
		incrementValue : 25,
		enableKeyEvents : true,
		minValue : '0',
		maxValue : '100'
	});
	Zarafa.common.ui.grid.CompleteSpinner.superclass.constructor.call(this, arguments);
};

Ext.extend(Zarafa.common.ui.grid.CompleteSpinner, Ext.ux.form.SpinnerField, {
	listeners : {
		'spinup' : function () {
			var value = this.incrementValue + (parseInt(this.getEl().dom.value.trim('%'), 10) - 1);
			if (this.maxValue >= value) {
				this.setValue(value);
			}
		},
		'spindown' : function () {
			var value = (parseInt(this.getEl().dom.value.trim('%'), 10) + 1) - this.incrementValue;
			if (this.minValue <= value) {
				this.setValue(value);
			}
		},
		'render' : function () {
			this.getEl().dom.value = parseInt(this.value) * 100;
		}
	}
});
Ext.reg('completespinner', Zarafa.common.ui.grid.CompleteSpinner);
