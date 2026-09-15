<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (!function_exists('imagecreatetruecolor')) {
	echo "Profile picture checks skipped without GD\n";

	return;
}

define('PROFILE_PICTURE_MAX_EDGE', 512);
define('PROFILE_PICTURE_MAX_BYTES', 524288);
define('PROFILE_PICTURE_MAX_PIXELS', 30000000);

if (!class_exists('BaseException')) {
	class BaseException extends Exception {}
}
require_once dirname(__DIR__) . '/includes/exceptions/class.GrommunioException.php';
require_once dirname(__DIR__) . '/includes/core/class.settings.php';

$settings = (new ReflectionClass('Settings'))->newInstanceWithoutConstructor();
$normalize = new ReflectionMethod('Settings', 'normalizeProfilePicture');
$normalize->setAccessible(true);

/**
 * Builds a data url for a generated image.
 *
 * @param int    $width
 * @param int    $height
 * @param string $format png, gif or jpeg
 * @param bool   $transparent
 */
function picture($width, $height, $format = 'jpeg', $transparent = false): string {
	$image = imagecreatetruecolor($width, $height);
	if ($transparent) {
		imagealphablending($image, false);
		imagesavealpha($image, true);
		imagefilledrectangle($image, 0, 0, $width, $height, imagecolorallocatealpha($image, 0, 0, 0, 127));
	}
	else {
		for ($x = 0; $x < $width; $x += 8) {
			imagefilledrectangle($image, $x, 0, $x + 3, $height, imagecolorallocate($image, 220, 40, 40));
		}
	}

	ob_start();
	match ($format) {
		'png' => imagepng($image),
		'gif' => imagegif($image),
		default => imagejpeg($image, null, 92),
	};
	$bytes = ob_get_clean();
	imagedestroy($image);

	return 'data:image/' . $format . ';base64,' . base64_encode($bytes);
}

/**
 * @param mixed $photo
 */
function dimensions($photo): array {
	$size = getimagesizefromstring($photo);

	return [$size[0], $size[1], $size[2]];
}

// A landscape picture is cropped to its centre square, never stretched.
$photo = $normalize->invoke($settings, picture(1200, 600, 'png'));
if ($photo === false) {
	throw new RuntimeException('A landscape PNG was rejected.');
}
[$width, $height, $type] = dimensions($photo);
if ($width !== $height) {
	throw new RuntimeException("A landscape picture was stored as {$width}x{$height}.");
}
if ($type !== IMAGETYPE_JPEG) {
	throw new RuntimeException('The picture was not stored as JPEG.');
}
if ($width !== PROFILE_PICTURE_MAX_EDGE) {
	throw new RuntimeException("A large picture was stored at {$width} pixels.");
}

// A square JPEG within the bounds is kept byte for byte.
$source = picture(400, 400);
$photo = $normalize->invoke($settings, $source);
if ($photo !== base64_decode(substr($source, strpos($source, ',') + 1), true)) {
	throw new RuntimeException('A picture which already fits was re-encoded.');
}

// Small pictures are not blown up.
$photo = $normalize->invoke($settings, picture(64, 96, 'png'));
[$width, $height] = dimensions($photo);
if ($width !== 64 || $height !== 64) {
	throw new RuntimeException("A 64x96 picture was stored as {$width}x{$height}.");
}

// Transparency becomes white, not black.
$photo = $normalize->invoke($settings, picture(200, 200, 'png', true));
$image = imagecreatefromstring($photo);
$colour = imagecolorsforindex($image, imagecolorat($image, 100, 100));
imagedestroy($image);
if ($colour['red'] < 250 || $colour['green'] < 250 || $colour['blue'] < 250) {
	throw new RuntimeException('A transparent picture was flattened onto ' . json_encode($colour));
}

// The result stays within the byte limit.
$photo = $normalize->invoke($settings, picture(2000, 2000, 'png'));
if (strlen($photo) > PROFILE_PICTURE_MAX_BYTES) {
	throw new RuntimeException('The stored picture exceeds the limit: ' . strlen($photo));
}

// Rejections: no data url, an unknown format, too many bytes, too many pixels.
foreach ([
	'not a data url' => 'https://example.com/picture.jpg',
	'an unsupported format' => 'data:image/webp;base64,' . base64_encode('nonsense'),
	'undecodable data' => 'data:image/png;base64,' . base64_encode('nonsense'),
] as $what => $value) {
	if ($normalize->invoke($settings, $value) !== false) {
		throw new RuntimeException("The picture check accepted {$what}.");
	}
}

$oversized = 'data:image/jpeg;base64,' . base64_encode(str_repeat('x', PROFILE_PICTURE_MAX_BYTES + 1));
if ($normalize->invoke($settings, $oversized) !== false) {
	throw new RuntimeException('The picture check accepted more than the byte limit.');
}

// A 8000x8000 PNG of one colour is a small file but a 256 MB canvas.
$bomb = imagecreatetruecolor(8000, 8000);
ob_start();
imagepng($bomb, null, 9);
$bombBytes = ob_get_clean();
imagedestroy($bomb);
if (strlen($bombBytes) < PROFILE_PICTURE_MAX_BYTES &&
	$normalize->invoke($settings, 'data:image/png;base64,' . base64_encode($bombBytes)) !== false) {
	throw new RuntimeException('The picture check accepted a 64 megapixel canvas.');
}

echo "Profile picture checks passed\n";
