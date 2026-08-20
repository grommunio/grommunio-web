Ext.namespace('Zarafa.common.dialogs');

/**
 * @class Zarafa.common.dialogs.MessageBox
 * @extends Ext.MessageBox
 *
 * Extension to the default {@link Ext.MessageBox MessageBox} which
 * offers some special features like displaying a selection list.
 */
// Use Ext.apply instead of Ext.extend because Ext.MessageBox is not
// a class but an instantiated object. The Ext.apply({}, a, b) trick
// is used to create a full copy of Ext.MessageBox instead of changing
// the existing object.
Zarafa.common.dialogs.MessageBox = Ext.apply({}, {
	/**
	 * The items which the last call to {@link #initDialog} must add to the
	 * {@link Ext.MessageBox messagebox} when it is shown.
	 *
	 * @property
	 * @type Array
	 * @private
	 */
	dlgItems: undefined,

	/**
	 * The {@link #addCustomButtons} configurations which arrived while another
	 * messagebox was still waiting for an answer, in the order in which they must
	 * still be shown.
	 *
	 * @property
	 * @type Array
	 * @private
	 */
	queuedMessageBoxes: undefined,

	/**
	 * The per browser window state of {@link Ext.MessageBox}. This messagebox is a copy
	 * of that singleton and builds its own dialog, so it needs its own collection:
	 * {@link Ext.MessageBox#getDialog} records the current dialog here, and sharing the
	 * collection overwrites the entry which {@link Ext.MessageBox#setActiveWindowMessageBox}
	 * restores from when the active browser window changes. Nothing reads the entries of
	 * this copy.
	 *
	 * @property
	 * @type Ext.util.MixedCollection
	 * @private
	 */
	browserWindowsMessageBox: new Ext.util.MixedCollection(),

	/**
	 * Initialize the {@link Ext.MessageBox.dlg Dialog}.
	 * Because the {@link Ext.MessageBox MessageBox} hides the usable
	 * interface from use, we must apply a hack to access the Dialog
	 * before it is displayed to the user.
	 *
	 * This function will add a list of {@link Ext.Component Components}
	 * to the dialog, which can be used to fine-tune the look&feel.
	 *
	 * @param {Array} items The array of items which must be added to the
	 * MessageBox.
	 * @private
	 */
	initDialog: function(items)
	{
		var dlg = this.getDialog();

		// Add a container to be able to position the items after a possible msg text
		if ( !this.dlgItemContainer ){
			this.dlgItemContainer = this.dlgItemContainer || new Ext.Container({
				border: false,
				cls: 'my-cont'
			});
			this.dlgItemContainer.render(dlg.body);
		}

		// Close a messagebox which is still open, Ext.MessageBox#show hides it only
		// after the handlers below were registered and would consume them.
		this.hide();

		this.dlgItems = items;

		// Automatically remove all items which we had added.
		// This makes sure we can use the same Dialog multiple times
		dlg.on('hide', this.onRemoveDialogItems, this, {single: true});

		// In case the 'hide' event was not fired,
		// we also listen to the destroy event as fallback.
		dlg.on('destroy', this.onRemoveDialogItems, this, {single: true});

		// Before showing the dialog, we must first
		// add all items to the dialog.
		dlg.on('show', this.onShowDialogItems, this, {single: true});
	},

	/**
	 * Add the {@link #dlgItems items} of the last {@link #initDialog} call to the
	 * {@link Ext.MessageBox messagebox}.
	 * @param {Ext.Window} dlg The window
	 * @private
	 */
	onShowDialogItems: function(dlg)
	{
		var items = this.dlgItems;

		// Take the items along, so a later hide can no longer discard the ones which
		// a following #initDialog has put there in the meantime.
		this.dlgItems = undefined;

		if(Ext.isEmpty(items)) {
			return;
		}

		this.dlgItemContainer.add(items);
		this.dlgItemContainer.doLayout();
	},

	/**
	 * Remove the items which {@link #initDialog} had added to the
	 * {@link Ext.MessageBox messagebox}.
	 * @param {Ext.Window} dlg The window
	 * @private
	 */
	onRemoveDialogItems: function(dlg)
	{
		this.dlgItemContainer.removeAll();
	},

  /**
   * Extension of {@link Ext.MessageBox.show} that adds the following configuration options:<ul>
   * <li><b>checkbox</b>: Boolean<div class="sub-desc">When set to true a checkbox will be added to the bottom
   * of the MessageBox.</div></li>
   * <li><b>checkboxLabel</b>: String<div class="sub-desc">The label of the checkbox that will be added when
   * the checkbox config option is set to true. (defaults to 'Do not show this message again')</div></li>
   * <li><b>fn</b>: Function<div class="sub-desc">A callback function which is called when the dialog is dismissed either
   * by clicking on the configured buttons, or on the dialog close button, or by pressing
   * the return button to enter input.
   * <p>Progress and wait dialogs will ignore this option since they do not respond to user
   * actions and can only be closed programmatically, so any required function should be called
   * by the same code after it closes the dialog. Parameters passed:<ul>
   * <li><b>buttonId</b>: String<div class="sub-desc">The ID of the button pressed, one of:<div class="sub-desc"><ul>
   * <li><tt>ok</tt></li>
   * <li><tt>yes</tt></li>
   * <li><tt>no</tt></li>
   * <li><tt>cancel</tt></li>
   * </ul></div></div></li>
   * <li><b>text</b>: String<div class="sub-desc">Value of the input field if either <tt><a href="#show-option-prompt" ext:member="show-option-prompt" ext:cls="Ext.MessageBox">prompt</a></tt>
   * or <tt><a href="#show-option-multiline" ext:member="show-option-multiline" ext:cls="Ext.MessageBox">multiline</a></tt> is true</div></li>
   * <li><b>checked</b>: Boolean<div class="sub-desc">Value of the checkbox field. (Will only be passed when the
   * checkbox option was set to true in the config object)</div></li>
   * <li><b>opt</b>: Object<div class="sub-desc">The config object passed to show.</div></li>
   * </ul></p></div></li>
   * </ul>
   *
   * @param {Object} config The configuration options of the the MessageBox. See above and {@link Ext.MessageBox.show}
   * for more information.
   * @return {Zarafa.common.dialogs.MessageBox} this
   */
	show: function(config)
	{
		config.title = config.title || _('grommunio Web');

		if ( config.checkbox !== true ){
			return Ext.MessageBox.show.call(this, config);
		}

		// If no checkboxState was set we will set it to false (=unchecked)
		var checkboxState = !!config.checkboxState;

		var cb = {
			xtype: 'container',
			cls: 'k-cb-dontshowagain',
			items: [{
				xtype: 'checkbox',
				ctCls: 'k-cb-dontshowagain',
				boxLabel: config.checkboxLabel || _('Do not show this message again.'),
				checked: checkboxState,
				listeners: {
					check: function(cb, checked){
						checkboxState = checked;
					}
				},
				scope: this
			}]
		};

		this.initDialog([cb]);

		// Make sure the checkbox state is also passed to the callback function
		if ( Ext.isFunction(config.fn) ){
			var origFn = config.fn;
			config.fn = function(buttonid, text, opts){
				origFn.call(this, buttonid, text, checkboxState, opts);
			}.bind(config.scope || null);
		}

		return Ext.MessageBox.show.call(this, config);
	},

	/**
	 * Displays a message box with OK and Cancel buttons prompting the user to make a selection
	 * from a list of {@link Ext.form.Radio radio} buttons.
	 * If a callback function is passed it will be called after the user
	 * clicks either button, and the id of the button that was clicked (could also be the top-right
	 * close button) and the selected {@link Ext.form.Radio radio} as the two parameters to the callback.
	 * @param {String} title The title bar text
	 * @param {String} msg The message box body text
	 * @param {Function} fn (optional) The callback function invoked after the message box is closed
	 * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the callback is executed. Defaults to the browser window.
	 * @param {Array} selections (optional) Array of configuration objects for the {@link Ext.form.Radio radios} from which the user can select.
	 * @param {String} value (optional) Default value for the {@link Ext.form.RadioGroup radiogroup}.
	 * @param {String} customButton (optional) buttons which need to show in message box. this buttons contains custom name's.
	 * @return {Zarafa.common.dialogs.RadioMessageBox} this
	 */
	select: function(title, msg, fn, scope, selections, value, customButton)
	{
		var radioGroup = Ext.create({
			xtype: 'radiogroup',
			hideLabel: true,
			style: 'padding-left: 50px;',
			columns: 1,
			items: selections,
			value: value,
			listeners: {
				change: this.onChange,
				scope: this
			}
		});
		var items = [{
			xtype: 'container',
			anchor: '100% 100%',
			items: [ radioGroup ]
		}];

		if(!Ext.isEmpty(customButton)) {
			// The items travel along with the config: this messagebox may have to wait
			// for its turn, and until then they must not be put in another one.
			this.addCustomButtons({
				title: title,
				msg: msg + '<br />',
				minWidth: this.minPromptWidth,
				maxWidth: 250,
				scope: scope,
				fn: fn,
				prompt: false,
				value: value,
				customButton: customButton,
				radioGroup: radioGroup,
				dlgItems: items
			});
		} else {
			this.initDialog(items);
			this.show({
				title: title,
				msg: msg + '<br />',
				buttons: Ext.MessageBox.OKCANCEL,
				fn: function(button) {
					Ext.callback(fn, scope || window, [button, radioGroup.getValue()], 1);
				},
				minWidth: this.minPromptWidth,
				maxWidth: 250,
				scope: scope,
				prompt: false,
				value: value
			});
		}
		return this;
	},

	/**
	 * Event handler triggered when radio button of {@link #select} message box
	 * gets changed.
	 *
	 * @param {Ext.form.RadioGroup} radioGroup the radioGroup which triggers this event.
	 * @param {Ext.form.Radio} radio the radio which listen the event.
	 */
	onChange: function (radioGroup, radio) {
		if(radio.hideButtonText) {
			var fbar = this.getDialog().getFooterToolbar();
			var btn = fbar.find('name', radio.hideButtonText)[0];
			if(Ext.isDefined(btn)) {
				btn.setText(Ext.util.Format.capitalize(radio.showButtonText));
				btn.name = radio.showButtonText;
			}
		}
	},

	/**
	 * Display {@link Ext.MessageBox messagebox} with custom buttons.
	 * @param {Object} config The config contains the configuration
	 * options of message box as wall as custom buttons.
	 */
	addCustomButtons: function(config)
	{
		// There is only one dialog to show this in, so a messagebox which is still
		// waiting for an answer must not be replaced: its question would be gone and
		// its caller would never hear back. Line up behind it instead.
		if(this.isVisible() || !Ext.isEmpty(this.queuedMessageBoxes)) {
			this.queuedMessageBoxes = this.queuedMessageBoxes || [];
			this.queuedMessageBoxes.push(config);
			return;
		}

		this.showCustomButtons(config);
	},

	/**
	 * Display the {@link Ext.MessageBox messagebox} for a {@link #addCustomButtons}
	 * configuration. Only called when no other messagebox is on screen.
	 * @param {Object} config The configuration of the message box and its custom buttons
	 * @private
	 */
	showCustomButtons: function(config)
	{
		// A #select messagebox brings its own items, which are added when the dialog is
		// shown, so they must be registered before it is.
		if(!Ext.isEmpty(config.dlgItems)) {
			this.initDialog(config.dlgItems);
		}

		var dlg = this.getDialog();

		// Close a messagebox which is still open, Ext.MessageBox#show hides it only
		// after we added our buttons and would then remove those instead of its own.
		this.hide();
		this.removeCustomButtons(dlg);

		var buttons = dlg.getFooterToolbar().add(config.customButton);
		Ext.each(buttons, function(button) {
			button.isCustomButton = true;
		});
		// #show wraps config.fn when a checkbox was requested, so the handlers
		// can only be created after it.
		this.show(config);

		Ext.each(buttons, function(button) {
			var args = [];
			args.push(config.fn);
			if(Ext.isDefined(config.radioGroup)) {
				args.push(config.radioGroup);
			}
			button.customButtonHandler = Ext.createDelegate(this.onButtonClick, config.scope, args, true);
			dlg.mon(button, 'click', button.customButtonHandler, this);
		}, this);

		dlg.on('hide', this.onDestroy, this, {single: true});
		dlg.on('destroy', this.onDestroy, this, {single: true});
		dlg.on('hide', this.onDialogHidden, this);
	},

	/**
	 * Event handler which is triggered whenever the {@link Ext.MessageBox messagebox} is
	 * hidden. Hands the dialog over to the next messagebox which is waiting for it.
	 * @private
	 */
	onDialogHidden: function()
	{
		if(Ext.isEmpty(this.queuedMessageBoxes)) {
			return;
		}

		// Let the callback of the messagebox which was just answered run first, it may
		// well want to show a messagebox of its own.
		this.showQueuedMessageBox.defer(1, this);
	},

	/**
	 * Show the next {@link #queuedMessageBoxes queued} messagebox, unless something else
	 * claimed the dialog in the meantime. The hide of that one brings us back here.
	 * @private
	 */
	showQueuedMessageBox: function()
	{
		if(this.isVisible() || Ext.isEmpty(this.queuedMessageBoxes)) {
			return;
		}

		this.showCustomButtons(this.queuedMessageBoxes.shift());
	},

	/**
	 * Event handler triggered when custom button is clicked.
	 * it will hide the {@link Ext.MessageBox messagebox}.
	 * @param {Ext.Button} button The button which user pressed.
	 * @param {Ext.EventObject} event the event object
	 * @param {Function} callback The callback function to call when button is pressed.
	 * @param {Ext.form.RadioGroup} radioGroup The radioGroup contains if message box triggered from {@link #select} message box.
	 */
	onButtonClick: function(button, event, callback, radioGroup)
	{
		var buttonName = button.name || 'cancel';
		Zarafa.common.dialogs.MessageBox.hide();
		if(radioGroup) {
			callback.call(this, buttonName, radioGroup.getValue());
		} else {
			callback.call(this, buttonName);
		}
	},

	/**
	 * Event handler which is triggered when {@link Ext.MessageBox messagebox} gets hide.
	 * also it will remove all custom buttons from message box.
	 * @param {Ext.Window} dlg The window
	 */
	onDestroy: function(dlg)
	{
		this.removeCustomButtons(dlg);
	},

	/**
	 * Remove the buttons which {@link #addCustomButtons} had added to the footer of
	 * the given dialog. The buttons are looked up in the toolbar itself, so buttons
	 * which were left behind by an earlier messagebox are removed as well.
	 * @param {Ext.Window} dlg The window
	 * @private
	 */
	removeCustomButtons: function(dlg)
	{
		var fbar = dlg.getFooterToolbar();

		fbar.items.each(function(button) {
			if(button.isCustomButton !== true) {
				return;
			}

			if(button.customButtonHandler) {
				dlg.mun(button, 'click', button.customButtonHandler, this);
			}
			fbar.remove(button);
		}, this);
	}
}, Ext.MessageBox);
