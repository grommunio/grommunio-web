/*
 * #dependsFile client/zarafa/core/mapi/Restrictions.js
 */
Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.RestrictionFactory
 * 
 * Static methods for creating restrictions. Prop tags used for this restrictions
 * are actual constants used in php, eg. for display name property constant in php is PR_DISPLAY_NAME,
 * so we use 'PR_DISPLAY_NAME' as string in restrictions and that string is converted to actual constant
 * in php. for named constants we don't have any constants defined in php so for that we have to use
 * its hex value in string, like '0x80B5001E'. if we somehow dump all the prop tags of mapi to javascript
 * then we can use its hex value directly instead of using its string value.
 * 
 * @singleton
 */
Zarafa.core.data.RestrictionFactory = {
	/**
	 * creates RES_AND restriction which applies bitwise AND operation between restrictions.
	 * @param {Array} restrictionsArray array of restriction that should be combined using
	 * RES_AND restriction.
	 * @return {Array} RES_AND restriction.
	 */
	createResAnd : function(restrictionsArray) {
		return [
			Zarafa.core.mapi.Restrictions.RES_AND,
			restrictionsArray.clone()
		];
	},

	/**
	 * creates RES_OR restriction which applies bitwise OR operation between restrictions.
	 * @param {Array} restrictionsArray array of restriction that should be combined using
	 * RES_OR restriction.
	 * @return {Array} RES_OR restriction.
	 */
	createResOr : function(restrictionsArray) {
		return [
			Zarafa.core.mapi.Restrictions.RES_OR,
			restrictionsArray.clone()
		];
	},

	/**
	 * creates RES_NOT restriction which applies logical NOT operation on a sub restriction.
	 * @param {Array} subRestriction restriction whose values should be inverted.
	 * @return {Object} RES_NOT restriction.
	 */
	createResNot : function(subRestriction) {
		return [
			Zarafa.core.mapi.Restrictions.RES_NOT,
			subRestriction
		];
	},

	/**
	 * creates RES_COMPAREPROPS restriction which compares two property values.
	 * @param {Number} propTag1 property tag of first property that should be compared.
	 * @param {Number} propTag2 property tag of second property that should be compared.
	 * @return {Array} RES_COMPAREPROPS restriction.
	 */
	createResCompareProps : function(propTag1, propTag2) {
		var res = [],
			resCondition = Zarafa.core.mapi.Restrictions.RES_COMPAREPROPS,
			resValues = {};

		resValues[Zarafa.core.mapi.Restrictions.ULPROPTAG1] = propTag1;
		resValues[Zarafa.core.mapi.Restrictions.ULPROPTAG2] = propTag2;

		res.push(resCondition);
		res.push(resValues);

		return res;
	},

	/**
	 * creates RES_SUBRESTRICTION restriction which is used for placing a restriction on properties
	 * that holds object pointers for attachment and recipient tables.
	 * @param {Number} propTag property tag of property (can be PR_MESSAGE_ATTACHMENTS or PR_MESSAGE_RECIPIENTS).
	 * @param {Array} subRestriction sub restriction that will be applied to property of table indicated by propTag.
	 * @return {Array} RES_SUBRESTRICTION restriction.
	 */
	createResSubRestriction : function(propTag, subRestriction) {
		var res = [],
			resCondition = Zarafa.core.mapi.Restrictions.RES_SUBRESTRICTION,
			resValues = {};

		resValues[Zarafa.core.mapi.Restrictions.ULPROPTAG] = propTag;
		resValues[Zarafa.core.mapi.Restrictions.RESTRICTION] = subRestriction;

		res.push(resCondition);
		res.push(resValues);

		return res;
	},

	/**
	 * creates a property structure to use in RES_COMMENT restriction (similar to SPropValue structure in mapi).
	 * For multi valued properties, propTag and propTagForValue will be different propTag will contain property tag
	 * of multi valued property and propTagForValue will contain single valued counter part of that propTag.
	 * for categories multi valued property tag is 0x8502101E and single valued property tag is 0x8502001E.
	 * @param {String} propTag property tag of the property.
	 * @param {Mixed} propValue value of the property.
	 * @param {String} propTagForValue single valued counter part of multi valued properties.
	 * @return {Array} property structure.
	 */
	createPropertyObject : function(propTag, propValue, propTagForValue) {
		var prop = [];

		if(Ext.isEmpty(propTagForValue)) {
			propTagForValue = propTag;
		}

		prop[Zarafa.core.mapi.Restrictions.ULPROPTAG] = propTag;
		prop[Zarafa.core.mapi.Restrictions.VALUE] = {};
		prop[Zarafa.core.mapi.Restrictions.VALUE][propTagForValue] = propValue;

		return prop;
	},

	/**
	 * creates RES_COMMENT restriction which is used for adding comments to restrictions which is ignored
	 * by mapi functions. in a special case this can be used in RES_SUBRESTRICTION to hold RES_PROPERTY restriction
	 * that will be applied on given property list.
	 * @param {Array} subRestriction sub restriction that will be applied to RES_SUBRESTRICTION.
	 * @param {Object} propertiesArray array of property list structure created by {@link #createPropertyObject}.
	 * @return {Array} RES_SUBRESTRICTION restriction.
	 */
	dataResComment : function(subRestriction, propertiesArray) {
		var res = [];
		var resCondition = Zarafa.core.mapi.Restrictions.RES_COMMENT;
		var resValues = {};

		resValues[Zarafa.core.mapi.Restrictions.RESTRICTION] = subRestriction;
		resValues[Zarafa.core.mapi.Restrictions.PROPS] = propertiesArray;

		res.push(resCondition);
		res.push(resValues);

		return res;
	},

	/**
	 * creates RES_PROPERTY restriction which is used to check value of properties using logical operators.
	 * For multi valued properties, propTag and propTagForValue will be different propTag will contain property tag
	 * of multi valued property and propTagForValue will contain single valued counter part of that propTag.
	 * for categories multi valued property tag is 0x8502101E and single valued property tag is 0x8502001E.
	 * @param {String} propTag property tag of property whose value should be checked.
	 * @param {Number} relOp relational operator that will be used for comparison.
	 * @param {Mixed} propValue value that should be used for checking.
	 * @param {String} propTagForValue property tag that should be used in value, only for multi valued properties.
	 * @return {Array} RES_PROPERTY restriction.
	 */
	dataResProperty : function(propTag, relOp, propValue, propTagForValue) {
		var res = [],
			resCondition = Zarafa.core.mapi.Restrictions.RES_PROPERTY,
			resValues = {};

		if(Ext.isEmpty(propTagForValue)) {
			propTagForValue = propTag;
		}

		resValues[Zarafa.core.mapi.Restrictions.RELOP] = relOp;
		resValues[Zarafa.core.mapi.Restrictions.ULPROPTAG] = propTag;
		resValues[Zarafa.core.mapi.Restrictions.VALUE] = {};
		resValues[Zarafa.core.mapi.Restrictions.VALUE][propTagForValue] = propValue;

		res.push(resCondition);
		res.push(resValues);

		return res;
	},

	/**
	 * creates RES_EXIST restriction which is used to check existance of a property.
	 * @param {String} propTag property tag of property whose existance should be checked.
	 * @return {Array} RES_EXIST restriction.
	 */
	dataResExist : function(propTag) {
		var res = [],
			resCondition = Zarafa.core.mapi.Restrictions.RES_EXIST,
			resValues = {};

		resValues[Zarafa.core.mapi.Restrictions.ULPROPTAG] = propTag;

		res.push(resCondition);
		res.push(resValues);

		return res;
	},

	/**
	 * creates RES_SIZE restriction which is used to check size of property's value.
	 * @param {String} propTag property tag of property whose size of value should be checked.
	 * @param {Number} relOp relational operator for comparing sizes.
	 * @param {Number} sizeValue size of value which will be used for comparison.
	 * @return {Array} RES_SIZE restriction.
	 */
	dataResSize : function(propTag, relOp, sizeValue) {
		var res = [],		
			resCondition = Zarafa.core.mapi.Restrictions.RES_SIZE,
			resValues = {};

		resValues[Zarafa.core.mapi.Restrictions.ULPROPTAG] = propTag;
		resValues[Zarafa.core.mapi.Restrictions.RELOP] = relOp;
		resValues[Zarafa.core.mapi.Restrictions.CB] = sizeValue;

		res.push(resCondition);
		res.push(resValues);

		return res;
	},

	/**
	 * creates RES_BITMASK restriction which is used to check property's value after applying bitmask.
	 * @param {String} propTag property tag of property whose size of value should be checked.
	 * @param {Number} bitMaskType type of bitmask to be applied.
	 * @param {Number} bitMaskValue value that should be compared after applying bitmask to original value.
	 * @return {Array} RES_BITMASK restriction.
	 */
	dataResBitmask : function(propTag, bitMaskType, bitMaskValue) {
		var res = [],
			resCondition = Zarafa.core.mapi.Restrictions.RES_BITMASK,
			resValues = {};

		resValues[Zarafa.core.mapi.Restrictions.ULPROPTAG] = propTag;
		resValues[Zarafa.core.mapi.Restrictions.ULTYPE] = bitMaskType;
		resValues[Zarafa.core.mapi.Restrictions.ULMASK] = bitMaskValue;

		res.push(resCondition);
		res.push(resValues);

		return res;
	},

	/**
	 * creates RES_CONTENT restriction which is used to fuzzy search a property's value.
	 * For multi valued properties, propTag and propTagForValue will be different propTag will contain property tag
	 * of multi valued property and propTagForValue will contain single valued counter part of that propTag.
	 * for categories multi valued property tag is 0x8502101E and single valued property tag is 0x8502001E.
	 * @param {String} propTag property tag of property whose value should be checked.
	 * @param {Number} fuzzyLevel type of fuzzy search that should be applied.
	 * @param {Mixed} propValue value that should be used for checking.
	 * @param {String} propTagForValue property tag that should be used in value, only for multi valued properties.
	 * @return {Array} RES_CONTENT restriction.
	 */
	dataResContent : function(propTag, fuzzyLevel, propValue, propTagForValue) {
		var res = [],
			resCondition = Zarafa.core.mapi.Restrictions.RES_CONTENT,
			resValues = {};

		if(Ext.isEmpty(propTagForValue)) {
			propTagForValue = propTag;
		}

		// default is FL_FULLSTRING
		resValues[Zarafa.core.mapi.Restrictions.FUZZYLEVEL] = Zarafa.core.mapi.Restrictions.FL_FULLSTRING;
		if(Ext.isObject(fuzzyLevel)) {
			Ext.each(fuzzyLevel, function(fuzzyFlag) {
				resValues[Zarafa.core.mapi.Restrictions.FUZZYLEVEL] += fuzzyFlag;
			});
		} else {
			resValues[Zarafa.core.mapi.Restrictions.FUZZYLEVEL] = fuzzyLevel;
		}
		resValues[Zarafa.core.mapi.Restrictions.ULPROPTAG] = propTag;
		resValues[Zarafa.core.mapi.Restrictions.VALUE] = {};
		resValues[Zarafa.core.mapi.Restrictions.VALUE][propTagForValue] = propValue;

		res.push(resCondition);
		res.push(resValues);

		return res;
	}
};
