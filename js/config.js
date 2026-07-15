/*!
 * TF-ENGINE — config.js
 * ---------------------------------------------------------------------
 * User configuration for TF-ENGINE.
 *
 * This is the only file most users should edit.
 *
 * TF-ENGINE automatically merges this object with its internal defaults,
 * so only specify the values you actually want to change.
 *
 * Configuration priority (lowest → highest):
 *
 *   1. Internal defaults (tf-engine.js)
 *   2. TF_CONFIG (this file)
 *   3. data-* attributes on .tf-engine containers
 *   4. TFEngine.setConfig() at runtime
 *
 * Objects are merged deeply, allowing individual nested properties to
 * be overridden without redefining the entire section.
 *
 * Leaving this file empty is perfectly valid.
 * ---------------------------------------------------------------------
 */

(function (global) {
    "use strict";

    // Preserve any configuration created before this file loads.
    global.TF_CONFIG = global.TF_CONFIG || {};

    /*
    ----------------------------------------------------------------------
    Examples
    ----------------------------------------------------------------------

    Theme
        theme: "blue",

    Enable debug logging
        debug: true,

    CSS variables
        vars: {
            ac: "#4a90e2",
            rd: "12px"
        },

    Observer
        observer: {
            threshold: 0.25
        },

    Component overrides
        components: {
            card: {
                hoverLift: false
            }
        }
    */

})(window);
