/*-------------------------------------------------------------------
 Ext.ux.form.TinyMCETextArea

 ExtJS form field - a text area with integrated TinyMCE WYSIWYG Editor

 Version: 4.0.1
 Release date: 17.12.2013
 ExtJS Version: 4.2.1
 TinyMCE Version: 4.0.11
 License: LGPL v2.1 or later, Sencha License

 Author: Oleg Schildt
 E-Mail: Oleg.Schildt@gmail.com

 Copyright (c) 2013 Oleg Schildt

 Enhanced by Steve Drucker (sdrucker@figleaf.com):
 ExtJS Version: 4.2.1
 TinyMCE Version: 4.0.20

 Re-Enhanced by Bhavin Bathani (bhavin.gir@gmail.com):
 ExtJS Version: 3.4
 TinyMCE Version: 4.1.0

 Following issues are covered:

 - Make the whole class compitible with ExtJS Version 3.4
 - Avoid using callparent function.
 - Using the way for inherit class which is supported in ExtJS Version 3.4
 - Avoid uaing 'alias' config to declare xtype.
 - add 'getInputId' function.
 - 'withEd' function is added to reschedule function call after editor will be initialized.
 - 'getEditor' function is added to reduce code duplication to get the editor instance.
 - 'insertAtCursor' function is added.
 - Enabling and disabling of the WYSIWYG editor controls without reinitialize the whole editor.
 - Removed all the configuration overhead for tinymce plugin inclusion.
 - Proper API code commenting is followed for better understanding.
 -------------------------------------------------------------------*/

Ext.ux.form.TinyMCETextArea = Ext.extend(Ext.form.TextArea, {
	/**
	 * Flag for tracking the initialization state.
	 * @property
	 * @type Boolean
	 */
	wysiwygIntialized: false,

	/**
	 * Indicates if the initialization of this editor is in progress.
	 * @property
	 * @type Boolean
	 */
	intializationInProgress: false,

	/**
	 * The height of the editor applied previously.
	 * @property
	 * @type Number
	 */
	lastHeight: null,

	/**
	 * The height of the editor iframe applied previously.
	 * @property
	 * @type Number
	 */
	lastFrameHeight: null,

	/**
	 * This properties enables starting without WYSIWYG editor.
	 * The user can activate it later if he wants.
	 * @property
	 * @type Boolean
	 */
	noWysiwyg: false,

	/**
	 * @cfg {Object} tinyMCEConfig Configuration object for the TinyMCE configuration options
	 */
	tinyMCEConfig: {},

	/**
	 * This property holds the editor instance.
	 * @property
	 * @type Object
	 */
	editor : undefined,

	/**
	 * @cfg {Boolean} disabled Render this component disabled (default is false).
	 */
	disableEditor : false,

	/**
	 * This property holds the window object which is the owner of the selector element.
	 * @property
	 * @type HTMLElement
	 */
	editorOwnerWindow : undefined,

	/**
	 * @constructor
	 * @param {Object} config The configuration options.
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			hideMode: 'offsets'
		});

		// Apply some required tinymce config
		Ext.applyIf(config.tinyMCEConfig, {
			hideMode: 'offsets',
			mode : 'exact',
			resize : false
		});

		Ext.ux.form.TinyMCETextArea.superclass.constructor.call(this, config);
	},

	/**
	 * Helper function provides the owner window object.
	 * @return {HTMLElement} the window object which contains the selector element.
	 * @private
	 */
	getEditorOwnerWindow : function()
	{
		if(Ext.isDefined(this.editorOwnerWindow)) {
			return this.editorOwnerWindow;
		} else {
			// There might be more than one browser window, and we are using tinymce environment loaded saperatly
			// in respective browser window. So it is mendatory to use global object of currently active window to
			// initialize and render the editor instance into respective browser window.
			var selectorElement = Ext.getDom(this.getInputId());
			var browserWindow = selectorElement ? selectorElement.ownerDocument.defaultView : undefined;
			return this.editorOwnerWindow = browserWindow;
		}
	},

	/**
	 * Function called after the editor has been rendered
	 * @private
	 */
	afterRender: function()
	{
		var me = this;

		Ext.ux.form.TinyMCETextArea.superclass.afterRender.call(this, arguments);

		// Rendering is completed, now the target textarea element is available which is required to create TinyMce editor.
		this.initEditor();

		me.on('blur', function(elm, ev, eOpts) {
			var ctrl = document.getElementById(me.getInputId());

			if (me.wysiwygIntialized) {
				var ed = me.getEditor();

				// In the HTML text modus, the contents should be
				// synchronized upon the blur event.
				if (ed && ed.isHidden()) {
					if (ctrl) {
						me.positionBeforeBlur = {
							start: ctrl.selectionStart,
							end: ctrl.selectionEnd
						};
					}

					ed.load();
				}
			} else {
				if (ctrl) {
					me.positionBeforeBlur = {
						start: ctrl.selectionStart,
						end: ctrl.selectionEnd
					};
				}
			}
		}, me);

		// Synchronize the tinymce editor height whenever base-textarea gets resized.
		me.on('resize', function(elm, width, height, oldWidth, oldHeight, eOpts) {
			me.syncEditorHeight(height);
		}, me);
	},

	/**
	 * Sets the height of the editor iframe.
	 * The toolbar/menubar/statusbar height needs to be subtracted from
	 * total height to find out the iframe height.
	 * @param {Mixed} height The new height to set.
	 * @private
	 */
	syncEditorHeight: function(height)
	{
		var me = this;

		me.lastHeight = height;

		// if the editor is not initialized/ rendered than simply return.
		if (!me.wysiwygIntialized || !me.rendered) {
			return;
		}

		// There is multiple tinymce editors loaded in multiple browser windows, Use global object of currently
		// active window to get the editor instance.
		var browserWindow = me.getEditorOwnerWindow();
		var ed = browserWindow.tinymce.get(me.getInputId());

		// if the editor is not available at all than simply return.
		if(!ed){
			return;
		}

		// if the editor is hidden, we do not synchronize
		// because the size values of the hidden editor are calculated wrong.
		if (ed.isHidden()) {
			return;
		}

		var edIframe = Ext.get(ed.iframeElement);
		var parent = edIframe.up(".mce-edit-area");
		parent = parent.up(".mce-container-body");

		var newHeight = height;

		var edToolbar = parent.down(".mce-toolbar-grp");
		if (edToolbar)
			newHeight -= edToolbar.getHeight();

		var edMenubar = parent.down(".mce-menubar");
		if (edMenubar)
			newHeight -= edMenubar.getHeight();

		var edStatusbar = parent.down(".mce-statusbar");
		if (edStatusbar)
			newHeight -= edStatusbar.getHeight();

		me.lastFrameHeight = newHeight - 3;

		edIframe.setHeight(newHeight - 3);
	},

	/**
	 * If ed (local editor instance) is already initialized, calls specified function directly.
	 * Otherwise reschedule that particular function call on {@link tinymce.Editor.init init} event.
	 * @param {Function} func The function definition which is to be called while editor is completely ready.
	 * @private
	 */
	withEd: function(func)
	{
		var me = this;
		var ed = this.getEditor();

		// check If editor instance is available or not
		if (ed){
			// if editor is created but not initialized then reschedule the function call on init event.
			if(!ed.initialized){
				ed.on("init", function() { me.withEd(func); }, me);
			} else if(ed.initialized){
				me.editor = ed;
				func.call(me);
			}
		}
	},

	/**
	 * @return {String} Returns the input id for this field. If none was specified via the {@link #inputId} config,
	 * then an id will be automatically generated.
	 */
	getInputId: function()
	{
		return this.inputId || (this.inputId = this.id);
	},

	/**
	 * Method to determine whether this Component is currently disabled.
	 * @return {Boolean} the disabled state of this Component.
	 */
	isDisabled : function()
	{
		return this.disabled;
	},

	/**
	 * Inserts the passed text at the current cursor position. The editor must be initialized
	 * to insert text.
	 * @param {String} value Text which needs to be inserted
	 */
	insertAtCursor: function(value)
	{
		// Call tiny MCE insert content function
		var ed = this.getEditor();
		ed.execCommand('mceInsertContent', false, value);
		ed.undoManager.clear();
	},

	/**
	 * Initialized the editor.
	 * Assign necessary {@link #tinyMCEConfig} options and register necessary events to handle content
	 * and height of editor.
	 * Will call {@link tinymce.Editor.init init} method to setup iframe and create theme and plugin instances.
	 * @private
	 */
	initEditor: function()
	{
		var me = this;

		if (me.noWysiwyg || me.intializationInProgress || me.wysiwygIntialized) {
			return;
		}

		me.intializationInProgress = true;

		me.tinyMCEConfig.selector = 'textarea#' + me.getInputId();

		if (me.lastFrameHeight) {
			me.tinyMCEConfig.height = me.lastFrameHeight;
		} else {
			me.tinyMCEConfig.height = 30;
		}

		// We have to override the setup method of the TinyMCE.
		// If the user has define own one, we shall not loose it.
		// Store it and call it after our specific actions.
		var user_setup = null;

		if (me.tinyMCEConfig.setup) {
			user_setup = me.tinyMCEConfig.setup;
		}

		// BEGIN: setup
		me.tinyMCEConfig.setup = function(ed) {

			if(!Ext.isDefined(me.editor)) {
				me.editor = ed;
			}

			var editorWindow = me.getEditorOwnerWindow();
			// Themes will dynamically load their stylesheets into the DOM.
			// We will overwrite the loadCSS function to add listeners for
			// the loading. This way we make sure that all css has been loaded
			// before we resize the editor.
			var origTinymceDOMloadCSS = editorWindow.tinymce.DOM.loadCSS;
			// We will store the urls of all stylesheets that are loading in this array
			var cssFilesLoading = [];

			editorWindow.tinymce.DOM.loadCSS = function(url){
				if (!url) {
					url = '';
				}

				Ext.each(url.split(','), function(url){
					if ( Ext.isEmpty(url) ){
						return;
					}
					// Store the url in the array, so we can check if we are still
					// loading css files
					cssFilesLoading.push(url);
					// Create an element to load the stylesheet
					var el = editorWindow.document.createElement('link');
					// Add the element to the DOM, or it will not fire events
					editorWindow.document.head.appendChild(el);
					// Add a handler for the load event
					el.addEventListener('load', function(){
						// Remove the url from the array
						cssFilesLoading.splice(cssFilesLoading.indexOf(url), 1);
						// Remove the element from the DOM because tiny will have added it also
						// and we don't need it twice
						editorWindow.document.head.removeChild(el);
						me.fireEvent('stylesheetloaded', url);
					});
					// Add a handler for the error event
					el.addEventListener('error', function(){
						// Remove the url from the array
						cssFilesLoading.splice(cssFilesLoading.indexOf(url), 1);
						me.fireEvent('stylesheetloaded', url);
					});
					el.setAttribute('rel', 'stylesheet');
					el.setAttribute('type', 'text/css');
					el.setAttribute('href', url);

				});

				return origTinymceDOMloadCSS.apply(this, arguments);
			};

			ed.on('init', function(e) {
				// Restore the original loadCSS function
				editorWindow.tinymce.DOM.loadCSS = origTinymceDOMloadCSS;

				me.wysiwygIntialized = true;
				me.intializationInProgress = false;

				if (me.disableEditor || me.isDisabled()) {
					me.disable();
				}

				me.fireEvent('initialized', me, ed, {});

				// A wrapper function for syncEditorHeight(). It will check
				// if all css has been loaded before calling syncEditorHeight()
				function setEditorHeight(){
					if ( cssFilesLoading.length>0 ){
						me.on('stylesheetloaded', function(){
							setEditorHeight();
						}, this);
					} else {
						me.syncEditorHeight(me.lastHeight || me.height);
					}
				}

				if (me.lastHeight || me.height) {
					setEditorHeight();
				}
			});

			if (user_setup) {
				user_setup(ed);
			}
		};

		var editorWindow = me.getEditorOwnerWindow();
		editorWindow.tinymce.init(me.tinyMCEConfig);

		me.intializationInProgress = false;
		me.wysiwygIntialized = true;
	},

	/**
	 * Retrieves the editor instance if the value of {@link #editor} property is empty.
	 * @return {Object} the editor instance.
	 */
	getEditor: function()
	{
		// There is multiple tinymce editors loaded in multiple browser windows, Use global object of currently
		// active window to get the editor instance.
		var editorWindow = this.getEditorOwnerWindow();
		return editorWindow ? editorWindow.tinymce.get(this.getInputId()) : undefined;
	},

	/**
	 * Returns true/false if the editor is hidden or not.
	 * @return {Boolean} the hidden state of an editor.
	 */
	isEditorHidden: function()
	{
		var me = this;

		if (!me.wysiwygIntialized) {
			return true;
		}

		var ed = me.getEditor();
		if (!ed) {
			return true;
		}

		return ed.isHidden();
	},

	/**
	 * Shows the editor and call {@link #initEditor} method if the editor is not initialized.
	 */
	showEditor: function()
	{
		var me = this;

		me.storedCursorPosition = null;

		if (!me.wysiwygIntialized) {
			me.noWysiwyg = false;
			me.initEditor();
			return;
		}

		var ed = me.getEditor();
		if (!ed) {
			return;
		}

		ed.show();

		ed.nodeChanged();

		if (me.lastHeight) {
			me.syncEditorHeight(me.lastHeight);
		}
	},

	/**
	 * Hides the editor.
	 */
	hideEditor: function()
	{
		var me = this;

		if (!me.wysiwygIntialized) {
			return;
		}

		var ed = me.getEditor();
		if (!ed) {
			return;
		}

		var node = ed.selection.getNode();

		if (!node || node.nodeName === "#document" || node.nodeName === "BODY" || node.nodeName === "body") {
			ed.hide();

			return;
		}

		// otherwise try to position the cursor

		var marker = '<a id="_____sys__11223___"></a>';
		ed.selection.collapse(true);
		ed.execCommand('mceInsertContent', 0, marker);

		ed.hide();

		var ctrl = document.getElementById(me.getInputId());

		var pos = -1;
		var txt = "";

		if (ctrl) {
			txt = ctrl.value;
			pos = txt.indexOf(marker);
		}

		if (pos !== -1) {
			var re = new RegExp(marker, "g");
			txt = txt.replace(re, "");
			ctrl.value = txt;

			if (ctrl.setSelectionRange) {
				ctrl.focus();
				ctrl.setSelectionRange(pos, pos);
			}
		}
	},

	/**
	 * Shows/Hides the editor, will call {@link #hideEditor} or {@link #showEditor}.
	 */
	toggleEditor: function()
	{
		var me = this;

		if (!me.wysiwygIntialized) {
			me.showEditor();
			return;
		}

		var ed = me.getEditor();

		if (ed.isHidden()) {
			me.showEditor();
		} else {
			me.hideEditor();
		}
	},

	/**
	 * Destroys the editor instance by removing all events, element references.
	 * @return {Object} me the current scope or container instance.
	 */
	removeEditor: function()
	{
		var me = this;

		if (me.intializationInProgress) {
			return me;
		}

		if (!me.wysiwygIntialized) {
			return me;
		}

		var ed = me.getEditor();
		if (ed) {
			ed.save();
			ed.destroy(false);
		}

		me.wysiwygIntialized = false;

		return me;
	},

	/**
	 * Sets a data value into the field and runs the validation.
	 * @param {String} v The value to set
	 * @return {String} Value which was set
	 */
	setValue: function(v)
	{
		var me = this;

		if (me.wysiwygIntialized) {
			// The editor does some preformatting of the HTML text
			// entered by the user.
			// The method setValue sets the value of the textarea.
			// We have to load the text into editor for the
			// preformatting and then to save it back to the textarea.
			if (this.value !== v) {
				this.value = v;
				if (this.rendered) {
					var ed = me.getEditor();
					if(!ed){
						// There is multiple tinymce editors loaded in multiple browser windows,
						// Use global object of currently active window to register AddEditor event.
						var editorGlobalInstance = me.getEditorOwnerWindow().tinymce;
						editorGlobalInstance.EditorManager.on("AddEditor", function() {
							me.withEd(function(){
								var ed = me.getEditor();
								// if selected editor is dirty then dont call setContent function.
								if(!ed.isDirty()) {
									me.setContent(ed, v);
								}
							});
						}, this);
					} else {
						me.setContent(ed, v);
					}
				}
			}
		}
		return this.value;
	},

	/**
	 * Function is used to set the content in HTML Editor.
	 * @param {Object} editor the HTML Editor Object
	 * @param {String} value the value which is going to set in editor.
	 */
	setContent : function(editor, value)
	{
		editor.setContent(value === null || value === undefined ? '' : value, { format: 'raw' });
		editor.startContent = editor.getContent({ format: 'raw' });
	},

	/**
	 * Returns the current data value of the editor.
	 * @return {String} v The field value
	 */
	getValue: function(some)
	{
		var ed = this.getEditor();
		if(!ed){
			return;
		}
		if(!this.rendered || !ed.initialized )
			return Ext.value( this.value, '' );

		var v = ed.getContent();
		if( v === this.emptyText || v === undefined ){
			v = '';
		}
		return v;
	},

	/**
	 * Returns the raw data value which may or may not be a valid, defined value.
	 * @return {Mixed} v The field value
	 */
	getRawValue : function(){

		var ed = this.getEditor();
		if(!ed){
			return;
		}

		if( !this.rendered || !ed.initialized )
			return Ext.value( this.value, '' );

		var v = ed.getContent({format : 'raw'});
		if(v === this.emptyText){
			v = '';
		}
		return v;
	},

	/**
	 * Initializes the field's value based on the initial config.
	 */
	initValue: function()
	{
		if (!this.rendered)
			Ext.ux.TinyMCE.superclass.initValue.call(this);
		else {
			if (this.value !== undefined) {
				this.setValue(this.value);
			}
			else {
				var v = this.getEl().value;
				if ( v )
					this.setValue( v );
			}
		}
	},

	/**
	 * Focuses/activates the editor. This will set this editor as the activeEditor in the tinymce collection.
	 * If the editor is not initialized yet than Try to focus this component.
	 * @param {Boolean} selectText (optional) If applicable, true to also select the text in this component.
	 * @param {Boolean/Number} delay (optional) Delay the focus this number of milliseconds (true for 10 milliseconds)
	 * @return {Ext.Component} me
	 */
	focus: function(selectText, delay)
	{
		var me = this;

		if (me.isDisabled()) {
			return me;
		}

		if (delay) {
			if (isNaN(delay)) {
				delay = 10;
			}

			setTimeout(function() {
				me.focus.call(me, selectText, false);
			}, delay);
			return me;
		}

		if (!me.wysiwygIntialized) {
			return Ext.ux.form.TinyMCETextArea.superclass.focus.call(this, arguments);
		}

		var ed = me.getEditor();

		if (ed && !ed.isHidden()) {
			Ext.ux.form.TinyMCETextArea.superclass.focus.call(this, arguments);

			ed.focus();
		} else {
			return Ext.ux.form.TinyMCETextArea.superclass.focus.call(this, arguments);
		}

		return me;
	},

	/**
	 * Enable this component.
	 * @return {Ext.Component} this
	 */
	enable: function()
	{
		var me = this;
		var result  = Ext.ux.form.TinyMCETextArea.superclass.enable.call(this, arguments);

		if (!result) {
			return result;
		}

		var ed = me.getEditor();
		if(ed) {
			ed.theme.panel.find('*').disabled(false);
			this.getEditorBody().setAttribute('contenteditable', true);
		}

		return me;
	},

	/**
	 * Disable this component.
	 * @param {Boolean} silent true to prevent fire 'disable' event
	 * @return {Ext.Component} this
	 */
	disable: function(silent)
	{
		var me = this;
		var result = Ext.ux.form.TinyMCETextArea.superclass.disable.call(this, arguments);

		if (!result) {
			return result;
		}

		var ed = me.getEditor();
		if(ed) {
			ed.theme.panel.find('*').disabled(true);
			this.getEditorBody().setAttribute('contenteditable', false);
		}

		return me;
	},

	/**
	 * Hide this component.
	 * @return {Ext.Component} this
	 */
	hide: function()
	{
		var me = this;

		Ext.ux.form.TinyMCETextArea.superclass.hide.call(this, arguments);

		var ed = me.getEditor();
		if(ed){
			ed.hide();
		} else {
			// There are multiple tinymce editors loaded in multiple browser windows,
			// Use global object of currently active window to register AddEditor event.
			var editorGlobalInstance = me.getEditorOwnerWindow().tinymce;
			editorGlobalInstance.EditorManager.on("AddEditor", function() {
				me.withEd(function() {
					var ed = me.getEditor();
					ed.hide();
				});
			}, this);
		}

		return me;
	},

	/**
	 * Show this component.
	 * @return {Ext.Component} this
	 */
	show: function()
	{
		var me = this;

		Ext.ux.form.TinyMCETextArea.superclass.show.call(this, arguments);

		var ed = me.getEditor();
		if(ed){
			ed.show();
		}

		return me;
	},

	/**
	 * Keep bookmark location for the current selection in a class property named into {@link #storedCursorPosition}.
	 * which can be used to restore the selection after some content modification to the document.
	 */
	storeCurrentSelection: function()
	{
		var me = this;

		var wwg_mode = false;

		var ed = me.getEditor();

		if (me.wysiwygIntialized) {
			if (ed && !ed.isHidden()) {
				wwg_mode = true;
			}
		}

		var ctrl = document.getElementById(me.getInputId());

		if (wwg_mode) {
			me.storedCursorPosition = ed.selection.getBookmark('simple');
		} else if (ctrl) {
			me.storedCursorPosition = me.positionBeforeBlur;
		}
	},

	/**
	 * Restores the selection to the specified bookmark stored into {@link #storedCursorPosition} property.
	 */
	restoreCurrentSelection: function()
	{
		var me = this;

		if (!me.storedCursorPosition) {
			return;
		}

		var wwg_mode = false;

		var ed = me.getEditor();

		if (me.wysiwygIntialized) {
			if (ed && !ed.isHidden()) {
				wwg_mode = true;
			}
		}

		var ctrl = document.getElementById(me.getInputId());

		if (wwg_mode) {
			ed.selection.moveToBookmark(me.storedCursorPosition);
		} else if (ctrl) {
			ctrl.setSelectionRange(me.storedCursorPosition.start, me.storedCursorPosition.end);
		}
	},

	/**
	 * Insert text at the cursor position by executing 'mceInsertContent' tinymce command
	 * if the editor is initialized and not hidden. Otherwise, it will get the size of
	 * existing content up till the cursor position of the editor and append the text.
	 * @param {String} txt the text which needs to be inserted
	 */
	insertText: function(txt)
	{
		var me = this;

		var wwg_mode = false;

		var ed = me.getEditor();

		if (me.wysiwygIntialized) {
			if (ed && !ed.isHidden()) {
				wwg_mode = true;
			}
		}

		var ctrl = document.getElementById(me.getInputId());

		if (wwg_mode) {
			ed.focus();
			ed.execCommand('mceInsertContent', 0, txt);
		} else if (ctrl) {
			ctrl.focus();

			var start = ctrl.selectionStart + txt.length;

			ctrl.value = ctrl.value.slice(0, ctrl.selectionStart) + txt + ctrl.value.slice(ctrl.selectionEnd);

			ctrl.setSelectionRange(start, start);
		}
	}
});
Ext.reg('zarafa.tinymcetextarea', Ext.ux.form.TinyMCETextArea);
