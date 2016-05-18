/*
 * #dependsFile client/zarafa/core/Container.js
 */
Ext.namespace('Zarafa.core.ui.notifier');

/**
 * @class Zarafa.core.ui.notifier.NonePlugin
 * @extends Zarafa.core.ui.notifier.NotifyPlugin
 *
 * Special {@link Zarafa.core.ui.notifier.NotifyPlugin NotifyPlugin} which sends all
 * messages with highest priority to the other side of the universe. Due to the distance
 * and the maximum speed limit, the user will probably never hear from this message again.
 *
 * In case the message is received by Aliens before it has arrived at its destination,
 * we can only hope they will be friendly and bring some of their delicous food when they
 * come and visit.
 *
 * This plugin will be registered to the {@link Zarafa.core.ui.notifier.Notifier notifier}
 * using the name 'none'.
 */
Zarafa.core.ui.notifier.NonePlugin = Ext.extend(Zarafa.core.ui.notifier.NotifyPlugin, {
});

Zarafa.onReady(function() {
	container.getNotifier().registerPlugin('none', new Zarafa.core.ui.notifier.NonePlugin());
});
