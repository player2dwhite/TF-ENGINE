/*!
 * TF-ENGINE — defaults.js
 * ---------------------------------------------------------------------
 * Factory settings. Maintained by the engine itself, not by users —
 * to override a value, use config.js instead of editing this file.
 * Whenever a new feature is added to TF-Engine, its default lives here.
 *
 * Priority order (see tf-engine.js):
 *   1. This file (TF_DEFAULTS)          <- lowest priority
 *   2. config.js (TF_CONFIG)
 *   3. data-attributes on .tf-engine
 *   4. Runtime API — TFEngine.setConfig()   <- highest priority
 * ---------------------------------------------------------------------
 */
(function (global) {
    "use strict";

    global.TF_DEFAULTS = global.TF_DEFAULTS || {

        // Main theme. See variables.css: default | blue | red | green | light.
        theme: "default",

        // Enables engine animations (fade, reveal on scroll, tabs).
        animation: true,

        // Rounded corners on components (reserved for future adjustments).
        rounded: true,

        // Auto-mounts every registered component (card, panel, etc.).
        autoComponents: true,

        // Enables IntersectionObserver for scroll-in animations.
        observe: true,

        // Debug mode: enables TFEngine.log().
        debug: false,

        // JS -> CSS variable bridge. Example: { ac: "#4a90e2", rd: "12px" }.
        vars: {},

        // Scroll observer settings (see TFEngine._initObserver).
        observer: {
            threshold: 0.15,
            selector: ".tf-fade, .tf-slide, .tf-zoom, .tf-pulse, [data-tf-observe]",
            once: true
        },

        // TFEngine.storage settings.
        storage: {
            prefix: "tf_",
            backend: "local"   // local | session | memory
        },

        // Accessibility behavior.
        accessibility: {
            respectReducedMotion: true,
            focusVisible: true
        },

        // Internal performance knobs.
        performance: {
            cacheConfig: true,
            cacheEngines: false
        },

        // Editor module is not implemented yet — this just reserves the
        // config shape so editor/editor.js can plug in later.
        editor: {
            enabled: false
        },

        // Per-component config lives here, namespaced by component name.
        // Each component fills its own slot via registerComponent()'s
        // `defaults` option — this file doesn't need a manual entry per
        // component, but MAY predefine one to override a component's
        // own defaults engine-wide (still second priority to config.js).
        components: {}
    };

})(window);
