Ext.namespace('Zarafa.util');

// This class is defined counter-intuitively in extjs-mod,
// because we need the utility function in both extjs-mod as
// well as the WebApp core.

/**
 * @class Zarafa.util.Translations
 * @extends Object
 * Utility class containing utility functions for creating
 * translation strings.
 */
Zarafa.util.Translations = {
	msg: _('The quick brown fox jumps over the lazy dog'),

	/**
	 * This will split a translation string up into different sections.
	 * The intension is to fix problems which might occur when two labels
	 * are used to construct a full sentence, this could happen with for example
	 * paging, where the translation string is "Page X of Y" where the used labels
	 * are: "Page" and "of Y". Obviously this will not translate correctly for
	 * all languages and thus we must attempt to translate the full string, and
	 * split it up ourselves, so we can provide the correct sentences to ExtJs.
	 *
	 * @param {String} translation The translation string which must be split
	 * @param {String} split The separation string which must be found in 'translation'
	 * @return {Array} Array of strings, the first element is the translation string
	 * which comes before the 'split' and the second element is the translation string
	 * which comes after the 'split'. Note that 'split' itself is not within the result.
	 * @static
	 */
	SplitTranslation : function(translation, split)
	{
		if (!Ext.isDefined(split))
			return translation;

		var index = translation.indexOf(split);
		if (index == -1)
			return translation;

		// Find the last non-space character before the split-string
		var endFirst = index - 1;
		while (translation[endFirst] == ' ' && endFirst >= 0)
			endFirst--;

		// Find the first non-space character after the split-string
		var startSecond = index + split.length;
		while (translation[startSecond] == ' ' && startSecond < translation.length)
			startSecond++;

		return [
			translation.substr(0, endFirst + 1),
			translation.substr(startSecond)
		];
	},

	/**
	 * This will split a translation string up into different sections.
	 * The intension is to fix problems which might occur when more then two labels
	 * are used to construct a full sentence, this could happen with for example
	 * recurrence where the translation string is 'Every X Y of every Z month(s)'.
	 * We don't want to translate 'Every', 'of every' and 'month(s)' separately.
	 * Instead we want to translate the full String. And split the translated
	 * string up into the multiple labels.
	 *
	 * @param {String} translation The translation string which must be split
	 * @param {Array} split The separation strings which must be found in 'translation'
	 * @return {Array} Array of strings This contains all pieces of the translation,
	 * including the split strings. 'Every X Y of every Z month(s)' will be returned as:
	 * [ 'Every', 'X', 'Y', 'of every', 'Z', 'month(s)' ].
	 * @static
	 */
	MultiSplitTranslation : function(translation, split)
	{
		// Split must always be an array
		if (!Ext.isArray(split))
			split = [ split ];

		// Prepare our translated pieces, by default the
		// main translation string is our piece
		var pieces = new Ext.util.MixedCollection();
		pieces.add(translation);

		// Time for some magic, for each split string, we are going
		// to loop through all pieces until we find the first piece
		// which contains our split string. We then remove the piece
		// and replace it with the result from SplitTranslation
		// with a reference to which split string we have found.
		for (var i = 0; i < split.length; i++) {
			pieces.each(function(piece, index) {
				// Let SplitTranslation determine if the
				// split string is inside this piece. If it isn't then it will
				// return a single string.
				var splitPiece = Zarafa.util.Translations.SplitTranslation(piece, split[i]);
				if (!Ext.isArray(splitPiece))
					return true;

				// Remove the old piece, we are replacing it with
				// the new pieces.
				pieces.removeAt(index);

				// Depending on the translation it could happen that either
				// the first or the second piece is empty...
				if (!Ext.isEmpty(splitPiece[0])) {
					pieces.insert(index, splitPiece[0]);
					index++;
				}

				// Always insert the reference to the split string which
				// we have found.
				pieces.insert(index, split[i]);
				index++;

				if (!Ext.isEmpty(splitPiece[1])) {
					pieces.insert(index, splitPiece[1]);
					index++;
				}

				// We're done, we don't support the same split string
				// multiple times in the same string.
				return false;
			});
		}

		return pieces.getRange();
	}
};

// This document contains all translations of ExtJs components,
// translations are done using Ext.Override and must _only_ override
// the strings within an ExtJs component.
(function() {
	Ext.apply(Date, {
		dayNames : [
			_('Sunday'),
			_('Monday'),
			_('Tuesday'),
			_('Wednesday'),
			_('Thursday'),
			_('Friday'),
			_('Saturday')
		],

		monthNames : [
			_('January'),
			_('February'),
			_('March'),
			_('April'),
			_('May'),
			_('June'),
			_('July'),
			_('August'),
			_('September'),
			_('October'),
			_('November'),
			_('December')
		]
	});

	Ext.PagingToolbar.tmpPageText = Zarafa.util.Translations.SplitTranslation(_('Page {A} of {0}'), '{A}');
	Ext.override(Ext.PagingToolbar, {
		displayMsg : _('Displaying messages {0} - {1} of {2}'),
		emptyMsg : _('No messages to display'),
		beforePageText : Ext.PagingToolbar.tmpPageText[0],
		afterPageText : Ext.PagingToolbar.tmpPageText[1],
		firstText : _('First Page'),
		prevText : _('Previous Page'),
		nextText : _('Next Page'),
		lastText : _('Last Page'),
		refreshText : _('Refresh')
	});
	delete Ext.PagingToolbar.tmpPageText;

	Ext.override(Ext.DatePicker, {
		todayText : _('Today'),
		okText : '&nbsp;' + _('OK') + '&nbsp;',
		cancelText : _('Cancel'),
		todayTip : _('{0} (Spacebar)'),
		minText : _('This date is before the minimum date'),
		maxText : _('This date is after the maximum date'),
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		format : _('d/m/Y'),
		disabledDaysText : _('Disabled'),
		disabledDatesText : _('Disabled'),
		nextText : _('Next Month (Control+Right)'),
		prevText : _('Previous Month (Control+Left)'),
		monthYearText : _('Choose a month (Control+Up/Down to move years)'),
		// DatePicker prototype has copied the Date.monthNames and Date.dayNames,
		// since we just translated that, we need to copy it here again.
		monthNames : Date.monthNames,
		dayNames : Date.dayNames
	});

	Ext.override(Ext.form.HtmlEditor, {
		createLinkText : _('Please enter the URL for the link') + ':',
		buttonTips: {
			bold : {
				title: _('Bold (Ctrl+B) text'),
				text: _('Make the selected text bold.'),
				cls: 'x-html-editor-tip'
			},
			italic : {
				title: _('Italic (Ctrl+I)'),
				text: _('Make the selected text italic.'),
				cls: 'x-html-editor-tip'
			},
			underline : {
				title: _('Underline (Ctrl+U)'),
				text: _('Underline the selected text.'),
				cls: 'x-html-editor-tip'
			},
			increasefontsize : {
				title: _('Grow Text'),
				text: _('Increase the font size.'),
				cls: 'x-html-editor-tip'
			},
			decreasefontsize : {
				title: _('Shrink Text'),
				text: _('Decrease the font size.'),
				cls: 'x-html-editor-tip'
			},
			backcolor : {
				title: _('Text Highlight Color'),
				text: _('Change the background color of the selected text.'),
				cls: 'x-html-editor-tip'
			},
			forecolor : {
				title: _('Font Color'),
				text: _('Change the color of the selected text.'),
				cls: 'x-html-editor-tip'
			},
			justifyleft : {
				title: _('Align Text Left'),
				text: _('Align text to the left.'),
				cls: 'x-html-editor-tip'
			},
			justifycenter : {
				title: _('Center Text'),
				text: _('Center text in the editor.'),
				cls: 'x-html-editor-tip'
			},
			justifyright : {
				title: _('Align Text Right'),
				text: _('Align text to the right.'),
				cls: 'x-html-editor-tip'
			},
			insertunorderedlist : {
				title: _('Bullet List'),
				text: _('Start a bulleted list.'),
				cls: 'x-html-editor-tip'
			},
			insertorderedlist : {
				title: _('Numbered List'),
				text: _('Start a numbered list.'),
				cls: 'x-html-editor-tip'
			},
			createlink : {
				title: _('Hyperlink'),
				text: _('Make the selected text a hyperlink.'),
				cls: 'x-html-editor-tip'
			},
			sourceedit : {
				title: _('Source Edit'),
				text: _('Switch to source editing mode.'),
				cls: 'x-html-editor-tip'
			}
		}
	});

	Ext.override(Ext.grid.GridView, {
		sortAscText : _('Sort Ascending'),
		sortDescText: _('Sort Descending'),
		columnsText: _('Columns')
	});

	Ext.override(Ext.grid.GroupingView, {
		groupByText : _('Group By This Field'),
		showGroupsText : _('Show in Groups'),
		emptyGroupText : _('(None)')
	});

	Ext.MessageBox.buttonText.ok = _('Ok');
	Ext.MessageBox.buttonText.cancel = _('Cancel');
	Ext.MessageBox.buttonText.yes = _('Yes');
	Ext.MessageBox.buttonText.no = _('No');

	Ext.override(Ext.LoadMask, {
		msg : _('Loading') + '...'
	});

	Ext.override(Ext.form.ComboBox, {
		loadingText : _('Loading') + '...'
	});

	Ext.override(Ext.form.Field, {
		invalidText : _('The value in this field is invalid')
	});

	Ext.override(Ext.form.TextField, {
		minLengthText : _('The minimum length for this field is {0}'),
		maxLengthText : _('The maximum length for this field is {0}'),
		blankText : _('This field is required')
	});

	Ext.override(Ext.form.NumberField, {
		minText : _('The minimum value for this field is {0}'),
		maxText : _('The maximum value for this field is {0}'),
		nanText : _('{0} is not a valid number')
	});

	Ext.override(Ext.form.DateField, {
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		format : _('d/m/Y'),
		disabledDaysText : _('Disabled'),
		disabledDatesText : _('Disabled'),
		minText : _('The date in this field must be equal to or after {0}'),
		maxText : _('The date in this field must be equal to or before {0}'),
		invalidText : _('{0} is not a valid date - it must be in the format {1}')
	});

	Ext.override(Ext.form.CheckboxGroup, {
		blankText : _('You must select at least one item in this group')
	});

	Ext.override(Ext.form.RadioGroup, {
		blankText : _('You must select one item in this group')
	});

	Ext.override(Ext.form.TimeField, {
		minText : _('The time in this field must be equal to or after {0}'),
		maxText : _('The time in this field must be equal to or before {0}'),
		invalidText : _('{0} is not a valid time'),
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		format : _('G:i')
	});

	Ext.override(Ext.grid.GridView, {
		sortAscText : _('Sort Ascending'),
		sortDescText : _('Sort Descending'),
		columnsText : _('Columns')
	});

	Ext.override(Ext.grid.PropertyColumnModel, {
		nameText : _('Name'),
		valueText : _('Value'),
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		dateFormat : _('d/m/Y'),
		trueText: _('true'),
		falseText: _('false')
	});

	Ext.apply(Ext.form.VTypes, {
		emailText : _('This field should be an e-mail address in the format "user@example.com"'),
		urlText : String.format(_('This field should be a URL in the format "{0}"'),  'http:/' + '/www.example.com'),
		alphaText : _('This field should only contain letters and _'),
		alphanumText : _('This field should only contain letters, numbers and _')
	});
})();
