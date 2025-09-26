<?php

declare(strict_types=1);

namespace Datamate\SeafileApi;

use Datamate\SeafileApi\Exception\ConnectionException;
use Datamate\SeafileApi\Exception\InvalidArgumentException;
use Datamate\SeafileApi\Exception\InvalidResponseException;
use Datamate\SeafileApi\Exception\UnexpectedJsonTextResponseException as JsonDecodeException;

/**
 * Seafile API.
 *
 * Interact with the Seafile API with the curl extension.
 *
 * @see https://manual.seafile.com/develop/web_api_v2.1.html
 */
final class SeafileApi {
	public const string USER_PREFIX_AUTH_TOKEN = '@auth:token:';

	public const string TYPE_DIR = 'dir';
	public const string TYPE_FILE = 'file';
	public const string TYPE_REPO = 'repo';
	public const string TYPE_SREPO = 'srepo';
	public const string TYPE_GREPO = 'grepo';

	public const TYPES = self::TYPES_FILE + self::TYPES_DIR_LIKE;
	public const TYPES_DIR_LIKE = self::TYPES_DIR + self::TYPES_REPO;
	public const array TYPES_DIR = [self::TYPE_DIR => self::TYPE_DIR];
	public const array TYPES_FILE = [self::TYPE_FILE => self::TYPE_FILE];
	public const array TYPES_REPO = [self::TYPE_REPO => self::TYPE_REPO, self::TYPE_SREPO => self::TYPE_SREPO, self::TYPE_GREPO => self::TYPE_GREPO];

	/**
	 * @const string
	 */
	public const string STRING_SUCCESS = 'success';

	/**
	 * Error codes.
	 */
	public const int ERROR_CODE_FEATURES = 802;
	public const int ERROR_CODE_NO_CURL = 803;
	public const int ERROR_CODE_FILE_IO = 808;

	/**
	 * default curl options.
	 */
	private const array CURL_OPTION_DEFAULTS = [
		CURLOPT_AUTOREFERER => true,
		CURLOPT_TIMEOUT => 10,
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_FOLLOWLOCATION => false,
	];

	/**
	 * @var array shared curl options between all requests
	 */
	private array $curlSharedOptions = self::CURL_OPTION_DEFAULTS;

	/**
	 * jsonDecode accept flags.
	 *
	 * @see jsonDecode
	 */
	private const int JSON_DECODE_ACCEPT_MASK = 31;                         # 1 1111 accept bitmask (five bits with the msb flags)
	private const int JSON_DECODE_ACCEPT_JSON = 16;                         # 1 0000 JSON text
	private const int JSON_DECODE_ACCEPT_DEFAULT = 23;                      # 1 0111 default: string, array or object
	private const int JSON_DECODE_ACCEPT_OBJECT = 17;                       # 1 0001 object
	private const int JSON_DECODE_ACCEPT_ARRAY = 18;                        # 1 0010 array
	private const int JSON_DECODE_ACCEPT_STRING = 20;                       # 1 0100 string
	private const int JSON_DECODE_ACCEPT_ARRAY_OF_OBJECTS = 24;             # 1 1000 array with only objects (incl. none)
	private const int JSON_DECODE_ACCEPT_ARRAY_SINGLE_OBJECT = 25;          # 1 1001 array with one single object, return that item
	private const int JSON_DECODE_ACCEPT_ARRAY_SINGLE_OBJECT_NULLABLE = 26; # 1 1010 array with one single object, return that item, or empty array, return null
	private const int JSON_DECODE_ACCEPT_SUCCESS_STRING = 28;               # 1 1100 string "success"
	private const int JSON_DECODE_ACCEPT_SUCCESS_OBJECT = 29;               # 1 1101 object with single "success" property and value true

	/**
	 * @const string ASCII upper-case characters part of a hexit
	 */
	private const string HEX_ALPHA_UPPER = 'ABCDEF';

	/**
	 * @const string ASCII lower-case characters part of a hexit
	 */
	private const string HEX_ALPHA_LOWER = 'abcdef';

	private ?\CurlHandle $handle = null;

	private string $token = '';

	/**
	 * constructor.
	 */
	public function __construct(/**
	 * @var string Server base URL
	 */
		private readonly string $baseurl, /**
	 * @var string Username
	 */
		private string $user, /**
	 * @var string Password
	 */
		private readonly string $pass,
		?string $otp = null
	) {
		if (!function_exists('curl_version')) {
			throw new ConnectionException('PHP-CURL not installed', self::ERROR_CODE_NO_CURL);
		}
		// trigger_error(sprintf("ctor: %s:%s", $user, $pass), E_USER_NOTICE);

		$this->setTokenByUsernameAndPassword($otp);
	}

	/**
	 * ping (with authentication).
	 *
	 * @see https://download.seafile.com/published/web-api/home.md#user-content-Quick%20Start
	 *
	 * @return string "pong"
	 */
	public function ping(): string {
		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api2/ping/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_STRING,
		);
	}

	/**
	 * get server version.
	 *
	 * @throws Exception
	 */
	public function getServerVersion(): string {
		$serverInfo = $this->getServerInformation();
		if (
			!is_string($serverInfo->version ?? null) ||
			!is_array($serverInfo->features ?? null)
		) {
			throw new InvalidResponseException('We could not retrieve list of server features.', self::ERROR_CODE_FEATURES);
		}

		$isSeafilePro = in_array('seafile-pro', $serverInfo->features, true);
		$edition = $isSeafilePro ? 'Professional' : 'Community';

		return "{$serverInfo->version} ({$edition})";
	}

	/**
	 * get server information.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/server-info.md#user-content-Get%20Server%20Information
	 *
	 * @throws Exception
	 */
	public function getServerInformation(): object {
		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api2/server-info/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_OBJECT,
		);
	}

	/**
	 * check account info.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/account.md#user-content-Check%20Account%20Info
	 */
	public function checkAccountInfo(): object {
		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api2/account/info/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]]
			),
			self::JSON_DECODE_ACCEPT_OBJECT,
		);
	}

	/**
	 * list seafile server libraries.
	 *
	 * that are all libraries a user can access.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/libraries.md#user-content-List%20Libraries
	 *
	 * @return object[]
	 *
	 * @throws Exception
	 */
	public function listLibraries(): array {
		return $this->listLibrariesCached(true);
	}

	/**
	 * get default library.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/libraries.md#user-content-Get%20Default%20Library
	 *
	 * @return object{exists: bool, repo_id: string}
	 */
	public function getDefaultLibrary(): object {
		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api2/default-repo/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_OBJECT,
		);
	}

	/**
	 * create a library.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/libraries.md#user-content-Create%20Library
	 *
	 * @param string $name of library
	 */
	public function createLibrary(string $name): object {
		$name = trim($name, "/");

		return $this->jsonDecode(
			$this->post(
				"{$this->baseurl}/api2/repos/",
				['name' => $name],
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_OBJECT,
		);
	}

	/**
	 * name a library.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/libraries.md#user-content-Rename%20Library
	 */
	public function nameLibrary(string $lib, string $name): void {
		$lib = $this->verifyLib($lib);
		$fields = ['repo_name' => $name];
		$_ = $this->jsonDecode(
			$this->post(
				"{$this->baseurl}/api2/repos/{$lib}/?op=rename",
				$fields,
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_SUCCESS_STRING,
		);
		unset($_);
	}

	/**
	 * rename a library.
	 *
	 * do nothing if the library can not be found
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/libraries.md#user-content-Rename%20Library
	 */
	public function renameLibrary(string $oldName, string $newName): void {
		$lib = $this->getLibraryIdByLibraryName($oldName);
		if ($lib === null) {
			return; // no library to rename
		}

		$this->nameLibrary($lib, $newName);
	}

	/**
	 * delete a library by name.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/libraries.md#user-content-Delete%20Library
	 */
	public function deleteLibraryByName(string $name): void {
		$id = $this->getLibraryIdByLibraryName($name);
		if ($id === null) {
			return; // library already gone
		}

		$this->deleteLibraryById($id);
	}

	/**
	 * delete a library by id.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/libraries.md#user-content-Delete%20Library
	 */
	public function deleteLibraryById(string $id): void {
		$lib = $this->verifyLib($id);

		$_ = $this->jsonDecode(
			$this->delete(
				"{$this->baseurl}/api2/repos/{$lib}/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_SUCCESS_STRING,
		);
		unset($_);
	}

	/**
	 * get library info array from path.
	 *
	 * @param string $libNamedPath with the library name as first component
	 *
	 * @return object with 'id' and 'name' of library, both NULL if not found
	 *
	 * @throws Exception
	 * @throws InvalidResponseException
	 */
	public function getLibraryFromPath(string $libNamedPath): object {
		$libraries = $this->listLibrariesCached();
		$libraries = array_column($libraries, null, 'name');

		$name = explode('/', ltrim($this->normalizePath($libNamedPath), '/'), 2)[0];

		return (object) [
			'id' => $libraries[$name]->id ?? null,
			'name' => $libraries[$name]->name ?? null,
		];
	}

	/**
	 * list all share links.
	 *
	 * all folder/file download share links in all libraries created by user.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/share-links.md#user-content-List%20all%20Share%20Links
	 *
	 * @return object[]
	 *
	 * @throws Exception
	 * @throws InvalidResponseException
	 *
	 * @noinspection PhpUnused
	 */
	public function listAllShareLinks(): array {
		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api/v2.1/share-links/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_ARRAY_OF_OBJECTS,
		);
	}

	/**
	 * Create Share Link.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/share-links.md#user-content-Create%20Share%20Link
	 *
	 * @param ?string                 $password    [optional]
	 * @param \DateTimeInterface|?int $expire      [optional] number of days to expire (int) or DateTime to expire
	 * @param ?array                  $permissions [optional] see seafile api docs
	 *
	 * @throws Exception
	 * @throws InvalidArgumentException
	 * @throws InvalidResponseException
	 */
	public function createShareLink(string $lib, string $path, ?string $password = null, $expire = null, ?array $permissions = null): object {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);

		$fields = [
			'repo_id' => $lib,
			'path' => $path,
		];
		if ($password !== null) {
			$fields['password'] = $password;
		}
		if ($expire !== null) {
			$expireTime = $expire;
			if (is_int($expire)) {
				$expireDays = max(1, min(365, (int) $expire));
				$expireTime = (new \DateTimeImmutable())->add(
					new \DateInterval("P{$expireDays}D")
				);
			}
			if (!$expireTime instanceof \DateTimeInterface) {
				throw new InvalidArgumentException('Expire type mismatch: ' . \gettype($expireTime));
			}
			$fields['expiration_time'] = $expireTime->format(\DATE_ATOM);
		}
		if ($permissions !== null) {
			try {
				$fields['permissions'] = json_encode($permissions, JSON_THROW_ON_ERROR);
			} /* @noinspection PhpMultipleClassDeclarationsInspection */ catch (\JsonException) {
				throw new InvalidArgumentException('permissions');
			}
		}

		return $this->jsonDecode(
			$this->post(
				"{$this->baseurl}/api/v2.1/share-links/",
				$fields,
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_OBJECT,
		);
	}

	/**
	 * List Share Links of a Library.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/share-links.md#user-content-List%20all%20Share%20Links
	 *
	 * @param ?string $lib [optional] library id (guid), default/null for all libraries
	 *
	 * @return object[]
	 *
	 * @throws Exception
	 */
	public function listShareLinksOfALibrary(?string $lib = null): array {
		$lib = $this->verifyLib($lib ?? '', true);

		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api/v2.1/share-links/?repo_id={$lib}",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_ARRAY_OF_OBJECTS,
		);
	}

	/**
	 * check password (of a share link by token).
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1-admin/share-links.md#user-content-Check%20Password
	 *
	 * @param string $token    of share link
	 * @param string $password in plain
	 *
	 * @throws Exception
	 * @throws InvalidResponseException
	 *
	 * @noinspection PhpUnused
	 */
	public function checkShareLinkPassword(string $token, string $password): object {
		$tokenEncoded = rawurlencode($token);

		return $this->jsonDecode(
			$this->post(
				"{$this->baseurl}/api/v2.1/admin/share-links/{$tokenEncoded}/check-password/",
				['password' => $password],
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_SUCCESS_OBJECT,
		);
	}

	/**
	 * share Link of a folder (or file).
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/share-links.md#user-content-List%20Share%20Link%20of%20a%20Folder%20(File)
	 *
	 * @return object the share link
	 *
	 * @throws Exception
	 * @throws InvalidArgumentException
	 * @throws InvalidResponseException
	 *
	 * @noinspection PhpUnused
	 */
	public function listShareLinksOfAFolder(string $lib, string $path): ?object {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);
		$pathEncoded = rawurlencode($path);

		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api/v2.1/share-links/?repo_id={$lib}&path={$pathEncoded}",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_ARRAY_SINGLE_OBJECT_NULLABLE,
		);
	}

	/**
	 * Delete Share Link.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/share-links.md#user-content-Delete%20Share%20Link
	 *
	 * @return object success {"success": true}
	 *
	 * @throws Exception
	 */
	public function deleteShareLink(string $token): object {
		$token = $this->verifyToken($token);

		return $this->jsonDecode(
			$this->delete(
				"{$this->baseurl}/api/v2.1/share-links/{$token}/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_SUCCESS_OBJECT,
		);
	}

	/**
	 * search user.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/user-search.md#user-content-Search%20User
	 *
	 * @throws Exception
	 */
	public function searchUser(string $search): object {
		$searchEncoded = rawurlencode($search);

		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api2/search-user/?q={$searchEncoded}",
				[CURLOPT_HTTPHEADER => ['Authorization: Token ' . $this->token]],
			),
			self::JSON_DECODE_ACCEPT_OBJECT,
		);
	}

	/**
	 * list groups for user sharing.
	 *
	 * @return array|object|string
	 *
	 * @throws Exception
	 * @throws InvalidResponseException
	 *
	 * @see (undocumented)
	 */
	public function shareableGroups(): array {
		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api/v2.1/shareable-groups/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_ARRAY_OF_OBJECTS,
		);
	}

	/**
	 * Share a Library to Group.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/share.md#user-content-Share%20a%20Library%20to%20Group
	 *
	 * @param int|int[]   $group
	 * @param null|string $permission [optional] r, rw, admin (default: r)
	 *
	 * @return array
	 *
	 * @throws Exception
	 * @throws InvalidArgumentException
	 */
	public function shareLibraryPathToGroup(string $lib, string $path, $group, ?string $permission = null) {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);
		$pathEncoded = rawurlencode($path);

		$fields = [
			'share_type' => 'group',
			'group_id' => $group,
			'permission' => $permission ?? 'r',
		];

		return $this->jsonDecode(
			$this->put(
				"{$this->baseurl}/api2/repos/{$lib}/dir/shared_items/?p={$pathEncoded}",
				$fields,
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_OBJECT,
		);
	}

	/**
	 * Share a Library to User.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/share.md#user-content-Share%20a%20Library%20to%20User
	 *
	 * @param null|string $permission [optional] r, rw, admin (default: r)
	 *
	 * @return array
	 *
	 * @throws Exception
	 * @throws InvalidArgumentException
	 */
	public function shareLibraryPathToUser(string $lib, string $path, string $user, ?string $permission = null) {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);
		$pathEncoded = rawurlencode($path);

		$fields = [
			'share_type' => 'user',
			'username' => $user,
			'permission' => $permission ?? 'r',
		];

		return $this->jsonDecode(
			$this->put(
				"{$this->baseurl}/api2/repos/{$lib}/dir/shared_items/?p={$pathEncoded}",
				$fields,
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			// either array of objects -or- failure object
			self::JSON_DECODE_ACCEPT_ARRAY | self::JSON_DECODE_ACCEPT_OBJECT,
		);
	}

	/**
	 * Unshare a Library to Group.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/share.md#user-content-Unshare%20a%20Library%20from%20Group
	 *
	 * @throws Exception
	 * @throws InvalidArgumentException
	 */
	public function unshareLibraryPathToGroup(string $lib, string $path, int $group): object {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);
		$pathEncoded = rawurlencode($path);

		return $this->jsonDecode(
			$this->delete(
				"{$this->baseurl}/api2/repos/{$lib}/dir/shared_items/?p={$pathEncoded}&share_type=group&group_id={$group}",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_SUCCESS_OBJECT,
		);
	}

	/**
	 * Unshare a Library to User.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/share.md#user-content-Unshare%20a%20Library%20from%20User
	 *
	 * @param string|string[] $user
	 *
	 * @throws Exception
	 * @throws InvalidArgumentException
	 */
	public function unshareLibraryPathToUser(string $lib, string $path, $user): object {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);
		$pathEncoded = rawurlencode($path);
		$userEncoded = rawurlencode($user);

		return $this->jsonDecode(
			$this->delete(
				"{$this->baseurl}/api2/repos/{$lib}/dir/shared_items/?p={$pathEncoded}&share_type=user&username={$userEncoded}",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_SUCCESS_OBJECT,
		);
	}

	/**
	 * list user shares for a library path.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/share.md#user-content-List%20Shared%20Users%20of%20a%20Library
	 *
	 * @return array<int, object>
	 *
	 * @throws Exception
	 * @throws InvalidArgumentException
	 * @throws InvalidResponseException
	 */
	public function listSharesOfLibraryPath(string $lib, string $path): array {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);
		$pathEncoded = rawurlencode($path);

		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api2/repos/{$lib}/dir/shared_items/?p={$pathEncoded}",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_ARRAY_OF_OBJECTS,
		);
	}

	/**
	 * create a new directory.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/directories.md#user-content-Create%20New%20Directory
	 *
	 * @param string $lib  library id (guid)
	 * @param string $path of the directory to create (e.g.: "/path/to/new-directory", leading and trailing slashes can be omitted)
	 *
	 * @return object|string the common "success" or the object with error_msg property
	 *
	 * @throws Exception|InvalidArgumentException
	 */
	public function createNewDirectory(string $lib, string $path) {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);
		$pathEncoded = rawurlencode($path);

		return $this->jsonDecode(
			$this->post(
				"{$this->baseurl}/api2/repos/{$lib}/dir/?p={$pathEncoded}",
				['operation' => 'mkdir'],
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_STRING | self::JSON_DECODE_ACCEPT_OBJECT,
		);
	}

	/**
	 * delete a file.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/file.md#user-content-Delete%20File
	 *
	 * @param string $lib  library id (guid)
	 * @param string $path of the fle to delete (e.g.: "/path/to/file-to-delete", leading and trailing slashes can be omitted)
	 *
	 * @return object|string the common "success" or the known object with error_msg property
	 *
	 * @throws Exception|InvalidArgumentException
	 */
	public function deleteFile(string $lib, string $path) {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);
		$pathEncoded = rawurlencode($path);

		return $this->jsonDecode(
			$this->delete(
				"{$this->baseurl}/api2/repos/{$lib}/file/?p={$pathEncoded}",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_STRING | self::JSON_DECODE_ACCEPT_OBJECT,
		);
	}

	/**
	 * get a file download URL.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/file.md#user-content-Download%20File
	 *
	 * @return string download URL (http/s)
	 *
	 * @throws Exception|InvalidArgumentException
	 */
	public function downloadFile(string $lib, string $path): string {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);
		$pathEncoded = rawurlencode($path);

		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api2/repos/{$lib}/file/?p={$pathEncoded}",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_STRING,
		);
	}

	/**
	 * download a file.
	 *
	 * get file contents of a file in a library
	 *
	 * @return false|string on failure
	 *
	 * @throws Exception|InvalidArgumentException
	 */
	public function downloadFileAsBuffer(string $lib, string $path) {
		$url = $this->downloadFile($lib, $path);

		return $this->get($url);
	}

	/**
	 * download a file to a local file.
	 *
	 * @param string $localPath path to a file - existing or not - on the local file-system
	 *
	 * @return bool success/failure
	 *
	 * @throws Exception|InvalidArgumentException
	 */
	public function downloadFileToFile(string $lib, string $path, string $localPath): bool {
		$handle = fopen($localPath, 'wb');
		if ($handle === false) {
			throw new Exception('failed to open local path for writing', self::ERROR_CODE_FILE_IO);
		}

		try {
			$result = $this->downloadFileToStream($lib, $path, $handle);
		}
		finally {
			$close = fclose($handle);
		}

		if (!$close) {
			throw new Exception('failed to close local path handle', self::ERROR_CODE_FILE_IO);
		}

		return $result;
	}

	/**
	 * download a file to a stream handle.
	 *
	 * @param resource $handle stream handle
	 *
	 * @return bool success/failure
	 *
	 * @throws Exception|InvalidArgumentException
	 */
	public function downloadFileToStream(string $lib, string $path, $handle): bool {
		$url = $this->downloadFile($lib, $path);

		return $this->get($url, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FILE => $handle]);
	}

	/**
	 * list items in directory.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/directories.md#user-content-List%20Items%20in%20Directory
	 *
	 * @throws Exception
	 * @throws InvalidArgumentException
	 * @throws InvalidResponseException
	 */
	public function listItemsInDirectory(string $lib, string $path): array {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);
		$pathEncoded = rawurlencode($path);

		$result = $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api2/repos/{$lib}/dir/?p={$pathEncoded}",
				[CURLOPT_HTTPHEADER => ['Authorization: Token ' . $this->token]],
			),
		);

		if (is_object($result)) {
			// likely a folder not found.
			$result = [];
		}

		return $result;
	}

	/**
	 * move a file.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/file.md#user-content-Move%20File
	 *
	 * @throws Exception|InvalidArgumentException
	 */
	public function moveFile(string $lib, string $path, string $dstLib, string $dstDir): object {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);
		$pathEncoded = rawurlencode($path);
		$dstLib = $this->verifyLib($dstLib);
		$dstDir = $this->normalizePath($dstDir);

		return $this->jsonDecode(
			$this->post(
				"{$this->baseurl}/api2/repos/{$lib}/file/?p={$pathEncoded}",
				['operation' => 'move', 'dst_repo' => $dstLib, 'dst_dir' => $dstDir],
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_OBJECT,
		);
	}

	/**
	 * rename a file.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/file.md#user-content-Move%20File
	 *
	 * @param string $lib     library id (guid)
	 * @param string $path    of the file to rename (e.g. "/path/to/file-to-rename")
	 * @param string $newName new basename for the basename of $path (e.g. "new-file-name")
	 *
	 * @return object|string the common "success" or the known object with error_msg property
	 *
	 * @throws Exception
	 */
	public function renameFile(string $lib, string $path, string $newName) {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);
		$pathEncoded = rawurlencode($path);

		return $this->jsonDecode(
			$this->post(
				"{$this->baseurl}/api2/repos/{$lib}/file/?p={$pathEncoded}",
				['operation' => 'rename', 'newname' => $newName],
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_STRING | self::JSON_DECODE_ACCEPT_OBJECT,
		);
	}

	/**
	 * simplified file upload routine for string buffer.
	 *
	 * @throws InvalidArgumentException
	 * @throws Exception
	 */
	public function uploadBuffer(string $lib, string $path, string $buffer): object {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);

		$parentDir = dirname($path);
		$uploadLink = $this->uploadGetLink($lib, $parentDir);
		$fileName = basename($path);

		return $this->uploadFileBuffer($uploadLink, $parentDir, '', $buffer, $fileName);
	}

	/**
	 * simplified file upload routine for standard file.
	 *
	 * @param string $path path in seafile to upload the file as
	 * @param string $file path of file to upload
	 *
	 * @throws InvalidArgumentException
	 * @throws Exception
	 */
	public function uploadFile(string $lib, string $path, string $file): object {
		$lib = $this->verifyLib($lib);
		$path = $this->normalizePath($path);
		if (!is_file($file) && !is_readable($file)) {
			throw new InvalidArgumentException(sprintf('Not a readable file: %s', $file));
		}

		$parentDir = dirname($path);
		$uploadLink = $this->uploadGetLink($lib, $parentDir);
		$fileName = basename($path);

		return $this->uploadFilePath($uploadLink, $parentDir, '', $file, $fileName);
	}

	/**
	 * upload string buffer as a file.
	 *
	 * same as {@see SeafileApi::uploadFile()} with the option to upload without a
	 * concrete file on the system. the temporary file to upload is created
	 * from the string buffer.
	 *
	 * @param string $uploadLink   from {@see uploadGetLink}
	 * @param string $parentDir    the parent directory to upload the file to
	 * @param string $relativePath the name of the file, subdirectories possible (e.g. uploading a folder)
	 * @param string $buffer       file contents to upload as string (not the file-name)
	 * @param string $fileName     to use as basename for the data
	 *
	 * @throws Exception
	 */
	public function uploadFileBuffer(
		string $uploadLink,
		string $parentDir,
		string $relativePath,
		string $buffer,
		string $fileName = 'upload.dat',
		bool $replace = false
	): object {
		$tmpHandle = tmpfile();
		if ($tmpHandle === false) {
			throw new Exception('Upload data rejected: Unable to open temporary stream.');
		}

		$meta = stream_get_meta_data($tmpHandle);
		$tmpFile = $meta['uri'];
		if (!is_file($tmpFile)) {
			fclose($tmpHandle);

			throw new Exception('Upload data rejected: No file with temporary stream.');
		}

		$bytes = fwrite($tmpHandle, $buffer);
		if ($bytes === false) {
			fclose($tmpHandle);

			throw new Exception('Upload data rejected: Failed to write to temporary stream.');
		}

		$diff = strlen($buffer) - $bytes;
		if ($diff !== 0) {
			fclose($tmpHandle);

			throw new Exception(sprintf("Upload data rejected: Unexpected difference writing to temporary stream: %d bytes", $diff));
		}

		$result = rewind($tmpHandle);
		if ($result === false) {
			fclose($tmpHandle);

			throw new Exception('Upload data rejected: Failed to rewind temporary stream.');
		}

		$result = $this->uploadFilePath($uploadLink, $parentDir, $relativePath, $tmpFile, $fileName, $replace);
		fclose($tmpHandle);

		return $result;
	}

	/**
	 * upload file.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/file-upload.md#user-content-Upload%20File
	 *
	 * @param string  $uploadLink   from {@see uploadGetLink}
	 * @param string  $parentDir    the parent directory to upload a file to
	 * @param string  $relativePath to place the file in under $uploadPath (can include subdirectories)
	 * @param string  $path         path of the file to upload
	 * @param ?string $fileName     to use as basename for the file (the name used in Seafile)
	 *
	 * @throws Exception
	 */
	public function uploadFilePath(
		string $uploadLink,
		string $parentDir,
		string $relativePath,
		string $path,
		?string $fileName = null,
		bool $replace = false
	): object {
		$parentDir = $this->normalizePath($parentDir);
		$relativePath = ltrim('/', $this->normalizePath($relativePath));
		$fileName ??= basename($path);

		$fields = [
			'file' => new \CURLFile($path, 'application/octet-stream', $fileName),
			'parent_dir' => $parentDir,
			'relative_path' => $relativePath,
			'replace' => $replace ? '1' : '0',
		];

		return $this->jsonDecode(
			$this->post(
				"{$uploadLink}?ret-json=1",
				$fields,
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_ARRAY_SINGLE_OBJECT,
		);
	}

	/**
	 * get file upload link.
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/file-upload.md#user-content-Get%20Upload%20Link
	 *
	 * @param string $uploadDir the directory to upload file(s) to
	 *
	 * @return string upload link (https?://...)
	 *
	 * @throws Exception|InvalidArgumentException
	 */
	public function uploadGetLink(string $lib, string $uploadDir): string {
		$lib = $this->verifyLib($lib);
		$uploadDir = $this->normalizePath($uploadDir);
		$pathEncoded = rawurlencode($uploadDir);

		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api2/repos/{$lib}/upload-link/?p={$pathEncoded}",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_STRING,
		);
	}

	public function generateUserAuthToken(string $email): object {
		return $this->jsonDecode(
			$this->post(
				"{$this->baseurl}/api/v2.1/admin/generate-user-auth-token/",
				['email' => $email],
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_OBJECT,
		);
	}

	public function getUserActivity(string $email, int $page = 1, int $perPage = 25): object {
		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api/v2.1/admin/user-activities/?user={$email}&page={$page}&per_page={$perPage}",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_OBJECT,
		);
	}

	/**
	 * set authorization token.
	 */
	public function setToken(string $token): void {
		$this->token = $token;
	}

	public function listDevices(): array {
		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api2/devices/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
		);
	}

	public function listStarredItems(): object {
		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api/v2.1/starred-items/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
		);
	}

	public function listGroups(): object {
		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api2/groups/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
		);
	}

	public function listInvitations(): array {
		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api/v2.1/invitations/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
		);
	}

	/**
	 * @param string $start e.g. date('Y-m-d', time() - 7776000 ); // 3 months
	 * @param string $end   e.g. date('Y-m-d', time());
	 */
	public function getLoginLog(string $start, string $end): array {
		$start = rawurlencode($start);
		$end = rawurlencode($end);

		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api/v2.1/admin/logs/login/?start={$start}&end={$end}",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
		);
	}

	public function listUploadLinks(): array {
		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api/v2.1/upload-links/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
		);
	}

	public function listRepoApiTokens(string $lib): object {
		$lib = $this->verifyLib($lib);

		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api/v2.1/repos/{$lib}/repo-api-tokens/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
		);
	}

	/**
	 * internal api implementation to get library by name.
	 *
	 * @return ?string id (guid) of the library, null if library does not exist
	 *
	 * @throws Exception
	 */
	private function getLibraryIdByLibraryName(string $name): ?string {
		$name = explode('/', $this->normalizePath($name), 2)[1];

		$libraries = $this->listLibrariesCached();
		$libraries = array_column($libraries, null, 'name');

		return $libraries[$name]->id ?? null;
	}

	/**
	 * List libraries a user can access.
	 *
	 * internal api implementation for {@see listLibrariesCached()} and {@see listLibraries()}
	 *
	 * @see https://download.seafile.com/published/web-api/v2.1/libraries.md#user-content-List%20Libraries
	 *
	 * @return object[]
	 *
	 * @throws Exception
	 */
	private function listLibrariesDo(): array {
		return $this->jsonDecode(
			$this->get(
				"{$this->baseurl}/api2/repos/",
				[CURLOPT_HTTPHEADER => ["Authorization: Token {$this->token}"]],
			),
			self::JSON_DECODE_ACCEPT_ARRAY_OF_OBJECTS,
		);
	}

	/**
	 * like {@see listLibraries()} but cached.
	 *
	 * @throws Exception
	 * @throws InvalidResponseException
	 */
	private function listLibrariesCached(bool $invalidate = false): array {
		static $librariesCache;

		return $librariesCache = ($invalidate ? null : $librariesCache) ?? $this->listLibrariesDo();
	}

	/**
	 * normalize path.
	 *
	 * normalizes the path component separator <slash> "/" <U002F> U+002F SOLIDUS
	 * with first character being the slash, no consecutive slashes within the
	 * path and no terminating slash.
	 */
	private function normalizePath(string $path): string {
		$buffer = rtrim($path, '/');
		$buffer = preg_replace('~/{2,}~', '/', $buffer);
		$buffer === '' && $buffer = '/';
		$buffer[0] === '/' || $buffer = "/{$buffer}";

		return $buffer;
	}

	/**
	 * verify library id.
	 *
	 * verifies the format of a library id. can be used in URLs
	 * afterwards. case normalization to lowercase.
	 *
	 * example library id strings:
	 *  - 21b941c2-5411-4372-a514-00b62ab99ef2 (from the docs)
	 *  - 79144b25-f772-42b6-a1c0-60e6359f5884 (from a server)
	 *
	 * @return string library id
	 */
	private function verifyLib(string $lib, bool $allowEmpty = false): string {
		if ($allowEmpty && ($lib === '')) {
			return $lib;
		}

		$buffer = \strtr($lib, self::HEX_ALPHA_UPPER, self::HEX_ALPHA_LOWER);
		$format = '%04x%04x-%04x-%04x-%04x-%04x%04x%04x';
		$values = sscanf($buffer, $format);
		$result = vsprintf($format, $values);

		if ($buffer !== $result) {
			throw new InvalidArgumentException(sprintf('Not a library id: "%s"', $lib));
		}

		return $result;
	}

	/**
	 * verify share link token.
	 *
	 * verifies the format of a share link token. can be used in URLs
	 * afterwards. case normalization to lowercase.
	 *
	 * @param string $token e.g. "0a29ff44dc0b4b56be74"
	 */
	private function verifyToken(string $token): string {
		$buffer = \strtr($token, self::HEX_ALPHA_UPPER, self::HEX_ALPHA_LOWER);
		$format = '%04x%04x%04x%04x%04x';
		$values = sscanf($buffer, $format);
		$result = vsprintf($format, $values);

		if ($buffer !== $result) {
			throw new InvalidArgumentException(sprintf('Not a token: "%s"', $token));
		}

		return $result;
	}

	/**
	 * authenticate class against seafile api.
	 *
	 * @see https://download.seafile.com/published/web-api/home.md#user-content-Quick%20Start
	 *
	 * @param null|string $otp (optional) Seafile OTP (if user uses OTP access)
	 */
	private function setTokenByUsernameAndPassword(?string $otp = null): void {
		// @auth:token:<email> : password is auth token
		if (str_starts_with($this->user, $needle = self::USER_PREFIX_AUTH_TOKEN)) {
			$this->user = \substr($this->user, strlen($needle)) ?: '';
			$this->token = $this->pass;
			if ($this->ping() !== 'pong') {
				throw new ConnectionException('token authentication failure');
			}

			return;
		}

		$data = $this->jsonDecode(
			$this->post(
				"{$this->baseurl}/api2/auth-token/",
				['username' => $this->user, 'password' => $this->pass],
				$otp ? [CURLOPT_HTTPHEADER => ["X-SEAFILE-OTP: {$otp}"]] : [],
			),
			self::JSON_DECODE_ACCEPT_OBJECT,
		);
		$this->token = (string) $data->token;
	}

	/**
	 * http request with get method.
	 *
	 * @return bool|string
	 */
	private function get(string $url, array $curlOptions = []) {
		$curlOptions += $this->curlSharedOptions;

		return $this->curlExec($url, $curlOptions);
	}

	/**
	 * http request with post method.
	 *
	 * @return bool|string
	 */
	private function post(string $url, array $fields = [], array $curlOptions = []) {
		$curlOptions += $this->curlSharedOptions;
		$curlOptions[CURLOPT_POST] = true;
		$curlOptions[CURLOPT_POSTFIELDS] = $fields;

		return $this->curlExec($url, $curlOptions);
	}

	/**
	 * http request with put method.
	 *
	 * @return bool|string
	 */
	public function put(string $url, array $fields = [], array $curlOptions = []) {
		$curlOptions += $this->curlSharedOptions;
		$curlOptions[CURLOPT_CUSTOMREQUEST] = 'PUT';
		$curlOptions[CURLOPT_POSTFIELDS] = $fields;

		return $this->curlExec($url, $curlOptions);
	}

	/**
	 * http request with delete method.
	 *
	 * @return bool|string
	 */
	public function delete(string $url, array $curlOptions = []) {
		$curlOptions += $this->curlSharedOptions;
		$curlOptions[CURLOPT_CUSTOMREQUEST] = 'DELETE';

		return $this->curlExec($url, $curlOptions);
	}

	/**
	 * json decode handler.
	 *
	 * decode json with structural acceptance
	 *
	 * @param int $flags decode accept flag
	 *
	 * @return array|object|string
	 *
	 * @throws InvalidResponseException
	 */
	private function jsonDecode(string $jsonText, int $flags = self::JSON_DECODE_ACCEPT_DEFAULT) {
		$accept = $flags & self::JSON_DECODE_ACCEPT_MASK;
		if ($accept === 0) {
			return $jsonText;
		}

		try {
			$result = json_decode($jsonText, false, 512, JSON_THROW_ON_ERROR);
		} /* @noinspection PhpMultipleClassDeclarationsInspection */ catch (\JsonException $e) {
			throw JsonDecodeException::create(sprintf('json decode error of %s', JsonDecodeException::shorten($jsonText)), $jsonText, $e);
		}

		if ($accept === self::JSON_DECODE_ACCEPT_JSON) {
			return $result;
		}

		if ($accept === self::JSON_DECODE_ACCEPT_ARRAY_OF_OBJECTS) {
			if (is_array($result) && $result === array_filter($result, 'is_object')) {
				return $result;
			}

			throw JsonDecodeException::create(sprintf('json decode accept %5d error [%s] of %s', decbin($accept), \gettype($result), JsonDecodeException::shorten($jsonText)), $jsonText);
		}

		if ($accept === self::JSON_DECODE_ACCEPT_ARRAY_SINGLE_OBJECT_NULLABLE) {
			if (is_array($result) &&
				(
					(\count($result) === 1 && is_object($result[0] ?? null)) ||
					(\count($result) === 0)
				)
			) {
				return $result[0] ?? null;
			}

			throw JsonDecodeException::create(sprintf('json decode accept %5d error [%s] of %s', decbin($accept), \gettype($result), JsonDecodeException::shorten($jsonText)), $jsonText);
		}

		if ($accept === self::JSON_DECODE_ACCEPT_ARRAY_SINGLE_OBJECT) {
			if (is_array($result) && is_object($result[0] ?? null) && \count($result) === 1) {
				return $result[0];
			}

			throw JsonDecodeException::create(sprintf('json decode accept %5d error [%s] of %s', decbin($accept), \gettype($result), JsonDecodeException::shorten($jsonText)), $jsonText);
		}

		if ($accept === self::JSON_DECODE_ACCEPT_SUCCESS_OBJECT) {
			if (is_object($result) && (array) $result === ['success' => true]) {
				return $result;
			}

			throw JsonDecodeException::create(sprintf('json decode accept %5d error [%s] of %s', decbin($accept), \gettype($result), JsonDecodeException::shorten($jsonText)), $jsonText);
		}

		if ($accept === self::JSON_DECODE_ACCEPT_SUCCESS_STRING) {
			if ($result === self::STRING_SUCCESS) {
				return $result;
			}

			throw JsonDecodeException::create(sprintf('json decode accept %5d error [%s] of %s', decbin($accept), \gettype($result), JsonDecodeException::shorten($jsonText)), $jsonText);
		}

		if (is_string($result) && (self::JSON_DECODE_ACCEPT_STRING !== ($accept & self::JSON_DECODE_ACCEPT_STRING))) {
			throw JsonDecodeException::create(sprintf('json decode type %s not accepted; of %s', \gettype($result), JsonDecodeException::shorten($jsonText)), $jsonText);
		}

		if (is_array($result) && (self::JSON_DECODE_ACCEPT_ARRAY !== ($accept & self::JSON_DECODE_ACCEPT_ARRAY))) {
			throw JsonDecodeException::create(sprintf('json decode type %s not accepted; of %s', \gettype($result), JsonDecodeException::shorten($jsonText)), $jsonText);
		}

		if (is_object($result) && (self::JSON_DECODE_ACCEPT_OBJECT !== ($accept & self::JSON_DECODE_ACCEPT_OBJECT))) {
			throw JsonDecodeException::create(sprintf('json decode type %s not accepted; of %s', \gettype($result), JsonDecodeException::shorten($jsonText)), $jsonText);
		}

		return $result;
	}

	/**
	 * execute curl with url and options.
	 *
	 * @return bool|string
	 */
	private function curlExec(string $url, array $options) {
		$handle = curl_init($url);
		if (!$handle instanceof \CurlHandle) {
			throw new ConnectionException('Unable to initialise cURL session.', self::ERROR_CODE_NO_CURL);
		}

		$this->handle = $handle;

		if (!curl_setopt_array($this->handle, $options)) {
			throw new Exception("Error setting cURL request options.");
		}
		$result = curl_exec($this->handle);
		$this->curlExecHandleResult($result);
		curl_close($this->handle);

		return $result;
	}

	/**
	 * internal handling of curl_exec() return.
	 *
	 * {@see curlExec()}
	 *
	 * @param bool|string $curlResult return value from curl_exec();
	 *
	 * @throws ConnectionException
	 */
	private function curlExecHandleResult($curlResult): void {
		if (empty($curlResult)) {
			throw new ConnectionException(curl_error($this->handle), -1);
		}

		$code = (int) curl_getinfo($this->handle)['http_code'];

		$codeIsInErrorRange = $code >= 400 && $code <= 600;
		$codeIsNotInNonErrorCodes = !in_array($code, [200, 201, 202, 203, 204, 205, 206, 207, 301], true);

		if ($codeIsInErrorRange || $codeIsNotInNonErrorCodes) {
			ConnectionException::throwCurlResult($code, $curlResult);
		}
	}
}
