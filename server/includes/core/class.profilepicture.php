<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Normalises the profile picture before it is stored on the mailbox.
 */
class ProfilePicture {
	/**
	 * Brings a profile picture into the shape every client renders well: a
	 * square JPEG of at most PROFILE_PICTURE_MAX_EDGE pixels and
	 * PROFILE_PICTURE_MAX_BYTES bytes. An image which already fits is kept
	 * byte for byte.
	 *
	 * @param string $dataUrl the base64 data url as sent by the client
	 *
	 * @return false|string the JPEG data, or false when it is not usable
	 */
	public static function normalize($dataUrl) {
		if (!preg_match('/^data:image\/(?<extension>(?:png|gif|jpg|jpeg));base64,(?<image>.+)$/', (string) $dataUrl, $matches)) {
			return false;
		}

		$image = base64_decode($matches['image'], true);
		if ($image === false || strlen($image) > PROFILE_PICTURE_MAX_BYTES) {
			return false;
		}

		// A small file can still carry a huge canvas; GD would allocate it all.
		$size = @getimagesizefromstring($image);
		if ($size === false || $size[0] * $size[1] > PROFILE_PICTURE_MAX_PIXELS) {
			return false;
		}

		$source = @imagecreatefromstring($image);
		if ($source === false) {
			return false;
		}

		$width = imagesx($source);
		$height = imagesy($source);
		$isJpeg = strcasecmp($matches['extension'], 'jpeg') == 0 || strcasecmp($matches['extension'], 'jpg') == 0;

		if ($isJpeg && $width === $height && $width <= PROFILE_PICTURE_MAX_EDGE) {
			imagedestroy($source);

			return $image;
		}

		// Anything else gets the centre square scaled into the bounds.
		$square = min($width, $height);
		$result = self::encode(
			$source,
			(int) (($width - $square) / 2),
			(int) (($height - $square) / 2),
			$square,
			min($square, PROFILE_PICTURE_MAX_EDGE)
		);
		imagedestroy($source);

		return $result;
	}

	/**
	 * Scales a square region of an image to $edge pixels and encodes it as
	 * JPEG, lowering the quality and finally the edge length until it fits
	 * PROFILE_PICTURE_MAX_BYTES.
	 *
	 * @param GdImage $source the decoded image
	 * @param int     $x      left edge of the region
	 * @param int     $y      top edge of the region
	 * @param int     $square edge length of the region
	 * @param int     $edge   edge length of the result
	 *
	 * @return false|string the JPEG data, or false when it could not be encoded
	 */
	private static function encode($source, $x, $y, $square, $edge) {
		$target = imagecreatetruecolor($edge, $edge);
		if ($target === false) {
			return false;
		}

		// Transparency would come out black in JPEG, blend it onto white instead.
		imagealphablending($target, true);
		imagefilledrectangle($target, 0, 0, $edge, $edge, imagecolorallocate($target, 255, 255, 255));
		imagecopyresampled($target, $source, 0, 0, $x, $y, $edge, $edge, $square, $square);

		// Above 90 libjpeg drops the chroma subsampling, which multiplies the
		// size for no visible gain at this resolution.
		$result = false;
		for ($quality = 85; $quality >= 40; $quality -= 10) {
			ob_start();
			$written = imagejpeg($target, null, $quality);
			$jpeg = ob_get_clean();
			if (!$written) {
				break;
			}
			$result = $jpeg;
			if (strlen($jpeg) <= PROFILE_PICTURE_MAX_BYTES) {
				break;
			}
		}
		imagedestroy($target);

		if ($result === false || strlen($result) <= PROFILE_PICTURE_MAX_BYTES) {
			return $result;
		}

		return $edge > 144 ? self::encode($source, $x, $y, $square, (int) ($edge / 2)) : false;
	}
}
