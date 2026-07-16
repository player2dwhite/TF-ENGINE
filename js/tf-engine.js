/*! TF-ENGINE JS CORE */
(function (global) {
    "use strict";

    if (global.TFEngine && global.TFEngine.__core) {
        return;
    }

    var VERSION = "2.2.0";

    var TFEngine = global.TFEngine || {};

    TFEngine.__core = true;
    TFEngine.version = VERSION;

    function toArray(arrayLike) {
        return Array.prototype.slice.call(arrayLike);
    }

    function isPlainObject(value) {
        return !!value && typeof value === "object" && !Array.isArray(value);
    }

    function deepMerge(target, source) {
        if (!isPlainObject(source)) { return target; }
        Object.keys(source).forEach(function (key) {
            if (isPlainObject(source[key]) && isPlainObject(target[key])) {
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        });
        return target;
    }

    TFEngine.utils = TFEngine.utils || {};
    TFEngine.components = TFEngine.components || {};
    TFEngine.editor = TFEngine.editor || {};

    TFEngine._modules = TFEngine._modules || [];
    TFEngine._listeners = TFEngine._listeners || {};
    TFEngine._mounted = TFEngine._mounted || [];
    TFEngine._themes = TFEngine._themes || {};
    TFEngine._observer = null;
    TFEngine._initialized = false;

    TFEngine.utils.deepMerge = deepMerge;

    TFEngine.utils.merge = function (target) {
        target = target || {};
        for (var i = 1; i < arguments.length; i++) {
            var src = arguments[i];
            if (!src) { continue; }
            if (typeof Object.assign === "function") {
                Object.assign(target, src);
            } else {
                for (var key in src) {
                    if (Object.prototype.hasOwnProperty.call(src, key)) {
                        target[key] = src[key];
                    }
                }
            }
        }
        return target;
    };
    
    TFEngine.log = function () {
        if (this.config.debug && global.console && console.log) {
            console.log.apply(console, ["[TFEngine]"].concat(toArray(arguments)));
        }
        return this;
    };

    TFEngine.warn = function () {
        if (global.console && console.warn) {
            console.warn.apply(console, ["[TFEngine]"].concat(toArray(arguments)));
        }
        return this;
    };

    TFEngine.error = function () {
        if (global.console && console.error) {
            console.error.apply(console, ["[TFEngine]"].concat(toArray(arguments)));
        }
        return this;
    };

    TFEngine.config = TFEngine.config || {
        theme: "default",
        animation: true,
        rounded: true,
        autoComponents: true,
        observe: true,
        debug: false,
        vars: {},
        observer: {},
        storage: {},
        accessibility: {},
        performance: {},
        editor: {},
        components: {}
    };

    TFEngine.mergeConfig = function (userConfig) {
        deepMerge(this.config, userConfig);
        return this;
    };

    TFEngine.setConfig = function (userConfig) {
        this.mergeConfig(userConfig);
        if (userConfig && userConfig.vars) {
            this.applyVariables();
        }
        if (userConfig && userConfig.theme) {
            this.setTheme(userConfig.theme);
        }
        this.emit("configChange", { config: this.config });
        return this;
    };

    TFEngine.getConfig = function (key) {
        return key ? this.config[key] : this.config;
    };

    TFEngine.getComponentConfig = function (name) {
        return (this.config.components && this.config.components[name]) || {};
    };

    TFEngine.on = function (event, callback) {
        if (typeof callback !== "function") { return this; }
        (this._listeners[event] = this._listeners[event] || []).push(callback);
        return this;
    };

    TFEngine.once = function (event, callback) {
        if (typeof callback !== "function") { return this; }
        var self = this;
        function wrapper(evt) {
            self.off(event, wrapper);
            callback(evt);
        }
        return this.on(event, wrapper);
    };

    TFEngine.off = function (event, callback) {
        if (!this._listeners[event]) { return this; }
        if (!callback) {
            delete this._listeners[event];
            return this;
        }
        this._listeners[event] = this._listeners[event].filter(function (fn) {
            return fn !== callback;
        });
        return this;
    };

    TFEngine.offAll = function () {
        this._listeners = {};
        return this;
    };

    TFEngine.emit = function (event, detail) {
        var handlers = this._listeners[event] || [];
        var evt = { type: event, detail: detail, timestamp: Date.now() };
        handlers.forEach(function (callback) {
            try {
                callback(evt);
            } catch (err) {
                TFEngine.error("listener error for '" + event + "':", err);
            }
        });
        return this;
    };

    TFEngine._findModule = function (name) {
        for (var i = 0; i < this._modules.length; i++) {
            if (this._modules[i].name === name) { return this._modules[i]; }
        }
        return undefined;
    };

    TFEngine.registerModule = function (name, mod, options) {
        if (!mod || typeof mod.init !== "function") {
            this.warn("module '" + name + "' is invalid (missing init()).");
            return this;
        }
        options = options || {};
        var entry = {
            name: name,
            mod: mod,
            priority: typeof options.priority === "number" ? options.priority : 10,
            dependencies: options.dependencies || [],
            enabled: options.enabled !== false,
            lazy: !!options.lazy,
            version: options.version || "1.0.0",
            status: "registered"
        };
        this._modules.push(entry);

        if (!entry.enabled) {
            entry.status = "disabled";
            return this;
        }
        if (this._initialized && !entry.lazy) {
            this._runModule(entry);
        }
        return this;
    };

    TFEngine.runModule = function (name) {
        var entry = this._findModule(name);
        if (!entry) {
            this.warn("no module registered as '" + name + "'.");
            return this;
        }
        this._runModule(entry);
        return this;
    };

    TFEngine._runModule = function (entry, chain) {
        chain = chain || [];
        if (!entry.enabled || entry.status === "ready") { return; }
        if (chain.indexOf(entry.name) !== -1) {
            this.warn("circular dependency detected at '" + entry.name + "', skipping.");
            return;
        }
        chain = chain.concat(entry.name);

        for (var i = 0; i < entry.dependencies.length; i++) {
            var dep = this._findModule(entry.dependencies[i]);
            if (!dep) {
                this.warn("module '" + entry.name + "' depends on '" + entry.dependencies[i] + "', which isn't registered.");
                continue;
            }
            this._runModule(dep, chain);
        }

        this.emit("beforeModule", { name: entry.name });
        try {
            entry.mod.init(this);
            entry.status = "ready";
        } catch (err) {
            entry.status = "error";
            this.error("module '" + entry.name + "' failed to init:", err);
        }
        this.emit("afterModule", { name: entry.name, status: entry.status });
    };

    TFEngine._runAllModules = function () {
        var runnable = this._modules
            .filter(function (m) { return m.enabled && !m.lazy; })
            .sort(function (a, b) { return a.priority - b.priority; });
        for (var i = 0; i < runnable.length; i++) {
            this._runModule(runnable[i]);
        }
    };

    TFEngine.applyVariables = function (source) {
        var root = document.documentElement;
        var vars = source || this.config.vars;
        if (!isPlainObject(vars)) { return this; }
        var self = this;
        Object.keys(vars).forEach(function (key) {
            try {
                root.style.setProperty("--" + key, vars[key]);
            } catch (err) {
                self.warn("invalid CSS variable: --" + key, err);
            }
        });
        return this;
    };

    TFEngine.setVariable = function (name, value) {
        try {
            document.documentElement.style.setProperty("--" + name, value);
            this.config.vars[name] = value;
            this.emit("variableChange", { name: name, value: value });
        } catch (err) {
            this.warn("couldn't set --" + name, err);
        }
        return this;
    };

    TFEngine.getVariable = function (name) {
        return global.getComputedStyle(document.documentElement)
            .getPropertyValue("--" + name)
            .trim();
    };

    TFEngine.removeVariable = function (name) {
        document.documentElement.style.removeProperty("--" + name);
        delete this.config.vars[name];
        return this;
    };

    TFEngine.registerTheme = function (name, vars) {
        if (!name || !isPlainObject(vars)) {
            this.warn("invalid theme '" + name + "'.");
            return this;
        }
        this._themes[name] = vars;
        return this;
    };

    TFEngine.setTheme = function (name) {
        if (!name) { return this; }
        this.config.theme = name;

        document.documentElement.setAttribute("data-theme", name);

        var themeClassRe = /\btf-theme-\S+\b/g;
        this.getEngines().forEach(function (el) {
            el.className = el.className.replace(themeClassRe, "").replace(/\s+/g, " ").trim();
            if (name && name !== "default") {
                el.className += " tf-theme-" + name;
            }
        });

        if (this._themes[name]) {
            this.applyVariables(this._themes[name]);
        }

        this.emit("themeChange", { theme: name });
        return this;
    };

    var utils = TFEngine.utils;

    utils.query = function (selector, context) {
        return (context || document).querySelector(selector);
    };

    utils.queryAll = function (selector, context) {
        return toArray((context || document).querySelectorAll(selector));
    };

    utils.create = function (tag, attrs, children) {
        var el = document.createElement(tag);
        attrs = attrs || {};
        Object.keys(attrs).forEach(function (key) {
            if (key === "class" || key === "className") {
                el.className = attrs[key];
            } else if (key === "text") {
                el.textContent = attrs[key];
            } else if (key === "html") {
                el.innerHTML = attrs[key];
            } else {
                el.setAttribute(key, attrs[key]);
            }
        });
        if (typeof children === "string") {
            el.appendChild(document.createTextNode(children));
        } else if (Array.isArray(children)) {
            children.forEach(function (child) { if (child) { el.appendChild(child); } });
        } else if (children instanceof Node) {
            el.appendChild(children);
        }
        return el;
    };

    utils.remove = function (el) {
        if (el && el.parentNode) { el.parentNode.removeChild(el); }
    };

    utils.replace = function (oldEl, newEl) {
        if (oldEl && oldEl.parentNode) { oldEl.parentNode.replaceChild(newEl, oldEl); }
    };

    utils.after = function (el, newEl) {
        if (el && el.parentNode) { el.parentNode.insertBefore(newEl, el.nextSibling); }
    };

    utils.before = function (el, newEl) {
        if (el && el.parentNode) { el.parentNode.insertBefore(newEl, el); }
    };

    utils.closest = function (el, selector) {
        if (!el) { return null; }
        if (typeof el.closest === "function") { return el.closest(selector); }
        var node = el;
        while (node && node.nodeType === 1) {
            if (utils.matches(node, selector)) { return node; }
            node = node.parentNode;
        }
        return null;
    };

    utils.matches = function (el, selector) {
        var proto = Element.prototype;
        var fn = proto.matches || proto.matchesSelector || proto.webkitMatchesSelector
            || proto.mozMatchesSelector || proto.msMatchesSelector;
        return !!el && !!fn && fn.call(el, selector);
    };

    TFEngine.storage = (function () {
        var memory = {};

        function backend(kind) {
            try {
                var s = global[kind === "session" ? "sessionStorage" : "localStorage"];
                var testKey = "__tf_engine_test__";
                s.setItem(testKey, "1");
                s.removeItem(testKey);
                return s;
            } catch (err) {
                return null;
            }
        }

        return {
            get: function (key, kind) {
                var store = backend(kind);
                var raw = store ? store.getItem(key) : (Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null);
                if (raw === null || raw === undefined) { return null; }
                try { return JSON.parse(raw); } catch (err) { return raw; }
            },
            set: function (key, value, kind) {
                var raw = JSON.stringify(value);
                var store = backend(kind);
                if (store) { store.setItem(key, raw); } else { memory[key] = raw; }
            },
            remove: function (key, kind) {
                var store = backend(kind);
                if (store) { store.removeItem(key); } else { delete memory[key]; }
            },
            clear: function (kind) {
                var store = backend(kind);
                if (store) { store.clear(); } else { memory = {}; }
            }
        };
    })();

    TFEngine.registerComponent = function (name, def) {
        if (!def || !def.selector) {
            this.warn("component '" + name + "' is invalid (missing selector).");
            return this;
        }
        this.components[name] = def;

        if (isPlainObject(def.defaults)) {
            var resolved = deepMerge({}, def.defaults);
            deepMerge(resolved, this.config.components[name] || {});
            this.config.components[name] = resolved;
        }

        if (this._initialized && this.config.autoComponents) {
            this._mountComponent(name);
        }
        return this;
    };

    TFEngine._mountComponent = function (name) {
        var def = this.components[name];
        if (!def || typeof def.mount !== "function") { return; }
        var self = this;
        utils.queryAll(def.selector).forEach(function (el) {
            if (el.getAttribute("data-tf-mounted") === name) { return; }
            try {
                def.mount(el);
                el.setAttribute("data-tf-mounted", name);
                self._mounted.push(el);
            } catch (err) {
                self.error("component '" + name + "' failed to mount:", err);
            }
        });
    };

    TFEngine.mount = function (name) {
        if (name) { this._mountComponent(name); return this; }
        for (var key in this.components) { this._mountComponent(key); }
        return this;
    };

    TFEngine.unmount = function (name) {
        var self = this;
        var names = name ? [name] : Object.keys(this.components);
        names.forEach(function (key) {
            var def = self.components[key];
            if (!def) { return; }
            utils.queryAll('[data-tf-mounted="' + key + '"]').forEach(function (el) {
                try {
                    if (typeof def.unmount === "function") { def.unmount(el); }
                } catch (err) {
                    self.error("component '" + key + "' failed to unmount:", err);
                } finally {
                    el.removeAttribute("data-tf-mounted");
                }
            });
        });
        return this;
    };

    TFEngine.scan = function () {
        if (!this.config.autoComponents) { return this; }
        this.mount();
        return this;
    };

    TFEngine.registerPlugin = function (name, plugin) {
        if (!plugin) {
            this.warn("invalid plugin '" + name + "'.");
            return this;
        }
        var self = this;
        if (isPlainObject(plugin.components)) {
            Object.keys(plugin.components).forEach(function (key) {
                self.registerComponent(key, plugin.components[key]);
            });
        }
        if (isPlainObject(plugin.modules)) {
            Object.keys(plugin.modules).forEach(function (key) {
                var mod = plugin.modules[key];
                self.registerModule(key, mod, mod.options);
            });
        }
        if (isPlainObject(plugin.themes)) {
            Object.keys(plugin.themes).forEach(function (key) {
                self.registerTheme(key, plugin.themes[key]);
            });
        }
        if (isPlainObject(plugin.commands)) {
            this.editor.commands = this.utils.merge(this.editor.commands || {}, plugin.commands);
        }
        this.emit("pluginRegistered", { name: name });
        return this;
    };

    TFEngine._initObserver = function () {
        if (!this.config.observe || !this.config.animation) { return; }
        if (typeof global.IntersectionObserver !== "function") {
            this.warn("IntersectionObserver unavailable, skipping scroll animations.");
            return;
        }
        var opts = this.config.observer || {};
        var self = this;
        this._observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("tf-in-view");
                    if (opts.once !== false) { self._observer.unobserve(entry.target); }
                }
            });
        }, { threshold: typeof opts.threshold === "number" ? opts.threshold : 0.15 });

        utils.queryAll(opts.selector || ".tf-fade, .tf-slide, .tf-zoom, .tf-pulse, [data-tf-observe]")
            .forEach(function (el) { self._observer.observe(el); });
    };

    TFEngine.getEngines = function () {
        return utils.queryAll(".tf-engine");
    };

    TFEngine.loadElementConfig = function (el) {
        if (!el || !el.dataset) { return this; }
        if (el.dataset.animation !== undefined) {
            this.config.animation = el.dataset.animation === "true";
        }
        if (el.dataset.theme) {
            this.config.theme = el.dataset.theme;
        }
        if (el.dataset.rounded !== undefined) {
            this.config.rounded = el.dataset.rounded === "true";
        }
        if (el.dataset.autoComponents !== undefined) {
            this.config.autoComponents = el.dataset.autoComponents === "true";
        }
        if (el.dataset.debug !== undefined) {
            this.config.debug = el.dataset.debug === "true";
        }
        return this;
    };

    TFEngine.getVersion = function () { return this.version; };

    TFEngine.isReady = function () { return this._initialized; };

    TFEngine.destroy = function () {
        if (!this._initialized) { return this; }
        this.emit("destroy", {});

        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
        this.unmount();
        this._modules.forEach(function (m) {
            if (m.status === "ready") { m.status = "registered"; }
        });
        this.offAll();
        this._initialized = false;
        return this;
    };

    TFEngine.reload = function () {
        this.destroy();
        return this.init();
    };

    TFEngine.init = function () {
        if (this._initialized) {
            this.warn("already initialized, skipping. Use reload() to restart.");
            return this;
        }

        this.emit("beforeInit", {});

        if (global.TF_DEFAULTS) {
            this.mergeConfig(global.TF_DEFAULTS);
        }

        if (global.TF_CONFIG) {
            this.mergeConfig(global.TF_CONFIG);
        }

        var engines = this.getEngines();
        if (engines.length) {
            this.loadElementConfig(engines[0]);
        }

        this.applyVariables();
        if (this.config.theme && this.config.theme !== "default") {
            this.setTheme(this.config.theme);
        }

        if (this.config.autoComponents) { this.mount(); }
        this._initObserver();

        this._runAllModules();

        this._initialized = true;
        this.emit("ready", { version: this.version, config: this.config });
        this.emit("afterInit", {});

        this.log("core v" + this.version + " ready. Engines found: " + engines.length);
        return this;
    };

    global.TFEngine = TFEngine;

    function start() {
        TFEngine.init();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }

    if (global.mw && typeof global.mw.hook === "function") {
        global.mw.hook("wikipage.content").add(function () {
            if (!TFEngine._initialized) {
                start();
            } else {
                TFEngine.scan();
            }
        });
    }

})(window);
