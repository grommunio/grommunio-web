/*
 * #dependsFile client/zarafa/Zarafa.js
 */

Ext.namespace('Zarafa.whatsnew');

/**
 * This object describes the new features that should be shown to users one time after updating
 * the WebApp.
 * NOTE: Plugins can add the same property to their main plugin class to communicate new features.
 * WebApp must use urls relative to the root of the WebApp. Plugins must use urls relative to the
 * root directory of the plugin.
 */
Zarafa.whatsnew.Features = {
	// The features described here will only be shown when the version of the WebApp corresponds to
	// the version set here.
	"version": '3.5.0',

	// The following array describes the features that should be shown to the user. Each object in the
	// array should/could contain the following properties that describe a feature:
	// 'title': mandatory
	// 'description': mandatory, can contain HTML
	// 'image_url': mandatory
	// 'icon_url': optional
	"features": [{
		"title": _('Import / Export'),
		"description": _('Calendar, contact and mail items can be imported and exported from and to WebApp.') +
		'<br><br>' +
		_('Right-click a folder and select the import button. Additionally, items can be imported from the attachment context menu.') +
		_('Exporting can be done from the context menu of an item.'),
		"image_url": 'client/resources/images/whatsnew/importexport.png',
		"icon_url": 'client/resources/images/whatsnew/iconwebapp.png'
		}, {
		"title": _('Icon packs'),
		"description": _('You can now choose between different icons. By default the new Breeze icons are enabled, but if you prefer the classic icons you can change this in the settings.') +
		'<br><br>' +
		_("Go to your settings, open the general tab and select an icon pack to your liking.") +
		'<br><br>' +
		_('Left: Breeze - Right: Classic'),
		"image_url": 'client/resources/images/whatsnew/iconpack.png',
		"icon_url": 'client/resources/images/whatsnew/iconwebapp.png'
		}]
};
