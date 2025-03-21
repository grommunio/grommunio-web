<?php

namespace OCSAPI;

/**
 * This class holds all information of one OCS share.
 *
 * @class   ocsclient
 */
class ocsshare {
	private $id;
	private $url;
	private $item_type;
	private $share_type;
	private $share_with;
	private $share_with_displayname;
	private $file_target;
	private $path;
	private $permissions;
	private $stime;
	private $expiration;
	private $token;
	private $uid_owner;
	private $mimetype;

	public const SHARE_URL_SUFFIX = "/public.php?service=files&t=";

	/**
	 * Constructor.
	 * Parse a new ocsshare object out of the xml client response.
	 */
	public function __construct($xmlelement) {
		$this->id = intval($xmlelement->id);
		$this->url = (string) $xmlelement->url;
		$this->item_type = (string) $xmlelement->item_type;
		$this->share_type = intval($xmlelement->share_type);
		$this->share_with = (string) $xmlelement->share_with;
		$this->share_with_displayname = (string) $xmlelement->share_with_displayname;
		$this->file_target = (string) $xmlelement->file_target;
		$this->path = rtrim((string) $xmlelement->path, "/");
		$this->permissions = intval($xmlelement->permissions);
		$this->stime = intval($xmlelement->stime);
		$this->expiration = (string) $xmlelement->expiration;
		$this->token = (string) $xmlelement->token;
		$this->uid_owner = (string) $xmlelement->uid_owner;
		$this->mimetype = (string) $xmlelement->mimetype;
	}

	/**
	 * Add the sharing URL to this object.
	 *
	 * @param string $host Host string: for example http://demo.owncloud.org
	 */
	public function generateShareURL($host) {
		if ((!isset($this->url) || empty($this->url)) && (isset($this->token) && !empty($this->token))) {
			// generate the url out of the token
			$this->url = $host . self::SHARE_URL_SUFFIX . $this->token;
		}
	}

	/**
	 * @return int
	 */
	public function getId() {
		return $this->id;
	}

	/**
	 * @param int $id
	 */
	public function setId($id) {
		$this->id = intval($id);
	}

	/**
	 * @return string
	 */
	public function getUrl() {
		return $this->url;
	}

	/**
	 * @param string $url
	 */
	public function setUrl($url) {
		$this->url = $url;
	}

	/**
	 * @return string
	 */
	public function getItemType() {
		return $this->item_type;
	}

	/**
	 * @param string $item_type
	 */
	public function setItemType($item_type) {
		$this->item_type = $item_type;
	}

	/**
	 * @return int
	 */
	public function getShareType() {
		return $this->share_type;
	}

	/**
	 * @param int $share_type
	 */
	public function setShareType($share_type) {
		$this->share_type = intval($share_type);
	}

	/**
	 * @return string
	 */
	public function getShareWith() {
		return $this->share_with;
	}

	/**
	 * @param string $share_with
	 */
	public function setShareWith($share_with) {
		$this->share_with = $share_with;
	}

	/**
	 * @return string
	 */
	public function getShareWithDisplayname() {
		return $this->share_with_displayname;
	}

	/**
	 * @return string
	 */
	public function getFileTarget() {
		return $this->file_target;
	}

	/**
	 * @param string $file_target
	 */
	public function setFileTarget($file_target) {
		$this->file_target = $file_target;
	}

	/**
	 * @return string
	 */
	public function getPath() {
		return $this->path;
	}

	/**
	 * @param string $path
	 */
	public function setPath($path) {
		$this->path = $path;
	}

	/**
	 * @return int
	 */
	public function getPermissions() {
		return $this->permissions;
	}

	/**
	 * @param int $permissions
	 */
	public function setPermissions($permissions) {
		$this->permissions = intval($permissions);
	}

	/**
	 * @return int
	 */
	public function getStime() {
		return $this->stime;
	}

	/**
	 * @param int $stime
	 */
	public function setStime($stime) {
		$this->stime = intval($stime);
	}

	/**
	 * @return string
	 */
	public function getExpiration() {
		return $this->expiration;
	}

	/**
	 * @param string $expiration
	 */
	public function setExpiration($expiration) {
		$this->expiration = $expiration;
	}

	/**
	 * @return string
	 */
	public function getToken() {
		return $this->token;
	}

	/**
	 * @param string $token
	 */
	public function setToken($token) {
		$this->token = $token;
	}

	/**
	 * @return string
	 */
	public function getUidOwner() {
		return $this->uid_owner;
	}

	/**
	 * @param string $uid_owner
	 */
	public function setUidOwner($uid_owner) {
		$this->uid_owner = $uid_owner;
	}

	/**
	 * @return string
	 */
	public function getMimetype() {
		return $this->mimetype;
	}

	/**
	 * @param string $mimetype
	 */
	public function setMimetype($mimetype) {
		$this->mimetype = $mimetype;
	}
}
