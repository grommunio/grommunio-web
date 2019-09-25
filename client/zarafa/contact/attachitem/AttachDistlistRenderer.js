Ext.namespace('Zarafa.contact.attachitem');

/**
 * @class Zarafa.contact.attachitem.AttachDistlistRenderer
 * @extends Zarafa.common.attachment.dialogs.AttachItemBaseRenderer
 *
 * Renderer that can be used to get text data from {@link Zarafa.contact.ContactRecord ContactRecord}.
 */
Zarafa.contact.attachitem.AttachDistlistRenderer = Ext.extend(Zarafa.common.attachment.dialogs.AttachItemBaseRenderer, {
	/**
	 * Constructor will intialize default properties
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
	{
		Zarafa.contact.attachitem.AttachDistlistRenderer.superclass.constructor.call(this, config);

		Ext.apply(this.labels, {
			'display_name' : _('Distribution List Name'),
			'members' : _('Members')
		});
	},

	/**
	 * Function should be used to generate template which can be used by {@link #generateText} to add data into template and return the string that is generated.
	 * This will generate template for the html format only.
	 * @return {String} The HTML for the XTemplate to use
	 */
	generateHTMLTemplate : function()
	{
		var html = '';

		html += this.addHTMLRowGroup({
			'display_name' : '{display_name:htmlEncode}'
		});

		html += this.addHTMLRowGroup({
			'sensitivity' : '{sensitivity:sensitivityString}',
			'categories' : '{categories:htmlEncode}',
			'attachment_names' : '{attachment_names:htmlEncode}'
		});

		html += this.addHTMLRowGroup({
			'members' : '{members:htmlEncode}'
		});

		html += '{body}';

		return html;
	},

	/**
	 * Function should be used to generate template which can be used by {@link #generateText} to add data into template and return the string that is generated.
	 * This will generate template for the plain text format only.
	 * @return {String} The HTML for the XTemplate to use
	 */
	generatePlainTemplate : function()
	{
		var html = '';

		html += this.addPlainRowGroup({
			'display_name' : '{display_name}'
		});

		html += this.addPlainRowGroup({
			'sensitivity' : '{sensitivity:sensitivityString}',
			'categories' : '{categories}',
			'attachment_names' : '{attachment_names}'
		});

		html += this.addPlainRowGroup({
			'members' : '{members}'
		});

		html += '{body}';

		return html;
	},

	/**
	 * Prepares data suitable for use in an XTemplate from the record.
	 * @param {Zarafa.core.data.IPMRecord} record The record to aquire data from.
	 * @return {Array} An array of data which is customized for our purpose.
	 */
	prepareData : function(record, htmlFormat)
	{
		var data = Zarafa.contact.attachitem.AttachDistlistRenderer.superclass.prepareData.apply(this, arguments);

		// generate members data
		data['members'] = record.getMemberNames();

		return data;
	}
});