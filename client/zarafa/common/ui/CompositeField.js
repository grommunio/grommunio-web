Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.CompositeField
 * @extends Ext.form.CompositeField
 * @xtype zarafa.compositefield
 */
Zarafa.common.ui.CompositeField = Ext.extend(Ext.form.CompositeField, {

	/**
	 * @cfg {Boolean} isSingleValued True when this class contains a valid {@link #getValue} function
	 * which returns a valid value and the {@link Ext.form.BasicForm}#{@link Ext.form.BasicForm#updateRecord}
	 * doesn't need to loop over {@link #eachItem} to construct an array of values to be stored into the
	 * {@link Ext.data.Record} property for the {@link #name}.
	 */
	isSingleValued : false,

	/**
	 * @cfg {String} focusClass The CSS class to use when the checkbox receives focus (defaults to undefined)
	 * this will not apply any focus class from the child elements of composite fields
	 */
	focusClass : undefined,

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'zarafa.compositefield',
			// Unfortunately we cannot set this margin in the css, because Ext uses absolute positions
			// for the items in a composite field and doesn't handle margins using css margins
			defaultMargins: '0 6 0 0'
		});
		config.cls = config.cls ? config.cls + ' zarafa-compositefield' : 'zarafa-compositefield';

		Ext.apply(this, config);

		Zarafa.common.ui.CompositeField.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize component
	 * We perform a Ext.create() on each item within the
	 * {@link Zarafa.common.ui.CompositeField CompositeField} to make sure it
	 * is allocated. This fixes any issues with find{By,ById,ByType} which
	 * could be called before the field is rendered. Only during rendering
	 * will a inner {@link Ext.Container container} be allocated which allocates
	 * the items within this field. This would break the find functions, so
	 * allocating them here we can be sure that this field really behaves
	 * as a container.
	 */
	initComponent : function()
	{
		Zarafa.common.ui.CompositeField.superclass.initComponent.call(this);

		// Ext.form.CompositeField removes references to components which are not form fields
		// but we should support adding non form fields to composite field also
		 var fields = this.innerCt.findBy(function(c) {
			return c.isXType('box');
		}, this);

		this.items.addAll(fields);

		// Correct the ownerCt reference of the container, so we can use findParentBy
		// on the items in the innerCt to reach the compositefield (and its parents).
		this.innerCt.ownerCt = this;
	},

	/**
	 * Cascades down the component/container heirarchy from this component (called first), calling the specified function with
	 * each component. The scope (<i>this</i>) of
	 * function call will be the scope provided or the current component. The arguments to the function
	 * will be the args provided or the current component. If the function returns false at any point,
	 * the cascade is stopped on that branch.
	 * @param {Function} fn The function to call
	 * @param {Object} scope (optional) The scope of the function (defaults to current component)
	 * @param {Array} args (optional) The args to call the function with (defaults to passing the current component)
	 * @return {Ext.Container} this
	 */
	cascade : function(fn, scope, args)
	{
		if (fn.apply(scope || this, args || [this]) !== false) {
			if (this.items) {
				var cs = (this.items instanceof Ext.util.MixedCollection) ? this.items.items : this.items;
				for (var i = 0, len = cs.length; i < len; i++) {
					if (cs[i].cascade) {
						cs[i].cascade(fn, scope, args);
					} else {
						fn.apply(scope || cs[i], args || [cs[i]]);
					}
				}
			}
		}
		return this;
	},

	/**
	 * Performs validation checks on each subfield and returns false if any of them fail validation.
	 * We override this function to be able to have non-form-field elements in the composite.
	 * @return {Boolean} False if any subfield failed validation
	 */
	validateValue: function(value, preventMark) {
		var valid = true;

		this.eachItem(function(field) {
			if ( field.isXType('field') && !field.isValid(preventMark)) {
				valid = false;
			}
		});

		return valid;
	},

	/**
	 * Find a component under this container at any level by property
	 *
	 * @param {String} prop
	 * @param {String} value
	 * @return {Array} Array of Ext.Components
	 */
	find : Ext.Container.prototype.find,

	/**
	 * Find a component under this container at any level by a custom function.
	 * If the passed function returns true, the component will be included in the results.
	 * The passed function is called with the arguments (component, this container).
	 *
	 * @param {Function} fn The function to call
	 * @param {Object} scope (optional) The scope for the function
	 * @return {Array} Array of Ext.Components
	 */
	findBy : Ext.Container.prototype.findBy,

	/**
	 * Find a component under this container at any level by xtype or class
	 *
	 * @param {String/Class} xtype The xtype string for a component, or the class of the component directly
	 * @param {Boolean} shallow (optional) False to check whether this Component is descended from the xtype
	 * (this is the default), or true to check whether this Component is directly of the specified xtype
	 * @return {Array} Array of Ext.Components
	 */
	findByType : Ext.Container.prototype.findByType
});

Ext.reg('zarafa.compositefield', Zarafa.common.ui.CompositeField);
