Ext.namespace('Zarafa.plugins.files.settings.data');

/**
 * @class Zarafa.plugins.files.settings.data.AccountRenderUtil
 * @singleton
 *
 * This class offers some basic utils for rendering account specific values.
 */
Zarafa.plugins.files.settings.data.AccountRenderUtil = {

	/**
	 * Renderer for the status column of the accountgrid
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.Record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	statusRenderer: function (value, p, record) {

		switch (value) {
			case Zarafa.plugins.files.data.AccountRecordStatus.OK:
				p.css = "zarafa-files-listview-icon zarafa-files-account-ok";
				break;
			case Zarafa.plugins.files.data.AccountRecordStatus.NEW:
				p.css = "zarafa-files-listview-icon zarafa-files-account-new";
				break;
			case Zarafa.plugins.files.data.AccountRecordStatus.ERROR:
				p.css = "zarafa-files-listview-icon zarafa-files-account-error";
				break;
			case Zarafa.plugins.files.data.AccountRecordStatus.UNKNOWN:
				p.css = "zarafa-files-listview-icon zarafa-files-account-unknown";
				break;
			default :
				break;
		}

		// add extra css class for empty cell
		p.css += ' zarafa-grid-empty-cell';
		p.attr = 'ext:qtip="' + record.get("status_description") + '"';

		return '';
	},

	/**
	 * Renderer for the feature column of the accountgrid
	 * @param value
	 * @param metadata
	 * @param record
	 * @param rowIndex
	 * @param colIndex
	 * @param store
	 * @param feature
	 * @returns {string}
	 */
	featureRenderer: function (value, metadata, record, rowIndex, colIndex, store, feature) {
		var availableFeatures = record.get('backend_features');

		// hide this feature if account does not support it
		if (!Ext.isDefined(availableFeatures) || availableFeatures === null || !Zarafa.plugins.files.settings.data.AccountRenderUtil.arrayContains(availableFeatures, feature)) {
			return 'x-hide-display';
		}
		return 'zarafa-files-feature-spacer';
	},

	/**
	 * Renderer for the backend column of the accountgrid
	 * @param {String} value The value holds backend name.
	 * @returns {string} return HTML markups
	 */
	backendRenderer: function (value)
	{
		if (Ext.isEmpty(value)) {
			return '';
		}
		return '<span class="icon_16_' + value + ' files_backend_selector">&nbsp;</span>' + value;
	},

	/**
	 * Check if a array contains the needle
	 * @param array
	 * @param needle
	 * @returns {boolean}
	 */
	arrayContains: function (array, needle) {
		var i = array.length;
		while (i--) {
			if (array[i] === needle) {
				return true;
			}
		}
		return false;
	}
};