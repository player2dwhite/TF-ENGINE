/*!
 * TF-ENGINE — config.js
 * ---------------------------------------------------------------------
 * Configuración externa y declarativa de TF-Engine. No contiene lógica
 * del core: solo define window.TF_CONFIG, que tf-engine.js lee y
 * combina con sus defaults durante init() (o vía TFEngine.setConfig()
 * en runtime).
 *
 * Se carga DESPUÉS de tf-engine.js y ANTES del resto de módulos, para
 * que la config ya esté disponible cuando arranquen.
 *
 * Los módulos (theme, tabs, animaciones, editor...) se activan o
 * desactivan desde aquí sin tocar el core, usando estas mismas
 * opciones o, si el módulo lo soporta, sus propios flags en
 * TFEngine.registerModule(name, mod, { enabled: false }).
 *
 * Si el wiki ya definió window.TF_CONFIG antes de que este archivo se
 * ejecute (por ejemplo, escrito directamente en Common.js), esos
 * valores se respetan y no se pisan.
 * ---------------------------------------------------------------------
 */
(function (global) {
    "use strict";

    global.TF_CONFIG = global.TF_CONFIG || {
        // Tema principal aplicado al cargar la página.
        // Valores disponibles según variables.css: default | blue | red | green | light.
        theme: "default",

        // Activa animaciones del engine (fade, reveal al hacer scroll, tabs).
        animation: true,

        // Activa esquinas redondeadas de componentes (reservado para futuros ajustes).
        rounded: true,

        // Montaje automático de componentes registrados (<tf-card>, etc.).
        autoComponents: true,

        // Activa IntersectionObserver para animaciones al hacer scroll.
        observe: true,

        // Modo debug: habilita TFEngine.log(). Mantener en false en producción.
        debug: false,

        // Variables CSS dinámicas opcionales — puente JS -> :root.
        // Ejemplo:
        // ac: "#4a90e2",
        // rd: "12px"
        vars: {}
    };

})(window);
