Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.FlavorFlags
 * @extends Zarafa.core.Enum
 *
 * Enumerates possible 'flavor' values for RuleActions.
 * The exact value depends on the selected
 * {@link Zarafa.core.mapi.RuleActions Rule Action}.
 *
 * @singleton
 */
Zarafa.core.mapi.FlavorFlags = Zarafa.core.Enum.create({
	/**
	 * Flavor for {@link Zarafa.core.mapi.RuleActions#OP_FORWARD OP_FORWARD}
	 * which indicates that the original sender must be preserved.
	 * @property
	 * @type Number
	 */
	FWD_PRESERVE_SENDER : 1,

	/**
	 * Flavor for {@link Zarafa.core.mapi.RuleActions#OP_FORWARD OP_FORWARD}.
	 * Forwards the message without making any changes to the message
	 * @property
	 * @type Number
	 */
	FWD_DO_NOT_MUNGE_MSG : 2,

	/**
	 * Flavor for {@link Zarafa.core.mapi.RuleActions#OP_FORWARD OP_FORWARD}
	 * which indicates that the messages is forwarded as attachment.
	 * @property
	 * @type Number
	 */
	FWD_AS_ATTACHMENT : 4
});
