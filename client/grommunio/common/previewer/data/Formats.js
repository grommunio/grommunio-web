Ext.namespace('Grommunio.common.previewer.data');

/**
 * @class Grommunio.common.previewer.data.Formats
 * @singleton
 *
 * The file formats the previewer can render, and the renderer each one is
 * handed to. Attachments and files use the same table, so a document that can
 * be previewed from a mail can be previewed from the Files context as well.
 *
 * The keys of {@link #extensions} are the names the viewer page accepts as its
 * "plugin" parameter. The viewer keeps an extension table of its own for
 * documents opened outside grommunio Web, but takes the hint when it is given
 * one, so this table decides which renderer a preview ends up in.
 */
Grommunio.common.previewer.data.Formats = {

	/**
	 * The file extensions each renderer takes. 'pdf' is the bundled pdf.js
	 * viewer, every other renderer is a plugin of the viewer page.
	 * @property
	 * @type Object
	 */
	extensions: {
		pdf: ['pdf'],

		// Word processing
		doc: ['doc', 'dot'],
		docx: ['docx', 'docm', 'dotx', 'dotm'],
		rtf: ['rtf'],
		odf: ['odt', 'fodt', 'ott', 'ods', 'fods', 'ots', 'odp', 'fodp', 'otp'],

		// Spreadsheets, legacy and delimited included
		sheet: [
			'xls', 'xlt', 'xlsx', 'xlsm', 'xltx', 'xltm', 'xlsb',
			'csv', 'tsv', 'dbf', 'dif', 'slk', 'prn'
		],

		// Presentations
		pptx: ['pptx', 'pptm', 'potx', 'ppsx', 'ppsm'],

		// Messages
		message: ['eml'],

		// Images. An SVG goes through <img>, which never runs its scripts.
		image: [
			'png', 'jpg', 'jpeg', 'jpe', 'gif', 'bmp',
			'webp', 'avif', 'ico', 'svg'
		],

		// Audio and video
		media: [
			'aac', 'mp3', 'm4a', 'oga', 'ogg', 'opus', 'wav', 'flac',
			'mp1', 'mp2', 'mp4', 'm4v', 'mpg', 'mpeg', 'ogv', 'webm', 'mov'
		],

		// Text and source. Markup is shown as source, not rendered.
		text: [
			'txt', 'text', 'log', 'md', 'markdown', 'json', 'xml', 'yaml',
			'yml', 'ini', 'cfg', 'conf', 'diff', 'patch', 'sql', 'htm',
			'html', 'css', 'js', 'ts', 'php', 'py', 'pl', 'rb', 'sh', 'bat',
			'ps1', 'c', 'h', 'cpp', 'hpp', 'cs', 'java', 'go', 'rs',
			'tex', 'toml', 'properties'
		]
	},

	/**
	 * The renderer of every extension, built from {@link #extensions} the
	 * first time it is needed.
	 * @property
	 * @type Object
	 * @private
	 */
	renderers: undefined,

	/**
	 * The extension of a file name, lower case and without the dot.
	 *
	 * @param {String} filename A file name or path
	 * @return {String} The extension, empty when the name carries none
	 */
	getExtension: function (filename)
	{
		if (!Ext.isString(filename)) {
			return '';
		}

		// Take the name from the path first, so that a dot in a directory
		// name is not mistaken for the start of an extension.
		var name = filename.split(/[\\/]/).pop();
		var dot = name.lastIndexOf('.');

		return dot > 0 ? name.substr(dot + 1).toLowerCase() : '';
	},

	/**
	 * The renderer that will be used for a file.
	 *
	 * @param {String} filename A file name or path
	 * @return {String} The renderer name, undefined when the file cannot be previewed
	 */
	getRenderer: function (filename)
	{
		if (!this.renderers) {
			this.renderers = {};
			Ext.iterate(this.extensions, function (renderer, extensions) {
				Ext.each(extensions, function (extension) {
					this.renderers[extension] = renderer;
				}, this);
			}, this);
		}

		return this.renderers[this.getExtension(filename)];
	},

	/**
	 * Whether the previewer can show a file.
	 *
	 * @param {String} filename A file name or path
	 * @return {Boolean} True when the file has a renderer
	 */
	isSupported: function (filename)
	{
		return !!this.getRenderer(filename);
	}
};
