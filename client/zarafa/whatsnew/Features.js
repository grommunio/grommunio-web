/*
 * #dependsFile client/zarafa/Zarafa.js
 */

Ext.namespace('Zarafa.whatsNew');

/**
 * This object describes the new features that should be shown to users one time after updating
 * the WebApp.
 * NOTE: Plugins can add the same property to their main plugin class to communicate new features.
 * WebApp must use urls relative to the root of the WebApp. Plugins must use urls relative to the
 * root directory of the plugin.
 */
Zarafa.whatsNew.Features = {
	// The features described here will only be shown when the version of the WebApp corresponds to
	// the version set here.
    "version": '0.0',

	// The following array describes the features that should be shown to the user. Each object in the
	// array should/could contain the following properties that describe a feature:
	// 'title': mandatory
	// 'description': mandatory, can contain HTML
	// 'image_url': mandatory
	// 'icon_url': optional
    "features": [{
        "title": _('Improved searching'),
        "description": _('Searching in Kopano WebApp and DeskApp just got easier with the new folder selector. Before you start your search you can select which folders your search should target.'),
        "image_url": 'client/resources/images/whatsnew/improvedsearch.png',
        "icon_url": 'client/resources/images/whatsnew/improvedsearch_icon.png'
    },
    {
        "title": _('Improved categories'),
        "description": _('With the new and improved way that Kopano WebApp and DeskApp handle categories it is much simpler to label your messages. The better overview will enhance your productivity.'),
        "image_url": 'client/resources/images/whatsnew/improvedcategories.png'
    }]
};
