Ext.namespace('Zarafa.plugins.filepreviewer');

/**
 * @class Zarafa.plugins.filepreviewer.FileviewerPlugin
 * @extends Zarafa.core.Plugin
 */
Zarafa.plugins.filepreviewer.FileviewerPlugin = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * This method is called by the parent and will initialize all insertion points
	 * and shared components.
	 */
	initPlugin: function () {
		Zarafa.plugins.filepreviewer.FileviewerPlugin.superclass.initPlugin.apply(this, arguments);

		Zarafa.core.data.SharedComponentType.addProperty('filepreviewer.viewpanel');
	},

	/**
	 * Fired when the user doubleclicked on a box
	 * @param {Zarafa.common.ui.BoxField} boxField Parent of the box
	 * @param {Zarafa.common.ui.Box} box The box that has been doubleclicked
	 * @param {Ext.data.Record} record The record that belongs to the box
	 */
	doOpen: function (record) {
		var componentType = Zarafa.core.data.SharedComponentType['filepreviewer.viewpanel'];

		var config = {
			modal     : true,
			autoResize: true
		};

		Zarafa.core.data.UIFactory.openLayerComponent(componentType, record, config);
	},

	/**
	 * Check if the given file is either a PDF file or a ODF file.
	 *
	 * @param path
	 * @returns {boolean}
	 * @private
	 */
	isSupportedDocument: function (path) {
		return path.match(/^.*\.(pdf|od[tps]|jpg|jpeg|png|bmp|gif|mp4|mp3|ogg|webm|wav)$/i) ? true : false;
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * This will bid on a common.create or common.view for a
	 * record with a message class set to IPM or IPM.Note.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function (type, record) {
		var bid = -1;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['filepreviewer.viewpanel']:
				bid = 1;
				break;
			case Zarafa.core.data.SharedComponentType['common.view']:
			{
				if (record instanceof Zarafa.core.data.IPMAttachmentRecord) {
					var filename = record.get('name');
					if (this.isSupportedDocument(filename)) {
						bid = 2; // bit higher then the other plugins to make sure that this plugin is used
					}
				}
				break;
			}
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function (type, record) {
		var component;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['common.view']:
				component = this;
				break;
			case Zarafa.core.data.SharedComponentType['filepreviewer.viewpanel']:
				component = Zarafa.plugins.filepreviewer.ViewerPanel;
				break;
		}
		return component;
	}

});

Zarafa.onReady(function () {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name             : 'filepreviewer',
		displayName      : _('File previewer plugin'),
		about            : Zarafa.plugins.filepreviewer.ABOUT,
		pluginConstructor: Zarafa.plugins.filepreviewer.FileviewerPlugin
	}));
});
