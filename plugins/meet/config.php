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

	// Plain text template for the meeting invitation (used in plain text editors),
	// must contain %url% as a placeholder for the meeting url
	'invitationmessage' => '
________________________________________________________________________________
grommunio Meet
Join the created meeting with your browser or mobile app.
Click here to join the meeting: - %url% -
________________________________________________________________________________
',

	// HTML template for the meeting invitation (used in HTML editors),
	// must contain %url% as a placeholder for the meeting url.
	// Uses inline styles for maximum email client compatibility.
	'invitationhtml' => '<div style="max-width:520px;margin:16px 0;font-family:helvetica,arial,sans-serif;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;background:#ffffff;">'
		. '<div style="background:linear-gradient(135deg,#0067b1 0%,#0098e3 100%);padding:20px 24px;">'
		.   '<table cellpadding="0" cellspacing="0" border="0"><tr>'
		.     '<td style="vertical-align:middle;padding-right:14px;">'
		.       '<div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;text-align:center;line-height:40px;">'
		.         '<img src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2722%27 height=%2722%27 fill=%27%23fff%27 viewBox=%270 0 24 24%27%3E%3Cpath d=%27M4.5 8.75A2.25 2.25 0 0 1 6.75 6.5h6.5a2.25 2.25 0 0 1 2.25 2.25v.727l3.386-1.878A.75.75 0 0 1 20 8.255v7.495a.75.75 0 0 1-1.114.656L15.5 14.528v.722a2.25 2.25 0 0 1-2.25 2.25h-6.5A2.25 2.25 0 0 1 4.5 15.25v-6.5Z%27/%3E%3C/svg%3E" alt="" width="22" height="22" style="vertical-align:middle;" />'
		.       '</div>'
		.     '</td>'
		.     '<td style="vertical-align:middle;">'
		.       '<div style="font-size:18px;font-weight:600;color:#ffffff;line-height:1.3;">grommunio Meet</div>'
		.       '<div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:2px;">Video Conference</div>'
		.     '</td>'
		.   '</tr></table>'
		. '</div>'
		. '<div style="padding:24px;">'
		.   '<p style="margin:0 0 20px;color:#333333;font-size:14px;line-height:1.6;">'
		.     'You are invited to a video conference. Join with your browser or mobile app.'
		.   '</p>'
		.   '<table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;"><tr><td style="border-radius:8px;background:#0067b1;text-align:center;">'
		.     '<a href="%url%" style="display:inline-block;padding:12px 36px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">'
		.       'Join Meeting'
		.     '</a>'
		.   '</td></tr></table>'
		.   '<p style="margin:0;font-size:12px;color:#999999;word-break:break-all;line-height:1.5;">'
		.     '<span style="color:#666666;font-weight:500;">Meeting link:</span><br/>'
		.     '<a href="%url%" style="color:#0067b1;text-decoration:none;">%url%</a>'
		.   '</p>'
		. '</div>'
		. '</div>',
]);
