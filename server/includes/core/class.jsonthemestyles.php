<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Turns the properties of a json theme into the inline styles of the page.
 */
class JsonThemeStyles {
	/**
	 * @param string $theme      The name of the json theme
	 * @param array  $themeProps The properties of its theme.json file
	 *
	 * @return string The styles (between <style> tags) and the stylesheet links
	 */
	public static function render($theme, $themeProps) {
		$themeProps = self::derivePalette(self::normalizeColors($themeProps));
		$themeProps = self::resolveUrls($themeProps, $theme);

		$styles = '<style>' . self::getVariables($themeProps);
		foreach ($themeProps as $k => $v) {
			if ($v && isset(self::$styles[$k])) {
				$styles .= str_replace("{{{$k}}}", htmlspecialchars((string) $v), self::$styles[$k]);
			}
		}
		$styles .= '</style>' . "\n";

		return $styles . self::stylesheetLinks($themeProps, $theme);
	}

	/**
	 * Fills in the colors a theme left out from the ones it set.
	 *
	 * @param array $themeProps A hash with the normalized properties of a theme.json file
	 *
	 * @return array
	 */
	private static function derivePalette($themeProps) {
		if ($themeProps['primary-color']) {
			$themeProps = self::derivePrimaryPalette($themeProps);
		}
		if ($themeProps['action-color'] && !$themeProps['action-color:hover']) {
			$themeProps['action-color:hover'] = Colors::darker($themeProps['action-color'], 10);
		}
		if (isset($themeProps['selection-color']) && !isset($themeProps['selection-text-color'])) {
			// Set a text color for the selection-color
			$hsl = Colors::rgb2hsl($themeProps['selection-color']);
			if ($hsl['l'] > 50) {
				$hsl['l'] = 5;
			}
			else {
				$hsl['l'] = 95;
			}
			$themeProps['selection-text-color'] = Colors::colorObject2string(Colors::hsl2rgb($hsl));
		}

		return $themeProps;
	}

	/**
	 * @param array $themeProps A hash with the normalized properties of a theme.json file
	 *
	 * @return array
	 */
	private static function derivePrimaryPalette($themeProps) {
		if (!$themeProps['primary-color:hover']) {
			$hsl = Colors::rgb2hsl($themeProps['primary-color']);
			if ($hsl['l'] > 20) {
				$themeProps['primary-color:hover'] = Colors::darker($themeProps['primary-color'], 10);
			}
			else {
				$themeProps['primary-color:hover'] = Colors::lighter($themeProps['primary-color'], 20);
			}
		}

		// Check if the main bar is not too light for white text (i.e. the default color)
		if (!$themeProps['mainbar-text-color'] && Colors::getLuma($themeProps['primary-color']) > 155) {
			$themeProps['mainbar-text-color'] = '#000000';
		}

		if (!$themeProps['selection-color']) {
			$themeProps['selection-color'] = Colors::setLuminance($themeProps['primary-color'], 80);
		}

		if (!$themeProps['primary-color:dark']) {
			$themeProps['primary-color:dark'] = Colors::darker($themeProps['primary-color'], 20);
		}

		// The top bar is a flat primary-color unless the theme asks for a gradient,
		// which is what the key has always promised.
		if (!$themeProps['gradient-start']) {
			$themeProps['gradient-start'] = $themeProps['primary-color'];
		}
		if (!$themeProps['gradient-end']) {
			$themeProps['gradient-end'] = $themeProps['gradient-start'];
		}

		return $themeProps;
	}

	/**
	 * @param array  $themeProps A hash with the properties of a theme.json file
	 * @param string $theme      the name of the theme the urls are part of
	 *
	 * @return array
	 */
	private static function resolveUrls($themeProps, $theme) {
		foreach (['background-image', 'logo-large', 'logo-small'] as $key) {
			if (isset($themeProps[$key])) {
				$themeProps[$key] = self::fixUrl($themeProps[$key], $theme);
			}
		}
		if (isset($themeProps['logo-large']) && !isset($themeProps['logo-small'])) {
			$themeProps['logo-small'] = $themeProps['logo-large'];
		}
		if (isset($themeProps['logo-small:dark'])) {
			$themeProps['logo-small:dark'] = self::fixUrl($themeProps['logo-small:dark'], $theme);
		}
		elseif (isset($themeProps['logo-small'])) {
			$themeProps['logo-small:dark'] = $themeProps['logo-small'];
		}
		if (isset($themeProps['spinner-image'])) {
			$themeProps['spinner-image'] = self::fixUrl($themeProps['spinner-image'], $theme);
		}

		return $themeProps;
	}

	/**
	 * @param array  $themeProps A hash with the properties of a theme.json file
	 * @param string $theme      the name of the theme the stylesheets are part of
	 *
	 * @return string the link tags of the stylesheets the theme defines
	 */
	private static function stylesheetLinks($themeProps, $theme) {
		$stylesheets = $themeProps['stylesheets'] ?? [];
		if (is_string($stylesheets)) {
			$stylesheets = explode(' ', $stylesheets);
		}
		elseif (!is_array($stylesheets)) {
			return '';
		}

		$links = '';
		foreach ($stylesheets as $stylesheet) {
			if (!is_string($stylesheet) || empty(trim($stylesheet))) {
				continue;
			}
			$links .= "\t\t" . '<link rel="stylesheet" type="text/css" href="' . htmlspecialchars((string) self::fixUrl(trim($stylesheet), $theme)) . '" />' . "\n";
		}

		return $links;
	}

	/**
	 * Normalizes all defined colors in a JSON theme to valid hex colors.
	 *
	 * @param array $themeProps A hash with the properties defined a theme.json file
	 */
	private static function normalizeColors($themeProps) {
		$colorKeys = [
			'primary-color',
			'primary-color:hover',
			'primary-color:dark',
			'gradient-start',
			'gradient-end',
			'mainbar-text-color',
			'action-color',
			'action-color:hover',
			'selection-color',
			'selection-text-color',
			'focus-color',
		];
		foreach ($colorKeys as $ck) {
			$themeProps[$ck] = isset($themeProps[$ck]) ? Colors::getHexColorFromCssColor($themeProps[$ck]) : null;
		}

		return $themeProps;
	}

	/**
	 * Utility function to fix relative urls in JSON themes.
	 *
	 * @param string $url   the url to be fixed
	 * @param string $theme the name of the theme the url is part of
	 */
	private static function fixUrl($url, $theme) {
		// the url is absolute we don't have to fix anything
		if (preg_match('/^https?:\/\//', $url)) {
			return $url;
		}

		return versionedUrl(PATH_PLUGIN_DIR . '/' . $theme . '/' . $url);
	}

	/**
	 * The custom properties a theme feeds. grommunio.css is written against these and
	 * uses them far more widely than the fixed selectors below, so a theme that sets
	 * none of them only reaches the handful of places those selectors name.
	 *
	 * The built-in themes declare the same properties in grommunio.css; a json theme
	 * gets no rule of its own there, so they are emitted here instead. One theme is
	 * active per request, which is why plain "body" is specific enough.
	 *
	 * @param array $themeProps A hash with the properties defined in a theme.json file
	 *
	 * @return string a css rule, or an empty string when the theme sets no colors
	 */
	private static function getVariables($themeProps) {
		$variables = [
			'--theme-primary-color' => $themeProps['primary-color'] ?? null,
			'--theme-primary-hover' => $themeProps['primary-color:hover'] ?? null,
			'--theme-primary-dark' => $themeProps['primary-color:dark'] ?? null,
			'--theme-gradient-start' => $themeProps['gradient-start'] ?? null,
			'--theme-gradient-end' => $themeProps['gradient-end'] ?? null,
			'--theme-selection-bg' => $themeProps['selection-color'] ?? null,
			'--theme-spinner-image' => isset($themeProps['spinner-image']) ? 'url(' . $themeProps['spinner-image'] . ')' : null,
		];

		$declarations = '';
		foreach ($variables as $name => $value) {
			if ($value) {
				$declarations .= "\n\t\t\t\t" . $name . ': ' . htmlspecialchars((string) $value) . ';';
			}
		}

		if (empty($declarations)) {
			return '';
		}

		return "\n\t\t\t/* The palette grommunio.css is written against */\n\t\t\tbody {" . $declarations . "\n\t\t\t}\n";
	}

	/**
	 * The templates of the styles that a json theme can add to the page.
	 *
	 * @var array<string, string>
	 */
	private static $styles = [
		'primary-color' => '
			/* The Sign in button of the login screen */
			body.login #form-container #submitbutton,
			#loading-mask #form-container #submitbutton {
				background: {{primary-color}};
			}

			/* The top bar of the Welcome dialog */
			.grommunio-welcome-body > .x-panel-bwrap > .x-panel-body div.grommunio-welcome-title {
				border-left: 1px solid {{primary-color}};
				border-right: 1px solid {{primary-color}};
				background: {{primary-color}};
			}

			/* The border line under the top menu bar */
			body #grommunio-mainmenu {
				border-color: {{primary-color}};
			}
			/* The background color of the top menu bar */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct {
				background-color: {{primary-color}};
			}
			/* Unread items */
			.k-unreadborders .x-grid3-row.x-grid3-row-collapsed.mail_unread > table,
			.k-unreadborders .x-grid3-row.x-grid3-row-expanded.mail_unread > table {
		        	border-left: 4px solid {{primary-color}} !important;
			}
		',

		'primary-color:hover' => '
			/* Hover state and active state of the Sign in button */
			body.login #form-container #submitbutton:hover,
			#loading-mask #form-container #submitbutton:hover,
			body.login #form-container #submitbutton:active,
			#loading-mask #form-container #submitbutton:active {
				background: {{primary-color:hover}};
			}

			/* Background color of the hover state of the buttons in the top menu bar */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .x-btn.x-btn-over,
			/* Background color of the active state of the buttons (i.e. when the buttons get clicked) */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .x-btn.x-btn-over.x-btn-click,
			/* Background color of the selected button */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .grommunio-maintabbar-maintab-active,
			/* Background color of the hover state of selected button */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .grommunio-maintabbar-maintab-active.x-btn-over,
			/* Background color of the active state of selected button */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .grommunio-maintabbar-maintab-active.x-btn-over.x-btn-click {
				background-color: {{primary-color:hover}} !important;
			}
		',

		'mainbar-text-color' => '
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct,
			/* Text color of the buttons in the top menu bar */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .x-btn button.x-btn-text,
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .x-btn-over button.x-btn-text,
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .x-btn-over.x-btn-click button.x-btn-text,
			/* Text color of the selected button in the top menu bar */
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .grommunio-maintabbar-maintab-active button.x-btn-text,
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .grommunio-maintabbar-maintab-active.x-btn-over button.x-btn-text,
			body #grommunio-mainmenu.grommunio-maintabbar > .x-toolbar-ct .grommunio-maintabbar-maintab-active.x-btn-over.x-btn-click button.x-btn-text {
				color: {{mainbar-text-color}} !important;
			}
		',

		'action-color' => '
			/****************************************************************************
			 *  Action color
			 * ===============
			 * Some elements have a different color than the default color of these elements
			 * to get extra attention, e.g. "call-to-action buttons", the current day
			 * in the calendar, etc.
			 ****************************************************************************/
			/* Buttons, normal state */
			.x-btn.grommunio-action .x-btn-small,
			.x-btn.grommunio-action .x-btn-medium,
			.x-btn.grommunio-action .x-btn-large,
			/* Buttons, active state */
			.x-btn.grommunio-action.x-btn-over.x-btn-click .x-btn-small,
			.x-btn.grommunio-action.x-btn-over.x-btn-click .x-btn-medium,
			.x-btn.grommunio-action.x-btn-over.x-btn-click .x-btn-large,
			.x-btn.grommunio-action.x-btn-click .x-btn-small,
			.x-btn.grommunio-action.x-btn-click .x-btn-medium,
			.x-btn.grommunio-action.x-btn-click .x-btn-large,
			/* Special case: Popup, Windows, or Messageboxes (first button is by default styled as the action button) */
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-large,
			/* action button in reminder popout */
			.k-reminderpanel .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn:not(.grommunio-normal) .x-btn-small,
			.k-reminderpanel .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-click:not(.grommunio-normal) .x-btn-small,
			.k-reminderpanel .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over.x-btn-click:not(.grommunio-normal) .x-btn-small,
			/* Current day in the calendar */
			.grommunio-freebusy-panel .x-freebusy-timeline-container .x-freebusy-header .x-freebusy-header-body .x-freebusy-timeline-day.x-freebusy-timeline-day-current,
			.grommunio-freebusy-panel .x-freebusy-timeline-container .x-freebusy-header .x-freebusy-header-body .x-freebusy-timeline-day.x-freebusy-timeline-day-current table,
			.grommunio-freebusy-panel .x-freebusy-timeline-container .x-freebusy-header .x-freebusy-header-body .x-freebusy-timeline-day.x-freebusy-timeline-day-current table tr.x-freebusy-timeline-day td,
			/* The date pickers */
			.x-date-picker .x-date-inner td.x-date-today a,
			.x-date-picker .x-date-mp table td.x-date-mp-sel a,
			.x-date-picker .x-date-mp table tr.x-date-mp-btns td button.x-date-mp-ok {
				background: {{action-color}} !important;
			}
			/* Focused Action button */
			.x-btn.grommunio-action.x-btn-focus .x-btn-small, .x-btn.grommunio-action.x-btn-focus .x-btn-medium, .x-btn.grommunio-action.x-btn-focus .x-btn-large {
				background: {{action-color}} !important;
			}
			/* Selected calendar */
			.grommunio-calendar-tabarea-stroke.grommunio-calendar-tab-selected {
				border-top-color: {{action-color}};
			}
			.x-date-picker .x-date-inner td.x-date-weeknumber a,
			.grommunio-hierarchy-node-total-count span.grommunio-hierarchy-node-counter,
			.grommunio-hierarchy-node-unread-count span.grommunio-hierarchy-node-counter {
				color: {{action-color}};
			}
			.x-date-picker .x-date-inner td.x-date-today a {
				border-color: {{action-color}};
			}
			.grommunio-freebusy-panel .x-freebusy-timeline-container .x-freebusy-header .x-freebusy-header-body .x-freebusy-timeline-day.x-freebusy-timeline-day-current,
			.grommunio-freebusy-panel .x-freebusy-timeline-container .x-freebusy-body .x-freebusy-background .x-freebusy-timeline-day.x-freebusy-timeline-day-current {
				border-right-color: {{action-color}};
			}
			.grommunio-freebusy-panel .x-freebusy-timeline-container .x-freebusy-header .x-freebusy-header-body .x-freebusy-timeline-day.x-freebusy-timeline-day-current table tr.x-freebusy-timeline-hour td:first-child,
			.grommunio-freebusy-panel .x-freebusy-timeline-container .x-freebusy-body .x-freebusy-background .x-freebusy-timeline-day.x-freebusy-timeline-day-current td:first-child {
				border-left-color: {{action-color}};
			}
		',

		'action-color:hover' => '
			/* Buttons, hover state */
			.x-btn.grommunio-action.x-btn-over .x-btn-small,
			.x-btn.grommunio-action.x-btn-over .x-btn-medium,
			.x-btn.grommunio-action.x-btn-over .x-btn-large,
			/* Special case: Popup, Windows, or Messageboxes */
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-large,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-large,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-small,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-medium,
			.x-window .x-window-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-large,
			/* action button in reminder popout */
			.k-reminderpanel .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-over:not(.grommunio-normal) .x-btn-small,
			/* The date pickers */
			.x-date-picker .x-date-mp table tr.x-date-mp-btns td button.x-date-mp-ok:hover {
				background: {{action-color:hover}} !important;
			}
		',

		'selection-color' => '
			/*********************************************************************
			 * Selected items in grids and trees
			 * =================================
			 * The background color of the selected items in grids and trees can
			 * be changed to better suit the theme.
			 *********************************************************************/
			/* selected item in grids */
			.x-grid3-row.x-grid3-row-selected,
			.x-grid3 .x-grid3-row-selected .grommunio-grid-button-container,
			/* selected item in tree hierarchies */
			.x-tree-node .grommunio-hierarchy-node.x-tree-selected,
			/* selected items in boxfields (e.g. the recipient fields) */
			.x-grommunio-boxfield ul .x-grommunio-boxfield-item-focus,
			.x-grommunio-boxfield ul .x-grommunio-boxfield-recipient-item.x-grommunio-boxfield-item-focus,
			/* selected items in card view of Contacts context */
			div.grommunio-contact-cardview-selected,
			/* selected items in icon view of Notes context */
			.grommunio-note-iconview-selected,
			/* selected category in the Settings context */
			#grommunio-mainpanel-contentpanel-settings .grommunio-settings-category-panel .grommunio-settings-category-tab-active,
			/* selected date in date pickers */
			.x-date-picker .x-date-inner td.x-date-selected:not(.x-date-today) a,
			.x-date-picker .x-date-inner td.x-date-selected:not(.x-date-today) a:hover {
				background-color: {{selection-color}} !important;
				border-color: {{selection-color}};
			}

			/* Selected x-menu */
			.x-menu-item-selected {
			background-color: {{selection-color}};
			}

			/*********************************************************************
			 * Extra information about items
			 * =================================
			 * Sometimes extra information is shown in opened items. (e.g. "You replied
			 * to this message etc"). This can be styled with the following rules.
			 *********************************************************************/
			.preview-header-extrainfobox,
			.preview-header-extrainfobox-item,
			.k-appointmentcreatetab .grommunio-calendar-appointment-extrainfo div,
			.k-taskgeneraltab .grommunio-calendar-appointment-extrainfo div,
			.grommunio-mailcreatepanel > .x-panel-bwrap > .x-panel-body .grommunio-mailcreatepanel-extrainfo div {
				background: {{selection-color}} !important;
			}

			/* Selected mail item */
			.k-unreadborders .x-grid3-row.x-grid3-row-expanded.mail_read.x-grid3-row-selected > table {
			        border-left: 4px solid {{selection-color}} !important;
			}

			/* Hover selected item */
			.k-unreadborders .x-grid3-row.x-grid3-row-expanded.mail_read.x-grid3-row-selected.x-grid3-row-over > table,
			.k-unreadborders .x-grid3-row.x-grid3-row-collapsed.mail_read.x-grid3-row-selected > table {
			        border-left: 4px solid {{selection-color}} !important;
			}
		',

		'selection-text-color' => '
			/*********************************************************************
			 * Extra information about items
			 * =================================
			 * Sometimes extra information is shown in opened items. (e.g. "You replied
			 * to this message etc"). This can be styled with the following rules.
			 *********************************************************************/
			.preview-header-extrainfobox,
			.preview-header-extrainfobox-item,
			.k-appointmentcreatetab .grommunio-calendar-appointment-extrainfo div,
			.k-taskgeneraltab .grommunio-calendar-appointment-extrainfo div,
			.grommunio-mailcreatepanel > .x-panel-bwrap > .x-panel-body .grommunio-mailcreatepanel-extrainfo div {
				color: {{selection-text-color}};
			}
		',

		'focus-color' => '
			/*********************************************************************
			 * Focused items
			 * =================================
			 *********************************************************************/
			/* Normal button */
			.x-window .x-window-footer .x-toolbar-left-row .x-toolbar-cell:not(.x-hide-offsets) ~ .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-focus:not(.grommunio-action):not(.x-btn-over):not(.x-btn-click) .x-btn-small,
			.x-window .x-panel-footer .x-toolbar-right-row .x-toolbar-cell:not(.x-hide-offsets) ~ .x-toolbar-cell:not(.x-hide-offsets) .x-btn.x-btn-focus:not(.grommunio-action):not(.x-btn-over):not(.x-btn-click) .x-btn-small,
			.x-btn.x-btn-focus:not(.grommunio-action):not(.x-btn-click) .x-btn-small,
			.x-btn.x-btn-focus:not(.grommunio-action):not(.x-btn-click) .x-btn-medium,
			.x-btn.x-btn-focus:not(.grommunio-action):not(.x-btn-click) .x-btn-large,
			.x-toolbar .x-btn.x-btn-focus:not(.grommunio-action):not(.x-btn-noicon) .x-btn-small {
			border: 1px solid {{focus-color}} !important;
			}
			/* Login */
			body.login #form-container input:focus,
			#loading-mask #form-container input:focus {
			border-color: {{focus-color}};
			}
			input:focus {
				border-color: {{focus-color}};
			}
			/* Form elements */
			.x-form-text.x-form-focus:not(.x-trigger-noedit) {
				border-color: {{focus-color}} !important;
			}
			.x-form-field-wrap.x-trigger-wrap-focus:not(.x-freebusy-userlist-container) {
				border-color: {{focus-color}};
			}
			input.x-form-text.x-form-field.x-form-focus {
				border-color: {{focus-color}} !important;
			}
			.x-form-field-wrap.x-trigger-wrap-focus:not(.x-freebusy-userlist-container) input.x-form-text.x-form-field.x-form-focus {
			border-color: {{focus-color}} !important;
			}
		',

		'logo-large' => '
			/* The logo in the Login screen. Maximum size of the logo image is 220x60px. */
			body.login #form-container #logo,
			#loading-mask #form-container #logo {
				background: url({{logo-large}}) no-repeat right center;
				background-size: contain;
			}
		',

		'logo-small' => '
			/****************************************************************************
			 * The logo (shown on the right below the top bar)
			 * ===============================================
			 * The maximum height of the image that can be shown is 45px.
			 ****************************************************************************/
			.grommunio-maintoolbar {
				background-image: url({{logo-small}});
				background-size: auto 38px;
			}
		',

		/* Dark mode gives the stock logo a light variant; a branded deployment has its
		   own. The selector matches the one in darkmode.css and this block comes after
		   it, so it wins without !important. */
		'logo-small:dark' => '
			body.dark-mode .grommunio-maintoolbar {
				background-image: url({{logo-small:dark}});
				background-size: auto 38px;
			}
		',

		'background-image' => '
			/*********************************************************************************************
			 * The Login screen and the Welcome screen
			 * =======================================
			 ********************************************************************************************/
			/* Background image of the login screen */
			body.login,
			#loading-mask,
			#bg,
			/* Background image of the Welcome screen */
			body.grommunio-welcome {
				background: url({{background-image}}) no-repeat center center;
				background-size: cover;
			}
		',

		'spinner-image' => '
			/* The spinner of the login/loading screen. The one inside the application
			   is drawn from --theme-spinner-image, which getVariables() sets. */
			body.login #form-container.loading .right,
			#loading-mask #form-container.loading .right {
				background: url({{spinner-image}}) no-repeat center center;
			}
		',
	];
}
