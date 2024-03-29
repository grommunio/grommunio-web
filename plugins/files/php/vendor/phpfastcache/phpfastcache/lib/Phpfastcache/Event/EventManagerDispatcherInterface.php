<?php

/**
 *
 * This file is part of Phpfastcache.
 *
 * @license MIT License (MIT)
 *
 * For full copyright and license information, please see the docs/CREDITS.txt and LICENCE files.
 *
 * @author Georges.L (Geolim4)  <contact@geolim4.com>
 * @author Contributors  https://github.com/PHPSocialNetwork/phpfastcache/graphs/contributors
 */

declare(strict_types=1);

namespace Phpfastcache\Event;

interface EventManagerDispatcherInterface
{
    /**
     * @return EventManagerInterface
     */
    public function getEventManager(): EventManagerInterface;

    /**
     * @param EventManagerInterface $eventManager
     * @return mixed
     */
    public function setEventManager(EventManagerInterface $eventManager): static;

    /**
     * @return bool
     * @deprecated Will be removed in v10
     */
    public function hasEventManager(): bool;
}
