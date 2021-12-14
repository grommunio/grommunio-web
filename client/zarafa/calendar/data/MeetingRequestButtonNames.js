Ext.namespace('Zarafa.calendar.data');

/**
 * @class Zarafa.calendar.data.MeetingRequestButtonNames
 * @extends Zarafa.core.Enum
 *
 * Enum containing all the meetingrequest button names.
 * Which will be helpful in distinguishing meeting request buttons
 * in {@link Zarafa.calendar.ui.MeetingRequestButton MeetingRequestButton} base class.
 *
 * @singleton
 */
Zarafa.calendar.data.MeetingRequestButtonNames = Zarafa.core.Enum.create({
    /**
	 * Preserve name for RemoveFromCalendarButton.
	 *
	 * @property
	 * @type String
	 */
    REMOVEFROMCALENDAR: 'removeFromCalendarButton',

    /**
	 * Preserve name for NoResponseRequiredButton.
	 *
	 * @property
	 * @type String
	 */
    NORESPONSE: 'noResponseButton',

    /**
	 * Preserve name for AcceptButton.
	 *
	 * @property
	 * @type String
	 */
    ACCEPT: 'acceptButton',

    /**
	 * Preserve name for TentativeButton.
	 *
	 * @property
	 * @type String
	 */
    TENTATIVE: 'tentativeButton',

    /**
	 * Preserve name for DeclineButton.
	 *
	 * @property
	 * @type String
	 */
    DECLINE: 'declineButton',

    /**
	 * Preserve name for ProposeNewTimeButton.
	 *
	 * @property
	 * @type String
	 */
    PROPOSENEWTIME: 'proposeNewTimeButton',

    /**
	 * Preserve name for ViewAllProposalsButton.
	 *
	 * @property
	 * @type String
	 */
    VIEWPROPOSALS: 'viewProposalsButton',

    /**
	 * Preserve name for AcceptProposalButton.
	 *
	 * @property
	 * @type String
	 */
    ACCEPTPROPOSAL: 'acceptProposalButton',

    /**
	 * Preserve name for calendarButton.
	 *
	 * @property
	 * @type String
	 */
    CALENDAR: 'calendarButton'
});
