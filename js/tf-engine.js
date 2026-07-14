/*!
 * TF-ENGINE JS CORE
 * ---------------------------------------------------------------------
 * Capa JavaScript OPCIONAL para TF-Engine (Design System CSS).
 * El CSS de TF-Engine funciona de forma completamente independiente:
 * este archivo solo añade un "Enhanced Mode" (temas dinámicos, montaje
 * de componentes, puente de variables CSS, animaciones al hacer scroll
 * vía IntersectionObserver, y una API con la que futuros módulos del
 * editor pueden engancharse) para quien decida cargarlo.
 *
 * Compatibilidad: MediaWiki / Fandom, Common.js, mw.loader.load().
 * Sin frameworks externos — JavaScript vanilla (ES5-friendly).
 *
 * Namespace expuesto: window.TFEngine
 * Único global adicional permitido: window.TF_CONFIG (ver config.js)
 * ---------------------------------------------------------------------
 * Orden de prioridad de configuración:
 *   1. Defaults internos (TFEngine.config)
 *   2. window.TF_CONFIG
 *   3. data-attributes del primer .tf-engine encontrado
 *   4. API en runtime — TFEngine.setConfig(...)
 * ---------------------------------------------------------------------
 * Orden de carga recomendado (ver /js/README.md):
 *   1. tf-engine.js          (este archivo)
 *   2. config.js
 *   3. utils/dom.js
 *   4. utils/storage.js
 *   5. utils/theme.js
 *   6. utils/templates.js
 *   7. components/index.js
 *   8. components/card.js, panel.js, alert.js, badge.js, infobox.js, tabs.js
 *   9. components/tabs-behavior.js
 *  10. utils/animations.js
 *  11. editor/editor.js
 * ---------------------------------------------------------------------
 */
(function (global) {
    "use strict";

    // Evita doble inicialización si el script se carga más de una vez
    // (frecuente en Fandom cuando varias páginas de Common.js lo importan).
    if (global.TFEngine && global.TFEngine.__core) {
        return;
    }

    var VERSION = "2.1.0";

    /**
     * Namespace principal. Si algún módulo llegó a cargarse antes que el
     * core (orden incorrecto), se reutiliza lo que ya exista en vez de
     * pisarlo, para no perder registros previos.
     */
    var TFEngine = global.TFEngine || {};

    TFEngine.__core = true;
    TFEngine.version = VERSION;

    // ------------------------------------------------------------------
    // Helpers internos (no públicos)
    // ------------------------------------------------------------------

    /** Convierte un array-like (arguments, NodeList) en Array real. */
    function toArray(arrayLike) {
        return Array.prototype.slice.call(arrayLike);
    }

    /** true si el valor es un objeto plano (no null, no array). */
    function isPlainObject(value) {
        return !!value && typeof value === "object" && !Array.isArray(value);
    }

    // ------------------------------------------------------------------
    // Namespaces de extensión que los distintos módulos van rellenando.
    // ------------------------------------------------------------------
    TFEngine.utils = TFEngine.utils || {};
    TFEngine.components = TFEngine.components || {};
    TFEngine.editor = TFEngine.editor || {};

    TFEngine._modules = TFEngine._modules || [];       // [{name, mod, priority, dependencies, enabled, lazy, version, status}]
    TFEngine._listeners = TFEngine._listeners || {};
    TFEngine._mounted = TFEngine._mounted || [];        // elementos ya montados, para no volver a montarlos
    TFEngine._observer = null;
    TFEngine._initialized = false;

    // ==================================================================
    // 1. UTILIDADES BÁSICAS — TFEngine.utils.merge (fallback Object.assign)
    // ==================================================================

    /**
     * Copia las propiedades de uno o más objetos fuente sobre un objeto
     * destino. Usa Object.assign si está disponible; si no, copia las
     * propiedades a mano para mantener compatibilidad con entornos sin
     * Object.assign. Úsese siempre en vez de llamar a Object.assign
     * directamente, así hay un único punto de fallback en todo el core.
     *
     * @param {Object} target  Objeto destino (se muta y se retorna).
     * @param {...Object} sources  Uno o más objetos fuente.
     * @returns {Object} target, ya combinado.
     * @example
     *   TFEngine.utils.merge({a:1}, {b:2}, {a:3}); // {a:3, b:2}
     */
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

    // ==================================================================
    // 2. LOGGING — TFEngine.log / warn / error
    // ==================================================================

    /**
     * Log informativo, solo visible si config.debug === true.
     * Úsese para trazas de desarrollo que no deberían verse en producción.
     */
    TFEngine.log = function () {
        if (this.config.debug && global.console && console.log) {
            console.log.apply(console, ["[TFEngine]"].concat(toArray(arguments)));
        }
        return this;
    };

    /** Warning — siempre visible, independiente de config.debug. */
    TFEngine.warn = function () {
        if (global.console && console.warn) {
            console.warn.apply(console, ["[TFEngine]"].concat(toArray(arguments)));
        }
        return this;
    };

    /** Error — siempre visible, independiente de config.debug. */
    TFEngine.error = function () {
        if (global.console && console.error) {
            console.error.apply(console, ["[TFEngine]"].concat(toArray(arguments)));
        }
        return this;
    };

    // ==================================================================
    // 3. SISTEMA DE CONFIGURACIÓN
    // ==================================================================

    /**
     * Configuración por defecto (prioridad 1 de 4). Se combina con
     * window.TF_CONFIG, luego con data-attributes, y finalmente puede
     * modificarse en runtime con TFEngine.setConfig().
     */
    TFEngine.config = TFEngine.config || {
        theme: "default",       // default | blue | red | green | light
        animation: true,        // activa animaciones/observer
        rounded: true,          // reservado para futuros ajustes de radio
        autoComponents: true,   // monta automáticamente los componentes registrados
        observe: true,          // activa IntersectionObserver para animaciones al scroll
        debug: false,           // activa TFEngine.log()
        vars: {}                // puente JS -> variables CSS (--xx)
    };

    /**
     * Combina un objeto de configuración externo sobre TFEngine.config.
     * `vars` se combina en profundidad (merge), el resto se sobreescribe.
     * Es la implementación interna; TFEngine.setConfig() es el punto de
     * entrada público recomendado (dispara el evento "configChange").
     *
     * @param {Object} userConfig
     * @returns {TFEngine}
     */
    TFEngine.mergeConfig = function (userConfig) {
        if (!isPlainObject(userConfig)) { return this; }
        var self = this;
        Object.keys(userConfig).forEach(function (key) {
            if (key === "vars" && isPlainObject(userConfig.vars)) {
                self.config.vars = self.utils.merge({}, self.config.vars, userConfig.vars);
            } else {
                self.config[key] = userConfig[key];
            }
        });
        return this;
    };

    /**
     * API pública de runtime (prioridad 4 de 4) para cambiar configuración
     * después de init(). Si se pasan `vars`, también las aplica como
     * custom properties CSS de inmediato.
     *
     * @param {Object} userConfig
     * @returns {TFEngine}
     * @example TFEngine.setConfig({ theme: "blue", debug: true });
     */
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

    /**
     * @param {string} [key] Si se omite, retorna toda la config.
     * @returns {*}
     */
    TFEngine.getConfig = function (key) {
        return key ? this.config[key] : this.config;
    };

    // ==================================================================
    // 4. EVENTOS — on / once / off / emit
    // ==================================================================
    // Los nombres de evento pueden incluir un namespace informal con
    // punto, por ejemplo "ready.myModule" — es simplemente otra clave de
    // string, así que conviven sin colisionar con "ready" a secas.

    /**
     * Suscribe un callback a un evento.
     * @param {string} event
     * @param {Function} callback
     * @returns {TFEngine}
     */
    TFEngine.on = function (event, callback) {
        if (typeof callback !== "function") { return this; }
        (this._listeners[event] = this._listeners[event] || []).push(callback);
        return this;
    };

    /**
     * Igual que on(), pero el callback se ejecuta una sola vez y luego
     * se desuscribe automáticamente.
     * @param {string} event
     * @param {Function} callback
     * @returns {TFEngine}
     */
    TFEngine.once = function (event, callback) {
        if (typeof callback !== "function") { return this; }
        var self = this;
        function wrapper(evt) {
            self.off(event, wrapper);
            callback(evt);
        }
        return this.on(event, wrapper);
    };

    /**
     * Desuscribe un callback. Si se omite `callback`, elimina TODOS los
     * listeners de ese evento (útil para limpieza en destroy()/reload()).
     * @param {string} event
     * @param {Function} [callback]
     * @returns {TFEngine}
     */
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

    /** Elimina absolutamente todos los listeners de todos los eventos. */
    TFEngine.offAll = function () {
        this._listeners = {};
        return this;
    };

    /**
     * Dispara un evento. Cada callback recibe un objeto estandarizado
     * { type, detail, timestamp } en vez del detail crudo, para que los
     * módulos puedan inspeccionar de qué evento vino sin cerrarlo sobre
     * la variable externa.
     * @param {string} event
     * @param {*} [detail]
     * @returns {TFEngine}
     */
    TFEngine.emit = function (event, detail) {
        var handlers = this._listeners[event] || [];
        var evt = { type: event, detail: detail, timestamp: Date.now() };
        handlers.forEach(function (callback) {
            try {
                callback(evt);
            } catch (err) {
                TFEngine.error("error en listener de '" + event + "':", err);
            }
        });
        return this;
    };

    // ==================================================================
    // 5. REGISTRO Y CARGA DE MÓDULOS
    // ==================================================================
    // Cada módulo se registra con:
    //   TFEngine.registerModule("nombre", { init: function(engine){...} }, {
    //       priority: 10,            // menor número = corre antes (default 10)
    //       dependencies: ["otro"],  // nombres de módulos que deben correr antes
    //       enabled: true,           // false = queda registrado pero no corre
    //       lazy: false,             // true = no corre en init(), solo con runModule()
    //       version: "1.0.0"
    //   });

    /**
     * Busca la entrada interna de un módulo por nombre.
     * @param {string} name
     * @returns {Object|undefined}
     */
    TFEngine._findModule = function (name) {
        for (var i = 0; i < this._modules.length; i++) {
            if (this._modules[i].name === name) { return this._modules[i]; }
        }
        return undefined;
    };

    /**
     * Registra un módulo. Si el core ya está inicializado (carga tardía,
     * por ejemplo vía mw.loader.load asíncrono) y el módulo no es lazy,
     * se ejecuta de inmediato en vez de esperar a un init() que ya pasó.
     *
     * @param {string} name
     * @param {{init:function}} mod
     * @param {Object} [options]
     * @param {number} [options.priority=10]
     * @param {string[]} [options.dependencies=[]]
     * @param {boolean} [options.enabled=true]
     * @param {boolean} [options.lazy=false]
     * @param {string} [options.version="1.0.0"]
     * @returns {TFEngine}
     */
    TFEngine.registerModule = function (name, mod, options) {
        if (!mod || typeof mod.init !== "function") {
            this.warn("módulo '" + name + "' inválido (falta init()).");
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
            status: "registered"   // registered -> ready | error | disabled
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

    /**
     * Ejecuta un módulo ya registrado por nombre, sin importar si es
     * lazy o si ya corrió antes (esto permite volver a montarlo tras un
     * reload() parcial). Útil sobre todo para módulos lazy.
     * @param {string} name
     * @returns {TFEngine}
     */
    TFEngine.runModule = function (name) {
        var entry = this._findModule(name);
        if (!entry) {
            this.warn("no existe un módulo registrado llamado '" + name + "'.");
            return this;
        }
        this._runModule(entry);
        return this;
    };

    /**
     * Ejecuta un módulo respetando sus dependencias (recursivo, con
     * detección de ciclos) y aislando errores: si un módulo falla, se
     * marca status:"error" y se continúa con el resto sin abortar todo
     * el framework.
     * @param {Object} entry
     * @param {string[]} [chain] pila interna para detectar dependencias circulares
     */
    TFEngine._runModule = function (entry, chain) {
        chain = chain || [];
        if (!entry.enabled || entry.status === "ready") { return; }
        if (chain.indexOf(entry.name) !== -1) {
            this.warn("dependencia circular detectada en '" + entry.name + "', se omite.");
            return;
        }
        chain = chain.concat(entry.name);

        for (var i = 0; i < entry.dependencies.length; i++) {
            var dep = this._findModule(entry.dependencies[i]);
            if (!dep) {
                this.warn("módulo '" + entry.name + "' depende de '" + entry.dependencies[i] + "', que no está registrado.");
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
            this.error("el módulo '" + entry.name + "' falló al iniciar:", err);
        }
        this.emit("afterModule", { name: entry.name, status: entry.status });
    };

    /**
     * Corre todos los módulos habilitados y no-lazy, ordenados por
     * prioridad ascendente (menor número primero). Las dependencias se
     * resuelven dentro de _runModule sin importar el orden del array.
     */
    TFEngine._runAllModules = function () {
        var runnable = this._modules
            .filter(function (m) { return m.enabled && !m.lazy; })
            .sort(function (a, b) { return a.priority - b.priority; });
        for (var i = 0; i < runnable.length; i++) {
            this._runModule(runnable[i]);
        }
    };

    // ==================================================================
    // 6. PUENTE DE VARIABLES CSS
    // ==================================================================

    /**
     * Aplica TFEngine.config.vars completo como custom properties en
     * :root, por ejemplo { ac: "#ff4d4d", rd: "12px" } -> --ac, --rd.
     * @returns {TFEngine}
     */
    TFEngine.applyVariables = function () {
        var root = document.documentElement;
        var vars = this.config.vars;
        if (!isPlainObject(vars)) { return this; }
        var self = this;
        Object.keys(vars).forEach(function (key) {
            try {
                root.style.setProperty("--" + key, vars[key]);
            } catch (err) {
                self.warn("variable CSS inválida: --" + key, err);
            }
        });
        return this;
    };

    /**
     * Setea una única variable CSS (--name) en :root y la recuerda en
     * config.vars para que sobreviva a un reload().
     * @param {string} name  Sin el prefijo "--".
     * @param {string} value
     * @returns {TFEngine}
     */
    TFEngine.setVariable = function (name, value) {
        try {
            document.documentElement.style.setProperty("--" + name, value);
            this.config.vars[name] = value;
            this.emit("variableChange", { name: name, value: value });
        } catch (err) {
            this.warn("no se pudo setear --" + name, err);
        }
        return this;
    };

    /**
     * Lee el valor computado de una variable CSS en :root.
     * @param {string} name  Sin el prefijo "--".
     * @returns {string}
     */
    TFEngine.getVariable = function (name) {
        return global.getComputedStyle(document.documentElement)
            .getPropertyValue("--" + name)
            .trim();
    };

    /**
     * Quita un override de variable puesto por setVariable() — la
     * variable vuelve a resolverse desde Common.css (:root allí).
     * @param {string} name  Sin el prefijo "--".
     * @returns {TFEngine}
     */
    TFEngine.removeVariable = function (name) {
        document.documentElement.style.removeProperty("--" + name);
        delete this.config.vars[name];
        return this;
    };

    // ==================================================================
    // 7. GESTOR DE TEMAS
    // ==================================================================

    /**
     * Cambia de tema en runtime. Actualiza el atributo data-theme en
     * <html> (para selectores globales tipo [data-theme="light"]) y
     * reemplaza la clase tf-theme-* en cada contenedor .tf-engine
     * (para selectores tipo .tf-theme-blue definidos en Common.css).
     * @param {string} name  "default" | "light" | "blue" | "red" | "green" | ...
     * @returns {TFEngine}
     * @example TFEngine.setTheme("blue");
     */
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

        this.emit("themeChange", { theme: name });
        return this;
    };

    // ==================================================================
    // 8. UTILIDADES DE DOM — TFEngine.utils.*
    // ==================================================================

    var utils = TFEngine.utils;

    /** @returns {Element|null} */
    utils.query = function (selector, context) {
        return (context || document).querySelector(selector);
    };

    /** @returns {Element[]} */
    utils.queryAll = function (selector, context) {
        return toArray((context || document).querySelectorAll(selector));
    };

    /**
     * Crea un elemento con atributos y contenido opcionales.
     * @param {string} tag
     * @param {Object} [attrs]  Pares atributo->valor. "class"/"className" y
     *   "text"/"html" reciben tratamiento especial.
     * @param {(Node|Node[]|string)} [children]
     * @returns {Element}
     */
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

    /** Quita un elemento del DOM si todavía tiene padre. */
    utils.remove = function (el) {
        if (el && el.parentNode) { el.parentNode.removeChild(el); }
    };

    /** Reemplaza oldEl por newEl en el DOM. */
    utils.replace = function (oldEl, newEl) {
        if (oldEl && oldEl.parentNode) { oldEl.parentNode.replaceChild(newEl, oldEl); }
    };

    /** Inserta newEl inmediatamente después de el. */
    utils.after = function (el, newEl) {
        if (el && el.parentNode) { el.parentNode.insertBefore(newEl, el.nextSibling); }
    };

    /** Inserta newEl inmediatamente antes de el. */
    utils.before = function (el, newEl) {
        if (el && el.parentNode) { el.parentNode.insertBefore(newEl, el); }
    };

    /** Wrapper de Element.closest() */
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

    /** Wrapper de Element.matches() */
    utils.matches = function (el, selector) {
        var proto = Element.prototype;
        var fn = proto.matches || proto.matchesSelector || proto.webkitMatchesSelector
            || proto.mozMatchesSelector || proto.msMatchesSelector;
        return !!el && !!fn && fn.call(el, selector);
    };

    // ==================================================================
    // 9. STORAGE — TFEngine.storage
    // ==================================================================.

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
            /**
             * @param {string} key
             * @param {"local"|"session"} [kind="local"]
             * @returns {*} 
             */
            get: function (key, kind) {
                var store = backend(kind);
                var raw = store ? store.getItem(key) : (Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null);
                if (raw === null || raw === undefined) { return null; }
                try { return JSON.parse(raw); } catch (err) { return raw; }
            },
            /**
             * @param {string} key
             * @param {*} value  Se serializa con JSON.stringify.
             * @param {"local"|"session"} [kind="local"]
             */
            set: function (key, value, kind) {
                var raw = JSON.stringify(value);
                var store = backend(kind);
                if (store) { store.setItem(key, raw); } else { memory[key] = raw; }
            },
            /** @param {string} key @param {"local"|"session"} [kind="local"] */
            remove: function (key, kind) {
                var store = backend(kind);
                if (store) { store.removeItem(key); } else { delete memory[key]; }
            },
            /** @param {"local"|"session"} [kind="local"] */
            clear: function (kind) {
                var store = backend(kind);
                if (store) { store.clear(); } else { memory = {}; }
            }
        };
    })();

    // ==================================================================
    // 10.COMPONENT ASSEMBLY
    // ==================================================================

    TFEngine.registerComponent = function (name, def) {
        if (!def || !def.selector) {
            this.warn("componente '" + name + "' inválido (falta selector).");
            return this;
        }
        this.components[name] = def;
        if (this._initialized && this.config.autoComponents) {
            this._mountComponent(name);
        }
        return this;
    };

    /** Mount */
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
                self.error("componente '" + name + "' falló al montar:", err);
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
                    self.error("componente '" + key + "' falló al desmontar:", err);
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

    // ==================================================================
    // 11. OBSERVER DE SCROLL
    // ==================================================================

    TFEngine._initObserver = function () {
        if (!this.config.observe || !this.config.animation) { return; }
        if (typeof global.IntersectionObserver !== "function") {
            this.warn("IntersectionObserver no disponible, se omiten animaciones al scroll.");
            return;
        }
        var self = this;
        this._observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("tf-in-view");
                    self._observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        utils.queryAll(".tf-fade, .tf-slide, .tf-zoom, .tf-pulse, [data-tf-observe]")
            .forEach(function (el) { self._observer.observe(el); });
    };

    // ==================================================================
    // 12.CONTAINER DETECTION
    // ==================================================================

    /** @returns {Element[]} */
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

    // ==================================================================
    // 13. RUNTIME API — versión / status / destroy / reload
    // ==================================================================

    /** @returns {string} */
    TFEngine.getVersion = function () { return this.version; };

    /** @returns {boolean} */
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

    // ==================================================================
    // 14. INIT 
    // ==================================================================


    TFEngine.init = function () {
        if (this._initialized) {
            this.warn("ya estaba inicializado, se omite. Usa reload() si quieres reiniciar.");
            return this;
        }

        this.emit("beforeInit", {});

        // 1. Config externa (window.TF_CONFIG), si existe.
        if (global.TF_CONFIG) {
            this.mergeConfig(global.TF_CONFIG);
        }

        // 2. Overrides por elemento (primer .tf-engine de la página).
        var engines = this.getEngines();
        if (engines.length) {
            this.loadElementConfig(engines[0]);
        }

        // 3. Puente config JS -> variables CSS.
        this.applyVariables();
        if (this.config.theme && this.config.theme !== "default") {
            this.setTheme(this.config.theme);
        }

        // 4. Monta componentes registrados y arranca el observer de scroll.
        if (this.config.autoComponents) { this.mount(); }
        this._initObserver();

        // 5. Ejecuta todos los módulos registrados, respetando prioridad y dependencias.
        this._runAllModules();

        this._initialized = true;
        this.emit("ready", { version: this.version, config: this.config });
        this.emit("afterInit", {});

        this.log("core v" + this.version + " listo. Engines detectados: " + engines.length);
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
