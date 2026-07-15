/*! ---------------------------------------------------------------------
 * TF-ENGINE — editor/editor.js
 * --------------------------------------------------------------------- */
(function (TF) {
    "use strict";
    if (!TF) { return; }

    TF.editor = TF.editor || {};

    var EDITOR_DEFAULTS = {
        enabled: false,
        modules: {
            diagnostics: true,
            highlighter: true,
            statistics: true,
            outline: true,
            autocomplete: false 
        },
        debounce: {
            document: 250,
            resize: 150
        }
    };

    function resolveConfig() {
        var base = TF.utils.deepMerge({}, EDITOR_DEFAULTS);
        TF.config.editor = TF.utils.deepMerge(base, TF.config.editor || {});
        return TF.config.editor;
    }

    TF.editor._debounce = function (fn, wait) {
        var timer = null;
        return function () {
            var ctx = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
        };
    };

    var state = {
        active: false,
        adapterType: null,    
        textarea: null,
        cm: null,               
        wrapper: null,          
        listeners: [],         
        resizeObserver: null
    };

    function detectTextarea() {
        return document.getElementById("wpTextbox1");
    }

    function detectCodeMirror(textarea) {
      
        if (!textarea || !textarea.parentNode) { return null; }
        var wrap = textarea.parentNode.querySelector(".CodeMirror");
        if (wrap && wrap.CodeMirror) { return wrap.CodeMirror; }
        return null;
    }

    function detectVisualEditor() {
        return !!document.querySelector(".ve-ce-documentNode, .ve-ui-surface");
    }

    function buildTextareaAdapter(textarea) {
        return {
            type: "textarea",
            getValue: function () { return textarea.value; },
            getSelection: function () {
                return {
                    start: textarea.selectionStart,
                    end: textarea.selectionEnd
                };
            },
            setSelection: function (start, end) {
                textarea.selectionStart = start;
                textarea.selectionEnd = (end === undefined) ? start : end;
            },
            scrollToLine: function (line) {
                var lines = textarea.value.split("\n");
                var index = 0;
                for (var i = 0; i < Math.min(line, lines.length); i++) {
                    index += lines[i].length + 1;
                }
                textarea.selectionStart = textarea.selectionEnd = index;
                var lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 18;
                textarea.scrollTop = Math.max(0, (line - 3) * lineHeight);
            },
            getScrollInfo: function () {
                return { top: textarea.scrollTop, left: textarea.scrollLeft };
            },
            focus: function () { textarea.focus(); },
            blur: function () { textarea.blur(); },
            el: textarea
        };
    }

    function buildCodeMirrorAdapter(cm) {
        return {
            type: "codemirror",
            getValue: function () { return cm.getValue(); },
            getSelection: function () {
                var sel = cm.listSelections()[0];
                if (!sel) { return { start: 0, end: 0 }; }
                var start = cm.indexFromPos(sel.anchor);
                var end = cm.indexFromPos(sel.head);
                return { start: Math.min(start, end), end: Math.max(start, end) };
            },
            setSelection: function (start, end) {
                cm.setSelection(cm.posFromIndex(start), cm.posFromIndex(end === undefined ? start : end));
            },
            scrollToLine: function (line) {
                cm.scrollIntoView({ line: Math.max(0, line - 1), ch: 0 }, 100);
            },
            getScrollInfo: function () { return cm.getScrollInfo(); },
            focus: function () { cm.focus(); },
            blur: function () { cm.getInputField().blur(); },
            el: cm.getWrapperElement()
        };
    }

    function buildOverlay(referenceEl) {
        var wrapper = TF.utils.create("div", { class: "tf-engine tf-editor-overlay" });
        referenceEl.parentNode.insertBefore(wrapper, referenceEl);
        wrapper.appendChild(referenceEl);
        return wrapper;
    }

    function addListener(target, type, fn, opts) {
        target.addEventListener(type, fn, opts || false);
        state.listeners.push({ target: target, type: type, fn: fn, opts: opts });
    }

    function removeAllListeners() {
        state.listeners.forEach(function (entry) {
            entry.target.removeEventListener(entry.type, entry.fn, entry.opts || false);
        });
        state.listeners = [];
    }

    function bindDocumentEvents(cfg) {
        var emitDocumentChange = TF.editor._debounce(function () {
            TF.emit("documentChange", { value: TF.editor.getDocument() });
        }, cfg.debounce.document);

        var emitSelectionChange = function () {
            var sel = TF.editor.getSelection();
            TF.emit("selectionChange", sel);
            TF.emit("cursorMove", { position: sel.end });
        };

        var emitScroll = function () {
            TF.emit("editorScroll", TF.editor._adapter.getScrollInfo());
        };

        if (state.adapterType === "textarea") {
            addListener(state.textarea, "input", emitDocumentChange);
            addListener(state.textarea, "keyup", emitSelectionChange);
            addListener(state.textarea, "click", emitSelectionChange);
            addListener(state.textarea, "scroll", emitScroll);
        } else if (state.adapterType === "codemirror") {
            state.cm.on("change", emitDocumentChange);
            state.cm.on("cursorActivity", emitSelectionChange);
            state.cm.on("scroll", emitScroll);
            state.listeners.push({
                target: { removeEventListener: function () {
                    state.cm.off("change", emitDocumentChange);
                    state.cm.off("cursorActivity", emitSelectionChange);
                    state.cm.off("scroll", emitScroll);
                } },
                type: "noop",
                fn: function () {}
            });
        }

        var emitResize = TF.editor._debounce(function () {
            TF.editor.refresh();
        }, cfg.debounce.resize);
        addListener(window, "resize", emitResize);
    }

    function initSubmodules(cfg) {
        ["diagnostics", "highlighter", "statistics", "outline", "autocomplete"].forEach(function (name) {
            var sub = TF.editor[name];
            if (!sub || typeof sub.init !== "function") { return; }
            if (!cfg.modules[name]) { return; }
            try {
                sub.init(TF);
            } catch (err) {
                TF.error("editor/" + name + " failed to Start::", err);
            }
        });
    }

    function destroySubmodules() {
        ["autocomplete", "outline", "statistics", "highlighter", "diagnostics"].forEach(function (name) {
            var sub = TF.editor[name];
            if (sub && typeof sub.destroy === "function") {
                try { sub.destroy(); } catch (err) { TF.error("editor/" + name + " failed to destroy:", err); }
            }
        });
    }

    TF.editor.init = function () {
        if (state.active) { return TF.editor; }

        var cfg = resolveConfig();
        if (!cfg.enabled) { return TF.editor; }

        if (detectVisualEditor()) {
            TF.log("VisualEditor detected, TF-Engine editor remains inactive.");
            return TF.editor;
        }

        var textarea = detectTextarea();
        if (!textarea) { return TF.editor; } 

        var cm = detectCodeMirror(textarea);
        state.textarea = textarea;
        state.cm = cm;
        state.adapterType = cm ? "codemirror" : "textarea";
        TF.editor._adapter = cm ? buildCodeMirrorAdapter(cm) : buildTextareaAdapter(textarea);

        state.wrapper = buildOverlay(cm ? cm.getWrapperElement() : textarea);
        TF.editor._overlay = state.wrapper;

        bindDocumentEvents(cfg);
        initSubmodules(cfg);

        state.active = true;
        TF.emit("editorReady", { adapter: state.adapterType });
        return TF.editor;
    };

    TF.editor.destroy = function () {
        if (!state.active) { return TF.editor; }
        destroySubmodules();
        removeAllListeners();

        if (state.wrapper && state.wrapper.parentNode) {
            state.wrapper.parentNode.insertBefore(state.wrapper.firstChild, state.wrapper);
            state.wrapper.parentNode.removeChild(state.wrapper);
        }

        state.active = false;
        state.textarea = null;
        state.cm = null;
        state.wrapper = null;
        TF.editor._adapter = null;
        TF.emit("editorDestroy", {});
        return TF.editor;
    };

    TF.editor.reload = function () {
        TF.editor.destroy();
        TF.editor.init();
        TF.emit("editorReload", {});
        return TF.editor;
    };

    TF.editor.refresh = function () {
        if (!state.active) { return TF.editor; }
        TF.emit("documentChange", { value: TF.editor.getDocument() });
        return TF.editor;
    };

    TF.editor.getEditor = function () { return TF.editor._adapter; };

    TF.editor.getDocument = function () {
        return state.active && TF.editor._adapter ? TF.editor._adapter.getValue() : "";
    };

    TF.editor.getSelection = function () {
        return state.active && TF.editor._adapter
            ? TF.editor._adapter.getSelection()
            : { start: 0, end: 0 };
    };

    TF.editor.setSelection = function (start, end) {
        if (state.active && TF.editor._adapter) { TF.editor._adapter.setSelection(start, end); }
        return TF.editor;
    };

    TF.editor.scrollToLine = function (line) {
        if (state.active && TF.editor._adapter) { TF.editor._adapter.scrollToLine(line); }
        return TF.editor;
    };

    TF.editor.focus = function () {
        if (state.active && TF.editor._adapter) { TF.editor._adapter.focus(); }
        return TF.editor;
    };

    TF.editor.blur = function () {
        if (state.active && TF.editor._adapter) { TF.editor._adapter.blur(); }
        return TF.editor;
    };

    var VOID_ELEMENTS = ["br", "img", "hr", "input", "meta", "link", "source", "col", "area", "base", "embed", "track", "wbr"];

    TF.editor.parseDocument = function (text) {
        text = text || "";
        var lineStarts = [0];
        for (var i = 0; i < text.length; i++) {
            if (text[i] === "\n") { lineStarts.push(i + 1); }
        }
        function lineColOf(index) {
            var lo = 0, hi = lineStarts.length - 1, line = 0;
            while (lo <= hi) {
                var mid = (lo + hi) >> 1;
                if (lineStarts[mid] <= index) { line = mid; lo = mid + 1; }
                else { hi = mid - 1; }
            }
            return { line: line + 1, col: index - lineStarts[line] + 1 };
        }

        var tokens = [];
        var re = /<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
        var match;
        while ((match = re.exec(text))) {
            var closing = match[1] === "/";
            var tag = match[2].toLowerCase();
            var attrsRaw = match[3] || "";
            var selfClosed = match[4] === "/" || VOID_ELEMENTS.indexOf(tag) !== -1;

            var attrs = {};
            var attrRe = /([a-zA-Z_:][\w:.-]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|[^\s"'=<>`]+))?/g;
            var am;
            while ((am = attrRe.exec(attrsRaw))) {
                var name = am[1];
                var value = am[3] !== undefined ? am[3] : (am[4] !== undefined ? am[4] : am[2]);
                attrs[name] = value === undefined ? "" : value;
            }

            var startLC = lineColOf(match.index);
            var endLC = lineColOf(match.index + match[0].length);

            tokens.push({
                tag: tag,
                type: closing ? "close" : (selfClosed ? "self" : "open"),
                attrs: attrs,
                raw: match[0],
                start: match.index,
                end: match.index + match[0].length,
                startLine: startLC.line,
                startCol: startLC.col,
                endLine: endLC.line,
                endCol: endLC.col
            });
        }
        return { tokens: tokens, lineStarts: lineStarts, lineColOf: lineColOf };
    };

    TF.registerModule("editor", {
        init: function () {
            TF.editor.init();
        }
    }, { priority: 50 });

})(window.TFEngine);
EOF
node --check /home/claude/TF-ENGINE/js/editor/editor.js && echo "editor.js: sintaxis válida"
