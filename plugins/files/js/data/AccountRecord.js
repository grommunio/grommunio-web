/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.data');

/**
 * @class Grommunio.plugins.files.data.AccountRecordFields
 *
 * These fields will be available in all 'IPM.FilesAccount' type messages.
 */
Grommunio.plugins.files.data.AccountRecordFields = [
	{name: 'id'},
	{name: 'name'},
	{name: 'status'},
	{name: 'status_description'},
	{name: 'backend'},
	{name: 'backend_config'},
	{name: 'backend_features'},
	{name: 'account_sequence', type: 'number'},
	{name: 'cannot_change', type: 'boolean', defaultValue: false}
];

/**
 * @class Grommunio.plugins.files.data.AccountRecordStatus
 *
 * This object contains all valid status codes that an account can have.
 */
Grommunio.plugins.files.data.AccountRecordStatus = {
	OK     : "ok",
	ERROR  : "err",
	NEW    : "new",
	UNKNOWN: "unk"
};

/**
 * @class Grommunio.plugins.files.data.AccountRecordStatus
 *
 * This object contains all available feature codes that an account can have.
 */
Grommunio.plugins.files.data.AccountRecordFeature = {
	QUOTA       : "Quota",
	VERSION_INFO: "VersionInfo",
	SHARING     : "Sharing",
	STREAMING   : "Streaming",
	OAUTH       : "OAUTH"
};

/**
 * @class Grommunio.plugins.files.data.AccountRecord
 * @extends Grommunio.core.data.IPMRecord
 */
Grommunio.plugins.files.data.AccountRecord = Ext.extend(Grommunio.core.data.IPMRecord, {

	/**
	 * Applies all data from an {@link Grommunio.plugins.files.data.AccountRecord AccountRecord}
	 * to this instance. This will update all data.
	 *
	 * @param {Grommunio.plugins.files.data.AccountRecord} record The record to apply to this
	 * @return {Grommunio.plugins.files.data.AccountRecord} this
	 */
	applyData: function (record) {
		this.beginEdit();

		Ext.apply(this.data, record.data);
		Ext.apply(this.modified, record.modified);

		this.dirty = record.dirty;

		this.endEdit(false);

		return this;
	},

	/**
	 * Check if the account support the given feature.
	 *
	 * @param featureName Should be one of Grommunio.plugins.files.data.AccountRecordFeature children.
	 * @return {boolean}
	 */
	supportsFeature: function (featureName) {
		var features = this.get('backend_features') || [];

		return features.some(function(feature) {
			return feature === featureName;
		});
	},

	/**
	 * Check if the account support the given feature.
	 *
	 * @param featureName Should be one of Grommunio.plugins.files.data.AccountRecordFeature children.
	 * @return {boolean}
	 */
	renewOauthToken: function () {
		if(!this.supportsFeature(Grommunio.plugins.files.data.AccountRecordFeature.OAUTH)) {
			return false;
		}

		// show the frontend panel
		Grommunio.plugins.files.backend[this.get('backend')].data.OAUTH.reAuthenticate(this.get('id'));

		return true;
	}
});


Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.FilesAccount', Grommunio.plugins.files.data.AccountRecordFields);
Grommunio.core.data.RecordFactory.setBaseClassToMessageClass('IPM.FilesAccount', Grommunio.plugins.files.data.AccountRecord);