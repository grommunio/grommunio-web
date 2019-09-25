Ext.namespace('Zarafa.common.attachment.dialogs');

/**
 * @class Zarafa.common.attachment.dialogs.AttachItemBaseRenderer
 * @extends Object
 *
 * Base renderer that can be used to extend and create different renderers for different type of messages.
 */
Zarafa.common.attachment.dialogs.AttachItemBaseRenderer = Ext.extend(Object, {
	/**
	 * Will store labels for corresponsing record properties that will be used by {@link #addPlainRow} and {@link #addHTMLRow}
	 * to show labels in the data.
	 * @property labels
	 * @type Array
	 */
	labels : undefined,

	/**
	 * Will store object of {@link Ext.XTemplate XTemplate} that is created by {@link #generateText} for html data,
	 * this will make sure that template will only be generated once and then it will be reused.
	 * @property htmlTemplate
	 * @type Ext.XTemplate
	 */
	htmlTemplate : undefined,

	/**
	 * Will store object of {@link Ext.XTemplate XTemplate} that is created by {@link #generateText} for plain text data,
	 * this will make sure that template will only be generated once and then it will be reused.
	 * @property plainTemplate
	 * @type Ext.XTemplate
	 */
	plainTemplate : undefined,

	/**
	 * Constructor will intialize default properties
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
	{
		this.labels = Ext.apply({}, {
			subject : _('Subject'),
			display_to : _('To'),
			display_cc : _('Cc'),
			display_bcc : _('Bcc'),
			from : _('From'),
			categories : _('Categories'),
			sensitivity : _('Sensitivity'),
			importance : _('Importance'),
			attachment_names : _('Attachments')
		});
	},

	/**
	 * Function will generate text that should be added into another message's body.
	 * @param {Zarafa.core.data.IPMRecord} record record that will be used to get data and generate template based on that data.
	 * @param {Boolean} htmlFormat decide if html or plain template should be used, this will depend on the user settings.
	 * @return {String} data that can be put in the record's body property.
	 * @public
	 */
	generateText : function(record, htmlFormat)
	{
		var template;

		if(htmlFormat) {
			if(!this.htmlTemplate) {
				this.htmlTemplate =  new Ext.XTemplate(
					this.cleanTemplate(
						this.generateHTMLTemplate()
					)
				);
			}

			template = this.htmlTemplate;
		} else {
			if(!this.plainTemplate) {
				this.plainTemplate =  new Ext.XTemplate(
					this.generatePlainTemplate()
				);
			}

			template = this.plainTemplate;
		}

		// Generate text from template
		var text = template.apply(this.prepareData(record, htmlFormat));

		// below processing is only needed when we have some data to return
		if(!Ext.isEmpty(text.trim()) && htmlFormat) {
			// Remove extra line seperator from end of text
			text = text.replace(/(<hr width=\'100%\'>)*$/gi, '');

			// add a blockquote for styling purposes
			var html = '<blockquote style=\'border-left: 2px solid #325FBA; padding-left: 5px; margin-left: 10px; margin-top: 10px;\'>';
			html += text;
			html += '</blockquote><br>';

			text = html;
		}

		return text;
	},

	/**
	 * Helper function to add group of rows to template. This will also add conditional seperator after group rows.
	 * @param {Object} group (optional) key value pair of tag and format that will be checked
	 * and if any one field is not empty then add the seperator otherwise don't add seperator. The tags can also contain another objects
	 * which will be recursively checked.
	 * @return {String} data template string for group of rows.
	 */
	addPlainRowGroup : function(group)
	{
		var html = '';
		// add rows
		Ext.iterate(group, function(tag, format) {
			if(Ext.isObject(format)) {
				// recursively call the function
				html += '<tpl if="!Ext.isEmpty(values.' + tag + ')">';
				html += this.addPlainRowGroup(format);
				html += '</tpl>';
			} else {
				html += this.addPlainRow(tag, format);
			}
		}, this);

		// add conditional seperator
		html += this.addPlainSeperator(group);

		return html;
	},

	/**
	 * Helper function to add plain text row to template.
	 * @param {String} tag field/property of the record
	 * @param {String} format The template string which should be added
	 * @return {String} data template string for a row.
	 * @protected
	 */
	addPlainRow : function(tag, format)
	{
		var html = '';

		html += '<tpl if="!Ext.isEmpty(values.' + tag + ')">';
		html += this.getLabel(tag) + ' : \t' + format + '\n';
		html += '</tpl>';

		return html;
	},

	/**
	 * Helper function to add plain text seperator row to template.
	 * @param {Object} group (optional) key value pair of tag and format that will be checked
	 * and if any one field is not empty then add the seperator otherwise don't add seperator. The tags can also contain another objects
	 * which will be recursively checked.
	 * @return {String} data template string for a row.
	 * @protected
	 */
	addPlainSeperator : function(group)
	{
		if(group) {
			// if group is provided then create condition which checks if seperator should be added or not
			var condition = '';
			var seperator = ' || ';
			var skip = false;

			Ext.iterate(group, function(tag, format) {
				if(Ext.isObject(format)) {
					// we have got a sub group, for which we will not add seperator
					// that will be added when this same function will be called with the sub group
					skip = true;

					// break looping
					return false;
				} else {
					condition += ( Ext.isEmpty(condition) ? '' : seperator ) + '!Ext.isEmpty(values.' + tag + ')';
				}
			});

			var html = '';

			if(skip !== true) {
				html += '<tpl if="' + condition + '">';
				html += '\n';
				html += '</tpl>';
			}

			return html;
		}

		// if no group is provided then directly add seperator
		return '\n';
	},

	/**
	 * Helper function to add group of rows to template. This will also add conditional seperator after group rows.
	 * @param {Object} group (optional) key value pair of tag and format that will be checked
	 * and if any one field is not empty then add the seperator otherwise don't add seperator. The tags can also contain another objects
	 * which will be recursively checked.
	 * @return {String} data template string for group of rows.
	 */
	addHTMLRowGroup : function(group)
	{
		var html = '';
		// add rows
		Ext.iterate(group, function(tag, format) {
			if(Ext.isObject(format)) {
				// recursively call the function
				html += '<tpl if="!Ext.isEmpty(values.' + tag + ')">';
				html += this.addHTMLRowGroup(format);
				html += '</tpl>';
			} else {
				html += this.addHTMLRow(tag, format);
			}
		}, this);

		// add conditional separator
		html += this.addHTMLSeperator(group);

		return html;
	},

	/**
	 * Helper function to add html row to template.
	 * @param {String} tag field/property of the record
	 * @param {String} format The template string which should be added
	 * @return {String} data template string for a row.
	 * @protected
	 */
	addHTMLRow : function(tag, format)
	{
		var html = '';

		html += '<tpl if="!Ext.isEmpty(values.' + tag + ')">';
		html += '<div width=\'100%\'><div style="display: inline-block; width: 20%;"><strong>' + this.getLabel(tag) + ' :</strong></div><div style="display: inline-block; width: 80%">' + format + '</div></div>';
		html += '</tpl>';

		return html;
	},

	/**
	 * Helper function to add html seperator row to template.
	 * @param {Object} group (optional) key value pair of tag and format that will be checked
	 * and if any one field is not empty then add the seperator otherwise don't add seperator. The tags can also contain another objects
	 * which will be recursively checked.
	 * @return {String} data template string for a row.
	 * @protected
	 */
	addHTMLSeperator : function(group)
	{
		if(group) {
			// if group is provided then create condition which checks if seperator should be added or not
			var condition = '';
			var seperator = ' || ';
			var skip = false;

			Ext.iterate(group, function(tag, format) {
				if(Ext.isObject(format)) {
					// we have got a sub group, for which we will not add seperator
					// that will be added when this same function will be called with the sub group
					skip = true;

					// break looping
					return false;
				} else {
					condition += ( Ext.isEmpty(condition) ? '' : seperator ) + '!Ext.isEmpty(values.' + tag + ')';
				}
			});

			var html = '';

			if(skip !== true) {
				html += '<tpl if="' + condition + '">';
				html += '<hr width=\'100%\'>';
				html += '</tpl>';
			}

			return html;
		}

		// if no group is provided then directly add seperator
		return '<hr width=\'100%\'>';
	},

	/**
	 * Clean the template string by removing all illegal characters.
	 * @param {String} template The template string to clean
	 * @return {String} The clean template
	 * @private
	 */
	cleanTemplate : function(template)
	{
		// Conversions:
		// - \r is an illegal character which cannot be present in a string
		// - \ is a valid character, but shouldn't be escaped in an HTML text.
		return template.replace(/\r/g, '').replace(/\\/g, '\\\\');
	},

	/**
	 * Function should be used to generate template which can be used by {@link #generateText} to add data into template and return the string that is generated.
	 * This will generate template for the html format only.
	 * @return {String} The HTML for the XTemplate to use
	 */
	generateHTMLTemplate : Ext.emptyFn,

	/**
	 * Function should be used to generate template which can be used by {@link #generateText} to add data into template and return the string that is generated.
	 * This will generate template for the plain text format only.
	 * @return {String} The HTML for the XTemplate to use
	 */
	generatePlainTemplate : Ext.emptyFn,

	/**
	 * Function should be used to get row label based on record property. Function will be used by {@link #addPlainRow} and {@link #addHTMLRow}.
	 * @param {String} tag field name or property from the record.
	 * @return {String} The label to use for showing particular data from record.
	 */
	getLabel : function(tag)
	{
		return this.labels[tag];
	},

	/**
	 * Prepares data suitable for use in an XTemplate from the record.
	 * @param {Zarafa.core.data.IPMRecord} record The record to aquire data from.
	 * @param {Boolean} htmlFormat decide if html or plain data is requested, this will depend on the user settings.
	 * @return {Array} An array of data which is customized for our purpose.
	 */
	prepareData : function(record, htmlFormat)
	{
		// copy all properties
		var data = Ext.apply({}, record.data);

		// remove default values
		if (data['sensitivity'] === Zarafa.core.mapi.Sensitivity.NONE) {
			delete data['sensitivity'];
		}

		if (data['importance'] === Zarafa.core.mapi.Importance.NORMAL) {
			delete data['importance'];
		}

		// Get proper from address
		data['from'] = record.getSenderString();
		data['attachment_names'] = record.getAttachmentNames();

		data['body'] = record.getBody(htmlFormat);

		return data;
	}
});