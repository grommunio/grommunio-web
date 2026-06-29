Ext.namespace('Zarafa.plugins.ai.ui');

/**
 * @class Zarafa.plugins.ai.ui.AIActionChips
 * @singleton
 *
 * Renders suggested smart actions as clickable chips. Pure HTML (with an
 * emoji marker per type) so it needs no extra iconset; the hosting window wires
 * a single delegated click handler that maps a chip's data-idx back to its
 * action.
 */
Zarafa.plugins.ai.ui.AIActionChips = {

	/**
	 * Build the chips HTML for a list of actions.
	 * @param {Array} actions
	 * @return {String}
	 */
	renderHtml: function(actions)
	{
		var html = [];
		for (var i = 0; i < actions.length; i++) {
			html.push('<span class="k-ai-chip" data-idx="' + i + '">' +
				Ext.util.Format.htmlEncode(this.label(actions[i])) + '</span>');
		}
		return html.join('');
	},

	/**
	 * A human label for an action chip.
	 * @param {Object} action
	 * @return {String}
	 */
	label: function(action)
	{
		switch (action.type) {
			case 'meeting':
				return '📅 ' + (action.title ? String.format(_('Meeting: {0}'), action.title) : _('Create meeting'));
			case 'task':
				return '✅ ' + (action.title ? String.format(_('Task: {0}'), action.title) : _('Create task'));
			case 'contact':
				return '👤 ' + (action.name ? String.format(_('Add contact: {0}'), action.name) : _('Add contact'));
			case 'reply':
				return '↩️ ' + _('Draft reply');
			default:
				return action.type;
		}
	}
};
