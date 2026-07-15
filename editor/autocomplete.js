/*! ---------------------------------------------------------------------
 * TF-ENGINE — editor/autocomplete.js
 * ---------------------------------------------------------------------*/
(function (TF) {
    "use strict";
    if (!TF) { return; }

    TF.editor = TF.editor || {};

    var enabled = false;
    var providers = {};
    var popup = null;
    var onKeyup, onDocumentChange;

    var TF_TAGS = ["tf-card", "tf-panel", "tf-alert", "tf-badge", "tf-infobox", "tf-row", "tf-tabs", "tf-tab"];
    var TF_UTILITY_CLASSES = ["tf-flex", "tf-grid", "tf-center", "tf-mt-1", "tf-mt-2", "tf-mt-3",
        "tf-p-1", "tf-p-2", "tf-p-3", "tf-bold", "tf-italic", "tf-round", "tf-shadow"];

    function registerBuiltinProviders() {
        TF.editor.autocomplete.registerProvider("tf-tags", {
            
            trigger: /<tf-([\w-]*)$/,
            suggest: function (match) {
                var partial = match[1] || "";
                return TF_TAGS
                    .filter(function (tag) { return tag.indexOf("tf-" + partial) === 0; })
                    .map(function (tag) { return { label: "<" + tag + ">", insert: tag.slice(("tf-" + partial).length) + ">" , doc: "Componente TF-Engine" }; });
            }
        });

        TF.editor.autocomplete.registerProvider("tf-classes", {
            
            trigger: /class="[^"]*\btf-([\w-]*)$/,
            suggest: function (match) {
                var partial = match[1] || "";
                return TF_UTILITY_CLASSES
                    .filter(function (cls) { return cls.indexOf("tf-" + partial) === 0; })
                    .map(function (cls) { return { label: cls, insert: cls.slice(("tf-" + partial).length), doc: "Clase de utilidad TF-Engine" }; });
            }
        });

        TF.editor.autocomplete.registerProvider("tf-variables", {
            
            trigger: /var\(\s*--([\w-]*)$/,
            suggest: function (match) {
                var partial = match[1] || "";
                var vars = ["ac", "ac2", "bg", "bg2", "rd", "rd-sm", "rd-lg", "tx", "tt", "cr", "pl", "nt"];
                return vars
                    .filter(function (v) { return v.indexOf(partial) === 0; })
                    .map(function (v) { return { label: "--" + v, insert: v.slice(partial.length), doc: "Variable CSS de TF-Engine" }; });
            }
        });
    }

    function closePopup() {
        if (popup && popup.parentNode) { popup.parentNode.removeChild(popup); }
        popup = null;
    }

    function openPopup(suggestions, adapter) {
        closePopup();
        if (!suggestions.length) { return; }

        popup = TF.utils.create("ul", { class: "tf-list tf-editor-autocomplete-popup" });
        popup.style.position = "absolute";
        popup.style.zIndex = "50";
        popup.style.maxHeight = "180px";
        popup.style.overflow = "auto";

        suggestions.slice(0, 10).forEach(function (s) {
            var li = TF.utils.create("li", { class: "tf-list-item" }, s.label);
            li.style.cursor = "pointer";
            li.title = s.doc || "";
            li.addEventListener("mousedown", function (evt) {
                evt.preventDefault();
                applySuggestion(s, adapter);
                closePopup();
            });
            popup.appendChild(li);
        });

        var overlay = TF.editor._overlay;
        if (overlay) { overlay.appendChild(popup); }
    }

    function applySuggestion(suggestion) {

        var sel = TF.editor.getSelection();
        var text = TF.editor.getDocument();
        var adapter = TF.editor.getEditor();
        if (!adapter || adapter.type !== "textarea") { return; } 

        var before = text.slice(0, sel.end);
        var after = text.slice(sel.end);
        var newValue = before + suggestion.insert + after;
        adapter.el.value = newValue;
        var newPos = sel.end + suggestion.insert.length;
        adapter.setSelection(newPos, newPos);
        adapter.el.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function checkTriggers() {
        var sel = TF.editor.getSelection();
        var text = TF.editor.getDocument();
        var before = text.slice(0, sel.end);

        var lineStart = before.lastIndexOf("\n") + 1;
        var linePrefix = before.slice(lineStart);

        var collected = [];
        Object.keys(providers).forEach(function (name) {
            var provider = providers[name];
            var match = provider.trigger.exec(linePrefix);
            if (match) {
                try {
                    collected = collected.concat(provider.suggest(match) || []);
                } catch (err) {
                    TF.error("autocomplete provider '" + name + "' falló:", err);
                }
            }
        });

        if (collected.length) {
            openPopup(collected);
        } else {
            closePopup();
        }
    }

    TF.editor.autocomplete = {
        enable: function () { enabled = true; },
        disable: function () { enabled = false; closePopup(); },
        registerProvider: function (name, provider) {
            if (!provider || !(provider.trigger instanceof RegExp) || typeof provider.suggest !== "function") {
                TF.warn("provider de autocomplete inválido: '" + name + "'.");
                return;
            }
            providers[name] = provider;
        },
        removeProvider: function (name) { delete providers[name]; },
        refresh: function () { if (enabled) { checkTriggers(); } },
        init: function () {
            enabled = true;
            registerBuiltinProviders();

            onKeyup = TF.editor._debounce(function () {
                if (enabled) { checkTriggers(); }
            }, 150);
            onDocumentChange = function () { closePopup(); };

            var adapter = TF.editor.getEditor();
            if (adapter && adapter.type === "textarea") {
                adapter.el.addEventListener("keyup", onKeyup);
            }
            TF.on("documentChange", onDocumentChange);
        },
        destroy: function () {
            var adapter = TF.editor.getEditor();
            if (adapter && adapter.type === "textarea" && onKeyup) {
                adapter.el.removeEventListener("keyup", onKeyup);
            }
            if (onDocumentChange) { TF.off("documentChange", onDocumentChange); }
            closePopup();
            providers = {};
            enabled = false;
        }
    };

})(window.TFEngine);
