Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.ContentPanel
 * @extends Ext.Container
 * @xtype zarafa.contentpanel
 *
 * FIXME: this documentation needs to be completely rewritten
 * The {@link Zarafa.core.ui.ContentPanel ContentPanel} class a base class for content panels and is therefore not intended to be instantiated
 * directly. Developers must extend this class to implement a dialog window that can be shown as either an ExtJS
 * window or a separate browser window.
 * <p>
 * All dialog classes must be registered using the static register method:
 * <p>
 * <code><pre>
 * Zarafa.core.ui.ContentPanel.register(MyDialog, 'mydialog');
 * </pre></code>.
 * <p>
 * The dialog can then be instantiated using the create() method:
 * <p>
 * <code><pre>
 * MyDialog.create(config, {
 *   browser : true,
 *   width : 500,
 *   height : 300,
 * });
 * </pre></code>.
 *
 */
Zarafa.core.ui.ContentPanel = Ext.extend(Ext.Container, {
	/**
	 * @cfg {String} title The title for the ContentPanel
	 */
	title : undefined,

	/**
	 * @cfg {String} The action to take when the close header tool is clicked.
	 * Only used when using {@link Zarafa.core.data.UIFactoryWindowLayer UIFactoryWindowLayer} to
	 * display this {@link Zarafa.core.ui.ContentPanel ContentPanel}.
	 */
	closeAction : 'closeWrap',

	/**
	 * @cfg {Boolean} standalone If true, the {@link Zarafa.core.ui.ContentPanel contentpanel}
	 * will not be hooked into the {@link Zarafa.core.data.ContentPanelMgr}. This will prevent
	 * listening to events coming from the {@link Zarafa.core.data.ContentPanelMgr ContentPanelMgr}.
	 * Defaults to false.
	 */
	standalone : false,

	/**
	 * @cfg {Number} width The width for the ContentPanel
	 */
	width : 800,

	/**
	 * @cfg {Number} height The height for the ContentPanel
	 */
	height : 550,

	/**
	 * @cfg {String} iconCls Icon class for the tab
	 */
	iconCls : undefined,
	
	/**
	 * @cfg {Boolean} useInputAutoFocusPlugin True to use the inputautofocusplugin for
	 * this panel
	 */
	useInputAutoFocusPlugin : true,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		if ( config.useInputAutoFocusPlugin !== false ) {
			config.plugins = Ext.value(config.plugins, []);
			config.plugins.push({
				ptype : 'zarafa.inputautofocusplugin'
			});
		}

		Ext.applyIf(config, {
			xtype: 'zarafa.contentpanel',
			stateful : true
		});

		Zarafa.core.ui.ContentPanel.superclass.constructor.call(this, config);

		/**
		 * @event beforeclose
		 * Fires before the {@link Zarafa.core.ui.ContentPanel ContentPanel} is closed.
		 * A handler can return false to cancel the close.
		 * @param {Ext.Panel} panel The Panel being closed.
		 */
		/**
		 * @event close
		 * Fires after the Panel is closed.
		 * @param {Ext.Panel} panel The Panel that has been closed.
		 */
		this.initializeChildComponent(this);

		if (Ext.isDefined(this.title)) {
			this.setTitle(this.title);
		}

		// register with the ContentPanelMgr unless specifically instructed not to
		if (!this.standalone) {
			Zarafa.core.data.ContentPanelMgr.register(this);

		}
	},

	/**
	 * Called when the ContentPanel has been rendered.
	 * This activate the keymap on the element of this component after the normal operations of
	 * afterRender have been completed. It will activate by getting the xtype hierarchy from
	 * {@link #getXTypes} and format it into a string usable by the
	 * {@link Zarafa.core.KeyMapMgr KeyMapMgr}.
	 * @private
	 */
	afterRender: function()
	{
		Zarafa.core.ui.ContentPanel.superclass.afterRender.apply(this, arguments);
		var xtypes = this.getXTypes();

		// The first part leading up to zarafa.contentpanel will be stripped
		xtypes = xtypes.replace('component/box/container/zarafa.contentpanel','');

		// Then the "zarafa." will be stripped off from all the xtypes like "zarafa.somecontentpanel".
		xtypes = xtypes.replace(/\/zarafa\./g,'.');

		// Finally we strip string the "contentpanel" from all the xtypes. Otherwise each level will have
		// that "contentpanel" mentioned in them. Also we add contentpanel to the start as that sets
		// it apart from other components in the key mapping.
		xtypes = 'contentpanel' + xtypes.replace(/contentpanel/g, '');

		// This will activate keymaps with 'contentpanel.some.somemore' so the component
		// will have all key events register with 'contentpanel', 'some', 'somemore'
		Zarafa.core.KeyMapMgr.activate(this, xtypes);
	},

	/**
	 * This will initialize the {@link Ext.Container container} which is
	 * placed within the {@link Zarafa.core.ui.ContentPanel ContentPanel}. The
	 * {@link Ext.Container container} will recieve a reference to the
	 * {@link Zarafa.core.ui.ContentPanel ContentPanel} into which it has been embedded.
	 * @param {Ext.Component} component The component which must be initialized
	 * @private
	 */
	initializeChildComponent : function(component)
	{
		// Empty objects (undefined, null, []) cannot be initialized.
		if (Ext.isEmpty(component)) {
			return;
		}

		// If it is an array, just recursively call
		// this function again for each individual item.
		var recursive = function(c) {
			this.initializeChildComponent(c);
		};

		if (Ext.isArray(component)) {
			Ext.each(component, recursive, this);
			return;
		} else if (component instanceof Ext.util.MixedCollection) {
			component.each(recursive, this);
			return;
		}

		// We only initialize containers (and their subclasses).
		if (!component.isXType('container')) {
			return;
		}

		component.dialog = this;

		// Toolbars include the top- and bottomtoolbars
		if (!Ext.isEmpty(component.toolbars)) {
			this.initializeChildComponent(component.toolbars);
		}

		// Initialize all child items
		if (!Ext.isEmpty(component.items)) {
			this.initializeChildComponent(component.items);
		}
	},

	/**
	 * Closes the panel. Destroys all child components, rendering the panel unusable.
	 */
	close : function()
	{
		if (this.fireEvent('beforeclose', this) !== false) {
			this.doClose();
		}
	},

	/**
	 * Close handler for the {@link #close} function.
	 * @private
	 */
	doClose : function()
	{
		this.fireEvent('close', this);
		Zarafa.core.data.ContentPanelMgr.unregister(this);
	},

	/**
	 * Function will be called when {@link Ext.Window#closeAction} config will be used to
	 * close the window. This is hardcoded to close the dialog instead of hiding it to make sure that
	 * we fire proper events to notify dialog is closed.
	 * @protected
	 */
	closeWrap : function()
	{
		this.close();
	},

	/**
	 * Sets the title of the panel.
	 * @param {String} title the new window title.
	 */
	setTitle : function(title)
	{
		this.title = title;
		this.fireEvent('titlechange', this, title);
	},

	/**
	 * @param {String} iconCls Icon class of the panel
	 */
	setIcon : function(iconCls)
	{
		var oldIcon = this.iconCls;
		this.iconCls = iconCls;
		this.fireEvent('iconchange', this, iconCls, oldIcon);
	},

	/**
	 * @return {Boolean} true iff the content panel is a modal dialog
	 */
	isModal : function()
	{
		return this.modal;
	},

	/**
	 * Obtain the path in which the {@link #getState state} must be saved.
	 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
	 * used in the {@link Ext.state.Manager}. This returns {@link #statefulName} if provided, or else generates
	 * a custom name.
	 * @return {String} The unique name for this component by which the {@link #getState state} must be saved.
	 */
	getStateName : function()
	{
		return 'dialogs/' + Zarafa.core.ui.ContentPanel.superclass.getStateName.call(this);
	},

	/**
	 * When {@link #stateful} the State object which should be saved into the
	 * {@link Ext.state.Manager}.
	 * @return {Object} The state object
	 * @protected
	 */
	getState : function()
	{
		var state = Zarafa.core.ui.ContentPanel.superclass.getState.call(this) || {};
		return Ext.apply(state, this.getSize());
	}
});

Ext.reg('zarafa.contentpanel', Zarafa.core.ui.ContentPanel);
