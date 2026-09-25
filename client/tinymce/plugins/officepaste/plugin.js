/**
 * OfficePaste for TinyMCE Plugin
 * Copyright (C) 2020-2026 grommunio GmbH <dev@grommunio.com>
 */
(function (root, factory) {
  if (typeof exports === 'object' && typeof module === 'object')
    module.exports = factory(require('tinymce'));
  else if (typeof define === 'function' && define.amd)
    define(['tinymce'], factory);
  else if (typeof exports === 'object')
    exports['tinymce-officepaste-plugin'] = factory(require('tinymce'));
  else
    root['tinymce-officepaste-plugin'] = factory(root.tinymce);
})(this, function (tinymce) {
  'use strict';

  // Symbol fonts decide which character is shown, and code keeps its monospace font
  function keepsFontFamily(family) {
    const families = family.split(',').map((name) => name.trim().replace(/^["']|["']$/g, '').toLowerCase());
    return families.some((name) => /^(symbol|wingdings( [23])?|webdings|mt extra|zapf ?dingbats|opensymbol|(ui-)?monospace)$/.test(name)) ||
      /^(courier|consolas|menlo|monaco|lucida console)\b|\b(mono|code)\b/.test(families[0]);
  }

  // Removes the given style properties, and the legacy attributes that stand for them,
  // from all elements. Spans and fonts left without any attribute are unwrapped.
  function stripStyles(el, properties) {
    const strips = (property) => properties.indexOf(property) !== -1;
    // a text fill paints over the colour
    const removed = strips('color') ? properties.concat(['-webkit-text-fill-color', '-webkit-text-stroke-color']) : properties;

    const styled = el.querySelectorAll('[style]');
    for (let i = 0; i < styled.length; i++) {
      const node = styled[i];
      // a rule may be drawn by its background alone
      if (node.nodeName === 'HR') {
        continue;
      }
      const before = node.style.cssText;
      const keepsFamily = keepsFontFamily(node.style.fontFamily);
      for (let j = 0; j < removed.length; j++) {
        if (removed[j] !== 'font-family' || !keepsFamily) {
          node.style.removeProperty(removed[j]);
        }
      }
      if (node.style.length === 0 && node.style.cssText !== before) {
        node.removeAttribute('style');
      }
    }

    const fonts = el.querySelectorAll('font');
    for (let i = 0; i < fonts.length; i++) {
      if (strips('font-family') && !keepsFontFamily(fonts[i].getAttribute('face') || '')) {
        fonts[i].removeAttribute('face');
      }
      if (strips('font-size')) {
        fonts[i].removeAttribute('size');
      }
      if (strips('color')) {
        fonts[i].removeAttribute('color');
      }
    }
    const backgrounds = el.querySelectorAll('[bgcolor], [background]');
    for (let i = 0; i < backgrounds.length; i++) {
      if (strips('background-color') || strips('background')) {
        backgrounds[i].removeAttribute('bgcolor');
      }
      if (strips('background-image') || strips('background')) {
        backgrounds[i].removeAttribute('background');
      }
    }

    const wrappers = el.querySelectorAll('span, font');
    for (let i = 0; i < wrappers.length; i++) {
      if (wrappers[i].attributes.length === 0) {
        wrappers[i].replaceWith(...wrappers[i].childNodes);
      }
    }
  }

  // Gives the outermost blocks the stripped properties of the editor's own root
  // blocks, which carry the default font of the message. Headings keep their
  // size and preformatted text its font.
  function applyRootBlockStyle(editor, el, properties) {
    const attrs = editor.options.get('forced_root_block_attrs') || {};
    const rootStyle = editor.dom.parseStyle(attrs.style || '');
    const blocks = editor.schema.getBlockElements();

    const visit = (parent) => {
      for (let i = 0; i < parent.children.length; i++) {
        const node = parent.children[i];
        const name = node.nodeName;
        if (!blocks[name]) {
          // e.g. the <b> Google Docs wraps its paragraphs in
          visit(node);
          continue;
        }
        if (name === 'PRE' || name === 'HR') {
          continue;
        }

        let inherited = '';
        for (const property in rootStyle) {
          if (properties.indexOf(property) === -1 || node.style.getPropertyValue(property) !== '' ||
            (property === 'font-size' && /^H[1-6]$/.test(name))) {
            continue;
          }
          inherited += property + ': ' + rootStyle[property] + '; ';
        }
        if (inherited !== '') {
          node.setAttribute('style', inherited + (node.getAttribute('style') || ''));
        }
      }
    };
    visit(el);
  }

  function cleanWordFormatting(editor, content, properties) {
    const el = document.createElement('div');
    el.innerHTML = content;

    if (properties.length > 0) {
      stripStyles(el, properties);
      applyRootBlockStyle(editor, el, properties);
    }

    const paragraphs = el.querySelectorAll('p');

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];

      // Replace empty or insignificant paragraphs with <br />
      if (p.innerHTML.trim() === '' || p.innerHTML.trim() === '&nbsp;') {
        const br = document.createElement('br');
        p.parentNode.replaceChild(br, p);
      } else {
        // Remove unwanted margins from paragraphs to fix excessive line spacing
        p.style.margin = '0';
        p.style.padding = '0';

        // Clean up any unwanted negative text-indent
        if (parseFloat(p.style.textIndent) < 0) {
          p.style.textIndent = '0';
        }
      }
    }

    return el.innerHTML;
  }

  tinymce.PluginManager.add('officepaste', function (editor) {
    // Style properties of the source that are not taken over; content copied
    // within the editor keeps all of them.
    editor.options.register('officepaste_strip_styles', {
      processor: 'string[]',
      default: ['font-family', 'font-size', 'line-height', 'color', 'background-color', 'background']
    });

    editor.on('PastePreProcess', function (e) {
      const properties = e.internal ? [] : editor.options.get('officepaste_strip_styles')
        .join(' ').toLowerCase().split(/[\s,;]+/).filter((property) => property !== '');
      let cleanedContent = cleanWordFormatting(editor, e.content, properties);

      // Insert the cleaned content at the caret position
      e.preventDefault(); // Prevent TinyMCE from handling the paste itself
      editor.execCommand('mceInsertContent', false, cleanedContent);

      // Ensure the caret remains in the right place after pasting
      setTimeout(() => {
        editor.selection.collapse(false);
      }, 0);
    });
  });
});
