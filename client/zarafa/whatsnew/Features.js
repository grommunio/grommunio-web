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
    "version": '3.4.0',

	// The following array describes the features that should be shown to the user. Each object in the
	// array should/could contain the following properties that describe a feature:
	// 'title': mandatory
	// 'description': mandatory, can contain HTML
	// 'image_url': mandatory
	// 'icon_url': optional
    "features": [{
        "title": _('Improved categories'),
        "description": _('Categories now have a prominent place in your overviews of Mail, Calendar, Tasks and more.') +
                        '<br><br>' +
                        _('Adding a category is easy and can be done from the overview. Move your mouse over an email to see the "Add category" icon and click it, or right-click an item to open the context menu.'),
        "image_url": 'client/resources/images/whatsnew/improvedcategories.png',
        "icon_url": 'client/resources/images/whatsnew/iconwebapp.png'
    }, {
        "title": _('Flag item for follow up'),
        "description": _('You can now mark email items for follow-up by setting a flag. In the new flags menu you can select the follow-up date. A reminder will be shown that day.') +
                        '<br><br>' +
                        _("The Tasks context provides a complete overview of your to-do's. All tasks and flagged emails will be shown in this to-do list."),
        "image_url": 'client/resources/images/whatsnew/flagitem.png',
        "icon_url": 'client/resources/images/whatsnew/iconwebapp.png'
    }, {
        "title": _('Transformation of flags into follow-ups and categories'),
        "description": _('Your former flagged items are transformed into items with a color category and a "No date" follow-up flag. For example: an item with a blue flag will now have a category named "Blue".') +
                        '<br><br>' +
                        _(' You have the option to rename a color category when you first use it and all items with this category will get updated.'),
        "image_url": 'client/resources/images/whatsnew/transformflags.png',
        "icon_url": 'client/resources/images/whatsnew/iconwebapp.png'
    }, {
        "title": _('Search folders'),
        "description": _('If there is a search query you use frequently you are in luck! After you have completed a search you can now save it as a "search folder" which will show up in your favorites! You can then do the same search again with a single click.'),
        "image_url": 'client/resources/images/whatsnew/searchfolder.png',
        "icon_url": 'client/resources/images/whatsnew/iconwebapp.png'
    }]
};
