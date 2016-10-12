Ext.namespace('Zarafa.core.plugins');

/**
 * @class Zarafa.core.plugins.FormFieldTooltipPlugin
 * @extends Zarafa.core.plugins.ComponentTooltipPlugin
 * @ptype zarafa.formfieldtooltipplugin
 *
 * This plugin is use to set the tooltip on {@link Ext.form.Field FormField} component
 * of {@link Ext.BoxComponent BoxComponent}.
 */
Zarafa.core.plugins.FormFieldTooltipPlugin = Ext.extend(Zarafa.core.plugins.ComponentTooltipPlugin,{

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};
		Ext.apply(this, config);

		Zarafa.core.plugins.FormFieldTooltipPlugin.superclass.constructor.call(this, config);
	},

	/**
	 * Initializes the {@link Ext.Component Component} to which this plugin has been hooked.
	 * @param {Ext.menu.Item} field The field on which the plugin is installed.
	 */
	init : function(field)
	{
		Zarafa.core.plugins.FormFieldTooltipPlugin.superclass.init.apply(this, arguments);
		this.field.on('render', this.onRenderApplyTooltip, this);
	},

	/**
	 * Used to apply the tooltip on {@link Ext.form.Field FormField} components
	 * of {@link Ext.BoxComponent BoxComponent}.
	 * @param {Ext.BoxComponent} component The box component of {@link Ext.Component Component}
	 */
	onRenderApplyTooltip : function(component)
	{
		if (Ext.isDefined(component.tooltip)) {
			// Ext.form.Field are not supported tooltip so we have to
			// manually apply the qtip on components. here we are not
			// apply the qtip on wrap object because we want to show tooltip
			// on components object only and not on wrapper.
			Ext.each(component.wrap.dom.children, function (childComponent) {
				childComponent.qtip = component.tooltip;
			});
		}
	}
});

Ext.preg('zarafa.formfieldtooltipplugin', Zarafa.core.plugins.FormFieldTooltipPlugin);