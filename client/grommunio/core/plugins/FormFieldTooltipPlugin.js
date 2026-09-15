Ext.namespace('Grommunio.core.plugins');

/**
 * @class Grommunio.core.plugins.FormFieldTooltipPlugin
 * @extends Grommunio.core.plugins.ComponentTooltipPlugin
 * @ptype grommunio.formfieldtooltipplugin
 *
 * This plugin is use to set the tooltip on {@link Ext.form.Field FormField} component
 * of {@link Ext.BoxComponent BoxComponent}.
 */
Grommunio.core.plugins.FormFieldTooltipPlugin = Ext.extend(Grommunio.core.plugins.ComponentTooltipPlugin,{

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};
		Ext.apply(this, config);

		Grommunio.core.plugins.FormFieldTooltipPlugin.superclass.constructor.call(this, config);
	},

	/**
	 * Initializes the {@link Ext.Component Component} to which this plugin has been hooked.
	 * @param {Ext.menu.Item} field The field on which the plugin is installed.
	 */
	init: function(field)
	{
		Grommunio.core.plugins.FormFieldTooltipPlugin.superclass.init.apply(this, arguments);
		this.field.on('render', this.onRenderApplyTooltip, this);
	},

	/**
	 * Used to apply the tooltip on {@link Ext.form.Field FormField} components
	 * of {@link Ext.BoxComponent BoxComponent}.
	 * @param {Ext.BoxComponent} component The box component of {@link Ext.Component Component}
	 */
	onRenderApplyTooltip: function(component)
	{
		if (Ext.isDefined(component.tooltip)) {
			// Ext.form.Field are not supported tooltip so we have to
			// manually apply the qtip on components. here we are not
			// apply the qtip on wrap object because we want to show tooltip
			// on components object only and not on wrapper.
			if (Ext.isDefined(component.wrap)) {
				Ext.each(component.wrap.dom.children, function (childComponent) {
					childComponent.qtip = component.tooltip;
				});
			} else {
				component.getEl().dom.qtip = component.tooltip;
			}
		}
	}
});

Ext.preg('grommunio.formfieldtooltipplugin', Grommunio.core.plugins.FormFieldTooltipPlugin);
