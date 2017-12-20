/**
 * Scrollmap.js
 * @author Ozy Wu-Li - @ousikaa
 * @description Scrolling map
 */

// https://github.com/jquery-boilerplate/jquery-patterns/blob/master/patterns/jquery.basic.plugin-boilerplate.js

import config from '../config';


// the semi-colon before the function invocation is a safety
// net against concatenated scripts and/or other plugins
// that are not closed properly.
// the anonymous function protects the `$` alias from name collisions
;(function( $, window, document, undefined ) {

    let pluginName = 'Scrollmap';

    /**
     * Default Options
     */
    let defaultOptions = {

    }

    let Scrollmap = function( userOptions ) {
        this.options = $.extend( {}, defaultOptions, userOptions );
        this.init();
        this.controller = {
            afterMapInstantiation(map) {
                this.loaded(map);
            },
        }
    }

    Scrollmap.prototype = {
        /**
         * 
         */
        init() {
            this.instantiateMap();
        },
        /**
         * 
         */
        instantiateMap() {
            let map;

            mapboxgl.accessToken = config.mapboxAccessToken;
            map = new mapboxgl.Map({
                container: 'scrollmap', // container id
                style: 'mapbox://styles/aosika/cj4nes30j8qyl2qmqlc7ob06i', //stylesheet location
                // style: 'mapbox://styles/aosika/cj5q0qvf91f522smitgudhh9n',
                center: [100, 30], // starting position (lng, lat),
                zoom: 3
            });

            new Promise((resolve, reject) => {
                map.on('load', () => {
                    resolve()
                })
            }).then(() => {
                this.controller.afterMapInstantiation(map);
            });

        }
    }




    /*------------------------------------*\
      Export 
    \*------------------------------------*/
    module.exports = Scrollmap;




})( jQuery, window , document );


