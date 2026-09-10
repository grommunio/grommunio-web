<?php

/** Threading headers inherited by a response, independent of php-mapi. */
if (function_exists('mapi_msgstore_openentry')) {
	echo "Threading property checks skipped with php-mapi loaded\n";

	return;
}

foreach (['PR_CONVERSATION_INDEX', 'PR_CONVERSATION_TOPIC', 'PR_NORMALIZED_SUBJECT', 'PR_INTERNET_MESSAGE_ID',
	'PR_INTERNET_REFERENCES', 'PR_IN_REPLY_TO_ID', 'MAPI_E_NO_SUPPORT'] as $index => $constant) {
	define($constant, $index + 200);
}
class MAPIException extends Exception {
	public function setTitle($title) {}

	public function setDisplayMessage($message) {}
}
function getPropIdsFromStrings($store, $names) {
	return [];
}
function mapi_getprops($message, $tags = null) {
	return $message === 'unreadable' ? false : $message;
}
require_once dirname(__DIR__) . '/includes/core/class.operations.php';

$checks = 0;
function threadingCheck(bool $condition, string $label): void {
	if (!$condition) {
		throw new RuntimeException($label);
	}
	++$GLOBALS['checks'];
}

$operations = new Operations();
$original = [
	PR_INTERNET_MESSAGE_ID => '<orig@example.test>',
	PR_INTERNET_REFERENCES => '<first@example.test>',
	PR_CONVERSATION_INDEX => str_repeat('I', 22),
	PR_NORMALIZED_SUBJECT => 'Topic',
];
$reply = $operations->threadingProperties($original, true, []);
threadingCheck($reply[PR_IN_REPLY_TO_ID] === '<orig@example.test>', 'Reply names the original message id');
threadingCheck($reply[PR_INTERNET_REFERENCES] === '<first@example.test> <orig@example.test>', 'Reply extends the references chain');
threadingCheck(strlen($reply[PR_CONVERSATION_INDEX]) === 27 && str_starts_with($reply[PR_CONVERSATION_INDEX], str_repeat('I', 22)), 'Reply appends one child block to the conversation index');
threadingCheck($reply[PR_CONVERSATION_TOPIC] === 'Topic', 'Reply inherits the topic from the normalized subject');

$forward = $operations->threadingProperties($original, false, [PR_CONVERSATION_TOPIC => 'Kept']);
threadingCheck(!isset($forward[PR_IN_REPLY_TO_ID], $forward[PR_INTERNET_REFERENCES]), 'Forward carries no In-Reply-To or References');
threadingCheck($forward[PR_CONVERSATION_TOPIC] === 'Kept', 'Existing topic wins over the original');

$second = $operations->threadingProperties($original, true, $reply);
threadingCheck($second[PR_CONVERSATION_INDEX] === $reply[PR_CONVERSATION_INDEX], 'A second pass does not append another child block');
threadingCheck($operations->threadingProperties('unreadable', true, ['x' => 1]) === ['x' => 1], 'Unreadable source leaves the properties untouched');
threadingCheck($operations->threadingProperties([PR_CONVERSATION_INDEX => 'short'], true, []) === [], 'Short conversation index is not extended');

echo "OK: {$checks} threading property assertions\n";
