/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.data');

/**
 * @class Grommunio.calendar.data.MeetingRequestButtonNames
 * @extends Grommunio.core.Enum
 *
 * Enum containing all the meetingrequest button names.
 * Which will be helpful in distinguishing meeting request buttons
 * in {@link Grommunio.calendar.ui.MeetingRequestButton MeetingRequestButton} base class.
 *
 * @singleton
 */
Grommunio.calendar.data.MeetingRequestButtonNames = Grommunio.core.Enum.create({
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
    CALENDAR: 'calendarButton',

    /**
	 * Preserve name for ForwardButton.
	 *
	 * @property
	 * @type String
	 */
    FORWARD: 'forwardButton'
});
