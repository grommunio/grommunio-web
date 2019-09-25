Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.Restrictions
 * @extends Zarafa.core.Enum
 * 
 * Enumerates the different flags used in restriction.
 * 
 * @singleton
 */
Zarafa.core.mapi.Restrictions = Zarafa.core.Enum.create({
	/**
	 * Denotes restriction type that applies bitwise AND operation to restrictions.
	 * @property
	 * @type Number
	 */
	RES_AND	: 0x00000000,

	/**
	 * Denotes restriction type that applies bitwise OR operation to restrictions.
	 * @property
	 * @type Number
	 */
	RES_OR : 0x00000001,

	/**
	 * Denotes restriction type that applies bitwise NOT operation to a restriction.
	 * @property
	 * @type Number
	 */
	RES_NOT : 0x00000002,

	/**
	 * Denotes restriction type that is used for fuzzy content search in string properties.
	 * @property
	 * @type Number
	 */
	RES_CONTENT : 0x00000003,

	/**
	 * Denotes restriction type that is used for checking values of properties using logical operators.
	 * @property
	 * @type Number
	 */
	RES_PROPERTY : 0x00000004,

	/**
	 * Denotes restriction type that is used for comparing two properties.
	 * @property
	 * @type Number
	 */
	RES_COMPAREPROPS : 0x00000005,

	/**
	 * Denotes restriction type that is used for comparing value of property using bitmask operators.
	 * @property
	 * @type Number
	 */
	RES_BITMASK : 0x00000006,

	/**
	 * Denotes restriction type that is used for checking size of a property.
	 * @property
	 * @type Number
	 */
	RES_SIZE : 0x00000007,

	/**
	 * Denotes restriction type that is used for checking existance of a property.
	 * @property
	 * @type Number
	 */
	RES_EXIST : 0x00000008,

	/**
	 * Denotes restriction type that is used for checking value of internal properties that are
	 * stored in attachment and recipients table.
	 * @property
	 * @type Number
	 */
	RES_SUBRESTRICTION : 0x00000009,

	/**
	 * @property
	 * @type Number
	 */
	RES_COMMENT	: 0x0000000A,

	/**
	 * Denotes full string search for RES_CONTENT restriction type.
	 * @property
	 * @type Number
	 */
	FL_FULLSTRING : 0x00000000,

	/**
	 * Denotes sub string search for RES_CONTENT restriction type.
	 * @property
	 * @type Number
	 */
	FL_SUBSTRING : 0x00000001,

	/**
	 * Denotes prefix string search for RES_CONTENT restriction type.
	 * @property
	 * @type Number
	 */
	FL_PREFIX :	0x00000002,

	/**
	 * Denotes case insensitive string search for RES_CONTENT restriction type.
	 * @property
	 * @type Number
	 */
	FL_IGNORECASE : 0x00010000,

	/**
	 * Denotes space ignoring string search for RES_CONTENT restriction type.
	 * @property
	 * @type Number
	 */
	FL_IGNORENONSPACE : 0x00020000,

	/**
	 * Denotes loose type string search for RES_CONTENT restriction type.
	 * @property
	 * @type Number
	 */
	FL_LOOSE : 0x00040000,

	/**
	 * Denotes less than (<) operator for RES_PROPERTY restriction type.
	 * @property
	 * @type Number
	 */
	RELOP_LT : 0x00000000,

	/**
	 * Denotes less than or equal (<=) operator for RES_PROPERTY restriction type.
	 * @property
	 * @type Number
	 */
	RELOP_LE : 0x00000001,

	/**
	 * Denotes greater than (>) operator for RES_PROPERTY restriction type.
	 * @property
	 * @type Number
	 */
	RELOP_GT : 0x00000002,

	/**
	 * Denotes greater than or equal (>=) operator for RES_PROPERTY restriction type.
	 * @property
	 * @type Number
	 */
	RELOP_GE : 0x00000003,

	/**
	 * Denotes equal (==) operator for RES_PROPERTY restriction type.
	 * @property
	 * @type Number
	 */
	RELOP_EQ : 0x00000004,

	/**
	 * Denotes not equal (!=) operator for RES_PROPERTY restriction type.
	 * @property
	 * @type Number
	 */
	RELOP_NE : 0x00000005,

	/**
	 * Denotes regular expression (LIKE) for RES_PROPERTY restriction type.
	 * @property
	 * @type Number
	 */
	RELOP_RE : 0x00000006,

	/**
	 * Denotes equality of value (== 0) after applying mask for RES_BITMASK restriction type.
	 * @property
	 * @type Number
	 */
	BMR_EQZ : 0x00000000,

	/**
	 * Denotes non equality of value (!= 0) after applying mask for RES_BITMASK restriction type.
	 * @property
	 * @type Number
	 */
	BMR_NEZ : 0x00000001,

	// internal constants for restrictions
	/**
	 * Denotes propvalue.
	 * @property
	 * @type Number
	 */
	VALUE : 0,

	/**
	 * Denotes relation operator for comparison.
	 * @property
	 * @type Number
	 */
	RELOP : 1,

	/**
	 * Denotes fuzzy level to search in string property.
	 * @property
	 * @type Number
	 */
	FUZZYLEVEL : 2,

	/**
	 * Denotes value of size for comparison.
	 * @property
	 * @type Number
	 */
	CB : 3,

	/**
	 * Denotes type of bitmask (BMR_xxx).
	 * @property
	 * @type Number
	 */
	ULTYPE : 4,

	/**
	 * Denotes value of bitmask to compare after applying bitmask.
	 * @property
	 * @type Number
	 */
	ULMASK : 5,

	/**
	 * Denotes property tag.
	 * @property
	 * @type Number
	 */
	ULPROPTAG : 6,

	/**
	 * Denotes property tag (to use in RES_COMPAREPROPS as 1st property).
	 * @property
	 * @type Number
	 */
	ULPROPTAG1 : 7,

	/**
	 * Denotes property tag (to use in RES_COMPAREPROPS as 2nd property).
	 * @property
	 * @type Number
	 */
	ULPROPTAG2 : 8,

	/**
	 * Denotes property list structure (to use in RES_COMMENT).
	 * @property
	 * @type Number
	 */
	PROPS : 9,

	/**
	 * Denotes sub restriction (to be used in RES_COMMENT and RES_SUBRESTRICTION).
	 * @property
	 * @type Number
	 */
	RESTRICTION : 10
});