Ext.namespace('Zarafa.plugins.files.ui.snippets');

Zarafa.plugins.files.ui.snippets.PDFjsPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg{String} src
	 * URL to the PDF - Same Domain or Server with CORS Support
	 */
	src: '',

	/**
	 * @cfg {String} title The title of the pdf document.
	 */
	title: '',

	/**
	 * @cfg{Double} pageScale
	 * Initial scaling of the PDF. 1 = 100%
	 */
	pageScale: 1,

	/**
	 * @cfg{Boolean} disableWorker
	 * Disable workers to avoid yet another cross-origin issue(workers need the URL of
	 * the script to be loaded, and currently do not allow cross-origin scripts)
	 */
	disableWorker: true,

	/**
	 * @cfg{Boolean} disableTextLayer
	 * Enable to render selectable but hidden text layer on top of an PDF-Page.
	 * This feature is buggy by now and needs more investigation!
	 */
	disableTextLayer: true, // true by now, cause it´s buggy

	/**
	 * @cfg{String} loadingMessage
	 * The text displayed when loading the PDF.
	 */
	loadingMessage: 'Loading PDF, please wait...',

	/**
	 * @cfg{String} beforePageText
	 * The text displayed before the input item.
	 */
	beforePageText: 'Page',

	/**
	 * @cfg{String} afterPageText
	 * Customizable piece of the default paging text. Note that this string is formatted using
	 *{0} as a token that is replaced by the number of total pages. This token should be preserved when overriding this
	 * string if showing the total page count is desired.
	 */
	afterPageText: 'of {0}',

	/**
	 * @cfg{String} firstText
	 * The quicktip text displayed for the first page button.
	 * **Note**: quick tips must be initialized for the quicktip to show.
	 */
	firstText: 'First Page',

	/**
	 * @cfg{String} prevText
	 * The quicktip text displayed for the previous page button.
	 * **Note**: quick tips must be initialized for the quicktip to show.
	 */
	prevText: 'Previous Page',

	/**
	 * @cfg{String} nextText
	 * The quicktip text displayed for the next page button.
	 * **Note**: quick tips must be initialized for the quicktip to show.
	 */
	nextText: 'Next Page',

	/**
	 * @cfg{String} lastText
	 * The quicktip text displayed for the last page button.
	 * **Note**: quick tips must be initialized for the quicktip to show.
	 */
	lastText: 'Last Page',

	/**
	 * @cfg{String} fullscreenText
	 * The quicktip text displayed for the fullscreen button.
	 * **Note**: quick tips must be initialized for the quicktip to show.
	 */
	fullscreenText: 'Fullscreen',

	/**
	 * @cfg{Number} inputItemWidth
	 * The width in pixels of the input field used to display and change the current page number.
	 */
	inputItemWidth: 30,

	/**
	 * @cfg{Number} inputItemWidth
	 * The width in pixels of the combobox used to change display scale of the PDF.
	 */
	scaleWidth: 60,

	/**
	 * @constructor
	 */
	constructor: function (config) {
		config = config || {};

		config = Ext.applyIf(config, {
			xtype     : 'filesplugin.pdfjspanel',
			border    : false,
			baseCls   : 'x-panel pdf',
			bodyCssCls: 'pdf-body',
			pageScale : 1,
			header    : false, // hide title
			items     : [{
				xtype    : 'component',
				autoEl   : {
					cn: [
						{tag: 'canvas', 'class': 'pdf-page-container'},
						{tag: 'div', 'class': 'pdf-text-layer'}
					]
				},
				listeners: {
					afterrender: this.init.createDelegate(this)
				}
			}],
			bbar      : this.getPagingToolbar()
		});

		PDFJS.disableTextLayer = this.disableTextLayer;

		Zarafa.plugins.files.ui.snippets.PDFjsPanel.superclass.constructor.call(this, config);
	},

	getPagingToolbar: function () {
		var me = this;

		return {
			xtype : 'toolbar',
			height: 25,
			items : [{
				ref         : 'first',
				tooltip     : me.firstText,
				overflowText: me.firstText,
				iconCls     : 'x-tbar-page-first',
				disabled    : true,
				handler     : me.moveFirst,
				scope       : me
			}, {
				ref         : 'prev',
				tooltip     : me.prevText,
				overflowText: me.prevText,
				iconCls     : 'x-tbar-page-prev',
				disabled    : true,
				handler     : me.movePrevious,
				scope       : me
			}, '-', me.beforePageText, {
				xtype          : 'numberfield',
				ref            : 'inputItem',
				name           : 'inputItem',
				cls            : 'x-tbar-page-number',
				minValue       : 1,
				allowDecimals  : false,
				allowNegative  : false,
				enableKeyEvents: true,
				selectOnFocus  : true,
				submitValue    : false,
				width          : me.inputItemWidth,
				disabled       : true,
				margins        : '-1 2 3 2',
				listeners      : {
					scope  : me,
					keydown: me.onPagingKeyDown,
					blur   : me.onPagingBlur
				}
			}, {
				xtype  : 'tbtext',
				ref    : 'afterTextItem',
				text   : String.format(me.afterPageText, 1),
				margins: '0 5 0 0'
			}, '-', {
				ref         : 'next',
				tooltip     : me.nextText,
				overflowText: me.nextText,
				iconCls     : 'x-tbar-page-next',
				disabled    : true,
				handler     : me.moveNext,
				scope       : me
			}, {
				ref         : 'last',
				tooltip     : me.lastText,
				overflowText: me.lastText,
				iconCls     : 'x-tbar-page-last',
				disabled    : true,
				handler     : me.moveLast,
				scope       : me
			}, '->', {
				xtype         : 'combo',
				ref           : 'scaleCombo',
				triggerAction : 'all',
				lazyInit      : false,
				forceSelection: true,
				editable      : false,
				autoSelect    : true,
				disabled      : true,
				hidden        : true, // dont show this element . (for now... TODO)
				width         : me.scaleWidth,
				store         : {
					xtype      : 'jsonstore',
					autoDestroy: true,
					fields     : ['scale', 'text'],
					data       : [
						{
							scale: 0.5,
							text : '50%'
						}, {
							scale: 0.75,
							text : '75%'
						}, {
							scale: 1,
							text : '100%'
						}, {
							scale: 1.25,
							text : '125%'
						}, {
							scale: 1.5,
							text : '150%'
						}, {
							scale: 2,
							text : '200%'
						}, {
							scale: 4,
							text : '400%'
						}
					]
				},
				valueField    : 'scale',
				displayField  : 'text',
				mode          : 'local',
				listeners     : {
					scope : me,
					select: me.onScaleChange
				}
			}, {
				ref         : 'fullscreen',
				tooltip     : me.fullscreenText,
				overflowText: me.fullscreenText,
				iconCls     : 'files_icon_action_fullscreen',
				disabled    : false,
				handler     : me.displayFullscreen,
				scope       : me
			}]
		};
	},

	init: function () {
		// init gui elements
		this.pageContainer = this.el.query('.pdf-page-container')[0];

		if (!PDFJS.disableTextLayer) {
			this.textLayerDiv = this.el.query('.pdf-text-layer')[0];
		}

		if (this.disableWorker) {
			PDFJS.disableWorker = true;
		}

		// Asynchronously download PDF as an ArrayBuffer
		this.getDocument();
	}
	,

	onLoad: function () {
		try {
			var me = this, isEmpty;

			isEmpty = me.pdfDoc.numPages === 0;
			me.currentPage = me.currentPage || (isEmpty ? 0 : 1);

			me.renderPage(me.currentPage);
		}
		catch (error) {
			console.log("PDF: Can't render: " + error.message);
		}
	}
	,

	renderPage: function (num) {
		var me = this;
		var isEmpty, pageCount, currPage, afterText;
		var toolbar = me.getBottomToolbar();

		if (this.isRendering) {
			return;
		}

		me.isRendering = true;
		me.currentPage = num;

		currPage = me.currentPage;
		pageCount = me.pdfDoc.numPages;
		afterText = String.format(me.afterPageText, isNaN(pageCount) ? 1 : pageCount);
		isEmpty = pageCount === 0;

		toolbar.afterTextItem.setText(afterText);
		toolbar.inputItem.setDisabled(isEmpty);
		toolbar.inputItem.setValue(currPage);
		toolbar.first.setDisabled(currPage === 1 || isEmpty);
		toolbar.prev.setDisabled(currPage === 1 || isEmpty);
		toolbar.next.setDisabled(currPage === pageCount || isEmpty);
		toolbar.last.setDisabled(currPage === pageCount || isEmpty);
		toolbar.scaleCombo.setDisabled(isEmpty);
		toolbar.scaleCombo.setValue(me.pageScale);

		// Using promise to fetch the page
		me.pdfDoc.getPage(num).then(function (page) {

			if (!me.pageContainer) {
				// pageContainer not available. Widget destroyed already?
				me.isRendering = false;

				return;
			}

			var viewport = page.getViewport(me.pageScale);
			me.pageContainer.height = viewport.height;
			me.pageContainer.width = viewport.width;

			var ctx = me.pageContainer.getContext('2d');
			ctx.save();
			ctx.fillStyle = 'rgb(255, 255, 255)';
			ctx.fillRect(0, 0, me.pageContainer.width, me.pageContainer.height);
			ctx.restore();

			// see https://github.com/SunboX/ext_ux_pdf_panel/blob/master/ux/panel/PDF.js
			var textLayer = null; // TODO: this should be implemented...

			// Render PDF page into canvas context
			var renderContext = {
				canvasContext: ctx,
				viewport     : viewport,
				textLayer    : textLayer
			};
			page.render(renderContext);

			me.isRendering = false;

			if (me.loader) {
				me.loader.destroy();
			}

			if (me.rendered) {
				me.fireEvent('change', me, {
					current: me.currentPage,
					total  : me.pdfDoc.numPages
				});
			}
		});
	},

	moveFirst: function () {
		var me = this;
		if (me.fireEvent('beforechange', me, 1) !== false) {
			me.renderPage(1);
		}
	},

	movePrevious: function () {
		var me = this,
			prev = me.currentPage - 1;

		if (prev > 0) {
			if (me.fireEvent('beforechange', me, prev) !== false) {
				me.renderPage(prev);
			}
		}
	},

	moveNext: function () {
		var me = this,
			total = me.pdfDoc.numPages,
			next = me.currentPage + 1;

		if (next <= total) {
			if (me.fireEvent('beforechange', me, next) !== false) {
				me.renderPage(next);
			}
		}
	},

	moveLast: function () {
		var me = this,
			last = me.pdfDoc.numPages;

		if (me.fireEvent('beforechange', me, last) !== false) {
			me.renderPage(last);
		}
	},

	readPageFromInput: function () {
		var me = this, v = me.getBottomToolbar().inputItem.getValue(),
			pageNum = parseInt(v, 10);

		if (!v || isNaN(pageNum)) {
			me.getBottomToolbar().inputItem.setValue(me.currentPage);
			return false;
		}
		return pageNum;
	},

	onPagingFocus: function () {
		this.getBottomToolbar().inputItem.select();
	},

	onPagingBlur: function (e) {
		var curPage = this.getPageData().currentPage;
		this.getBottomToolbar().inputItem.setValue(curPage);
	},

	onPagingKeyDown: function (field, e) {
		var me = this,
			k = e.getKey(),
			increment = e.shiftKey ? 10 : 1,
			pageNum, total = me.pdfDoc.numPages;

		if (k == e.RETURN) {
			e.stopEvent();
			pageNum = me.readPageFromInput();
			if (pageNum !== false) {
				pageNum = Math.min(Math.max(1, pageNum), total);
				if (me.fireEvent('beforechange', me, pageNum) !== false) {
					me.renderPage(pageNum);
				}
			}
		} else if (k == e.HOME || k == e.END) {
			e.stopEvent();
			pageNum = k == e.HOME ? 1 : total;
			field.setValue(pageNum);
		} else if (k == e.UP || k == e.PAGE_UP || k == e.DOWN || k == e.PAGE_DOWN) {
			e.stopEvent();
			pageNum = me.readPageFromInput();
			if (pageNum) {
				if (k == e.DOWN || k == e.PAGE_DOWN) {
					increment *= -1;
				}
				pageNum += increment;
				if (pageNum >= 1 && pageNum <= total) {
					field.setValue(pageNum);
				}
			}
		}
	},

	onScaleChange: function (combo, record) {
		var me = this;

		me.pageScale = record.get(combo.valueField);
		me.renderPage(me.currentPage);
	},

	displayFullscreen: function () {
		var pdfBoxCfg = {
			easing        : 'elasticOut',
			resizeDuration: 0.6,
			close         : '&#215;',
			hideInfo      : 'auto',
			href          : this.src,
			title         : this.tile
		};
		Ext.ux.PdfBox.open(pdfBoxCfg);
	},

	setSrc: function (src) {
		this.src = src;
		return this.getDocument();
	}
	,

	getDocument: function () {
		var me = this;
		if (!!me.src) {
			PDFJS.getDocument(me.src).then(function (pdfDoc) {
				me.pdfDoc = pdfDoc;
				me.onLoad();
			});
		}
		return me;
	}
})
;

Ext.reg('filesplugin.pdfjspanel', Zarafa.plugins.files.ui.snippets.PDFjsPanel);
