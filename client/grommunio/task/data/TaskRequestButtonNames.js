Ext.namespace('Grommunio.task.data');

/**
 * @class Grommunio.task.data.TaskRequestButtonNames
 * @extends Grommunio.core.Enum
 *
 * Enum containing all the taskrequest button names.
 * Which will be helpful in distinguishing task request buttons
 * in {@link Grommunio.task.ui.TaskRequestButton TaskRequestButton} base class.
 *
 * @singleton
 */
Grommunio.task.data.TaskRequestButtonNames = Grommunio.core.Enum.create({
  /**
	 * Preserve name for {@link Grommunio.calendar.ui.AcceptButton AcceptButton}.
	 *
	 * @property
	 * @type String
	 */
  ACCEPT: 'acceptButton',

  /**
	 * Preserve name for {@link Grommunio.calendar.ui.DeclineButton DeclineButton}.
	 *
	 * @property
	 * @type String
	 */
  DECLINE: 'declineButton'
});
