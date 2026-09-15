/*
 * #dependsFile client/grommunio/core/Container.js
 */
Ext.namespace('Grommunio.core.ui.notifier');

/**
 * @class Grommunio.core.ui.notifier.NonePlugin
 * @extends Grommunio.core.ui.notifier.NotifyPlugin
 *
 * Special {@link Grommunio.core.ui.notifier.NotifyPlugin NotifyPlugin} which sends all
 * messages with highest priority to the other side of the universe. Due to the distance
 * and the maximum speed limit, the user will probably never hear from this message again.
 *
 * In case the message is received by Aliens before it has arrived at its destination,
	 * we can only hope they will be friendly and bring some of their delicious food when they
 * come and visit.
 *
 * This plugin will be registered to the {@link Grommunio.core.ui.notifier.Notifier notifier}
 * using the name 'none'.
 */
Grommunio.core.ui.notifier.NonePlugin = Ext.extend(Grommunio.core.ui.notifier.NotifyPlugin, {
});

Grommunio.onReady(function() {
	container.getNotifier().registerPlugin('none', new Grommunio.core.ui.notifier.NonePlugin());
});
