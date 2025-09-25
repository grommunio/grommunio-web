<?php declare(strict_types=1);

namespace Files\Backend\Seafile\Model;

use Datamate\SeafileApi\SeafileApi;
use Files\Backend\Seafile\Backend;

class SsoBackend
{
    /**
     * @var Config of the Backends files account
     */
    private ?Config $backendConfig = null;

    /**
     * Bind an SsoBackend
     *
     * @param ?SsoBackend $self
     * @psalm-param-out SsoBackend $self
     * @return SsoBackend
     */
    public static function bind(?SsoBackend &$self = null): SsoBackend
    {
        if ($self === null) {
            $self = new self();
        }

        return $self;
    }

    /**
     * hook for {@see Backend::init_backend()}
     *
     * @param Config $config
     * @return void
     */
    public function initBackend(Config $config): void
    {
        if ($this->backendConfig instanceof Config) {
            throw new \BadMethodCallException('backend is already configured');
        }

        $this->backendConfig = $config;
    }

    /**
     * hook for {@see Backend::open()}
     *
     * @return void
     */
    public function open(): void
    {
        if (!($this->backendConfig instanceof Config)) {
            // won't work w/o having the backend config for open()
            return;
        }

        if (isset($this->backendConfig['sso_auth_user_token'])) {
            $this->backendConfig->importConfigArray([
                'user' => SeafileApi::USER_PREFIX_AUTH_TOKEN . ConfigUtil::loadSmtpAddress(),
                'password' => $this->backendConfig['sso_auth_user_token'],
            ]);
        }
    }
}
