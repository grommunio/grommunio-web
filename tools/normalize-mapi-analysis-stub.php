<?php

declare(strict_types=1);

/**
 * Normalize the executable php-mapi test stub for static analysis.
 *
 * The upstream stub represents extension resources with a userland class named
 * `resource` and returns one fixed value from every function. Those choices are
 * useful for lightweight unit tests, but they give a static analyzer the wrong
 * model: a class is not PHP's resource pseudo-type, and successful/error paths
 * appear to be constant. This script is only run against Scrutinizer's pinned,
 * disposable dependency checkout.
 */
const EXPECTED_FUNCTION_COUNT = 120;
const EXPECTED_RESOURCE_FUNCTION_COUNT = 29;
const EXPECTED_PROPERTY_MAP_FUNCTION_COUNT = 1;
const EXPECTED_TABLE_ROWS_FUNCTION_COUNT = 2;
const EXPECTED_STUB_SHA256 = '0c38a1b6cc7db2c65bb152bd1624510f5a5773b33062d3779a483e12ee4c97ba';
const NORMALIZED_STUB_SHA256 = '7f53d04d39120cb571d47023d5b39b35ae95ffc74e0743af6a0eadc896b19de3';

$checkOnly = $argc === 3 && $argv[1] === '--check';
$normalize = $argc === 2 && $argv[1] !== '--check';
if (!$normalize && !$checkOnly) {
	fwrite(STDERR, "Usage: php tools/normalize-mapi-analysis-stub.php [--check] <stub-file>\n");

	exit(64);
}

$stubFile = $argv[$checkOnly ? 2 : 1];
$source = file_get_contents($stubFile);
if (!is_string($source)) {
	fwrite(STDERR, "Unable to read MAPI stub: {$stubFile}\n");

	exit(66);
}

$sourceHash = hash('sha256', $source);
if ($sourceHash === NORMALIZED_STUB_SHA256) {
	fwrite(STDOUT, $checkOnly ? "MAPI static-analysis model is valid\n" : "MAPI static-analysis model is already normalized\n");

	exit(0);
}
if ($checkOnly) {
	fwrite(STDERR, "MAPI static-analysis model does not match the reviewed normalized model: {$sourceHash}\n");

	exit(65);
}
if ($sourceHash !== EXPECTED_STUB_SHA256) {
	fwrite(STDERR, "Unexpected MAPI stub contents; refusing to rewrite an unverified file\n");

	exit(65);
}

if (substr_count($source, 'class resource {}') !== 1) {
	fwrite(STDERR, "Unexpected MAPI stub: fake resource class was not found exactly once\n");

	exit(65);
}

$functionPattern = '/^function (?<name>[A-Za-z_][A-Za-z0-9_]*)\((?<parameters>.*)\): (?<return>[A-Za-z_|?\\\]+) \{\R\treturn ?(?<value>.*);\R\}$/m';
$functionCount = preg_match_all($functionPattern, $source);
if ($functionCount !== EXPECTED_FUNCTION_COUNT) {
	fwrite(STDERR, sprintf("Unexpected MAPI stub: found %d simple functions, expected %d\n", $functionCount, EXPECTED_FUNCTION_COUNT));

	exit(65);
}

$source = str_replace(
	'class resource {}',
	'// The analysis model uses PHPDoc resource types instead of a fake userland class.',
	$source,
);

// MAPI's union return values use false as the error sentinel, never true.
$source = preg_replace('/(@return\s+(?:array|int|resource|string))\|bool\b/', '$1|false', $source);
$source = preg_replace('/(@param\s+)\?resource\b/', '$1null|resource', $source);
if (!is_string($source)) {
	fwrite(STDERR, "Unable to normalize MAPI PHPDoc types\n");

	exit(70);
}

$source = str_replace(
	[
		" * @return mixed\n */\nfunction mapi_table_queryallrows",
		" * @return mixed\n */\nfunction mapi_table_queryrows",
		" * @return mixed\n */\nfunction mapi_getprops",
	],
	[
		" * @return array<int, array<int, mixed>>\n */\nfunction mapi_table_queryallrows",
		" * @return array<int, array<int, mixed>>\n */\nfunction mapi_table_queryrows",
		" * @return array<int, mixed>\n */\nfunction mapi_getprops",
	],
	$source,
	$associativeArrayDocs,
);
if ($associativeArrayDocs !== EXPECTED_PROPERTY_MAP_FUNCTION_COUNT + EXPECTED_TABLE_ROWS_FUNCTION_COUNT) {
	fwrite(STDERR, "Unable to normalize MAPI associative-array PHPDoc types\n");

	exit(70);
}

$replacedFunctions = 0;
$resourceFunctions = 0;
$propertyMapFunctions = 0;
$tableRowsFunctions = 0;
$source = preg_replace_callback(
	$functionPattern,
	static function (array $matches) use (&$replacedFunctions, &$resourceFunctions, &$propertyMapFunctions, &$tableRowsFunctions): string {
		++$replacedFunctions;
		$parameters = preg_replace('/\??resource\s+(&?\$[A-Za-z_][A-Za-z0-9_]*)/', 'mixed $1', $matches['parameters']);
		if (!is_string($parameters)) {
			throw new RuntimeException('Unable to normalize MAPI resource parameter');
		}

		$isPropertyMap = $matches['name'] === 'mapi_getprops';
		$isTableRows = in_array($matches['name'], ['mapi_table_queryallrows', 'mapi_table_queryrows'], true);
		$returnType = $isPropertyMap || $isTableRows ? 'array' : preg_replace('/^(array|int|resource|string)\|bool$/', '$1|false', $matches['return']);
		if (!is_string($returnType)) {
			throw new RuntimeException('Unable to normalize MAPI return type');
		}
		if ($isPropertyMap) {
			++$propertyMapFunctions;
		}
		if ($isTableRows) {
			++$tableRowsFunctions;
		}
		if ($returnType === 'resource|false') {
			++$resourceFunctions;
		}

		$body = match (true) {
			$isPropertyMap => "return (array) json_decode((string) getenv('MAPI_ANALYSIS_PROPERTIES'), true);",
			$isTableRows => "return array_fill(0, random_int(0, 2), (array) json_decode((string) getenv('MAPI_ANALYSIS_TABLE_ROW'), true));",
			default => match ($returnType) {
				'void' => 'return;',
				'bool' => 'return random_int(0, 1) === 1;',
				'int' => 'return random_int(PHP_INT_MIN, PHP_INT_MAX);',
				'int|false' => 'return random_int(0, 1) === 1 ? random_int(PHP_INT_MIN, PHP_INT_MAX) : false;',
				'string' => "return random_int(0, 1) === 1 ? '' : bin2hex(random_bytes(1));",
				'string|false' => 'return random_int(0, 1) === 1 ? bin2hex(random_bytes(1)) : false;',
				'array' => "return (array) json_decode((string) getenv('MAPI_ANALYSIS_ARRAY'), true);",
				'array|false' => "return random_int(0, 1) === 1 ? (array) json_decode((string) getenv('MAPI_ANALYSIS_ARRAY'), true) : false;",
				'resource|false' => "return random_int(0, 1) === 1 ? fopen('php://memory', 'r') : false;",
				'mixed' => "return json_decode((string) getenv('MAPI_ANALYSIS_VALUE'), true);",
				default => throw new RuntimeException("Unsupported MAPI stub return type: {$returnType}"),
			},
		};

		// `resource` is a PHPDoc pseudo-type and cannot be a userland native hint.
		$returnDeclaration = $returnType === 'resource|false' ? ': mixed' : ": {$returnType}";

		return "function {$matches['name']}({$parameters}){$returnDeclaration} {\n\t{$body}\n}";
	},
	$source,
);

if (!is_string($source) ||
	$replacedFunctions !== EXPECTED_FUNCTION_COUNT ||
	$resourceFunctions !== EXPECTED_RESOURCE_FUNCTION_COUNT ||
	$propertyMapFunctions !== EXPECTED_PROPERTY_MAP_FUNCTION_COUNT ||
	$tableRowsFunctions !== EXPECTED_TABLE_ROWS_FUNCTION_COUNT) {
	fwrite(STDERR, "Unable to normalize every MAPI stub function\n");

	exit(70);
}

$invalidPatterns = [
	'/^class resource\b/m',
	'/^function .*\??resource\s+&?\$/m',
	'/^function .*:\s*resource(?:\||\s|\{)/m',
	'/^\s*return (?:false|0|null|\'\'|\[\]|new resource\(\));$/m',
	'/\$GLOBALS\[\'MAPI_ANALYSIS_/',
];
foreach ($invalidPatterns as $invalidPattern) {
	if (preg_match($invalidPattern, $source) === 1) {
		fwrite(STDERR, "Normalized MAPI stub still contains an analyzer-hostile construct\n");

		exit(70);
	}
}
if (substr_count($source, "return random_int(0, 1) === 1 ? fopen('php://memory', 'r') : false;") !== EXPECTED_RESOURCE_FUNCTION_COUNT) {
	fwrite(STDERR, "Normalized MAPI stub does not model every resource return consistently\n");

	exit(70);
}
if (substr_count($source, "return (array) json_decode((string) getenv('MAPI_ANALYSIS_PROPERTIES'), true);") !== EXPECTED_PROPERTY_MAP_FUNCTION_COUNT ||
	substr_count($source, "return array_fill(0, random_int(0, 2), (array) json_decode((string) getenv('MAPI_ANALYSIS_TABLE_ROW'), true));") !== EXPECTED_TABLE_ROWS_FUNCTION_COUNT) {
	fwrite(STDERR, "Normalized MAPI stub does not model associative-array returns consistently\n");

	exit(70);
}

$normalizedHash = hash('sha256', $source);
if ($normalizedHash !== NORMALIZED_STUB_SHA256) {
	fwrite(STDERR, "Normalized MAPI stub did not match the reviewed analysis model: {$normalizedHash}\n");

	exit(70);
}

if (file_put_contents($stubFile, $source, LOCK_EX) !== strlen($source)) {
	fwrite(STDERR, "Unable to write normalized MAPI stub: {$stubFile}\n");

	exit(73);
}

fwrite(STDOUT, "Normalized {$replacedFunctions} MAPI functions for static analysis\n");
