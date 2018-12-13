// -*- coding: utf-8; indent-tabs-mode: nil -*-
Ext.namespace('Zarafa.common.printer.renderers');

/**
 * @class Zarafa.common.printer.renderers.RecordRenderer
 * @extends Zarafa.common.printer.renderers.BaseRenderer
 * Utility functions for a record renderer class. Don't use this directly, use a subclass instead.
 */
Zarafa.common.printer.renderers.RecordRenderer = Ext.extend(Zarafa.common.printer.renderers.BaseRenderer, {
	/**
	 * @property customStylesheetPath
	 * @type String
	 * The path at which the print stylesheets can be found for the record renderer
	 */
	customStylesheetPath: 'client/resources/css/external/print.record.css',

	/**
	 * Print a single table row
	 * @param {String} header to place in the table before the record value
	 * @param {String} data value
	 * @private
	 */
	addRow: function(header, data) {
		var args = Ext.toArray(arguments);
		var tpl = '<tr>';

		tpl += '<th valign="top">' + header + (Ext.isEmpty(header) ? '' : ':') + '</th>';

		for (var i = 1, len = args.length; i < len; i++) {
			tpl += '<td valign="top">' + args[i] + '</td>';
		}

		tpl += '</tr>\n';

		return tpl;
	},

	/**
	 * Helper function to print an optional column in the email header table
	 * @param {Zarafa.core.data.MAPIRecord} record to get data value from
	 * @param {String} header to place in the table before the record value
	 * @param {String} tag to get from the record
	 * @param {String} format The template string which should be added
	 * @private
	 */
	optionalRow: function(header, tag, format) {
		var html = '';
		html += '<tpl if="!Ext.isEmpty(values.'+tag+')">';
		html += this.addRow(header, format);
		html += '</tpl>';
		return html;
	},

	/**
	 * Prepares data for any record for use in the XTemplate
	 * @param {Zarafa.core.data.MAPIRecord} record The mapi record to print
	 * @return {Array} Data suitable for use in the XTemplate
	 */
	prepareData: function(record) {
		// copy all properties
		var data = Ext.apply({}, record.data);
		data['fullname'] = container.getUser().getDisplayName();

		// HTML Escape all data
		for (var key in data) {
			if(Ext.isString(data[key])) {
				data[key] = Ext.util.Format.htmlEncode(data[key]);
			}
		}

		// remove default values
		var opt = record.get('sensitivity');
		if (!Ext.isEmpty(opt) && opt === 0) {
			delete data['sensitivity'];
		}
		opt = record.get('importance');
		if (!Ext.isEmpty(opt) && opt == 1) {
			delete data['importance'];
		}

		// add printer specific tags
		data['attachment_names'] = Ext.util.Format.htmlEncode(record.getAttachmentNames());

		return data;
	}
});
