/**
 * Settles the bundled pdf.js viewer into grommunio Web: theme, language and
 * link handling.
 *
 * A file rather than an inline script: the viewer page allows scripts from
 * its own origin only.
 *
 * @author grommunio GmbH <dev@grommunio.com>
 */

(function () {
    "use strict";

    var parameters = new URLSearchParams(document.location.search),
        theme      = parameters.get('theme'),
        locale     = parameters.get('locale');

    if (theme === 'dark' || theme === 'light') {
        document.documentElement.style.colorScheme = theme;
    }

    /**
     * The window grommunio Web runs in, seen from inside this frame.
     */
    function hostWindow() {
        var candidates = [window.parent, window.top],
            i;

        for (i = 0; i < candidates.length; i += 1) {
            try {
                if (candidates[i] && candidates[i] !== window &&
                        candidates[i].Zarafa && candidates[i].Zarafa.core &&
                        candidates[i].Zarafa.core.DarkMode) {
                    return candidates[i];
                }
            } catch (e) {
                // Another origin; not the window we are looking for.
            }
        }

        return null;
    }

    /**
     * Keep wearing the theme grommunio Web is wearing: the user can switch
     * between light and dark with a PDF open.
     */
    function followHostTheme() {
        var host = hostWindow();

        if (!host) {
            return;
        }

        function apply() {
            try {
                document.documentElement.style.colorScheme =
                    host.Zarafa.core.DarkMode.isDark() ? 'dark' : 'light';
            } catch (e) {
                // The window went away while the preview was open.
            }
        }

        apply();
        // Dark mode is turned on and off by a class on the body of the page.
        new MutationObserver(apply).observe(host.document.body, {
            attributes:      true,
            attributeFilter: ['class']
        });
    }

    followHostTheme();

    function settle() {
        var options = window.PDFViewerApplicationOptions;

        if (!options) {
            return;
        }
        // 2 is LinkTarget.BLANK.
        options.set('externalLinkTarget', 2);
        options.set('disablePreferences', true);
        if (locale) {
            options.set('localeProperties', { lang: locale });
        }
    }

    // The viewer announces itself on the document of the page it is embedded
    // in where it can reach one, and on its own only otherwise.
    document.addEventListener('webviewerloaded', settle);
    try {
        if (window.parent !== window && window.parent.document) {
            window.parent.document.addEventListener('webviewerloaded', settle);
        }
    } catch (e) {
        // A page of another origin; the viewer will announce itself here.
    }
}());
