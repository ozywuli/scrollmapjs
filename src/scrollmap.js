/**
 * Scrollmap.js
 * @author Ozy Wu-Li - @ousikaa
 * @description Scrolling map
 */

// https://github.com/jquery-boilerplate/jquery-patterns/blob/master/patterns/jquery.basic.plugin-boilerplate.js

import config from '../config';
import _debounce from 'lodash/debounce';


// the semi-colon before the function invocation is a safety
// net against concatenated scripts and/or other plugins
// that are not closed properly.
// the anonymous function protects the `$` alias from name collisions
;(function( $, window, document, undefined ) {
    /**
     * Plugin name
     */
    let pluginName = 'Scrollmap';

    /**
     * Default Options
     */
    let defaultOptions = {
        data: null,
        mapboxConfig: {
            container: 'scrollmap',
            style: 'mapbox://styles/aosika/cj8tmsx9cdk3m2rqmxbq8gr1b',
            center: [0, 0],
            zoom: 1
        }
    }

    /**
     * Scrollmap constructor
     */
    let Scrollmap = function( userOptions ) {
        // Combine/merge default and user options
        this.options = $.extend( true, defaultOptions, userOptions );
        // Init
        this.init();
        /**
         * Controller
         */
        this.controller = {
            afterMapInstantiation(map) {
                this.loaded(map);
            },
        }
    }

    /**
     * 
     */
    Scrollmap.prototype = {
        map: null,

        /**
         * Init
         */
        init() {
            this.instantiateMap();
            this.addScrollListener();
        },

        /**
         * Instantiate the map
         */
        instantiateMap() {
            // Map instance
            let map;
            // Mapbox access token
            mapboxgl.accessToken = config.mapboxAccessToken;
            // Instantiate mapbox
            map = new mapboxgl.Map(this.options.mapboxConfig);

            this.map = map;

            // Map load promise
            new Promise((resolve, reject) => {
                this.map.on('load', this.mapLoad.bind(this, resolve));
            }).then(this.afterMapLoad.bind(this, this.map));

        },

        /**
         * When map is loaded
         */
        mapLoad(resolve) {
            // Resolve map load promise
            resolve();

            this.options.geojson.features.forEach((marker) => {
                let markerEl = document.createElement('div');
                markerEl.className = 'marker';

                new mapboxgl.Marker(markerEl)
                    .setLngLat(marker.geometry.coordinates)
                    .addTo(this.map);
            })
        },

        /**
         * After map is loaded
         */
        afterMapLoad(map) {
            this.controller.afterMapInstantiation(map);
        },

        /**
         * Handles the scroll event
         */
        scrollHandler() {
            console.log('scrolling');
        },

        /**
         * Add scroll event listener
         */
        addScrollListener() {
            window.addEventListener('scroll', _debounce(this.scrollHandler, 150), true);
        }

    }




    /*------------------------------------*\
      Export 
    \*------------------------------------*/
    module.exports = Scrollmap;




})( jQuery, window , document );


