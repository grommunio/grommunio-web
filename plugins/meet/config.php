<?php

define('MEET_DEFAULTS', [
	// Base URL of your Meet installation:
	'server' => 'https://' . $_SERVER['HTTP_HOST'] . '/meet/',

	// Uncomment to enable the plugin by default
	// 'enable' => true,

	// Uncomment to change default meeting opening behaviour, possible values: web browser popup
	'openin' => 'web',

	// Uncomment to hide the main toolbar button by default
	// 'hidetabbarbutton' => true,

	// Uncomment to disable addition of the meeting url to the location instead of overwriting
	// 'locationoverride' => true,

	// Uncomment to disable protection of the url in the meeting location from automatic removal
	// 'nolocationfix' => true,

	// Uncomment to disable addition of the Message template to appointments
	// 'noinvitation' => true,

	// Template for the meeting invitation, must contain %url% as a placeholder for the meeting url, text only
	'invitationmessage' => '
________________________________________________________________________________
grommunio Meet
Join the created meeting with your browser or mobile app.
Click here to join the meeting: - %url% -
________________________________________________________________________________
',
]);
