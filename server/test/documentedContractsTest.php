<?php

require_once __DIR__ . '/../includes/core/class.colors.php';
require_once __DIR__ . '/../includes/core/class.conversion.php';

$stringColor = Colors::rgb2hsl('#ffffff');
$arrayColor = Colors::rgb2hsl(['r' => 255, 'g' => 255, 'b' => 255]);

if ($stringColor !== $arrayColor) {
	throw new RuntimeException('String and array color inputs must produce the same HSL value');
}

$restrictionValue = 'unchanged';
if (Conversion::json2restriction([], $restrictionValue) !== $restrictionValue) {
	throw new RuntimeException('Scalar restriction data must pass through unchanged');
}

$propertyTag = 'PR_SUBJECT';
if (Conversion::convertToSingleValuedProperty($propertyTag) !== $propertyTag) {
	throw new RuntimeException('Symbolic property tags must pass through unchanged');
}

echo "Documented contracts test passed\n";
