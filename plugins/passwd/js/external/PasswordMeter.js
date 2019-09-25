Ext.namespace('Ext.ux.form.field');

/**
 * @class Ext.ux.form.field.PasswordMeter
 * @extends Ext.form.TextField
 * @xtype ux.passwordmeterfield
 *
 * @author Christoph Haas <christoph.h@sprinternet.at>
 * @version 0.1
 * @license MIT License: http://www.opensource.org/licenses/mit-license.php
 *
 * This implementation of the password fields shows a nice graph of how
 * secure the password is.
 * Original implementation for ExtJS 1.1 from http://testcases.pagebakers.com/PasswordMeter/.
 */
Ext.ux.form.field.PasswordMeter = Ext.extend(Ext.form.TextField, {

	/**
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'ux.passwordmeterfield',
			inputType: 'password',
			enableKeyEvents: true
		});

		Ext.ux.form.field.PasswordMeter.superclass.constructor.call(this, config);
	},

	// private
	initComponent:function()
	{
		Ext.ux.form.field.PasswordMeter.superclass.initComponent.apply(this, arguments);
	},

	// private
	reset: function()
	{
		Ext.ux.form.field.PasswordMeter.superclass.reset.call(this);
		this.updateMeter();
	},

	// private
	onKeyUp : function(event)
	{
		Ext.ux.form.field.PasswordMeter.superclass.onKeyUp.call(this);

		this.updateMeter(this.getValue());

		this.fireEvent('keyup', this, event);
	},

	// private
	afterRender: function()
	{
		Ext.ux.form.field.PasswordMeter.superclass.afterRender.call(this);


		var width = this.getEl().getWidth();
		var newID = Ext.id();
		this.strengthMeterID = newID;
		this.scoreBarID = Ext.id();
		var objMeter = Ext.DomHelper.insertAfter(this.getEl(), {
			tag: "div",
			'class': "x-form-strengthmeter",
			'id': this.strengthMeterID,
			'style' : {
				width: width + 'px'
			}
		});
		Ext.DomHelper.append(objMeter, {
			tag: "div",
			'class': "x-form-strengthmeter-scorebar",
			'id': this.scoreBarID
		});

		this.fireEvent('afterrender', this);
	},

	/**
	 * Return the score of the entered password.
	 * It is a number between 0 and 100 where 100 is a very safe password.
	 *
	 * @returns {Number}
	 */
	getScore : function()
	{
		return this.calcStrength(this.getValue());
	},

	/**
	 * Sets the width of the meter, based on the score
	 *
	 * @param {String} val The current password
	 */
	updateMeter : function(val)
	{
		var maxWidth, score, scoreWidth, objMeter, scoreBar;

		objMeter = Ext.get(this.strengthMeterID);
		scoreBar = Ext.get(this.scoreBarID);

		maxWidth = objMeter.getWidth();
		if (val){
			score = this.calcStrength(val);
			scoreWidth = maxWidth - (maxWidth / 100) * score;
			scoreBar.applyStyles({margin: "0 0 0 " + (maxWidth - scoreWidth) + "px"}); // move the overlay to the right
			scoreBar.setWidth(scoreWidth, false); // downsize the overlay
		} else {
			scoreBar.applyStyles({margin: "0"});
			scoreBar.setWidth(maxWidth, false);
		}
	},

	/**
	 * Calculates the strength of a password
	 *
	 * @param {Object} p The password that needs to be calculated
	 * @return {int} intScore The strength score of the password
	 */
	calcStrength: function(p)
	{
		// PASSWORD LENGTH
		var len = p.length, score = len;

		if (len > 0 && len <= 4) { // length 4 or
			// less
			score += len
		} else if (len >= 5 && len <= 7) {
			// length between 5 and 7
			score += 6;
		} else if (len >= 8 && len <= 15) {
			// length between 8 and 15
			score += 12;
		} else if (len >= 16) { // length 16 or more
			score += 18;
		}

		// LETTERS (Not exactly implemented as dictacted above
		// because of my limited understanding of Regex)
		if (p.match(/[a-z]/)) {
			// [verified] at least one lower case letter
			score += 1;
		}
		if (p.match(/[A-Z]/)) { // [verified] at least one upper
			// case letter
			score += 5;
		}
		// NUMBERS
		if (p.match(/\d/)) { // [verified] at least one
			// number
			score += 5;
		}
		if (p.match(/(?:.*?\d){3}/)) {
			// [verified] at least three numbers
			score += 5;
		}

		// SPECIAL CHAR
		if (p.match(/[\!,@,#,$,%,\^,&,\*,\?,_,~]/)) {
			// [verified] at least one special character
			score += 5;
		}
		// [verified] at least two special characters
		if (p.match(/(?:.*?[\!,@,#,$,%,\^,&,\*,\?,_,~]){2}/)) {
			score += 5;
		}

		// COMBOS
		if (p.match(/(?=.*[a-z])(?=.*[A-Z])/)) {
			// [verified] both upper and lower case
			score += 2;
		}
		if (p.match(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)) {
			// [verified] both letters and numbers
			score += 2;
		}
		// [verified] letters, numbers, and special characters
		if (p.match(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\!,@,#,$,%,\^,&,\*,\?,_,~])/)) {
			score += 2;
		}

		return Math.min(Math.round(score * 2), 100);
	}
});

Ext.reg('ux.passwordmeterfield', Ext.ux.form.field.PasswordMeter);