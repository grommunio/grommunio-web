Ext.namespace('Zarafa.whatsnew.ui');

/**
 * @class Zarafa.whatsnew.ui.WhatsNewWindow
 * @extends Ext.Window
 *
 * The WhatsNewWindow is a dialog that shows new features in the latest version of the WebApp and the enabled
 * plugins. Features will be shown once, and the user has the option to turn off the showing of the dialog.
 */
Zarafa.whatsnew.ui.WhatsNewWindow = Ext.extend(Ext.Window, {
	/**
	 * @cfg {Object[]} features Array of objects describing the latest features of the WebApp version
	 * and of the installed plugins. Objects could have the following properties:<br>
	 * <ul>
	 * 		<li>title: String (mandatory)</li>
	 * 		<li>description: String (mandatory)</li>
	 * 		<li>image_url: String (mandatory)</li>
	 * 		<li>icon_url: String (optional)</li>
	 * </ul>
	 */
	features : [],

	/**
	 * The index of the feature item that is shown in the WhatsNewWindow.
	 * @property
	 * @type Number
	 */
	activeItem: 0,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		if ( Array.isArray(config.features) ) {
			this.features = config.features;
		}

		Ext.apply(config, {
			modal: true,
			id: 'k-whatsnew-window',
			width: 650,
			height: 397,
			resizable: false,
			title: _("What's new"),
			layout: 'vbox',
			layoutConfig: {
				align: 'stretch'
			},
			tools: [{
				id: 'close',
				handler: this.onSkip,
				scope: this
			}],
			bbar: this.createBottomBar(),
			items: [
				this.createFeaturePanels(),
				this.createNavigationPanel()
			]
		});

		Zarafa.whatsnew.ui.WhatsNewWindow.superclass.constructor.call(this, config);
	},

	/**
	 * Creates the components that should be shown in the bottom bar of the window
	 * @return {Array} Configuration objects for the components in the bottom bar
	 * @private
	 */
	createBottomBar : function()
	{
		return [{
			xtype: 'checkbox',
			boxLabel: _("Don't show me new features again."),
			ctCls: 'k-whatsnew-checkbox',
			ref: '../dontShowCheckbox'
		},
		'->',
		{
			cls: 'zarafa-normal',
			id: 'k-whatsnew-skip',
			text: _('Skip'),
			handler: this.onSkip,
			scope: this
		}];
	},

	/**
	 * Event handler for the click event of the 'skip' button in the bottom bar of the window.
	 * Will check if the user checked the "Don't show again" checkbox and adjust the "show" setting
	 * of the plugin accordingly before closing the window.
	 * @param {Ext.Button} btn The skip button
	 * @private
	 */
	onSkip : function(btn)
	{
		// Check the 'Don't show again' checkbox
		if ( this.dontShowCheckbox.getValue() ){
			var sm = container.getSettingsModel();
			sm.set('zarafa/v1/main/new_features_dialog/show', false);
		}

		this.close();
	},

	/**
	 * Creates the panel that contains the features descriptions. The panel uses the card layout
	 * to be able to switch between the features.
	 * @return {Object} Configuration object for the panel that contains the feature descriptions.
	 */
	createFeaturePanels : function()
	{
		var panels = this.features.map(function(feature){
			var html =
				'<h2 class="k-whatsnew-text-title">' + feature.title + '</h2>' +
				'<div class="k-whatsnew-text-description">' +
						Ext.util.Format.nl2br(Zarafa.core.HTMLParser.br2nl(feature.description)) +
				'</div>';
			if ( !Ext.isEmpty(feature.icon_url) ){
				html = '<img class="k-whatsnew-feature-icon" src="' + feature.icon_url + '">' + html;
			}

			return {
				layout: 'column',
				items: [{
					xtype: 'container',
					cls: 'k-whatsnew-feature-text',
					width: 216,
					autoScroll: true,
					height: 287,
					html : html
				}, {
					xtype: 'container',
					cls: 'k-whatsnew-feature-image',
					width: 432,
					height: 287,
					html: '<img src="' + feature.image_url + '">'
				}]
			};
		});

		return {
			xtype: 'container',
			ref: 'featureContainer',
			layout: 'card',
			activeItem: 0,
			autoHeight: true,
			defaults: {
				border: false
			},
			items: panels
		};
	},

	/**
	 * Creates the toolbar with the navigational buttons.
	 * @return {Object} Configuration object for the navigational toolbar.
	 */
	createNavigationPanel : function()
	{
		var buttons = [{
			xtype: 'zarafa.toolbarbutton',
			iconCls: 'arrow_left_l',
			id: 'k-whatsnew-prev',
			tooltip: _('Previous'),
			disabled: this.features.length>1 ? false : true,
			handler: this.onNavigate.createDelegate(this, [-1])
		}, {
			xtype: 'tbtext',
			ref: '../featureNumber',
			cls: 'k-whatsnew-feature-number',
			text: '1/' + this.features.length
		}, {
			xtype: 'zarafa.toolbarbutton',
			id: ' k-whatsnew-next',
			iconCls: 'arrow_right_l',
			tooltip: _('Next'),
			disabled: this.features.length>1 ? false : true,
			handler: this.onNavigate.createDelegate(this, [1])
		}];

		return {
			xtype: 'toolbar',
			cls: 'k-whatsnew-navbar',
			buttonAlign: 'center',
			items: buttons
		};
	},

	/**
	 * Event handler for the click event of the 'previous' and 'next' button that
	 * are used to navigate through the features.
	 * @param {Number} dir Equals +1 or -1 to denote forward or backward navigation respectively
	 */
	onNavigate : function(dir)
	{
		this.activeItem += dir;
		if ( this.activeItem >= this.features.length ){
			this.activeItem = 0;
		} else if ( this.activeItem < 0 ){
			this.activeItem = this.features.length-1;
		}

		this.featureContainer.layout.setActiveItem(this.activeItem);

		// Update the counter in the navigation toolbar of the window
		this.featureNumber.setText((this.activeItem+1) + '/' + this.features.length);
	}
});
