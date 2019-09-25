Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.RuleStates
 * @extends Zarafa.core.Enum
 * 
 * Enumerates the different rule states.
 * 
 * @singleton
 */
Zarafa.core.mapi.RuleStates = Zarafa.core.Enum.create({
	/**
	 * Denotes that the rule is disabled for the execution.
	 * @property
	 * @type Number
	 */
	ST_DISABLED : 0,

	/**
	 * Denotes that the rule is enabled for the execution.
	 * @property
	 * @type Number
	 */
	ST_ENABLED : 1,
	
	/**
	 * Denotes that the server has encountered any nonparsing error processing the rule.
	 * @property
	 * @type Number
	 */
	ST_ERROR : 2,

	/**
	 * Denotes that the rule is executed only when a user sets the Out of Office (OOF) state on the mailbox.
	 * @property
	 * @type Number
	 */
	ST_ONLY_WHEN_OOF : 4,

	/**
	 * Denotes that the rule will manage list of recipients when user has set Out of Office state on the mailbox.
	 * @property
	 * @type Number
	 */
	ST_KEEP_OOF_HIST : 8,

	/**
	 * Denotes that the rule evaluation will terminate after executing this rule.
	 * @property
	 * @type Number
	 */
	ST_EXIT_LEVEL : 16,

	/**
	 * Denotes that the evaluation of this rule will be skipped if the delivered message's
	 * PidTagContentFilterSpamConfidenceLevel property has a value of 0xFFFFFFFF.
	 * @property
	 * @type Number
	 */
	ST_SKIP_IF_SCL_IS_SAFE : 32,

	/**
	 * Denotes that the server has encountered rule data from the client that is in an incorrect format,
	 * which caused an error parsing the rule data.
	 * @property
	 * @type Number
	 */
	ST_RULE_PARSE_ERROR : 64,

	/**
	 * Denotes that the rule will clear list of recipients when user has set Out of Office state on the mailbox.
	 * @property
	 * @type Number
	 */
	ST_CLEAR_OOF_HIST : 2147483648
});