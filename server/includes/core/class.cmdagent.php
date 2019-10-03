<?php

class CmdAgent
{
	private $timeout;
	private $max_length;
	
	function __construct($timeout=60, $max_length=1024) {
		$this->timeout = $timeout;
		$this->max_length = $max_length;
	}
	
	static function create($path) {
		$socket = socket_create(AF_UNIX, SOCK_STREAM, 0);
		if ($socket >= 0) {
			if (socket_connect($socket, $path)) {
				return $socket;
			}
			socket_close($socket);
		}
		return false;
	}
	
	function read_line($socket) {
		$offset = 0;
		$line_result = '';
		$read_fds = array($socket);
		$write_fds = array();
		$except_fds = array();
		while (socket_select($read_fds, $write_fds, $except_fds, $this->timeout) > 0) {
			$out = socket_read($socket, $this->max_length - $offset);
			if (false === $out) {
				$lasterror = socket_strerror(socket_last_error($socket));
				error_log("socket error: " . $lasterror . " when geting response from domain socket '" . $path . "' after sending cmd '" . $cmd . "'");
				return false;
			}
			$offset += strlen($out);
			if ($offset >= $this->max_length) {
				error_log("out of buffer when reading response from domain socket");
				return false;
			}
			$line_result .= $out;
			if ("\r\n" == substr($line_result, -2)) {
				return substr($line_result, 0, -2);
			}
		}
		error_log("time out when reading response from domain socket");
		return false;
	}
	
	private function send($path, $cmd) {
		$socket = CmdAgent::create($path);
		if (false === $socket) {
			error_log("fail to connect to domain socket '" . $path . "' for sending cmd '" . $cmd . "'");
			return false;
		}
		socket_write($socket, $cmd . "\r\n", strlen($cmd) + 2);
		$result_line = $this->read_line($socket);
		socket_write($socket, "QUIT\r\n", 6);
		socket_close($socket);
		if (false === $result_line) {
			return false;
		}
		if (0 == strncasecmp($result_line, "TRUE", 4)) {
			if (' ' == substr($result_line, 4, 1)) {
				return array("result" => true, "line" => substr($result_line, 5));
			} else {
				return array("result" => true);
			}
		}
		return array("result" => false);
	}
	
	
	function put_user_data($username, $val) {
		$cmd = "PUT " . $username . " " . json_encode($val);
		$result = $this->send(PANDORA_ASESSION_PATH, $cmd);
		if (false === $result) {
			return false;
		}
		return $result['result'];
	}

	function get_user_data($username) {
		$cmd = "GET " . $username;
		$result = $this->send(PANDORA_ASESSION_PATH, $cmd);
		if (false === $result || false == $result['result']) {
			return false;
		}
		return json_decode($result['line'], true);
	}
}

?>