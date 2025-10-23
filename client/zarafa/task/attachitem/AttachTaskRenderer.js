Ext.namespace('Zarafa.task.attachitem');

/**
 * @class Zarafa.task.attachitem.AttachTaskRenderer
 * @extends Zarafa.common.attachment.dialogs.AttachItemBaseRenderer
 *
 * Renderer that can be used to get text data from {@link Zarafa.task.TaskRecord TaskRecord}.
 */
Zarafa.task.attachitem.AttachTaskRenderer = Ext.extend(Zarafa.common.attachment.dialogs.AttachItemBaseRenderer, {
	/**
	 * Constructor will initialize default properties
	 * @param {Object} config configuration object
	 */
	constructor: function(config)
	{
		Zarafa.task.attachitem.AttachTaskRenderer.superclass.constructor.call(this, config);

		Ext.apply(this.labels, {
			'startdate': _('Start Date'),
			'duedate': _('Due Date'),
			'status': _('Task Status'),
			'percent_complete': _('Percent Complete'),
			'totalwork': _('Total Work'),
			'actualwork': _('Actual Work'),
			'owner': _('Owner'),
			'companies': _('Companies'),
			'billinginformation': _('Billing Information'),
			'mileage': _('Mileage')
		});
	},

	/**
	 * Function should be used to generate template which can be used by {@link #generateText} to add data into template and return the string that is generated.
	 * This will generate template for the html format only.
	 * @return {String} The HTML for the XTemplate to use
	 */
	generateHTMLTemplate: function()
	{
		var html = '';

		html += this.addHTMLRowGroup({
			'subject': '{subject:htmlEncode}',
			// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
			'startdate': '{startdate:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}',
			// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
			'duedate': '{duedate:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}',
			'importance': '{importance:importanceString}',
			'sensitivity': '{sensitivity:sensitivityString}'
		});

		html += this.addHTMLRowGroup({
			'status': '{status:taskStatusString}',
			'percent_complete': '{percent_complete:percentage}',
			// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
			'date_completed': '{date_completed:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}'
		});

		html += this.addHTMLRowGroup({
			'totalwork': '{totalwork:duration}',
			'actualwork': '{actualwork:duration}',
			'owner': '{owner:htmlEncode}',
			'categories': '{categories:htmlEncode}',
			'companies': '{companies:htmlEncode}',
			'billinginformation': '{billinginformation:htmlEncode}',
			'mileage': '{mileage:htmlEncode}'
		});

		html += this.addHTMLRowGroup({
			'categories': '{categories:htmlEncode}',
			'companies': '{companies:htmlEncode}',
			'billinginformation': '{billinginformation:htmlEncode}',
			'mileage': '{mileage:htmlEncode}'
		});

		html += this.addHTMLRow('attachment_names', '{attachment_names:htmlEncode}');
		html += '{body}';

		return html;
	},

	/**
	 * Function should be used to generate template which can be used by {@link #generateText} to add data into template and return the string that is generated.
	 * This will generate template for the plain text format only.
	 * @return {String} The HTML for the XTemplate to use
	 */
	generatePlainTemplate: function()
	{
		var html = '';

		html += this.addPlainRowGroup({
			'subject': '{subject}',
			// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
			'startdate': '{startdate:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}',
			// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
			'duedate': '{duedate:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}',
			'importance': '{importance:importanceString}',
			'sensitivity': '{sensitivity:sensitivityString}'
		});

		html += this.addPlainRowGroup({
			'status': '{status:taskStatusString}',
			'percent_complete': '{percent_complete:percentage}',
			// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
			'date_completed': '{date_completed:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}'
		});

		html += this.addPlainRowGroup({
			'totalwork': '{totalwork:duration}',
			'actualwork': '{actualwork:duration}',
			'owner': '{owner}',
			'categories': '{categories}',
			'companies': '{companies}',
			'billinginformation': '{billinginformation}',
			'mileage': '{mileage}'
		});

		html += this.addPlainRowGroup({
			'categories': '{categories}',
			'companies': '{companies}',
			'billinginformation': '{billinginformation}',
			'mileage': '{mileage}'
		});

		html += this.addPlainRow('attachment_names', '{attachment_names}');
		html += '{body}';

		return html;
	},

	/**
	 * Prepares data suitable for use in an XTemplate from the record.
	 * @param {Zarafa.core.data.IPMRecord} record The record to acquire data from.
	 * @param {Boolean} htmlFormat decide if html or plain data is requested, this will depend on the user settings.
	 * @return {Array} An array of data which is customized for our purpose.
	 */
	prepareData: function(record, htmlFormat)
	{
		var data = Zarafa.task.attachitem.AttachTaskRenderer.superclass.prepareData.apply(this, arguments);

		// remove default values
		if (data['status'] === Zarafa.core.mapi.TaskStatus.NOT_STARTED) {
			delete data['status'];
		}

		if (data['percent_complete'] === 0) {
			delete data['percent_complete'];
		}

		if (data['actualwork'] === 0) {
			delete data['actualwork'];
		}

		if (data['totalwork'] === 0) {
			delete data['totalwork'];
		}

		return data;
	}
});