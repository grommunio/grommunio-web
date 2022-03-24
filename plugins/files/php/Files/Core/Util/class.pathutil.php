<?php
/**
 * Created by PhpStorm.
 * User: zdev
 * Date: 12.01.15
 * Time: 23:35
 */

namespace Files\Core\Util;


class PathUtil
{
	/**
	 * get_mime
	 *
	 * Returns the mimetype for the specified file
	 *
	 * @static
	 * @param string $filename Filname to get the mime type from
	 * @param int $mode 0 = full check, 1 = extension check only
	 *
	 * @return string the found mimetype or 'application/octet-stream' as fallback
	 */
	static function get_mime($filename, $mode = 0)
	{
		// mode 0 = full check
		// mode 1 = extension check only

		$mime_types = array(
			'txt' => 'text/plain',
			'htm' => 'text/html',
			'html' => 'text/html',
			'php' => 'text/html',
			'css' => 'text/css',
			'js' => 'application/javascript',
			'json' => 'application/json',
			'xml' => 'application/xml',
			'swf' => 'application/x-shockwave-flash',
			'flv' => 'video/x-flv',

			// images
			'png' => 'image/png',
			'jpe' => 'image/jpeg',
			'jpeg' => 'image/jpeg',
			'jpg' => 'image/jpeg',
			'gif' => 'image/gif',
			'bmp' => 'image/bmp',
			'ico' => 'image/vnd.microsoft.icon',
			'tiff' => 'image/tiff',
			'tif' => 'image/tiff',
			'svg' => 'image/svg+xml',
			'svgz' => 'image/svg+xml',

			// archives
			'zip' => 'application/zip',
			'rar' => 'application/x-rar-compressed',
			'exe' => 'application/x-msdownload',
			'msi' => 'application/x-msdownload',
			'cab' => 'application/vnd.ms-cab-compressed',

			// audio/video
			'mp3' => 'audio/mpeg',
			'qt' => 'video/quicktime',
			'mov' => 'video/quicktime',
			'mp4' => 'video/mp4',
			'webm' => 'video/webm',

			// adobe
			'pdf' => 'application/pdf',
			'psd' => 'image/vnd.adobe.photoshop',
			'ai' => 'application/postscript',
			'eps' => 'application/postscript',
			'ps' => 'application/postscript',

			// ms office
			'doc' => 'application/msword',
			'rtf' => 'application/rtf',
			'xls' => 'application/vnd.ms-excel',
			'ppt' => 'application/vnd.ms-powerpoint',
			'docx' => 'application/msword',
			'xlsx' => 'application/vnd.ms-excel',
			'pptx' => 'application/vnd.ms-powerpoint',

			// open office
			'odt' => 'application/vnd.oasis.opendocument.text',
			'ods' => 'application/vnd.oasis.opendocument.spreadsheet',
			'odp' => 'application/vnd.oasis.opendocument.presentation',
		);

		$exploded = explode('.', $filename);
		$last = array_pop($exploded);
		$ext = strtolower($last);

		if (function_exists('mime_content_type') && is_file($filename) && $mode == 0) {
			$mimetype = mime_content_type($filename);
			return $mimetype;
		} elseif (function_exists('finfo_open') && is_file($filename) && $mode == 0) {
			$finfo = finfo_open(FILEINFO_MIME);
			$mimetype = finfo_file($finfo, $filename);
			finfo_close($finfo);
			return $mimetype;
		} elseif (array_key_exists($ext, $mime_types)) {
			return $mime_types[$ext];
		} else {
			return 'application/octet-stream';
		}
	}

	/**
	 * Splits the filename from the given path
	 *
	 * @static
	 * @param string $path a filesystem path, use / as path separator
	 *
	 * @return string the last part of the path, mostly this is the filename
	 */
	static function getFilenameFromPath($path)
	{
		$pathParts = explode('/', $path);
		return end($pathParts);
	}

	/**
	 * Splits the foldername/path from the given path
	 *
	 * @static
	 * @param string $path
	 *
	 * @return string foldername
	 */
	static function getFolderNameFromPath($path)
	{
		$tmp = explode("/", $path);
		array_pop($tmp);
		$folder = implode("/", $tmp);
		$folder = $folder == "" ? "/" : $folder;

		return $folder;
	}

	/**
	 * creates a security file, which is checked before downloading a file
	 *
	 * @static
	 * @param string secid A random id
	 *
	 * @return void
	 */
	static function createSecIDFile($basepath, $secid)
	{
		$lockFile = $basepath . DIRECTORY_SEPARATOR . "secid." . $secid;
		$fh = fopen($lockFile, 'w') or die("can't open secid file");
		$stringData = date(DATE_RFC822);
		fwrite($fh, $stringData);
		fclose($fh);
	}

	/**
	 * Sanitize a filename.
	 * Currently removes all html tags
	 * and replaces \, /, :, ", |, !, ?, <, > and *
	 *
	 * @param string $string
	 * @return string
	 */
	static function sanitizeFilename($string)
	{
		$cleanerString = preg_replace('/[:\|\"!\*\?\\\\\/]+/i', '', $string);
		$cleanerString = strip_tags($cleanerString);
		$cleanerString = preg_replace('/[><]+/i', '', $cleanerString);
		return $cleanerString;
	}
}