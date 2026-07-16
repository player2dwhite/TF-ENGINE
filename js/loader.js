/*! TF-ENGINE — loader.js */
(function (global) {
    "use strict";

    if (!global.TFEngine) {
        console.error("[TFEngine] loader.js requires tf-engine.js.");
        return;
    }

    var TF = global.TFEngine;

    if (TF.loader) {
        return;
    }

    TF.loader = {

        modules: [],

        register: function (name, init) {

            if (typeof name !== "string") {
                TF.warn("Loader: invalid module name.");
                return this;
            }

            if (typeof init !== "function") {
                TF.warn("Loader: '" + name + "' has no init() function.");
                return this;
            }

            this.modules.push({
                name: name,
                init: init,
                loaded: false
            });

            return this;
        },

        load: function (name) {

            for (var i = 0; i < this.modules.length; i++) {

                var module = this.modules[i];

                if (module.name !== name || module.loaded) {
                    continue;
                }

                try {

                    module.init(TF);

                    module.loaded = true;

                    TF.log("Loaded module:", name);

                    TF.emit("moduleLoaded", {
                        name: name
                    });

                } catch (err) {

                    TF.error("Failed loading '" + name + "'", err);

                }

                break;
            }

            return this;
        },

        loadAll: function () {

            for (var i = 0; i < this.modules.length; i++) {

                this.load(this.modules[i].name);

            }

            return this;
        },

        has: function (name) {

            return this.modules.some(function (m) {
                return m.name === name;
            });

        },

        list: function () {

            return this.modules.map(function (m) {
                return {
                    name: m.name,
                    loaded: m.loaded
                };
            });

        }

    };

    if (TF.isReady()) {

        TF.loader.loadAll();

    } else {

        TF.on("ready", function () {

            TF.loader.loadAll();

        });

    }

})(window);
