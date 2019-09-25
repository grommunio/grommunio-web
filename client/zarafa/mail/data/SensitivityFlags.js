/*
 * #dependsFile client/zarafa/core/mapi/Sensitivity.js
 */
Ext.namespace('Zarafa.mail.data');

/**
 * @class Zarafa.mail.data.SensitivityFlags
 * @singleton
 */
Zarafa.mail.data.SensitivityFlags = {
	flags : [{
		value: Zarafa.core.mapi.Sensitivity['NONE'],
		name: Zarafa.core.mapi.Sensitivity.getDisplayName(Zarafa.core.mapi.Sensitivity['NONE'])
	},{
		value: Zarafa.core.mapi.Sensitivity['PERSONAL'],
		name: Zarafa.core.mapi.Sensitivity.getDisplayName(Zarafa.core.mapi.Sensitivity['PERSONAL'])
	},{
		value: Zarafa.core.mapi.Sensitivity['PRIVATE'],
		name: Zarafa.core.mapi.Sensitivity.getDisplayName(Zarafa.core.mapi.Sensitivity['PRIVATE'])
	},{
		value:  Zarafa.core.mapi.Sensitivity['COMPANY_CONFIDENTIAL'],
		name: Zarafa.core.mapi.Sensitivity.getDisplayName(Zarafa.core.mapi.Sensitivity['COMPANY_CONFIDENTIAL'])
	}]
};
