Ext.namespace('Zarafa.task.data');

/**
 * @class Zarafa.task.data.SearchFields
 * Search fields for search bar
 * @singleton
 */
Zarafa.task.data.SearchFields = [{
	name : _('All text fields'),
	value : 'subject body categories owner companies'
}, {
	name : _('Subject'),
	value : 'subject'
}, {
	name : _('Categories'),
	value : 'categories'
}, {
	name : _('Body'),
	value : 'body'
}, {
	name : _('Owner'),
	value : 'owner'
}, {
	name : _('Companies'),
	value : 'companies'
}, {
	name : _('Due Date'),
	value : 'duedate'
}, {
	name : _('Start Date'),
	value : 'startdate'
}];
