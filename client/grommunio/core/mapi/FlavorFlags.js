Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.FlavorFlags
 * @extends Grommunio.core.Enum
 *
 * Enumerates possible 'flavor' values for RuleActions.
 * The exact value depends on the selected
 * {@link Grommunio.core.mapi.RuleActions Rule Action}.
 *
 * @singleton
 */
Grommunio.core.mapi.FlavorFlags = Grommunio.core.Enum.create({
	/**
	 * Flavor for {@link Grommunio.core.mapi.RuleActions#OP_FORWARD OP_FORWARD}
	 * which indicates that the original sender must be preserved.
	 * @property
	 * @type Number
	 */
	FWD_PRESERVE_SENDER: 1,

	/**
	 * Flavor for {@link Grommunio.core.mapi.RuleActions#OP_FORWARD OP_FORWARD}.
	 * Forwards the message without making any changes to the message
	 * @property
	 * @type Number
	 */
	FWD_DO_NOT_MUNGE_MSG: 2,

	/**
	 * Flavor for {@link Grommunio.core.mapi.RuleActions#OP_FORWARD OP_FORWARD}
	 * which indicates that the messages is forwarded as attachment.
	 * @property
	 * @type Number
	 */
	FWD_AS_ATTACHMENT: 4
});
