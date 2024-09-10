/**
 * OfficePaste for TinyMCE Plugin
 * Copyright (C) 2020-2024 grommunio GmbH <dev@grommunio.com>
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

  function cleanWordFormatting(content) {
    const el = document.createElement('div');
    el.innerHTML = content;

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
    editor.on('PastePreProcess', function (e) {
      let cleanedContent = cleanWordFormatting(e.content);

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
