Ext.namespace('Zarafa.plugins.files.ui.snippets');

Zarafa.plugins.files.ui.snippets.WebODFPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Object} odfCanvas is Object of Odf.odfCanvas class.
	 * This object is responsible for rendering or opening
	 * the WebODF document in light box.
	 */
	odfCanvas: null,

	/**
	 * @cfg {Array} pages The pages in which all pages(slide) should be placed.
	 * This is only useful for ODP type of document.
	 */
	pages : [],

	/**
	 * @cfg {Number} currentPage The currentPage which contain index of
	 * the current page(slide) of the ODP document.
	 */
	currentPage : 0,

	/**
	 * @cfg {String} src The path to the odf file.
	 */
	src: null,

	/**
	 * @cfg {String} title The title of the odf document.
	 */
	title: '',

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
	 * @property {String} panelID The id of the webodf canvas panel
	 */
	panelID: null,

	/**
	 * @constructor
	 */
	constructor: function (config) {
		config = config || {};

		config = Ext.applyIf(config, {
			xtype : 'filesplugin.webodfpanel',
			border: false,
			header: false, // hide title
			items : [{
				xtype    : 'component',
				cls: 'webodfpanel-outerDocumentContainer',
				autoEl   : {
					cn: [
						{tag: 'div', 'class': 'webodfpanel-canvas'}
					]
				},
				listeners: {
					afterrender: this.initODF.createDelegate(this)
				}
			}],
			bbar : this.getPagingToolbar()
		});

		Zarafa.plugins.files.ui.snippets.WebODFPanel.superclass.constructor.call(this, config);
	},

	getPagingToolbar: function () {
		var me = this;

		return {
			xtype: 'toolbar',
			height: 25,
			items: [{
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
				xtype       : 'combo',
				ref         : 'scaleCombo',
				triggerAction: 'all',
				lazyInit    : false,
				forceSelection: true,
				editable: false,
				autoSelect: true,
				disabled    : true,
				hidden: true, // dont show this element . (for now... TODO)
				width       : me.scaleWidth,
				store       : {
					xtype: 'jsonstore',
					autoDestroy : true,
					fields: ['scale', 'text'],
					data  : [
						{
							scale: 0.5,
							text: '50%'
						},{
							scale: 0.75,
							text: '75%'
						},{
							scale: 1,
							text: '100%'
						},{
							scale: 1.25,
							text: '125%'
						},{
							scale: 1.5,
							text: '150%'
						},{
							scale: 2,
							text: '200%'
						},{
							scale: 4,
							text: '400%'
						}
					]
				},
				valueField  : 'scale',
				displayField: 'text',
				mode        : 'local',
				listeners   : {
					scope : me,
					select : me.onScaleChange
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

	initODF: function () {
		// init gui elements
		this.canvasContainer = Ext.DomQuery.selectNode('div[class*=webodfpanel-canvas]', this.el.dom);

		this.odfCanvas = new odf.OdfCanvas(this.canvasContainer);
		this.odfCanvas.load(this.src);
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
		var webodfCfg = {
			resizeDuration : 0.40,
			overlayDuration : 0.6,
			href : this.src,
			title : this.title
		};
		Zarafa.plugins.webodf.WebOdfBox.open(webodfCfg);
	}
});

Ext.reg('filesplugin.webodfpanel', Zarafa.plugins.files.ui.snippets.WebODFPanel);
