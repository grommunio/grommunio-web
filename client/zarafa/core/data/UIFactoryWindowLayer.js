Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.UIFactoryWindowLayer
 * @extends Zarafa.core.data.UIFactoryLayer
 *
 * This layer supports placing {@link Zarafa.core.ui.ContentPanel Content Panels}
 * to be placed inside a {@link Ext.Window} instance.
 */
Zarafa.core.data.UIFactoryWindowLayer = Ext.extend(Zarafa.core.data.UIFactoryLayer, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			type : 'dialogs',
			index : 10,
			allowModal : true,
			manager : Ext.WindowMgr,
			plugins : [ 'zarafa.contentwindowlayerplugin' ]
		});

		Zarafa.core.data.UIFactoryWindowLayer.superclass.constructor.call(this, config);
	},

	/**
	 * The create function which is invoked when a component needs to be added to the Container using
	 * this Layer.
	 * @param {Function} Constructor The constructor of the component which has to be created in the container layer.
	 * @param {Object} config The configuration object which must be
	 * passed to the constructor when creating the component
	 * @protected
	 */
	create : function(component, config)
	{
		var panel = new component(config);

		var windowCfg = {
			modal : panel.modal,
			manager : panel.manager,
			constrainHeader : true,
			minimizable: panel.minimizable || false,
			headerCfg : {
				tag : 'div',
				cls : 'zarafa-window-header x-window-header x-unselectable x-window-draggable'
			},
			layout : 'fit',
			items : [
				panel
			],
			title : panel.title,
			listeners : {
				// We want to give fade effect when subjecttext is longer than window width
				'afterrender' : function(win) {
					if (Ext.isDefined(win.header) && Ext.isElement(win.header.dom)) {
						Ext.DomHelper.append(win.header.dom, "<span class='fade'>&nbsp;</span>");
					}
				}
			}
		};

		// If the component has listeners defined add them to the containing window
			Ext.applyIf(windowCfg.listeners, config.listeners);

		if(panel.closeAction) {
			// add a custom closeAction config to properly fire close events when closing
			// dialogs using closeAction config
			windowCfg.closeAction = panel.closeAction;
			windowCfg[panel.closeAction] = panel[panel.closeAction].createDelegate(panel);
		}

		var window = new Ext.Window(windowCfg);
		window.show();
	}
});

Zarafa.core.data.UIFactory.registerLayer(new Zarafa.core.data.UIFactoryWindowLayer());
