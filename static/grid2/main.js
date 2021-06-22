import 'ol/ol.css';
import Graticule from 'ol/layer/Graticule';
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import Stroke from 'ol/style/Stroke';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import {fromLonLat} from 'ol/proj';

var map = new Map({
  layers: [
    new TileLayer({
      source: new OSM({
        wrapX: false,
      }),
    }),
    new Graticule({
      // the style to use for the lines, optional.
      strokeStyle: new Stroke({
        color: 'rgba(255,120,0,0.9)',
        width: 2,
        lineDash: [0.5, 4],
      }),
      showLabels: true,
      wrapX: false,
    }) ],
  target: 'map',
  view: new View({
    center: fromLonLat([4.8, 47.75]),
    zoom: 5,
  }),
});
