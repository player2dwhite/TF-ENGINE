/*!
 * TF-ENGINE — config.js
 * ---------------------------------------------------------------------
*/
(function (global) {
    "use strict";

    global.TF_CONFIG = global.TF_CONFIG || {
// Main theme applied when the page loads.
// Available values ​​according to variables.css: default | blue | red | green | light.
        theme: "default",

        // Activates engine animations (fade, reveal on scroll, tabs).
        animation: true,

        // Enables rounded corners of components (reserved for future adjustments).
        rounded: true,

        // Automatic assembly of registered components (<tf-card>, etc.).
        autoComponents: true,

        // Activate IntersectionObserver for scrolling animations.
        observe: true,

        // Debug mode: Enables TFEngine.log().
        debug: false,

// Optional dynamic CSS variables — JS bridge -> :root.
// Example:
// ac: "#4a90e2",
// rd: "12px"
        vars: {}
    };

})(window);
