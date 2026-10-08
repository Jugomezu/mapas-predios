# Mapas de predios

Sitio que unifica los visores geograficos de Optimizacion de Predios SAS.

| Ruta | Mapa | Origen |
|------|------|--------|
| `/` | Pagina de inicio con enlaces a los tres mapas | — |
| `/fontibon/` | Mapa informativo Fontibon (Bogota) | repo `Jugomezu/Fontibon` |
| `/15-con-106/` | 15 con 106 (Bogota) | repo `Jugomezu/15-con-106` |
| `/asomadera/` | Mapa informativo Asomadera (Medellin, acceso con usuario) | repo `Jugomezu/Map` |

## Capas de transporte compartidas (`shared/transporte/`)

Los dos mapas de Bogota cargan el mismo modulo `transporte.js`, que agrega:

- **Metro Linea 3 (corredor indicativo, en estudio)**: dibujado sobre el eje de la Av. Ciudad de Cali
  (POT Decreto 555/2021, IDE Bogota), de Ciudad Verde (Soacha) a la Calle 72, donde empalmaria con la Linea 2.
  La L3 esta en prefactibilidad y no tiene trazado oficial; la Av. Ciudad de Cali es una de las tres
  alternativas en estudio (con ALO Sur y Av. Boyaca). Las 15 estaciones son ilustrativas, ubicadas en cruces
  de la malla arterial.
- **Metro Linea 2** y **RegioTram de Occidente**, con sus estaciones (datos tomados del mapa de Fontibon).
- **Malla vial arterial proyectada POT 555** para toda la ciudad (capa 185 del servicio
  `POT_Bogota_Decreto_555_2021` de IDE Bogota), filtrada a los tramos propuestos, sin construir,
  parcialmente construidos y en construccion.
- Flechas en el borde del mapa que apuntan a la estacion mas cercana de cada linea cuando esta fuera de pantalla.

El mapa de Asomadera (Medellin) no incluye estas capas.

## Desarrollo local

```bash
python -m http.server 8000
```

Luego abrir http://localhost:8000/.
