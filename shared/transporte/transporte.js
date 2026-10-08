// Capas de transporte compartidas por los mapas de Bogota.
// Requiere leaflet.js, leaflet.pattern.js y los archivos de shared/transporte/data/.
(function() {
    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function(c) {
            return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
        });
    }

    function bindAttributesPopup(feature, layer) {
        var rows = '';
        for (var key in feature.properties) {
            var value = feature.properties[key];
            if (key.charAt(0) === '_' || value === null || String(value).trim() === '') continue;
            rows += '<tr><th scope="row">' + escapeHtml(key) + '</th><td>' + escapeHtml(value) + '</td></tr>';
        }
        layer.bindPopup('<table>' + rows + '</table>', {maxHeight: 400});
    }

    // Each stroke spec draws one pass of the same line; the last pass carries the popup.
    function lineLayers(data, strokes) {
        return strokes.map(function(stroke, index) {
            var isTop = index === strokes.length - 1;
            return L.geoJson(data, {
                pane: 'pane_Transporte_lineas',
                interactive: isTop,
                onEachFeature: isTop ? bindAttributesPopup : null,
                style: function() {
                    return L.extend({lineCap: 'round', lineJoin: 'round', opacity: 1}, stroke);
                }
            });
        });
    }

    function stationsLayer(data, color) {
        return L.geoJson(data, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    pane: 'pane_Transporte_estaciones',
                    radius: 5,
                    color: color,
                    weight: 2.5,
                    fillColor: '#ffffff',
                    fillOpacity: 1
                });
            },
            onEachFeature: function(feature, layer) {
                bindAttributesPopup(feature, layer);
                layer.bindTooltip(escapeHtml(feature.properties['Estación']), {direction: 'top', offset: [0, -6], className: 'transit-tooltip'});
            }
        });
    }

    var LINES = [
        {
            key: 'metroL3', mode: 'Metro L3', color: '#7b2cbf', shade: '#4a1a73',
            line: function() { return json_MetroL3; },
            stations: function() { return json_MetroL3Estaciones; },
            strokes: [
                {color: '#ffffff', weight: 8, opacity: 0.9},
                {color: '#7b2cbf', weight: 4.5, dashArray: '1 9'}
            ],
            swatch: '<line x1="3" y1="6" x2="23" y2="6" stroke="#bbb" stroke-width="9" stroke-linecap="round"/>' +
                '<line x1="3" y1="6" x2="23" y2="6" stroke="#fff" stroke-width="7" stroke-linecap="round"/>' +
                '<line x1="4" y1="6" x2="22" y2="6" stroke="#7b2cbf" stroke-width="4" stroke-linecap="round" stroke-dasharray="0.5 5.5"/>',
            label: 'Metro Linea 3 (corredor indicativo, en estudio)'
        },
        {
            key: 'metroL2', mode: 'Metro L2', color: '#0a5cad', shade: '#063a6e',
            line: function() { return json_MetroL2; },
            stations: function() { return json_MetroL2Estaciones; },
            strokes: [
                {color: '#ffffff', weight: 8},
                {color: '#0a5cad', weight: 4.5, dashArray: '10 7', lineCap: 'butt'}
            ],
            swatch: '<line x1="3" y1="6" x2="23" y2="6" stroke="#bbb" stroke-width="9" stroke-linecap="round"/>' +
                '<line x1="3" y1="6" x2="23" y2="6" stroke="#fff" stroke-width="7" stroke-linecap="round"/>' +
                '<line x1="3" y1="6" x2="23" y2="6" stroke="#0a5cad" stroke-width="4" stroke-dasharray="6 3"/>',
            label: 'Metro Linea 2 (proyectada)'
        },
        {
            key: 'regiotram', mode: 'RegioTram Occidente', color: '#1b6b36', shade: '#0f4221',
            line: function() { return json_RegioTram; },
            stations: function() { return json_RegioTramEstaciones; },
            // Railway symbology: white halo, green bed, white sleepers
            strokes: [
                {color: '#ffffff', weight: 10, opacity: 0.9},
                {color: '#1b6b36', weight: 7},
                {color: '#ffffff', weight: 2.5, dashArray: '9 9', lineCap: 'butt'}
            ],
            swatch: '<line x1="2" y1="6" x2="24" y2="6" stroke="#1b6b36" stroke-width="7"/>' +
                '<line x1="2" y1="6" x2="24" y2="6" stroke="#fff" stroke-width="2.5" stroke-dasharray="4 4"/>',
            label: 'RegioTram de Occidente (en construccion)'
        }
    ];

    function addRailLayers(map) {
        return LINES.map(function(def) {
            var group = L.featureGroup(lineLayers(def.line(), def.strokes).concat([stationsLayer(def.stations(), def.color)]));
            map.addLayer(group);
            return {def: def, group: group, node: {
                label: '<svg class="transit-swatch" width="26" height="12">' + def.swatch +
                    '<circle cx="13" cy="6" r="3.2" fill="#fff" stroke="' + def.color + '" stroke-width="2"/></svg> ' + def.label,
                layer: group
            }};
        });
    }

    // Malla vial arterial proyectada (POT Decreto 555/2021): reserves not yet fully built, split by status
    function addRoadLayers(map) {
        map.createPane('pane_MallaVialProyectada');
        map.getPane('pane_MallaVialProyectada').style.zIndex = 416;
        var constructionPattern = new L.StripePattern({
            weight: 3,
            spaceWeight: 4,
            color: '#d9480f',
            opacity: 0.75,
            spaceOpacity: 0,
            angle: 45
        });
        constructionPattern.addTo(map);
        var styles = {
            sin_construir: {color: '#c92a2a', weight: 1.6, dashArray: '6 4', fillColor: '#e03131', fillOpacity: 0.3},
            parcial: {color: '#e67700', weight: 1.2, fillColor: '#f59f00', fillOpacity: 0.3},
            en_construccion: {color: '#d9480f', weight: 1.6, fillPattern: constructionPattern, fillOpacity: 1}
        };
        function statusLayer(category) {
            var layer = L.geoJson(json_MallaVialPOT555, {
                pane: 'pane_MallaVialProyectada',
                filter: function(feature) { return feature.properties['_categoria'] === category; },
                onEachFeature: bindAttributesPopup,
                style: function() {
                    return L.extend({pane: 'pane_MallaVialProyectada', opacity: 1, lineJoin: 'round'}, styles[category]);
                }
            });
            map.addLayer(layer);
            return layer;
        }
        var sinConstruir = statusLayer('sin_construir');
        var parcial = statusLayer('parcial');
        var enConstruccion = statusLayer('en_construccion');
        return [
            {label: '<svg class="transit-swatch" width="26" height="12"><rect x="2" y="2" width="22" height="8" fill="rgba(224,49,49,0.3)" stroke="#c92a2a" stroke-width="1.5" stroke-dasharray="4 2.5"/></svg> Sin construir', layer: sinConstruir},
            {label: '<svg class="transit-swatch" width="26" height="12"><defs><pattern id="legendRoadStripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" fill="rgba(217,72,15,0.75)"/></pattern></defs><rect x="2" y="2" width="22" height="8" fill="url(#legendRoadStripes)" stroke="#d9480f" stroke-width="1.5"/></svg> En construccion', layer: enConstruccion},
            {label: '<svg class="transit-swatch" width="26" height="12"><rect x="2" y="2" width="22" height="8" fill="rgba(245,159,0,0.3)" stroke="#e67700" stroke-width="1.2"/></svg> Parcialmente construida', layer: parcial}
        ];
    }

    // Edge arrows pointing to the station of each line nearest the anchor, shown only while that station is off screen
    function addStationPointers(map, rails, anchor, anchorLabel, obstacleIds) {
        function nearestStation(data) {
            var best = null;
            data.features.forEach(function(feature) {
                var coords = feature.geometry.coordinates;
                var latlng = L.latLng(coords[1], coords[0]);
                var distance = map.distance(anchor, latlng);
                if (!best || distance < best.distance) {
                    best = {feature: feature, latlng: latlng, distance: distance};
                }
            });
            return best;
        }
        function findStationMarker(group, feature) {
            var found = null;
            group.eachLayer(function sweep(layer) {
                if (found) return;
                if (layer.feature === feature && layer.getLatLng) found = layer;
                else if (layer.eachLayer) layer.eachLayer(sweep);
            });
            return found;
        }
        var pointers = rails.map(function(rail) {
            var pointer = {def: rail.def, group: rail.group, station: nearestStation(rail.def.stations())};
            var km = (pointer.station.distance / 1000).toFixed(1).replace('.', ',');
            var el = document.createElement('div');
            el.className = 'station-pointer';
            var stationName = pointer.station.feature.properties['Estación'];
            if (!/^Estación/.test(stationName)) stationName = 'Estación ' + stationName;
            el.title = rail.def.mode + ' · ' + stationName + ' · ' + km + ' km ' + anchorLabel + ' (clic para ir)';
            // Tailless, two-tone arrowhead (north-arrow style) with a white outline, drawn pointing right and rotated toward the station
            el.innerHTML = '<svg width="46" height="46" viewBox="0 0 24 24">' +
                '<path d="M23 12 L3 2.5 L8.5 12 L3 21.5 Z" fill="#ffffff" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>' +
                '<path d="M23 12 L3 2.5 L8.5 12 Z" fill="' + rail.def.color + '" stroke="' + rail.def.color + '" stroke-width="0.8" stroke-linejoin="round"/>' +
                '<path d="M23 12 L8.5 12 L3 21.5 Z" fill="' + rail.def.shade + '" stroke="' + rail.def.shade + '" stroke-width="0.8" stroke-linejoin="round"/>' +
                '</svg><span class="station-pointer-label" style="color:' + rail.def.color + '">' + rail.def.mode + '</span>';
            L.DomEvent.disableClickPropagation(el);
            L.DomEvent.disableScrollPropagation(el);
            el.addEventListener('click', function() {
                map.flyTo(pointer.station.latlng, Math.max(map.getZoom(), 16));
                map.once('moveend', function() {
                    var marker = findStationMarker(pointer.group, pointer.station.feature);
                    if (marker) marker.openPopup();
                });
            });
            map.getContainer().appendChild(el);
            pointer.el = el;
            pointer.arrow = el.querySelector('svg');
            return pointer;
        });
        function rectsOverlap(a, b) {
            return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        }
        function update() {
            var container = map.getContainer();
            var origin = container.getBoundingClientRect();
            var size = map.getSize();
            var margin = 10;
            // Controls and cards the arrows must not cover
            var obstacles = [];
            container.querySelectorAll('.leaflet-control').forEach(function(control) {
                obstacles.push(control.getBoundingClientRect());
            });
            obstacleIds.forEach(function(id) {
                var element = document.getElementById(id);
                if (element) obstacles.push(element.getBoundingClientRect());
            });
            obstacles = obstacles.filter(function(r) { return r.width > 0; }).map(function(r) {
                return {left: r.left - origin.left - 6, right: r.right - origin.left + 6, top: r.top - origin.top - 6, bottom: r.bottom - origin.top + 6};
            });
            function isHidden(x, y) {
                if (x < 0 || y < 0 || x > size.x || y > size.y) return true;
                return obstacles.some(function(r) { return x > r.left && x < r.right && y > r.top && y < r.bottom; });
            }
            pointers.forEach(function(pointer) {
                var target = map.latLngToContainerPoint(pointer.station.latlng);
                if (!map.hasLayer(pointer.group) || !isHidden(target.x, target.y)) {
                    pointer.el.style.display = 'none';
                    return;
                }
                pointer.el.style.display = 'flex';
                var halfW = pointer.el.offsetWidth / 2;
                var halfH = pointer.el.offsetHeight / 2;
                var cx = size.x / 2, cy = size.y / 2;
                var dx = target.x - cx, dy = target.y - cy;
                // Largest step along the center->station ray that keeps the pill inside the map
                var tMax = Math.min(
                    dx === 0 ? Infinity : Math.abs((cx - halfW - margin) / dx),
                    dy === 0 ? Infinity : Math.abs((cy - halfH - margin) / dy));
                var x = cx, y = cy;
                for (var t = tMax; t > 0; t -= tMax / 60) {
                    x = cx + dx * t;
                    y = cy + dy * t;
                    var box = {left: x - halfW, right: x + halfW, top: y - halfH, bottom: y + halfH};
                    if (!obstacles.some(function(r) { return rectsOverlap(box, r); })) break;
                }
                pointer.el.style.transform = 'translate(' + Math.round(x - halfW) + 'px,' + Math.round(y - halfH) + 'px)';
                pointer.arrow.style.transform = 'rotate(' + (Math.atan2(dy, dx) * 180 / Math.PI) + 'deg)';
                // Later pointers steer around earlier ones
                obstacles.push({left: x - halfW - 6, right: x + halfW + 6, top: y - halfH - 6, bottom: y + halfH + 6});
            });
        }
        map.on('move zoom resize layeradd layerremove', update);
        map.getContainer().addEventListener('click', function() { setTimeout(update, 50); });
        setTimeout(update, 100);
    }

    // Adds the transport layers to `map` and returns layer-tree nodes for L.control.layers.tree.
    // options.anchor: LatLng the station pointers measure from; options.anchorLabel: text after the distance.
    window.Transporte = {
        add: function(map, options) {
            map.createPane('pane_Transporte_lineas');
            map.getPane('pane_Transporte_lineas').style.zIndex = 417;
            map.createPane('pane_Transporte_estaciones');
            map.getPane('pane_Transporte_estaciones').style.zIndex = 418;
            var roadNodes = addRoadLayers(map);
            var rails = addRailLayers(map);
            if (options.anchor) {
                addStationPointers(map, rails, options.anchor, options.anchorLabel || 'del predio', options.obstacleIds || []);
            }
            return [
                {label: 'Transporte ferreo', collapsed: false, selectAllCheckbox: 'Activar/Desactivar todos',
                 children: rails.map(function(rail) { return rail.node; })},
                {label: 'Malla vial proyectada (POT 555)', collapsed: false, selectAllCheckbox: 'Activar/Desactivar todos',
                 children: roadNodes}
            ];
        }
    };
})();
