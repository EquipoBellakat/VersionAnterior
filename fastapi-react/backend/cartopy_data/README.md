# Datos de Cartopy - Natural Earth

Este directorio contiene los datos de shapefiles de Natural Earth para Cartopy.

## Estructura Actual

```
cartopy_data/
└── shapefiles/
    └── natural_earth/
        └── physical/
            └── ne_110m_land.*  ✅ (Ya disponible)
```

## Archivos Recomendados (Opcionales)

Para una visualización más completa de los mapas, se recomienda descargar los siguientes archivos adicionales de Natural Earth:

### Archivos Físicos (Physical)
- **ne_110m_ocean** - Para mostrar el océano con mejor detalle
- **ne_110m_coastline** - Para líneas costeras más precisas

### Archivos Culturales (Cultural)
- **ne_110m_admin_0_boundary_lines_land** - Para mostrar fronteras entre países

## Cómo Descargar

1. Visita: https://www.naturalearthdata.com/downloads/
2. Navega a: **110m Physical Vectors** o **110m Cultural Vectors**
3. Descarga los archivos que necesites
4. Extrae los archivos en la estructura correspondiente:
   - Archivos físicos → `shapefiles/natural_earth/physical/`
   - Archivos culturales → `shapefiles/natural_earth/cultural/`

## Estructura Completa Recomendada

```
cartopy_data/
└── shapefiles/
    └── natural_earth/
        ├── physical/
        │   ├── ne_110m_land.* ✅
        │   ├── ne_110m_ocean.* (recomendado)
        │   └── ne_110m_coastline.* (recomendado)
        └── cultural/
            └── ne_110m_admin_0_boundary_lines_land.* (recomendado)
```

## Nota

El sistema funcionará con solo `ne_110m_land`, pero los archivos adicionales mejoran la calidad visual de los mapas generados.

