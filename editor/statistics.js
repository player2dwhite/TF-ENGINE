/*! TF-ENGINE — editor/statistics.js */
(function (TF) {
    "use strict";
    if (!TF) { return; }

    TF.editor = TF.editor || {};

    var current = null;
    var onDocumentChange, onSelectionChange;

    function byteLength(str) {
        try {
            return new Blob([str]).size;
        } catch (err) {
            
            return unescape(encodeURIComponent(str)).length;
        }
    }

    function countStructure(text) {
        var parsed = TF.editor.parseDocument(text);
        var counts = {
            htmlTags: 0, tfComponents: 0, panels: 0, cards: 0, tabs: 0,
            alerts: 0, variables: 0, cssVariables: 0, animations: 0
        };
        parsed.tokens.forEach(function (t) {
            if (t.type === "close") { return; }
            counts.htmlTags++;
            if (t.tag.indexOf("tf-") === 0) { counts.tfComponents++; }
            if (t.tag === "tf-panel") { counts.panels++; }
            if (t.tag === "tf-card") { counts.cards++; }
            if (t.tag === "tf-tabs") { counts.tabs++; }
            if (t.tag === "tf-alert") { counts.alerts++; }
        });
        var varMatches = text.match(/--[\w-]+\s*:/g);
        counts.variables = varMatches ? varMatches.length : 0;
        var cssVarUsage = text.match(/var\(\s*--[\w-]+/g);
        counts.cssVariables = cssVarUsage ? cssVarUsage.length : 0;
        var animClasses = text.match(/\btf-(fade|slide|zoom|pulse)\b/g);
        counts.animations = animClasses ? animClasses.length : 0;
        return counts;
    }

    function computeGeneral(lines) {
        var blank = 0, comment = 0;
        lines.forEach(function (line) {
            var trimmed = line.trim();
            if (trimmed === "") { blank++; }
            else if (/^<!--.*-->$/.test(trimmed) || /^<!--/.test(trimmed)) { comment++; }
        });
        return {
            totalLines: lines.length,
            blankLines: blank,
            commentLines: comment,
            codeLines: lines.length - blank - comment
        };
    }

    function computeText(text) {
        var words = text.trim() === "" ? [] : text.trim().split(/\s+/);
        var bytes = byteLength(text);
        return {
            characters: text.length,
            charactersNoSpaces: text.replace(/\s/g, "").length,
            words: words.length,
            bytes: bytes,
            kb: +(bytes / 1024).toFixed(2),
            utf8Size: bytes
        };
    }

    function computeEngine() {
        return {
            engineVersion: TF.version,
            loadedModules: TF._modules.filter(function (m) { return m.status === "ready"; }).length,
            registeredComponents: Object.keys(TF.components || {}).length,
            loadedPlugins: undefined
        };
    }

    function computePerformance() {
        var perf = TF.editor._perf || {};
        return {
            parseTime: perf.parse || 0,
            diagnosticsTime: perf.diagnostics || 0,
            renderTime: perf.render || 0
        };
    }

    function refresh() {
        var t0 = (window.performance ? performance.now() : Date.now());
        var text = TF.editor.getDocument();
        var lines = text.split("\n");

        current = {
            general: computeGeneral(lines),
            text: computeText(text),
            structure: countStructure(text),
            performance: computePerformance(),
            engine: computeEngine(),
            selection: computeSelectionStats()
        };

        var elapsed = (window.performance ? performance.now() : Date.now()) - t0;
        TF.editor._perf = TF.editor._perf || {};
        TF.editor._perf.parse = elapsed;

        TF.emit("statisticsUpdated", { statistics: current });
        return current;
    }

    function computeSelectionStats() {
        var sel = TF.editor.getSelection();
        var text = TF.editor.getDocument();
        var start = Math.min(sel.start, sel.end);
        var end = Math.max(sel.start, sel.end);
        var selected = text.slice(start, end);
        return {
            selectedLines: selected ? selected.split("\n").length : 0,
            selectedCharacters: selected.length,
            selectedWords: selected.trim() === "" ? 0 : selected.trim().split(/\s+/).length
        };
    }

    TF.editor.statistics = {
        refresh: refresh,
        reset: function () {
            current = null;
            TF.emit("statisticsUpdated", { statistics: null });
        },
        getStatistics: function () { return current; },
        getSelectionStatistics: function () { return computeSelectionStats(); },
        init: function () {
            var cfg = TF.config.editor || {};
            var wait = (cfg.debounce && cfg.debounce.document) || 250;

            onDocumentChange = TF.editor._debounce(refresh, wait);
            onSelectionChange = TF.editor._debounce(function () {
                TF.emit("statisticsUpdated", { statistics: current, selectionOnly: true });
            }, 100);

            TF.on("documentChange", onDocumentChange);
            TF.on("selectionChange", onSelectionChange);
            refresh();
        },
        destroy: function () {
            if (onDocumentChange) { TF.off("documentChange", onDocumentChange); }
            if (onSelectionChange) { TF.off("selectionChange", onSelectionChange); }
            current = null;
        }
    };

})(window.TFEngine);
