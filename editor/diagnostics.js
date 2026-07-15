/*!
 * TF-ENGINE — editor/diagnostics.js
 * ---------------------------------------------------------------------
 * Analiza el documento del editor y produce una lista de diagnósticos
 * ({ severity, startLine, endLine, startColumn, endColumn, code,
 * message, source }). Nunca modifica el documento, nunca sugiere
 * arreglos automáticos. Se apoya en TFEngine.editor.parseDocument()
 * (del controlador) para tokenizar; no llama a otros módulos del
 * editor directamente — solo emite "diagnosticsUpdated".
 * ---------------------------------------------------------------------
 */
(function (TF) {
    "use strict";
    if (!TF) { return; }

    TF.editor = TF.editor || {};

    var KNOWN_COMPONENTS = ["tf-card", "tf-panel", "tf-alert", "tf-badge", "tf-infobox", "tf-row", "tf-tabs", "tf-tab"];
    var CONTAINMENT = { "tf-row": "tf-infobox", "tf-tab": "tf-tabs" };
    var ATTR_ENUMS = {
        "tf-alert": { type: ["cr", "nt", "pl"] },
        "tf-badge": { type: ["accent", "cr", "pl", "nt"] }
    };
    var KNOWN_VARS = ["bcg", "bg", "bg2", "bg3", "glass", "pn", "pn2", "tx", "tt", "st", "ds", "mu",
        "ac", "ac2", "cr", "pl", "pll", "nt", "ntl", "lk", "lk2", "red", "green", "yellow", "purple",
        "cyan", "bd", "ln", "bd2", "rd", "rd-sm", "rd-lg", "rd-pill", "sh", "ss", "is", "gl", "ff",
        "ff-mono", "lh", "fw", "fw-b", "xs", "sm", "md", "lg", "xl", "pd", "pd-card", "gp", "mg",
        "hover", "active", "disabled", "focus", "table-head", "table-row1", "table-row2", "fit",
        "pos", "tr-fast", "tr-normal", "ease", "flex", "grid", "wrap", "center", "pointer", "full",
        "auto", "none", "crl", "cr-tx", "infol", "th-line", "content-width", "hero-height",
        "card-width", "container-width", "blur", "anim-fast", "anim", "anim-slow", "icon-size",
        "avatar-size", "image-radius", "noise-opacity", "z-dropdown", "z-modal", "z-tooltip",
        "z-toast", "bw", "bw2", "bs", "table-padding", "table-radius", "table-border", "btn-padding",
        "btn-radius", "btn-font", "card-padding", "card-radius", "card-shadow", "e1", "e2", "e3"];
    var KNOWN_UTILITY_PREFIXES = ["tf-mt-", "tf-mb-", "tf-p-", "tf-gap-", "tf-w-", "tf-max-",
        "tf-col-span-", "tf-row-span-", "tf-order-", "tf-e", "tf-theme-"];
    var KNOWN_CLASSES = ["tf-engine", "tf-flat", "tf-card", "tf-accent", "tf-panel", "tf-note",
        "tf-badge", "tf-code", "tf-divider", "tf-glow", "tf-flex", "tf-grid", "tf-cols-2",
        "tf-cols-3", "tf-cols-4", "tf-center", "tf-right", "tf-left", "tf-table", "tf-image",
        "tf-avatar", "tf-sm", "tf-lg", "tf-success", "tf-warning", "tf-error", "tf-info", "tf-round",
        "tf-round-sm", "tf-round-lg", "tf-round-pill", "tf-shadow", "tf-shadow-sm", "tf-shadow-inset",
        "tf-glow", "tf-hidden", "tf-block", "tf-inline", "tf-clickable", "tf-disabled", "tf-tr",
        "tf-tr-fast", "tf-tx", "tf-tt", "tf-st", "tf-ds", "tf-mu", "tf-ac", "tf-cr", "tf-pl", "tf-nt",
        "tf-uppercase", "tf-italic", "tf-bold", "tf-mono", "tf-btn", "tf-btn-primary", "tf-btn-danger",
        "tf-chip", "tf-pill", "tf-alert", "tf-banner", "tf-hero", "tf-sidebar", "tf-footer",
        "tf-navbar", "tf-icon", "tf-gallery", "tf-timeline", "tf-timeline-item", "tf-progress",
        "tf-progress-bar", "tf-tabs", "tf-tab", "tf-tab-active", "tf-tab-content", "tf-tab-panel",
        "tf-list", "tf-list-item", "tf-stat", "tf-stat-value", "tf-stat-title", "tf-dashboard",
        "tf-form", "tf-field", "tf-label", "tf-input", "tf-textarea", "tf-select", "tf-checkbox",
        "tf-radio", "tf-switch", "tf-range", "tf-search", "tf-input-group", "tf-btn-group",
        "tf-pills", "tf-tooltip", "tf-dropdown", "tf-dropdown-menu", "tf-modal", "tf-modal-box",
        "tf-modal-close", "tf-toast", "tf-spinner", "tf-skeleton", "tf-breadcrumb", "tf-sep",
        "tf-pagination", "tf-tree", "tf-accordion", "tf-accordion-body", "tf-card-header",
        "tf-card-body", "tf-card-footer", "tf-table-compact", "tf-table-dark", "tf-table-sortable",
        "tf-fade", "tf-slide", "tf-zoom", "tf-pulse", "tf-surface", "tf-container", "tf-stack",
        "tf-row", "tf-column", "tf-grow", "tf-shrink", "tf-align-start", "tf-align-center",
        "tf-align-end", "tf-justify-start", "tf-justify-center", "tf-justify-end", "tf-justify-between",
        "tf-grid-center", "tf-lowercase", "tf-capitalize", "tf-small", "tf-large", "tf-xl",
        "tf-truncate", "tf-wrap", "tf-break-word", "tf-pre", "tf-nowrap", "tf-break", "tf-bg",
        "tf-bg2", "tf-bg3", "tf-panel-bg", "tf-bg-ac", "tf-bg-red", "tf-bg-green", "tf-bg-yellow",
        "tf-border-ac", "tf-border-red", "tf-opacity-25", "tf-opacity-50", "tf-opacity-75",
        "tf-opacity-100", "tf-relative", "tf-absolute", "tf-fixed", "tf-sticky", "tf-top",
        "tf-bottom", "tf-inset-left", "tf-inset-right", "tf-center-x", "tf-center-y",
        "tf-inline-flex", "tf-inline-grid", "tf-none", "tf-overflow-auto", "tf-overflow-hidden",
        "tf-scroll-x", "tf-scroll-y", "tf-scroll", "tf-help", "tf-grab", "tf-grabbing", "tf-copy",
        "tf-select-none", "tf-rounded-top", "tf-rounded-bottom", "tf-rounded-left",
        "tf-rounded-right", "tf-border", "tf-border-top", "tf-border-bottom", "tf-border-left",
        "tf-border-right", "tf-hidden-desktop", "tf-hidden-mobile", "tf-callout", "tf-infobox",
        "tf-infobox-header", "tf-infobox-body", "tf-infobox-footer", "tf-tag", "tf-kbd",
        "tf-stepper", "tf-step", "tf-step-num", "tf-empty", "tf-empty-icon", "tf-loading",
        "tf-ribbon", "tf-fab", "tf-active", "tf-quote", "tf-visible", "tf-in-view",
        "tf-editor-overlay"];

function isKnownClass(cls) {
    if (KNOWN_CLASSES.indexOf(cls) !== -1) { return true; }
    return KNOWN_UTILITY_PREFIXES.some(function (prefix) { return cls.indexOf(prefix) === 0; });
}

function diag(severity, startLine, endLine, startCol, endCol, code, message) {
    return {
        severity: severity, startLine: startLine, endLine: endLine,
        startColumn: startCol, endColumn: endCol, code: code, message: message,
        source: "tf-diagnostics"
    };
}

var results = [];

function analyze(text) {
    var out = [];
    var parsed = TF.editor.parseDocument(text);
    var tokens = parsed.tokens;

    // --- Opening/closing stack + structural containment ---
    var stack = [];

    tokens.forEach(function (t) {
        if (t.type === "self") {
            emitInfoForTag(t, out);
            checkAttrs(t, out);
            return;
        }

        if (t.type === "open") {
            stack.push(t);
            emitInfoForTag(t, out);
            checkAttrs(t, out);

            if (CONTAINMENT[t.tag]) {
                var parent = stack[stack.length - 2];

                if (!parent || parent.tag !== CONTAINMENT[t.tag]) {
                    out.push(diag("error", t.startLine, t.startLine, t.startCol, t.endCol,
                        "tf-nesting", "<" + t.tag + "> must be inside <" + CONTAINMENT[t.tag] + ">."));
                }
            }

            if (t.tag.indexOf("tf-") === 0 && KNOWN_COMPONENTS.indexOf(t.tag) === -1) {
                out.push(diag("error", t.startLine, t.startLine, t.startCol, t.endCol,
                    "tf-unknown-component", "'<" + t.tag + ">' is not a valid TF-Engine component."));
            }

            return;
        }

        // closing
        if (!stack.length) {
            out.push(diag("error", t.startLine, t.startLine, t.startCol, t.endCol,
                "tf-unexpected-close", "Unexpected closing tag '</" + t.tag + ">' without a previous opening tag."));
            return;
        }

        var open = stack[stack.length - 1];

        if (open.tag !== t.tag) {
            out.push(diag("error", t.startLine, t.startLine, t.startCol, t.endCol,
                "tf-mismatched-close", "Expected '</" + open.tag + ">' but found '</" + t.tag + ">'."));
                // Assumes the upper opening tag is closed anyway to avoid
                // desynchronizing the entire stack because of a single malformed tag.
            }

            var matchIndex = -1;
            for (var i = stack.length - 1; i >= 0; i--) {
                if (stack[i].tag === t.tag) { matchIndex = i; break; }
            }

            if (matchIndex !== -1) {
                var openTag = stack[matchIndex];
                var betweenIsEmpty = text.slice(openTag.end, t.start).trim() === "";

                if (betweenIsEmpty && KNOWN_COMPONENTS.indexOf(t.tag) !== -1) {
                    out.push(diag("warning", openTag.startLine, t.endLine, openTag.startCol, t.endCol,
                        "tf-empty-component", "<" + t.tag + "> is empty."));
                }

                stack.splice(matchIndex, stack.length - matchIndex);
            }
        });

        stack.forEach(function (open) {
            out.push(diag("error", open.startLine, open.startLine, open.startCol, open.endCol,
                "tf-unclosed", "Missing closing tag for '<" + open.tag + ">'."));
        });

        // --- Duplicate IDs ---
        var idPositions = {};

        tokens.forEach(function (t) {
            if (!t.attrs || t.attrs.id === undefined) { return; }

            var id = t.attrs.id;

            if (!id) { return; }

            (idPositions[id] = idPositions[id] || []).push(t);
        });

        Object.keys(idPositions).forEach(function (id) {
            var occurrences = idPositions[id];

            if (occurrences.length > 1) {
                occurrences.forEach(function (t) {
                    out.push(diag("error", t.startLine, t.startLine, t.startCol, t.endCol,
                        "tf-duplicate-id", "id=\"" + id + "\" is repeated " + occurrences.length + " times."));
                });
            }
        });
                
         // --- Classes: unknown / duplicated, per token ---
        tokens.forEach(function (t) {
            if (!t.attrs || t.attrs.class === undefined) { return; }

            var raw = t.attrs.class || "";

            if (raw.trim() === "") {
                out.push(diag("warning", t.startLine, t.startLine, t.startCol, t.endCol,
                    "tf-empty-attr", "The class attribute is empty."));
                return;
            }

            var seen = {};

            raw.split(/\s+/).filter(Boolean).forEach(function (cls) {
                if (seen[cls]) {
                    out.push(diag("warning", t.startLine, t.startLine, t.startCol, t.endCol,
                        "tf-duplicate-class", "The class '" + cls + "' is repeated."));
                } else {
                    seen[cls] = true;
                }

                if (cls.indexOf("tf-") === 0 && !isKnownClass(cls)) {
                    out.push(diag("warning", t.startLine, t.startLine, t.startCol, t.endCol,
                        "tf-unknown-class", "Class '" + cls + "' is not recognized in TF-Engine."));
                }
            });
        });

        // --- Generic empty attributes + large inline styles ---
        tokens.forEach(function (t) {
            if (!t.attrs) { return; }

            Object.keys(t.attrs).forEach(function (name) {
                if (t.attrs[name] === "" && name !== "class") {
                    out.push(diag("warning", t.startLine, t.startLine, t.startCol, t.endCol,
                        "tf-empty-attr", "The attribute '" + name + "' is empty."));
                }
            });

            if (t.attrs.style && t.attrs.style.length > 300) {
                out.push(diag("warning", t.startLine, t.startLine, t.startCol, t.endCol,
                    "tf-large-inline-style", "Inline style is too long (" + t.attrs.style.length + " characters)."));
            }

            if (t.attrs.style) {
                var declared = {};

                t.attrs.style.split(";").forEach(function (decl) {
                    var m = /^\s*(--[\w-]+)\s*:/.exec(decl);

                    if (m) {
                        if (declared[m[1]]) {
                            out.push(diag("warning", t.startLine, t.startLine, t.startCol, t.endCol,
                                "tf-duplicate-variable", "The variable '" + m[1] + "' is defined more than once in this style."));
                        }

                        declared[m[1]] = true;
                    }
                });
            }
        });
        
        // --- Unknown var(--xxx) variables + detection info + deprecated syntax ---
        var lineOffset = 0;
        text.split("\n").forEach(function (lineText, idx) {
            var lineNo = idx + 1;
            var varRe = /var\(\s*--([\w-]+)/g;
            var vm;

            while ((vm = varRe.exec(lineText))) {
                out.push(diag("info", lineNo, lineNo, vm.index + 1, vm.index + vm[0].length + 1,
                    "tf-css-variable", "CSS variable detected: --" + vm[1]));

                if (KNOWN_VARS.indexOf(vm[1]) === -1) {
                    out.push(diag("warning", lineNo, lineNo, vm.index + 1, vm.index + vm[0].length + 1,
                        "tf-unknown-variable", "--" + vm[1] + " is not defined in variables.css."));
                }
            }

            if (/<center>|<font[\s>]/i.test(lineText)) {
                out.push(diag("warning", lineNo, lineNo, 1, lineText.length + 1,
                    "tf-deprecated-syntax", "Deprecated HTML tag detected on this line."));
            }
        });

        void lineOffset;

        tokens.forEach(function (t) {
            if (!t.attrs) { return; }

            if (t.attrs["data-theme"]) {
                out.push(diag("info", t.startLine, t.startLine, t.startCol, t.endCol,
                    "tf-theme-detected", "Theme detected: " + t.attrs["data-theme"]));
            }

            var cls = t.attrs.class || "";
            var themeMatch = /\btf-theme-(\S+)\b/.exec(cls);

            if (themeMatch) {
                out.push(diag("info", t.startLine, t.startLine, t.startCol, t.endCol,
                    "tf-theme-detected", "Theme detected: " + themeMatch[1]));
            }

            ["tf-fade", "tf-slide", "tf-zoom", "tf-pulse"].forEach(function (animClass) {
                if ((" " + cls + " ").indexOf(" " + animClass + " ") !== -1) {
                    out.push(diag("info", t.startLine, t.startLine, t.startCol, t.endCol,
                        "tf-animation-detected", "Animation detected: " + animClass));
                }
            });
        });

        return out;
    }
        
 function emitInfoForTag(t, out) {
    if (KNOWN_COMPONENTS.indexOf(t.tag) !== -1) {
        out.push(diag("info", t.startLine, t.startLine, t.startCol, t.endCol,
            "tf-component-detected", "TF-Engine component detected: <" + t.tag + ">"));
    }
}

function checkAttrs(t, out) {
    var rules = ATTR_ENUMS[t.tag];
    if (!rules || !t.attrs) { return; }

    Object.keys(rules).forEach(function (attrName) {
        var value = t.attrs[attrName];

        if (value === undefined || value === "") { return; }

        if (rules[attrName].indexOf(value) === -1) {
            out.push(diag("error", t.startLine, t.startLine, t.startCol, t.endCol,
                "tf-invalid-attribute", "'" + attrName + "=\"" + value + "\"' is not valid on <" + t.tag + ">."));
        }
    });
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------
var onDocumentChange;

TF.editor.diagnostics = {
    run: function () {
        var t0 = (global.performance ? performance.now() : Date.now());

        results = analyze(TF.editor.getDocument());

        var elapsed = (global.performance ? performance.now() : Date.now()) - t0;

        TF.editor._perf = TF.editor._perf || {};
        TF.editor._perf.diagnostics = elapsed;

        TF.emit("diagnosticsUpdated", { diagnostics: results, elapsed: elapsed });

        return results;
    },

    clear: function () {
        results = [];
        TF.emit("diagnosticsUpdated", { diagnostics: results, elapsed: 0 });
    },

    refresh: function () { return this.run(); },

    getDiagnostics: function () {
        return results.slice();
    },

    getErrors: function () {
        return results.filter(function (d) {
            return d.severity === "error";
        });
    },

    getWarnings: function () {
        return results.filter(function (d) {
            return d.severity === "warning";
        });
    },

    getInfo: function () {
        return results.filter(function (d) {
            return d.severity === "info";
        });
    },

    init: function () {
        onDocumentChange = TF.editor._debounce(function () {
            TF.editor.diagnostics.run();
        }, (TF.config.editor.debounce && TF.config.editor.debounce.document) || 250);

        TF.on("documentChange", onDocumentChange);
        TF.editor.diagnostics.run();
    },

    destroy: function () {
        if (onDocumentChange) {
            TF.off("documentChange", onDocumentChange);
        }

        results = [];
    }
};

var global = window;

})(window.TFEngine);
