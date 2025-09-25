<?php declare(strict_types=1);

namespace Files\Backend\Seafile\Model;

use ArrayAccess;
use OutOfBoundsException;
use UnexpectedValueException;

/**
 * Class Config
 *
 * @property-read string server Seafile server. FQN or IP address (v4 only).
 * @property-read int port TCP port of Seafile server. Default is 443.
 * @property-read bool ssl Use https (true) or http (false) scheme. Default is true.
 * @property-read string path Base path. Commonly empty.
 * @property-read string user Username for authentication.
 * @property-read string pass Password for authentication.
 * @property-read string sso_auth_user_token Token for SSO user authentication
 */
class Config implements ArrayAccess
{
    private const DEF = [
        'server' => 'server_address',
        'port' => 'server_port',
        'ssl' => 'server_ssl',
        'path' => 'server_path',
        'user' => 'user',
        'pass' => 'password',
        'sso_auth_user_token' => 'sso_auth_user_token',
    ];

    private const SCHEMA = [
        self::DEF['server'] => [
            'filter' => FILTER_VALIDATE_DOMAIN,
            'flags' => FILTER_FLAG_HOSTNAME,
            'options' => ['default' => 'seafile.example.com'],
        ],
        self::DEF['port'] => [
            'filter' => FILTER_VALIDATE_INT,
            'options' => ['min_range' => 0, 'max_range' => 65535, 'default' => 443],
        ],
        self::DEF['ssl'] => [
            'filter' => FILTER_VALIDATE_BOOLEAN,
            'options' => ['default' => true],
        ],
        self::DEF['path'] => [
            'filter' => FILTER_UNSAFE_RAW,
            'flags' => FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH,
            'options' => ['default' => ''],
        ],
        self::DEF['user'] => [
            'filter' => FILTER_UNSAFE_RAW,
            'flags' => FILTER_FLAG_STRIP_LOW,
            'options' => ['default' => ''],
        ],
        self::DEF['pass'] => [
            'filter' => FILTER_DEFAULT,
            'options' => ['default' => ''],
        ],
        self::DEF['sso_auth_user_token'] => [
            'filter' => FILTER_DEFAULT,
            'flags' => FILTER_FLAG_EMPTY_STRING_NULL,
            'options' => ['default' => null],
        ],
    ];

    private array $config = [];

    public function __construct(array $config = [])
    {
        $this->importConfigArray($config);
    }

    /**
     * Get the URL of the Seafile servers REST API
     *
     * @return string
     */
    public function getApiUrl(): string
    {
        $config = $this;

        $ssl = (bool)$config->ssl;
        $defaultPort = $ssl ? 443 : 80;
        $port = max(0, min(65535, (int)$config->port)) ?: $defaultPort;
        $host = rtrim($config->server, '/');
        $path = ltrim($config->path, '/');

        $url = sprintf('http%s://%s:%d/%s', $ssl ? 's' : '', $host, $port, $path);

        return rtrim($url, '/');
    }

    /**
     * read-only properties
     *
     * @param string $name
     * @return mixed
     *
     * @noinspection MagicMethodsValidityInspection
     * @noinspection RedundantSuppression
     */
    public function __get(string $name): mixed
    {
        if (!isset(self::DEF[$name])) {
            throw new OutOfBoundsException("Not a property: \"$name\"");
        }
        return $this->config[self::DEF[$name]];
    }

    /**
     * init configuration data
     *
     * set all named properties from associative array, overwriting self with defaults
     * from the schema.
     *
     * @param array $config
     * @return void
     */
    public function importConfigArray(array $config): void
    {
        $result = [];
        foreach (self::SCHEMA as $name => $definition) {
            $result[$name] =
                array_key_exists($name, $config)
                    ? $config[$name]
                    : $this->config[$name] ?? $definition['options']['default'] ?? null;
        }
        $filtered = filter_var_array($result, self::SCHEMA);

        if (!is_array($filtered)) {
            throw new UnexpectedValueException('Failed to filter Seafile configuration values.');
        }

        $this->config = $filtered;
    }

    /**
     * Hide its internal state from var_dump()
     *
     * Note: The xdebug extension may break this behavior.
     * You should not rely on it if you have debugging extensions installed.
     *
     * @return array
     */
    public function __debugInfo(): array
    {
        $info = $this->config;
        $info['password'] = is_string($info['password']) ? '*' : null;
        $info['sso_auth_user_token'] = is_string($info['sso_auth_user_token']) ? '*' : null;

        return $info;
    }

    /* ArrayAccess implementation */

    public function offsetExists(mixed $offset): bool
    {
        return isset($this->config[$offset]);
    }

    public function offsetGet(mixed $offset): mixed
    {
        return $this->config[$offset];
    }

    public function offsetSet(mixed $offset, mixed $value): void
    {
        trigger_error('modification by write is undefined behaviour', E_USER_WARNING);
    }

    public function offsetUnset(mixed $offset): void
    {
        trigger_error('modification by delete is undefined behaviour', E_USER_WARNING);
    }
}
