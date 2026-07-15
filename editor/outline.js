/*! ---------------------------------------------------------------------
 * TF-ENGINE — editor/outline.js
 * ---------------------------------------------------------------------*/
(function (TF) {
    "use strict";
    if (!TF) { return; }

    TF.editor = TF.editor || {};

    var tree = [];
    var panel = null;
    var listEl = null;
    var activeNodeId = null;
    var onDocumentChange, onCursorMove, onClick;

    var SECTION_TAGS = ["tf-card", "tf-panel", "tf-infobox", "tf-tabs", "tf-alert"];

    function buildTree(text) {
        var parsed = TF.editor.parseDocument(text);
        var root = [];
        var stack = [{ children: root }];
        var counter = 0;

        parsed.tokens.forEach(function (t) {
            if (t.type === "close") {
                for (var i = stack.length - 1; i > 0; i--) {
                    if (stack[i].tag === t.tag) { stack.splice(i); break; }
                }
                return;
            }
            if (SECTION_TAGS.indexOf(t.tag) === -1 && t.tag !== "tf-row" && t.tag !== "tf-tab") { return; }

            var label = t.tag;
            if (t.attrs && (t.attrs.title || t.attrs.label)) {
                label += ": " + (t.attrs.title || t.attrs.label);
            }
            var node = {
                id: "outline-" + (counter++),
                tag: t.tag,
                label: label,
                line: t.startLine,
                children: []
            };
            stack[stack.length - 1].children.push(node);
            if (t.type === "open") {
                node.tag2 = t.tag;
                stack.push({ tag: t.tag, children: node.children });
            }
        });

        text.split("\n").forEach(function (lineText, idx) {
            var m = /^\s*<h([1-6])[^>]*>(.*?)<\/h\1>/i.exec(lineText) || /^\s*={2,6}\s*(.+?)\s*={2,6}\s*$/.exec(lineText);
            if (m) {
                root.push({
                    id: "outline-" + (counter++),
                    tag: "heading",
                    label: (m[2] || m[1] || "").replace(/<[^>]+>/g, "") || lineText.trim(),
                    line: idx + 1,
                    children: []
                });
            }
        });

        var templateRe = /\{\{\s*([^|}]+)/g;
        var tm;
        text.split("\n").forEach(function (lineText, idx) {
            templateRe.lastIndex = 0;
            while ((tm = templateRe.exec(lineText))) {
                root.push({
                    id: "outline-" + (counter++),
                    tag: "template",
                    label: "{{" + tm[1].trim() + "}}",
                    line: idx + 1,
                    children: []
                });
            }
        });

        root.sort(function (a, b) { return a.line - b.line; });
        return root;
    }

    function renderNode(node) {
        var li = TF.utils.create("li", { class: "tf-list-item tf-outline-node", "data-outline-id": node.id, "data-line": node.line });
        li.style.cursor = "pointer";
        li.textContent = node.label + "  (L" + node.line + ")";
        if (node.children && node.children.length) {
            var ul = TF.utils.create("ul", { class: "tf-list" });
            node.children.forEach(function (child) { ul.appendChild(renderNode(child)); });
            li.appendChild(ul);
        }
        return li;
    }

    function render() {
        if (!listEl) { return; }
        listEl.innerHTML = "";
        tree.forEach(function (node) { listEl.appendChild(renderNode(node)); });
    }

    function findNodeById(nodes, id) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].id === id) { return nodes[i]; }
            var found = nodes[i].children && findNodeById(nodes[i].children, id);
            if (found) { return found; }
        }
        return null;
    }

    function findNodeByLine(nodes, line) {
        var best = null;
        function walk(list) {
            list.forEach(function (n) {
                if (n.line <= line && (!best || n.line > best.line)) { best = n; }
                if (n.children) { walk(n.children); }
            });
        }
        walk(nodes);
        return best;
    }

    function setActive(id) {
        activeNodeId = id;
        if (!listEl) { return; }
        TF.utils.queryAll(".tf-outline-node", listEl).forEach(function (li) {
            li.classList.toggle("tf-active", li.getAttribute("data-outline-id") === id);
        });
    }

    TF.editor.outline = {
        refresh: function () {
            tree = buildTree(TF.editor.getDocument());
            render();
            TF.emit("outlineUpdated", { tree: tree });
            return tree;
        },
        expand: function (id) {
            if (!listEl) { return; }
            var li = listEl.querySelector('[data-outline-id="' + id + '"]');
            if (li) { li.classList.remove("tf-outline-collapsed"); }
        },
        collapse: function (id) {
            if (!listEl) { return; }
            var li = listEl.querySelector('[data-outline-id="' + id + '"]');
            if (li) { li.classList.add("tf-outline-collapsed"); }
        },
        selectNode: function (id) {
            var node = findNodeById(tree, id);
            if (!node) { return; }
            setActive(id);
            TF.editor.scrollToLine(node.line);
            TF.emit("nodeSelected", { id: id, node: node });
        },
        getTree: function () { return tree; },
        init: function () {
            var overlay = TF.editor._overlay;
            panel = TF.utils.create("div", { class: "tf-panel tf-editor-outline" });
            panel.style.maxHeight = "260px";
            panel.style.overflow = "auto";
            listEl = TF.utils.create("ul", { class: "tf-list" });
            panel.appendChild(listEl);
            if (overlay && overlay.parentNode) {
                overlay.parentNode.insertBefore(panel, overlay);
            }

            onClick = function (evt) {
                var li = TF.utils.closest(evt.target, "[data-outline-id]");
                if (li) { TF.editor.outline.selectNode(li.getAttribute("data-outline-id")); }
            };
            listEl.addEventListener("click", onClick);

            var cfg = TF.config.editor || {};
            var wait = (cfg.debounce && cfg.debounce.document) || 250;
            onDocumentChange = TF.editor._debounce(function () { TF.editor.outline.refresh(); }, wait);
            TF.on("documentChange", onDocumentChange);

            onCursorMove = TF.editor._debounce(function (evt) {
                var text = TF.editor.getDocument();
                var line = text.slice(0, evt.detail.position).split("\n").length;
                var node = findNodeByLine(tree, line);
                if (node) { setActive(node.id); }
            }, 150);
            TF.on("cursorMove", onCursorMove);

            TF.editor.outline.refresh();
        },
        destroy: function () {
            if (onDocumentChange) { TF.off("documentChange", onDocumentChange); }
            if (onCursorMove) { TF.off("cursorMove", onCursorMove); }
            if (listEl && onClick) { listEl.removeEventListener("click", onClick); }
            if (panel && panel.parentNode) { panel.parentNode.removeChild(panel); }
            panel = null;
            listEl = null;
            tree = [];
        }
    };

})(window.TFEngine);
