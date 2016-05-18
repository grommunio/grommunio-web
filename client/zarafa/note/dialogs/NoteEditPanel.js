Ext.namespace('Zarafa.note.dialogs');

/**
 * @class Zarafa.note.dialogs.NoteEditPanel
 * @extends Ext.form.FormPanel
 * @xtype zarafa.noteeditpanel
 *
 * this class is used to provide ui for note dialog
 */
Zarafa.note.dialogs.NoteEditPanel = Ext.extend(Ext.FormPanel, {
	/**
	 * The current CSS class which is applied for
	 * determining the background color for this panel.
	 * @property
	 * @type String
	 */
	currentColorCss : undefined,
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config,{
			xtype	: 'zarafa.noteeditpanel',
			layout	: 'fit',
			border	: false,
			items   : [{
				xtype : 'zarafa.editorfield',
				useHtml : false,
				ref : 'noteText',
				plaintextName : 'body',
				listeners : {
					change : this.onTextareaChange,
					scope : this
				}
			}]
		});

		Zarafa.note.dialogs.NoteEditPanel.superclass.constructor.call(this,config);
	},

	/**
	 * handler for change event of text area in note dialog 
	 * @param {Object} textarea object 
	 * @private
	 */
	onTextareaChange :function(textarea)
	{
		var body = textarea.getValue();
		this.record.beginEdit();
		this.record.set('body',body);
		this.record.generateSubject();
		this.record.endEdit();
	},

	/**
	 * this function returns css class in response to icon index
	 * to set background color of Note Dialog's text area
	 * @param{String/Number} String or Int icon index value
	 * @return css class name
	 * @private
	 */
	getTextAreaColor : function(iconIndex)
	{
		var textAreaCSSClass = "";
		
		switch(parseInt(iconIndex, 10))
		{
			case Zarafa.core.mapi.IconIndex['note_blue']:
				textAreaCSSClass = "stickynote_dialog_blue";
				break;
			case Zarafa.core.mapi.IconIndex['note_green']:
				textAreaCSSClass = "stickynote_dialog_green";
				break;
			case Zarafa.core.mapi.IconIndex['note_pink']:
				textAreaCSSClass = "stickynote_dialog_pink";
				break;
			case Zarafa.core.mapi.IconIndex['note_yellow']:
			/* falls through */
			default:
				textAreaCSSClass = "stickynote_dialog_yellow";
				break;
			case Zarafa.core.mapi.IconIndex['note_white']:
				textAreaCSSClass = "stickynote_dialog_white";
				break;
		}

		return textAreaCSSClass;
	},

	/**
	 * Function is used to update values of form fields when ever
	 * an updated {@link Zarafa.core.data.IPMRecord record} is received
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update : function(record, contentReset)
	{
		var textArea = this.noteText.getEditor();

		if (record) {
			this.record = record;
			if (contentReset || record.isModifiedSinceLastUpdate('body')) {
				this.noteText.setValue(record.get('body') || '');
			}

			if (contentReset || record.isModifiedSinceLastUpdate('icon_index')) {
				textArea.removeClass(this.currentColorCss);
				var currentColor = this.getTextAreaColor(record.get('icon_index'));
				this.currentColorCss = currentColor;
				textArea.addClass(currentColor);
			}
		} else {
			this.noteText.setValue('');
			textArea.removeClass(this.currentColorCss);
		}
	},

	/**
	 * Function to update the record whenever form fields are modified
	 * @param {Zarafa.core.data.IPMRecord} the record to update
	 * @private
	 */
	updateRecord : function(record)
	{
		var body = this.noteText.getValue();
		this.record.beginEdit();
		this.record.set('body',body);
		this.record.generateSubject();
		this.record.endEdit();
	}
});

//Register note dialog edit panel xtype
Ext.reg('zarafa.noteeditpanel',Zarafa.note.dialogs.NoteEditPanel);
