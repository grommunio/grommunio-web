/*
 * #dependsFile client/grommunio/core/mapi/Sensitivity.js
 */
Ext.namespace('Grommunio.mail.data');

/**
 * @class Grommunio.mail.data.SensitivityFlags
 * @singleton
 */
Grommunio.mail.data.SensitivityFlags = {
	flags: [{
		value: Grommunio.core.mapi.Sensitivity['NONE'],
		name: Grommunio.core.mapi.Sensitivity.getDisplayName(Grommunio.core.mapi.Sensitivity['NONE'])
	},{
		value: Grommunio.core.mapi.Sensitivity['PERSONAL'],
		name: Grommunio.core.mapi.Sensitivity.getDisplayName(Grommunio.core.mapi.Sensitivity['PERSONAL'])
	},{
		value: Grommunio.core.mapi.Sensitivity['PRIVATE'],
		name: Grommunio.core.mapi.Sensitivity.getDisplayName(Grommunio.core.mapi.Sensitivity['PRIVATE'])
	},{
		value:  Grommunio.core.mapi.Sensitivity['COMPANY_CONFIDENTIAL'],
		name: Grommunio.core.mapi.Sensitivity.getDisplayName(Grommunio.core.mapi.Sensitivity['COMPANY_CONFIDENTIAL'])
	}]
};
