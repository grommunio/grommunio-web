<?php
/*
 * PHPCsFixer code style configuration file
 */
$config = new PhpCsFixer\Config();

return $config->
	setIndent("\t")->
	setRules([
		'@PhpCsFixer' => true,
		'native_constant_invocation' => false,
		'blank_line_before_statement' => ['statements' => ['case', 'continue',
			'declare', 'default', 'exit', 'goto', 'phpdoc', 'return', 'switch', 'throw', 'try', 'yield', ]],
		'braces' => ['position_after_functions_and_oop_constructs' => 'same'],
		'curly_braces_position' => ['functions_opening_brace' => 'same_line', 'classes_opening_brace' => 'same_line'],
		'concat_space' => ['spacing' => 'one'],
		'control_structure_continuation_position' => ['position' => 'next_line'],
		'indentation_type' => true,
		'operator_linebreak' => ['position' => 'end'],
		'ordered_class_elements' => false,
		'single_line_comment_style' => false,
		'single_quote' => false,
		'yoda_style' => ['equal' => false, 'identical' => false, 'less_and_greater' => false],
	])->
	setFinder(
		PhpCsFixer\Finder::create()->
			exclude(['vendor', 'language', 'phpfastcache'])->
			in(__DIR__)
	)
;
