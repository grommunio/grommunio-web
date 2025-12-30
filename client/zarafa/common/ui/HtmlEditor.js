/*
 * #dependsFile client/zarafa/mail/data/ActionTypes.js
 */
Ext.namespace("Zarafa.common.ui");

/**
 * @class Zarafa.common.ui.HtmlEditor
 * @extends Ext.ux.form.TinyMCETextArea
 * @xtype zarafa.htmleditor
 *
 * Our HtmlEditor is a simple override of the TinyMCE provided HtmlEditor.
 * It automatically enables all buttons which are needed within Zarafa, and adds
 * plugins to extend the HtmlEditor with additional features.
 * The toolbar is extended with the overflow option, which moves all buttons
 * which do not fit within the length of the toolbar to a new popup menu at
 * the right position of the toolbar.
 */
Zarafa.common.ui.HtmlEditor = Ext.extend(Ext.ux.form.TinyMCETextArea, {
	/**
	 * defaultFontFamily The default font family set by the user.
	 * @property
	 * @type String
	 */
	defaultFontFamily: undefined,

	/**
	 * defaultFontSize The default font size set by the user.
	 * @property
	 * @type String
	 */
	defaultFontSize: undefined,

	/**
	 * Reference to the document inside the TinyMCE iframe for event cleanup.
	 * @property
	 * @type Document
	 */
	editorDoc: null,

	/**
	 * @constructor
	 * @param config configuration object
	 * @cfg enableOverflow set {@link Ext.Toolbar.enableOverflow enableOverflow} on the toolbar.
	 */
	constructor: function(config)
	{
		config = config || {};
		// Get supported font families
		var fontFamilies = Zarafa.common.ui.htmleditor.Fonts.getFontFamilies();

		var baseUrl = container.getServerConfig().getBaseUrl();
		const cacheBuster = "8.1.2.369";

		var themeIsDark = container.getSettingsModel().get("zarafa/v1/main/active_theme") === "dark";

		this.defaultFontFamily = container.getSettingsModel().get("zarafa/v1/main/default_font");
		this.defaultFontSize = Zarafa.common.ui.htmleditor.Fonts.getDefaultFontSize();
		config = Ext.applyIf(config, {
			xtype: "zarafa.tinymcetextarea",
			hideLabel: true,
			hideMode: "offsets",
			readOnly: false,
			tinyMCEConfig: {
				delta_height: 1,
				plugins: "autolink directionality image link emoticons media charmap anchor lists advlist quickbars searchreplace visualchars table officepaste",
				quickbars_insert_toolbar: false,
				cache_suffix: "?version=" + cacheBuster,
				link_assume_external_targets: true,
				toolbar: "undo redo | fontfamily fontsizeinput bold italic underline strikethrough | backcolor forecolor removeformat | bullist numlist outdent indent align lineheight | ltr rtl | subscript superscript | link anchor image media table | charmap emoticons | searchreplace",
				quickbars_selection_toolbar: "fontsizeinput | bold italic underline strikethrough | backcolor forecolor removeformat | quicklink blockquote quickimage quicktable",
				toolbar_mode: "sliding",
				paste_data_images: true,
				automatic_uploads: false,
				remove_trailing_brs: false,
				font_family_formats: fontFamilies,
				font_size_input_default_unit: "pt",
				browser_spellcheck: true,
				valid_elements: '*[*]',
				extended_valid_elements: 'img[src|data-mce-src|alt|width|height],p[class|style],span[class|style],a[href|style],*[*]',
				valid_children: '+body[p],+p[span|a|b|strong|i|em|u|#text]',
				paste_as_text: false,
				width: "100%",
				menubar: false,
				contextmenu: false,
				statusbar: false,
				skin: themeIsDark ? "oxide-dark" : "oxide",
				content_css: themeIsDark ? "dark" : "default",
				branding: false,
				relative_urls: false,
				remove_script_host: false,
				forced_root_block: 'P',
				forced_root_block_attrs: {
					'style': 'padding: 0; margin: 0; '
				},
				content_style: "body{ " + "word-wrap: break-word; margin: 1rem !important;" + "}",
				setup: function(editor) {
					editor.on("PostProcess", function (e) {
						if (e.get) {
							e.content = inlineCSS(e.content);
						}
					});
				}
			}
		});

		// Set the correct language for tinymce
		var lang = container.getSettingsModel().get("zarafa/v1/main/language", true);
		var tinyLanguageCode = Zarafa.common.ui.htmleditor.LanguageMap.getTinyLanguageCode(lang);
		if (!Ext.isEmpty(tinyLanguageCode) && tinyLanguageCode !== "en_GB" && tinyLanguageCode !== "en_US") {
			config.tinyMCEConfig.language = tinyLanguageCode;
			config.tinyMCEConfig.language_url = baseUrl + "client/tinymce-languages/" + tinyLanguageCode + ".js";
		}

		// Give plugins the option to change the tinyMCE configuration
		container.populateInsertionPoint("common.htmleditor.tinymceconfig", {
			scope: this,
			config: config.tinyMCEConfig
		});

		this.addEvents(
		/**
		 * @event valuecorrection
		 * Fires after {@link #setValue} has been called, and the given value has been
		 * formatted by the browser or tinymce. This allows the user of this component
		 * to better determine what the user-made changes were.
		 * @param {Zarafa.common.ui.HtmlEditor} this The component which fired the event
		 * @param {String} correctedValue The new (by browser corrected) value
		 * @param {String} originalValue The value as set by the caller of setValue
		 */
		"valuecorrection",
		/**
		 * @event dblclick
		 * Fired when the user double clicks inside the editor content.
		 */
		"dblclick");

		Zarafa.common.ui.HtmlEditor.superclass.constructor.call(this, config);

		this.on("initialized", this.onEditorInitialized, this);
		this.on("beforedestroy", this.onBeforeDestroy, this);
	},

	/**
	 * Function is called when the tinymce editor is initialized.
	 * @param {Zarafa.common.ui.HtmlEditor} htmlEditor The editor which is initialized.
	 * @param {tinymce.Editor} tinymceEditor The tinymce editor instance
	 * @private
	 */
	onEditorInitialized: function(htmlEditor, tinymceEditor)
	{
		var server = container.getServerConfig();
		var clientTimeout = server.getClientTimeout();

		if (clientTimeout) {
			this.setIdleTimeEventListeners();
		}

		tinymceEditor.on("keydown", this.onKeyDown.createDelegate(this), this);
		tinymceEditor.on("mousedown", this.relayIframeEvent.createDelegate(this), this);

		var doc = tinymceEditor.getDoc();
		Ext.EventManager.on(doc, 'click', this.onEditorClick, this);
		Ext.EventManager.on(doc, 'dblclick', this.onEditorDocDblClick, this);
		this.editorDoc = doc;

		if (Ext.isGecko) {
			tinymceEditor.on("dblclick", this.onDBLClick.createDelegate(this));
			if (container.mainPanel) {
				var contentPanel = container.getTabPanel();
				this.mon(contentPanel, "beforetabchange", this.onBeforeTabChange, this);
			}
		}

		var listeners = {
			blur: this.onBlur,
			focus: this.onFocus,
			scope: this
		};

		Ext.EventManager.on(this.getEditor().getWin(), listeners);
		tinymceEditor.on("focus", this.onFocus.createDelegate(this), this);
		tinymceEditor.on("blur", this.onBlur.createDelegate(this), this);

		// Apply default formatting after initialization
		this.applyFontStyles();
		this.addDefaultFormatting();
	},

	isHtmlEditor: function()
	{
		return true;
	},

	/**
	 * Set event listeners on the iframe that will reset the
	 * {@link Zarafa#idleTime idle time} when the user performs
	 * an action in the iframe (i.e. click, mousemove, keydown)
	 * @private
	 */
	setIdleTimeEventListeners: function()
	{
		var doc = this.getEditorDocument();
		if (!doc.addEventListener) {
			/**
			 * Client timeout will still be handled by the backend though,
			 * but the message will only be shown to the user when he tries to
			 * connect to the backend after the session has timed out.
			*/
			return;
		}
		doc.addEventListener("click", (function() {
			Zarafa.idleTime = 0;
		}), true);
		doc.addEventListener("mousemove", (function() {
			Zarafa.idleTime = 0;
		}), true);
		doc.addEventListener("keydown", (function() {
			Zarafa.idleTime = 0;
		}), true);
	},

	/**
	 * Event handler for the beforedestroy event
	 * The handler will call the remove function the tinyMCE editor, so it can clean up properly.
	 */
	onBeforeDestroy: function()
	{
		var editor = this.getEditor();

		if (this.editorDoc) {
			Ext.EventManager.removeListener(this.editorDoc, 'click', this.onEditorClick, this);
			Ext.EventManager.removeListener(this.editorDoc, 'dblclick', this.onEditorDocDblClick, this);
			this.editorDoc = null;
		}

		// Check if the editor was activated
		if (editor) {
			editor.remove();
		}
	},

	/**
	 * Event handler is called when fonct family combobox gets change the font type.
	 * @param {object} event the event object
	 */
	onFontFamilyChange: function(event)
	{
		this.defaultFontFamily = event.control.settings.value;
	},

	/**
	 * Event handler is called when fonct size combobox gets change the font size.
	 * @param {object} event the event object
	 */
	onFontSizeChange: function(event)
	{
		this.defaultFontSize = event.control.settings.value;
	},

	/**
	 * Function is used to execute a tinymce command to compose
	 * default formatting as a style attribute of currently selected node.
	 * @param {tinymce.Editor} editor The tinymce editor instance
	 * @private
	 */
	composeDefaultFormatting: function(editor)
	{
		editor.execCommand("FontSize", false, this.defaultFontSize, {
			skip_focus: true
		});
		editor.execCommand("FontName", false, this.defaultFontFamily, {
			skip_focus: true
		});
		this.repositionBrTag(editor);
	},

	/**
	 * Function is used to add the BR tag to inner SPAN tag of P tag and remove BR tag from P tag.
	 * it required because BR tag is used to identify the cursor location as wall as after pressing
	 * enter or pasting content in editor default formatting gets repeated in next line , to make cursor
	 * position ideal it required that BR tag must be in SPAN tag.
	 * @param {tinymce.Editor} editor The tinymce editor instance
	 */
	repositionBrTag: function(editor)
	{
		var node = editor.selection.getNode();
		editor.dom.add(node, "br");
		var parentNode = editor.dom.getParent(node, "P");
		if (parentNode && parentNode.lastChild.nodeName === "BR") {
			parentNode.removeChild(parentNode.lastChild);
		}
	},

	/**
	 * Function will set value in the editor and will call {@link #checkValueCorrection}
	 * to update tinymce's editor value into record. for more information check code/comments
	 * of {@link #checkValueCorrection}.
	 * @param {String} value The value which was being set on the editor
	 */
	setValue: function(value)
	{
		if (Ext.isEmpty(value)) {
			return;
		}
		var self = this;
		this.withEd((function() {
			var setValue = value;
			var editor = self.getEditor();
			if (editor) {
				var currentValue = editor.getContent();
				if (currentValue === value) {
					// No changes, so we don't need to update
					return;
				}
			}
			Zarafa.common.ui.HtmlEditor.superclass.setValue.call(this, setValue);
			if (self.rendered) {
				// checkValueCorrection function will be only called when editor is created and
				// initialized. Otherwise, it will it wait for that.
				self.checkValueCorrection(this, value);
			}
		}));
	},

	/**
	 * Add the default formatting before composing a new mail.
	 * @private
	 */
	addDefaultFormatting: function()
	{
		var tinymceEditor = this.getEditor();
		if (tinymceEditor.getContent({
			format: "text"
		}).trim()) {
			// Only add default formatting when there is no content
			// Otherwise is has already been added
			return;
		}
		if (!this.isDisabled() && this.record && this.record.phantom) {
			var focusedElement = document.activeElement;
			tinymceEditor.selection.setCursorLocation(tinymceEditor.getBody().firstChild, 0);
			this.composeDefaultFormatting(tinymceEditor);
			// HTML styles will be applied while selecting default values from comboboxes.
			// We need to set those styles into the record to avoid change detection in record.
			this.checkValueCorrection(this, "");
			// Remove all the undo level from tinymce, so that user can't rollback the default HTML styles.
			tinymceEditor.undoManager.clear();
		}
	},

	/**
	* Toggle read only mode for the underlying TinyMCE editor without
	* disabling the component.
	* @param {Boolean} readOnly True to make the editor read-only
	*/
	setReadOnly: function(readOnly)
	{
		this.readOnly = readOnly;
		this.withEd((function() {
			var ed = this.getEditor();
			if (ed && ed.mode && ed.mode.set) {
				ed.mode.set(readOnly ? 'readonly' : 'design');
			}
		}), this);
	},

	/**
	 * Enable this component by calling parent class {@link Ext.ux.form.TinyMCETextArea.enable enable} function.
	 * It also call the {@link #addDefaultFormatting} function to add the default formatting.
	 */
	enable: function()
	{
		if (this.disabled) {
			Zarafa.common.ui.HtmlEditor.superclass.enable.apply(this, arguments);
			var editor = this.getEditor();
			// Reset the remembered selection value to its default value, because the single instance of
			// tinymce editor is being used by composing multiple signatures. it just enabled/disabled
			// with new/updated content.
			editor.selection.lastFocusBookmark = null;
			// Apply default formatting for the signature editor.
			if (Ext.isEmpty(editor.getContent())) {
				this.addDefaultFormatting(editor);
			}
		}
	},

	/**
	 * This is called after {@link #setValue} and determines if the value has been adjusted by the tinymce.
	 * Normally the value is applied to the <iframe> element where it is being rendered, tinymce will
	 * however also apply extra formatting, and change the ordering of some attributes. Because we only
	 * want to detect when the user made changes rather then the browser, we will check here what
	 * {@link #getValue} returns and check if that is different then the value which was being set.
	 * If a difference was found, the {@link #valuecorrection} event will be fired to inform the
	 * component user that he might need to implement some workaround.
	 *
	 * @param {Zarafa.common.ui.htmleditor.HtmlEditor} editor The HTML editor
	 * @param {String} value The value which was being set on the <iframe>
	 * @private
	 */
	checkValueCorrection: function(editor, value)
	{
		var correctedValue = editor.getValue();
		if (value !== correctedValue) {
			editor.fireEvent("valuecorrection", editor, correctedValue, value);
		}
	},

	/**
	 * Function is called when double clicked in the editor.
	 * While body is empty and double click in editor then firefox consider current selection on P tag instead of Span
	 * and P tag doesn't have formatting that's way default formatting will remove.
	 * Handle above situation by setting up selection on Span tag then after fire nodechange event of editor.
	 */
	onDBLClick: function()
	{
		var editor = this.getEditor();
		var element = editor.selection.getStart();
		// tinymce used zero width space characters as character container in empty line,
		// So needs to verify body is empty or not.
		var isEmptyBody = editor.selection.getContent({
			format: "text"
		}) === "";
		if (element === editor.getBody().firstChild && isEmptyBody) {
			editor.selection.setCursorLocation(element.firstChild.firstChild, 0);
		}
	},

	/**
	 * Handle click events inside the editor and open hyperlinks while in read-only mode.
	 * @param {Object} event The click event fired by TinyMCE
	 */
	onEditorClick: function(event)
	{
		if (!event.target) {
			return;
		}

		var node = event.target;
		while (node && node.nodeName !== 'A') {
			node = node.parentNode;
		}

		if (node && node.nodeName === 'A') {
			var href = node.getAttribute('href');
			if (href) {
				if (event.preventDefault) {
					event.preventDefault();
				}
				window.open(href, '_blank');
			}
		}
	},

	/**
	* Relay double click events from the iframe document to the component.
	* @param {Object} event The DOM event
	*/
	onEditorDocDblClick: function(event)
	{
		this.fireEvent('dblclick', this, event);
	},

	/**
	 * Function is called when mouse is clicked in the editor.
	 * Editor mousedown event needs to be relayed for the document element of grommunio Web page,
	 * to hide the context-menu.
	 * wheel event propagated from underlying iframe needs to be relayed to grommunio Web document
	 * to perform zoom functionality in DeskApp.
	 * @param {Object} event The event object
	 */
	relayIframeEvent: function(event)
	{
		Ext.getDoc().fireEvent(event.type, event);
	},

	/**
	 * Function is called when any key is pressed in the editor.
	 * @param {Object} event The event object
	 */
	onKeyDown: function(event)
	{
		var editor = this.getEditor();
		if (!Zarafa.core.BrowserWindowMgr.isMainWindowActive()) {
			switch (event.keyCode) {
			  case 116:
				//F5 button
				event.returnValue = false;
				event.keyCode = 0;
				return false;

			  case 82:
				//R button
				if (event.ctrlKey) {
					event.returnValue = false;
					event.keyCode = 0;
					return false;
				}
			}
		}

		if (event.keyCode === Ext.EventObject.ENTER) {
			// Ctrl + ENTER (and CMD + ENTER on a Mac) is the shortcut for sending an item. Because
			// we do not want to add the ENTER to the content then, we stop processing the event.
			if (event.ctrlKey || Ext.isMac && event.metaKey) {
				event.preventDefault();
				return false;
			}

			// Check if we are in a blockquote, and if so break the blockquote,
			// so the user can add his comments between the blockquotes.
			var blockquote = this.inBlockquote(editor);
			if (blockquote) {
				// Prevent normal enter-behaviour as we will handle it
				event.preventDefault();
				this.handleEnterInBlockquote();
				return false;
			}

			// We will do this in a deferred function to make sure that tiny first adds the bogus BR element to empty paragraphs
			(function() {
				var node = editor.selection.getNode();
				// When we created an empty P tag by pressing ENTER we must apply default formatting to it.
				// When we already have an empty SPAN with formatting in the P tag tiny adds a BR node with the attribute
				// 'data-mce-bogus' because otherwise it is not possible to move the cursor there. Tiny will remove those
				// bogus nodes when we get the content value. But we have removed the padding and margin of P-tags,
				// resulting in empty P nodes not being visible to the user. That's why we will remove the attribute
				// 'data-mce-bogus' of the BR nodes, so tiny will not remove them.
				if (node.nodeName === "P") {
					if (!node.hasChildNodes() || node.firstChild.nodeName === "BR") {
						this.composeDefaultFormatting(editor);
					}
				} else if (node.nodeName === "SPAN" && node.hasChildNodes() && node.firstChild.nodeName === "BR") {
					// This one is for when we created an empty paragraph by pressing ENTER while on the cursor was on end of a line
					node.firstChild.removeAttribute("data-mce-bogus");
				}
				// This one is for when we created an empty paragraph by pressing ENTER while the cursor was on the begin of a
				// line that already contained text
				var pNode = node.nodeName === "P" ? node : editor.dom.getParent(node, "p");
				var prevPNode = editor.dom.getPrev(pNode, "p");
				if (prevPNode && prevPNode.hasChildNodes()) {
					if (prevPNode.firstChild.nodeName === "SPAN" && prevPNode.firstChild.hasChildNodes() && prevPNode.firstChild.firstChild.nodeName === "BR") {
						// When we have a paragraph on which we added our default formatting, there will be a SPAN
						prevPNode.firstChild.firstChild.removeAttribute("data-mce-bogus");
					} else if (prevPNode.firstChild.nodeName === "BR") {
						// When we have a plain paragraph without our crappy default formatting there will only be a BR
						prevPNode.firstChild.removeAttribute("data-mce-bogus");
					}
				}
			}).createDelegate(this).defer(1);
		}

		/*
		 * HACK: Prevent the tab event to stop moving focus out of the editor.
		 * Instead of that, Insert four spaces while user presses TAB key.
		 */
		if (event.keyCode === Ext.EventObject.TAB && !event.shiftKey) {
			var listElement = editor.dom.getParent(editor.selection.getStart(), "LI,DT,DD");
			// check if cursor is not pointing to any list element to allow increase/decrease
			// indent of UL/OL instead of adding four white spaces.
			if (!listElement) {
				event.preventDefault();
				editor.execCommand("mceInsertContent", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
				editor.selection.collapse(false);
			}
			return;
		}
		this.fireEvent("keypress", this, Ext.EventObject);
	},

	/**
	 * Checks if the cursor is positioned inside a blockquote
	 * @param {tinymce.Editor} editor The editor we will check
	 * @return {DOMElement} The blockquote element if found or false otherwise
	 */
	inBlockquote: function(editor)
	{
		var blockquoteElement = null;
		var node = editor.selection.getNode();
		if (node.nodeName === "BLOCKQUOTE") {
			blockquoteElement = node;
		} else {
			blockquoteElement = editor.dom.getParent(node, "BLOCKQUOTE", editor.getBody());
		}
		return blockquoteElement !== null ? blockquoteElement : false;
	},

	/**
	 * Splits a blockquote DOM element at the position of the cursor
	 * @param {tinymce.Editor} editor The editor we will work in
	 * @param {DOMElement} blockquote The blockquote element that must be split.
	 */
	splitBlockquote: function(editor, blockquote)
	{
		// Save the current selection
		const selection = editor.selection;
		const range = selection.getRng(true);
		// Create a marker element to preserve the cursor's location
				const marker = editor.dom.create("span", {
			id: "split-marker"
		}, "");
		range.insertNode(marker);
		// Split the blockquote at the marker
				const newBlockquote = editor.dom.split(blockquote, marker);
		// Create a new paragraph with custom margin for the content after the split
				const newParagraph = editor.dom.create("p", {
			style: "margin: 10px 0 10px 0;"
		}, '<br data-mce-bogus="1" />');
		editor.dom.insertAfter(newParagraph, newBlockquote);
		// Move the cursor to the new paragraph (between the split)
				const newRange = editor.dom.createRng();
		newRange.setStartAfter(marker);
		newRange.setEndAfter(marker);
		// Remove the marker after setting the range
				editor.dom.remove(marker);
		// Apply the new range
				selection.setRng(newRange);
		// Focus the editor to ensure the cursor is active
				editor.focus();
	},

	/**
	 * Handles the event when the user presses ENTER when the cursor is positioned
	 * in a blockquote
	 */
	handleEnterInBlockquote: function()
	{
		var editor = this.getEditor();
		var blockquote = this.inBlockquote(editor);
		// Add an undo level and wrap the split operation in a transaction
				editor.undoManager.transact((() => {
			if (blockquote) {
				this.splitBlockquote(editor, blockquote);
			}
		}));
		editor.focus();
	},

	/**
	 * Event handler which is raised when the component looses the focus
	 * of the user. This will determine if the typed in value has changed
	 * since the moment it gained focus, and will raise the 'change' event
	 * in that case.
	 * @private
	 */
	onBlur: function()
	{
		// if container of HtmlEditor, i.e. dialog, is closed then component is
		// also destroyed or removed and we won't be able to get value/content.
		if (this.isDestroyed === true || this.getEditor().removed) {
			return;
		}
		// This event can be triggered multiple times, so we don't need to check
		// for changed when we blur without being focused. However, we do want to
		// invoke the 'blur' event since that will produce a consistent behavior
		// with other UI components from ExtJs.
				if (this.hasFocus === true) {
			var v = this.getRawValue();
			if (v.length !== this.originalValue.length || v !== this.originalValue) {
				this.fireEvent("change", this, v, this.originalValue);
			}
		}
		this.hasFocus = false;
		this.fireEvent("blur", this);
	},

	/**
	 * Event handler which is raised when the component gains the focus
	 * of the user. This will update the originalValue field so later,
	 * when the component looses focus, it can be determined if the
	 * value has been changed.
	 * @private
	 */
	onFocus: function()
	{
		// This event can be triggered multiple times,
		// even when it looses focus the onFocus will
		// be raised twice before the onBlur is called.
		if (this.hasFocus === true) {
			return;
		}
		this.originalValue = this.getRawValue();
		this.hasFocus = true;
		this.fireEvent("focus", this);
		// While body is empty and switching a focus in editor after tab change then
		// some how firefox consider current selection on P tag instead of span and
		// P tag doesn't have formatting that's way default formatting will remove.
		if (this.isTabChanged) {
			this.getEditor().selection.setCursorLocation();
			this.isTabChanged = false;
		}
	},

	/**
	 * Function is used to set the cursor within editor while mail replay/forward.
	 * It fires the 'focusin' event of editor.
	 */
	setCursorLocation: function()
	{
		var editor = this.getEditor();
		// check If editor instance is available or not
		if (editor) {
			this.withEd((function() {
				// Here we need to fire the focusin event of editor because
				// in default formatting we have two span tags, so somehow
				// when mail is reply/forward cursor set in first outer span which is not contains any
				// formatting so default formatting gets lost. to overcome this problem
				// we need to fire the focusin event of editor.
				editor.dispatch("focusin", {
					target: editor.getBody(),
					relatedTarget: null
				});
			}));
		} else {
			// if editor instance is not available yet to do auto focus than we have to reschedule the
			// auto focus mechanism un till editor instance will be available, simply register on
			// {@link #initialized} event.
			this.on("initialized", (function() {
				var focusCmp = this.ownerCt;
				focusCmp.focus.defer(1, focusCmp);
				focusCmp.fireEvent("setAutoFocusCursor", focusCmp.getEditor());
			}), this);
		}
	},

	/**
	 * Function will get the editor and fetch document element of the editor.
	 * @return {HTMLDocument} it will return document element of the editor iframe
	 */
	getEditorDocument: function()
	{
		return this.getEditor().getDoc();
	},

	/**
	 * Function will get the editor and fetch body element of the editor.
	 * @return {HTMLBodyElement} it will return body element of the editor iframe
	 */
	getEditorBody: function()
	{
		return this.getEditor().getBody();
	},

	/**
	 * bind an {@link Zarafa.core.data.IPMRecord} to this component
	 * record is necessary to properly convert img tags, for which store and entryid are needed
	 * @param {Zarafa.core.data.IPMRecord} record
	 */
	bindRecord: function(record)
	{
		this.record = record;
	},

	/**
	 * Event handler triggers when content tab panel is changed
	 */
	onBeforeTabChange: function()
	{
		this.isTabChanged = true;
		if (this.hasFocus) {
			this.getEditor().fire("blur", this);
		}
	},

	/**
	 * Function to set formatting with default font family and font size
	 */
	applyFontStyles: function()
	{
		var body = Ext.get(this.getEditorBody());
		body.setStyle("font-family", this.defaultFontFamily);
		body.setStyle("font-size", this.defaultFontSize);
	}
});

Ext.reg("zarafa.htmleditor", Zarafa.common.ui.HtmlEditor);

// Create a hidden html editor to prefetch all tiny files
Zarafa.onReady((function()
{
	var body = Ext.getBody();
	// Only prefetch for the webclient not for the welcome screen
	if (body.hasClass("zarafa-webclient")) {
		var el = body.createChild({
			id: "tiny-prefetch",
			style: {
				width: "10px",
				height: "10px",
				"z-index": -10,
				top: "-10000px",
				left: "-10000px",
				visibility: "hidden",
				position: "absolute"
			}
		});
		new Ext.Panel({
			xtype: "panel",
			applyTo: el,
			layout: "fit",
			border: false,
			flex: 1,
			autoHeight: false,
			items: [ {
				xtype: "zarafa.editorfield",
				ref: "../editorField",
				flex: 1,
				useHtml: true
			} ]
		});
	}
}));
