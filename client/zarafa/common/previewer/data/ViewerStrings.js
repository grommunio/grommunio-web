Ext.namespace('Zarafa.common.previewer.data');

/**
 * @class Zarafa.common.previewer.data.ViewerStrings
 * @singleton
 *
 * The text of the viewer page. The viewer is a plain page in a frame of its
 * own, without the message catalogue grommunio Web loads, so it reads its
 * strings from here: the English text is the key, and what it maps to is the
 * translation for the language the user is running grommunio Web in.
 */
Zarafa.common.previewer.data.ViewerStrings = {

	/**
	 * The strings of the viewer page, translated.
	 *
	 * @return {Object} The English text of the viewer mapped to its translation
	 */
	get: function ()
	{
		return {
			// Toolbar
			'Print': _('Print'),
			'Presentation': _('Presentation'),
			'Fullscreen': _('Fullscreen'),
			'Download': _('Download'),
			'Previous page': _('Previous page'),
			'Next page': _('Next page'),
			'Page:': _('Page:'),
			'of {0}': _('of {0}'),
			'Zoom out': _('Zoom out'),
			'Zoom in': _('Zoom in'),
			'Zoom': _('Zoom'),
			'Automatic': _('Automatic'),
			'Actual size': _('Actual size'),
			'Full width': _('Full width'),
			'Close': _('Close'),

			// Shared by the renderers
			'This document could not be previewed.': _('This document could not be previewed.'),
			'This file cannot be previewed.': _('This file cannot be previewed.'),
			'Download the file to open it with a program that can read it.': _('Download the file to open it with a program that can read it.'),
			'The document is empty.': _('The document is empty.'),

			// Spreadsheets
			'This sheet is empty.': _('This sheet is empty.'),
			'Showing the first {0} rows and {1} columns.': _('Showing the first {0} rows and {1} columns.'),

			// Text
			'Wrap lines': _('Wrap lines'),
			'Line numbers': _('Line numbers'),

			// Presentations
			'Slide {0}': _('Slide {0}'),
			'Speaker notes': _('Speaker notes'),

			// Messages
			'From': _('From'),
			'To': _('To'),
			'Cc': _('Cc'),
			'Subject': _('Subject'),
			'Date': _('Date'),
			'Attachments': _('Attachments'),
			'This message has no content.': _('This message has no content.')
		};
	}
};
