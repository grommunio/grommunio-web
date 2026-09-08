<?php

use PhpCsFixer\Config;
use PhpCsFixer\Finder;

/*
 * PHPCsFixer code style configuration file
 */
$config = new Config();

return $config->
	setIndent("\t")->
	setRules([
		'@PhpCsFixer' => true,
		'native_constant_invocation' => false,
		'blank_line_before_statement' => ['statements' => ['case', 'continue',
			'declare', 'default', 'exit', 'goto', 'phpdoc', 'return', 'switch', 'throw', 'try', 'yield', ]],
		// Preserve deliberate column alignment and hand-wrapped expressions.
		'binary_operator_spaces' => [
			'default' => 'single_space',
			'operators' => ['=' => 'at_least_single_space', '=>' => 'at_least_single_space'],
		],
		'braces_position' => ['functions_opening_brace' => 'same_line', 'classes_opening_brace' => 'same_line'],
		'concat_space' => false,
		'control_structure_continuation_position' => ['position' => 'next_line'],
		'indentation_type' => true,
		'method_argument_space' => [
			'after_heredoc' => true,
			'keep_multiple_spaces_after_comma' => true,
			'on_multiline' => 'ignore',
		],
		'operator_linebreak' => ['only_booleans' => true, 'position' => 'end'],
		'ordered_class_elements' => false,
		'phpdoc_align' => false,
		'phpdoc_to_comment' => ['ignored_tags' => ['scrutinizer']],
		'single_line_comment_style' => false,
		'single_quote' => false,
		'ternary_operator_spaces' => false,
		'yoda_style' => ['equal' => false, 'identical' => false, 'less_and_greater' => false],
	])->
	setFinder(
		Finder::create()->
			exclude(['deploy', 'language', 'node_modules', 'phpfastcache', 'vendor'])->
			in(__DIR__)
	);
