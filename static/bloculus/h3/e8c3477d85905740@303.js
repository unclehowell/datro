// https://observablehq.com/@sw1227/h3-index-visualizer@303
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# H3 index visualizer

**What's H3?**

[H3](https://uber.github.io/h3/#/) is a hexagonal hierarchical geospatial indexing system by Uber.

**How to visualize?**

- (1) Get boungind box of current map 
  - In Mapbox, use **getBounds()**
- (2) Convert bbox to a set of hexagons. 
  - Use **geojson2h3.featureToH3Set()**.
- (3) Convert hexagons to GeoJSON features (Polygon / Point), show it on map.
  - Hex to Polygon: **geojson2h3.h3SetToMultiPolygonFeature()**
  - Hex to Points: **h3.h3ToGeo()**
- (4) On map moved or precision changed, back to (1).
`
)});
  main.variable(observer("viewof map")).define("viewof map", ["html","height","mapboxgl","invalidation"], function*(html,height,mapboxgl,invalidation)
{
  const container = html`<div style="height:${height}px;">`;
  yield container; // Give the container dimensions.
  const map = container.value = new mapboxgl.Map({
    container,
    center: [139.75, 35.69],
    zoom: 12,
    style: "mapbox://styles/mapbox/light-v9",
    scrollZoom: true
  });

  invalidation.then(() => map.remove());
}
);
  main.variable(observer("map")).define("map", ["Generators", "viewof map"], (G, _) => G.input(_));
  main.variable(observer()).define(["md","resolution"], function(md,resolution){return(
md`resolution = ${resolution}`
)});
  main.variable(observer("viewof resolution")).define("viewof resolution", ["html"], function(html){return(
html`<input type=range min="0" max="12" step="1" value="7" id="resolution-slider">`
)});
  main.variable(observer("resolution")).define("resolution", ["Generators", "viewof resolution"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], function(md){return(
md`### Add Polygon(Hexagon) / Point(Index) layer for initial map`
)});
  main.variable(observer()).define(["map","getFeatures"], function(map,getFeatures){return(
map.on("load", () => {
  // Add initial data for hexagons & points
  const [hexFeatures, pointFeatures] = getFeatures(map.getBounds());
  map.addSource("geojson", {
    type: "geojson",
    data: hexFeatures
  });
  map.addSource("label", {
    type: "geojson",
    data: pointFeatures
  });

  // Add hexagon layer (outline of h3 hexagon)
  map.addLayer({
    "id": "geojsonLayer",
    "type": "line",
    "source": "geojson",
    "layout": {},
    "paint": {
      "line-width": 1,
      "line-color": "#00a0ff",
      "line-opacity": 0.8
    }
  });

  // Add text label layer (text of h3 index)
  map.addLayer({
    "id": "points",
    "type": "symbol",
    "source": "label",
    "layout": {
      "text-field": "{hex}",
      "text-size": 12,
      "text-anchor": "center"
    },
    "paint": {
      "text-color": "#00a0ff"
    }
  });

})
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Callback function to update layer for the current map`
)});
  main.variable(observer("updateLayer")).define("updateLayer", ["getFeatures","map"], function(getFeatures,map){return(
function updateLayer() {
  const [hexFeatures, pointFeatures] = getFeatures(map.getBounds());
  map.getSource("geojson").setData(hexFeatures);
  map.getSource("label").setData(pointFeatures);
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Attach *updateLayer()* to map-move event & slider event`
)});
  main.variable(observer()).define(["map","updateLayer"], function(map,updateLayer){return(
map.on("moveend", updateLayer)
)});
  main.variable(observer()).define(["d3","updateLayer"], function(d3,updateLayer){return(
d3.select("#resolution-slider").on("change", updateLayer)
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Function to generate polygon/point features for the given bbox`
)});
  main.variable(observer("getFeatures")).define("getFeatures", ["geojson2h3","resolution","h3"], function(geojson2h3,resolution,h3){return(
function getFeatures(bbox) {
  const bboxFeature = ({
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [bbox._sw.lng, bbox._sw.lat],
        [bbox._sw.lng, bbox._ne.lat],
        [bbox._ne.lng, bbox._ne.lat],
        [bbox._ne.lng, bbox._sw.lat],
        [bbox._sw.lng, bbox._sw.lat]
      ]]
    }
  });

  const hexagons = geojson2h3.featureToH3Set(bboxFeature, resolution);

  const hexPolygon = geojson2h3.h3SetToMultiPolygonFeature(hexagons);
  const points = {
    "type": "FeatureCollection",
    "features": hexagons.map(hex => (
      {
        "type": "Feature",
        "properties": {
          "hex": hex
        },
        "geometry": {
          "type": "Point",
          "coordinates": h3.h3ToGeo(hex).reverse()
        }
      }
    ))
  }

  return [hexPolygon, points];
}
)});
  main.variable(observer("height")).define("height", function(){return(
500
)});
  main.variable(observer("mapboxgl")).define("mapboxgl", ["require","html"], async function(require,html)
{
  const gl = await require("mapbox-gl@0.54");
  if (!gl.accessToken) {
    // token allowed only for @sw1227
    gl.accessToken = "pk.eyJ1Ijoic3cxMjI3IiwiYSI6ImNqeTFiYXF5cTA2ajYzaHE4cmEycnRteTkifQ.FR2JtUicCVzbH7xszfObEA";
    const href = await require.resolve("mapbox-gl@0.49/dist/mapbox-gl.css");
    document.head.appendChild(html`<link href=${href} rel=stylesheet>`);
  }
  return gl;
}
);
  main.variable(observer("geojson2h3")).define("geojson2h3", ["require"], function(require){return(
require('https://bundle.run/geojson2h3@1.0.1')
)});
  main.variable(observer("h3")).define("h3", ["require"], function(require){return(
require("h3-js")
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@5")
)});
  return main;
}
