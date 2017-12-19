import config from '../config';


let map;

mapboxgl.accessToken = config.mapboxAccessToken;
map = new mapboxgl.Map({
    container: 'scrollmap', // container id
    style: 'mapbox://styles/aosika/cj4nes30j8qyl2qmqlc7ob06i', //stylesheet location
    // style: 'mapbox://styles/aosika/cj5q0qvf91f522smitgudhh9n',
    center: [100, 30], // starting position (lng, lat),
    zoom: 3
})
