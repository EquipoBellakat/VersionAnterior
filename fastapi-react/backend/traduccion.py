import os

# Ruta base del archivo actual
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 👇 CRÍTICO: Configurar Cartopy ANTES de importarlo
# Cartopy busca datos en CARTOPY_DATA_DIR/shapefiles/natural_earth/
cartopy_data_dir = os.path.join(BASE_DIR, "cartopy_data")
os.environ["CARTOPY_DATA_DIR"] = cartopy_data_dir

# Verificar que el directorio existe
if not os.path.exists(cartopy_data_dir):
    print(f"⚠️  ADVERTENCIA: No se encontró el directorio de datos de Cartopy: {cartopy_data_dir}")
    print("   Los mapas pueden no renderizarse correctamente.")
else:
    print(f"✅ Usando datos locales de Cartopy desde: {cartopy_data_dir}")

import json
import math
import matplotlib
# Configurar matplotlib para usar backend sin GUI (importante para servidor)
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cfeature
from datetime import datetime, timedelta

# Ajusta la fecha de la carpeta según corresponda a tus datos actuales
PATH_TO_JSON = os.path.join(
    BASE_DIR,
    '..',
    'datos',
    '2025-10-31_23-32-15',
    'info_generada',
    'Info_AL132025.json'
)
OUTPUT_DIR = os.path.join(BASE_DIR, 'predicciones')

os.makedirs(OUTPUT_DIR, exist_ok=True)


def cargar_datos(filepath):
    if not os.path.exists(filepath):
        print(f"ERROR: No existe el archivo {filepath}")
        return None
    with open(filepath, 'r') as f:
        return json.load(f)


def calcular_vector_inicial(history, puntos_analisis=6):
    """Calcula velocidad y dirección inicial."""
    if len(history) < 2:
        return 0, 0, 0, 0

    recent = history[-puntos_analisis:]
    lat1, lon1 = float(recent[0]['lat']), float(recent[0]['lon'])
    lat2, lon2 = float(recent[-1]['lat']), float(recent[-1]['lon'])

    t1 = datetime.strptime(recent[0]['time'], "%Y-%m-%d %H:%M:%S")
    t2 = datetime.strptime(recent[-1]['time'], "%Y-%m-%d %H:%M:%S")
    hours = (t2 - t1).total_seconds() / 3600

    if hours == 0:
        return 0, 0, 0, 0

    v_lat = (lat2 - lat1) / hours
    v_lon = (lon2 - lon1) / hours

    return v_lat, v_lon, float(recent[-1]['lat']), float(recent[-1]['lon'])


def predecir_movimiento_organico(history, horas=48):
    """Genera predicción hora por hora con factores naturales."""
    v_lat, v_lon, curr_lat, curr_lon = calcular_vector_inicial(history)
    predicciones = []
    current_time_obj = datetime.strptime(history[-1]['time'], "%Y-%m-%d %H:%M:%S")

    # Factores de simulación
    factor_giro = 0.002  # Coriolis
    amplitud_wobble = 0.03  # Bamboleo
    frecuencia_wobble = 0.5

    print(f"--- Generando 48 puntos de predicción ---")

    for h in range(1, horas + 1):
        # 1. Ajuste de trayectoria (Coriolis + Aceleración al Norte/Este)
        if curr_lat > 30:
            v_lon += 0.005
            v_lat += 0.001

        v_lon += factor_giro * h * 0.1  # Giro progresivo

        # 2. Nueva posición base
        curr_lat += v_lat
        curr_lon += v_lon

        # 3. Añadir oscilación natural
        ruido_lat = math.sin(h * frecuencia_wobble) * amplitud_wobble
        ruido_lon = math.cos(h * frecuencia_wobble) * amplitud_wobble

        pos_final_lat = curr_lat + ruido_lat
        pos_final_lon = curr_lon + ruido_lon

        timestamp = current_time_obj + timedelta(hours=h)

        predicciones.append({
            "step": h,
            "lat": pos_final_lat,
            "lon": pos_final_lon,
            "time": timestamp.strftime("%Y-%m-%d %H:%M:%S")
        })

    return predicciones


def graficar_mapa(history, predictions, storm_id):
    # Datos Históricos
    lats_hist = [float(x['lat']) for x in history]
    lons_hist = [float(x['lon']) for x in history]

    # Datos Predicción
    lats_pred = [x['lat'] for x in predictions]
    lons_pred = [x['lon'] for x in predictions]

    # Configurar límites del mapa
    all_lats = lats_hist + lats_pred
    all_lons = lons_hist + lons_pred
    min_lon, max_lon = min(all_lons) - 5, max(all_lons) + 5
    min_lat, max_lat = min(all_lats) - 5, max(all_lats) + 5

    fig = plt.figure(figsize=(12, 10))
    ax = fig.add_subplot(1, 1, 1, projection=ccrs.PlateCarree())
    ax.set_extent([min_lon, max_lon, min_lat, max_lat], crs=ccrs.PlateCarree())

    # Fondo de mapa profesional
    # Nota: Si faltan algunos archivos de Natural Earth, Cartopy simplemente no los mostrará
    # Archivos recomendados para mejor visualización:
    # - ne_110m_land (ya disponible)
    # - ne_110m_ocean (opcional, mejora el océano)
    # - ne_110m_coastline (opcional, mejora las líneas costeras)
    # - ne_110m_admin_0_boundary_lines_land (opcional, para fronteras)
    try:
        ax.add_feature(cfeature.LAND, facecolor='#f0f0f0')
    except Exception as e:
        print(f"⚠️  No se pudo cargar LAND: {e}")
    
    try:
        ax.add_feature(cfeature.OCEAN, facecolor='#a0c0ff')
    except Exception as e:
        # Si no hay archivo de océano, usar color de fondo
        ax.set_facecolor('#a0c0ff')
        print(f"⚠️  No se pudo cargar OCEAN, usando color de fondo: {e}")
    
    try:
        ax.add_feature(cfeature.COASTLINE, linewidth=0.8)
    except Exception as e:
        print(f"⚠️  No se pudo cargar COASTLINE: {e}")
    
    try:
        ax.add_feature(cfeature.BORDERS, linestyle=':')
    except Exception as e:
        print(f"⚠️  No se pudo cargar BORDERS: {e}")
    
    ax.gridlines(draw_labels=True, linewidth=0.5, color='gray',
                 alpha=0.3, linestyle='--')

    plt.plot(
        lons_hist,
        lats_hist,
        color='blue',
        linewidth=2,
        marker='o',
        markersize=3,
        transform=ccrs.PlateCarree(),
        label='Historial'
    )

    plt.plot(
        lons_pred,
        lats_pred,
        color='red',
        linewidth=1.5,
        linestyle='--',
        marker='x',       # <--- AQUÍ ESTÁ EL TACHE POR HORA
        markersize=5,
        transform=ccrs.PlateCarree(),
        label='Predicción (+48h)'
    )

    plt.text(
        lons_hist[-1],
        lats_hist[-1] + 0.3,
        ' ACTUAL',
        transform=ccrs.PlateCarree(),
        fontweight='bold',
        color='navy'
    )

    plt.text(
        lons_pred[-1],
        lats_pred[-1],
        ' Fin',
        transform=ccrs.PlateCarree(),
        color='red',
        fontsize=9
    )

    plt.title(f"Predicción Hora por Hora: {storm_id}", fontsize=14)
    plt.legend(loc='upper left')

    # Usamos timestamp para que nunca se repita el nombre
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"prediccion_{storm_id}_{timestamp_str}.png"

    save_path = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(save_path, dpi=120, bbox_inches='tight')
    plt.close()

    return save_path


def main():
    print("Cargando datos...")
    data = cargar_datos(PATH_TO_JSON)
    if not data:
        return

    storm_id = data.get('id', 'STORM')
    history = data.get('history', [])
    history.sort(key=lambda x: datetime.strptime(x['time'], "%Y-%m-%d %H:%M:%S"))

    # Generar predicción
    predicciones = predecir_movimiento_organico(history, horas=48)

    # Graficar
    ruta = graficar_mapa(history, predicciones, storm_id)
    print("-" * 40)
    print(f"¡Mapa Generado!")
    print(f"Archivo guardado en: {ruta}")
    print("Cada 'x' roja representa 1 hora de predicción.")
    print("-" * 40)


if __name__ == "__main__":
    main()
