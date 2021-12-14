Ext.namespace('Zarafa.task.data');

/**
 * @class Zarafa.task.data.TaskRequestButtonNames
 * @extends Zarafa.core.Enum
 *
 * Enum containing all the taskrequest button names.
 * Which will be helpful in distinguishing task request buttons
 * in {@link Zarafa.task.ui.TaskRequestButton TaskRequestButton} base class.
 *
 * @singleton
 */
Zarafa.task.data.TaskRequestButtonNames = Zarafa.core.Enum.create({
  /**
	 * Preserve name for {@link Zarafa.calendar.ui.AcceptButton AcceptButton}.
	 *
	 * @property
	 * @type String
	 */
  ACCEPT: 'acceptButton',

  /**
	 * Preserve name for {@link Zarafa.calendar.ui.DeclineButton DeclineButton}.
	 *
	 * @property
	 * @type String
	 */
  DECLINE: 'declineButton'
});