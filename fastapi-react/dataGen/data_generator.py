import os
import json
from tropycal import realtime
from datetime import datetime
import matplotlib.pyplot as plt

# --------------------------------------------------------------------------
# FUNCIONES AUXILIARES PARA TRADUCIR EL FORECAST
# --------------------------------------------------------------------------
def save_realtime_storm_json(storm, filename):
    data = {
        "id": storm.id, "name": storm.name, "year": storm.year, "basin": storm.basin,
        "invest": storm.invest, "ace": storm.ace, "realtime": storm.realtime, "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "history": []
    }
    for i in range(len(storm.time)):
        entry = {
            "time": str(storm.time[i]), "lat": float(storm.lat[i]), "lon": float(storm.lon[i]),
            "vmax": int(storm.vmax[i]),
            "mslp": int(storm.mslp[i]) if storm.mslp[i] is not None else None,
            "type": storm.type[i]
        }
        data["history"].append(entry)
    try:
        forecast = storm.get_forecast_realtime()
        forecast_data = {
            "init": str(forecast["init"]), "fhr": forecast["fhr"],
            "lat": [float(x) for x in forecast["lat"]], "lon": [float(x) for x in forecast["lon"]],
            "vmax": forecast["vmax"],
            "mslp": [None if x is None else int(x) for x in forecast["mslp"]],
            "type": forecast["type"]
        }
        data["forecast"] = forecast_data
    except:
        data["forecast"] = None
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
    print(f" Datos JSON guardados en {os.path.basename(filename)}")

def save_invest_json(invest, filename):
    data = {
        "id": invest.id, "name": invest.name, "invest": invest.invest,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "realtime_formation_prob": invest.get_realtime_formation_prob()
    }
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
    print(f" Datos del invest guardados en {os.path.basename(filename)}")

# --------------------------------------------------------------------------
# DICCIONARIOS DE TRADUCCIÓN
# --------------------------------------------------------------------------

MESES_EN_ES = {
    # Meses largos
    "January": "enero", "February": "febrero", "March": "marzo",
    "April": "abril",  "May": "mayo",      "June": "junio",
    "July": "julio",   "August": "agosto", "September": "septiembre",
    "October": "octubre", "November": "noviembre", "December": "diciembre",
    # Abreviados (por si acaso)
    "Jan": "ene", "Feb": "feb", "Mar": "mar", "Apr": "abr",
    "Jun": "jun", "Jul": "jul", "Aug": "ago", "Sep": "sep",
    "Oct": "oct", "Nov": "nov", "Dec": "dic",
}

FRASES_EN_ES = {
    # Gráficos de intensidad
    "Model Forecast Intensity for": "Intensidad de pronóstico del modelo para",
    "Forecast Hour": "Hora de pronóstico",
    "Sustained Wind (kt)": "Viento sostenido (kt)",
    "Sustained Wind (mph)": "Viento sostenido (mph)",
    "Initialized": "Inicializado",

    # Info del NHC
    "Current Intensity": "Intensidad actual",
    "NHC Issued": "Emitido por NHC",

    # Tipos de ciclón
    "Tropical Storm": "Tormenta tropical",
    "Tropical Depression": "Depresión tropical",
    "Non-Tropical": "No tropical",
    "Subtropical": "Subtropical",
    "Unknown": "Desconocido",

    # Categorías
    "Category": "Categoría",   # "Category 1" → "Categoría 1"

    # Textos del cono / pie de figura
    "The cone of uncertainty in this graphic was generated internally":
        "El cono de incertidumbre de este gráfico fue generado internamente",
    "using the official NHC cone radii.":
        "usando los radios oficiales del cono del NHC.",
    "This cone differs slightly from the official NHC cone.":
        "Este cono puede diferir ligeramente del cono oficial del NHC.",

    # Pie genérico
    "Plot generated using Tropycal": "Gráfico generado con Tropycal",
    "Plot generated using troPYcal": "Gráfico generado con Tropycal",
}

# --------------------------------------------------------------------------
# HELPER GENERAL PARA TRADUCIR TEXTOS EN UNA FIGURA
# --------------------------------------------------------------------------

def _traducir_textos_en_figura(ax):
    """Traduce todos los textos que encuentre en la figura y en el eje."""

    fig = ax.get_figure()

    # Textos sueltos en figura y eje (títulos, subtítulos, anotaciones, etc.)
    all_texts = list(fig.texts) + list(ax.texts)
    for txt in all_texts:
        t = txt.get_text()
        if not t:
            continue

        # Meses
        for en, es in MESES_EN_ES.items():
            t = t.replace(en, es)

        # Frases clave
        for en, es in FRASES_EN_ES.items():
            t = t.replace(en, es)

        txt.set_text(t)

    # Textos de la leyenda, si existe
    leg = ax.get_legend()
    if leg:
        for txt in leg.get_texts():
            t = txt.get_text()
            for en, es in MESES_EN_ES.items():
                t = t.replace(en, es)
            for en, es in FRASES_EN_ES.items():
                t = t.replace(en, es)
            txt.set_text(t)

        # Título de la leyenda, por si acaso
        if leg.get_title() is not None:
            t = leg.get_title().get_text()
            for en, es in MESES_EN_ES.items():
                t = t.replace(en, es)
            for en, es in FRASES_EN_ES.items():
                t = t.replace(en, es)
            leg.get_title().set_text(t)

        # Opcional: un pelín de transparencia al recuadro
        frame = leg.get_frame()
        frame.set_alpha(0.95)


# --------------------------------------------------------------------------
# TRADUCIR GRÁFICA DE FORECAST (CONE, TRAYECTORIA, ETC.)
# --------------------------------------------------------------------------

def traducir_forecast(ax, storm_name: str):
    """
    Traduce el gráfico generado por storm.plot_forecast_realtime().
    Cambia títulos, textos internos, meses, etc.
    """

    # Título principal (el original lo sobrescribimos)
    ax.set_title(f"Pronóstico oficial para {storm_name}", fontsize=14)

    # En estos mapas los ejes son lat/lon, normalmente no hace falta tocarlos,
    # pero si quieres:
    ax.set_xlabel("Longitud")
    ax.set_ylabel("Latitud")

    # Aplicar traducciones a todos los textos
    _traducir_textos_en_figura(ax)

    return ax


# --------------------------------------------------------------------------
# TRADUCIR GRÁFICA DE MODELOS DE INTENSIDAD
# --------------------------------------------------------------------------

def traducir_modelos(ax, storm_name: str):
    """
    Traduce el gráfico generado por storm.plot_models_wind().
    Cambia títulos, ejes, leyenda y textos internos.
    """

    # Título en español
    ax.set_title(f"Intensidad de pronóstico del modelo para {storm_name}",
                 fontsize=14)

    # Ejes en español
    ax.set_xlabel("Hora de pronóstico")
    ax.set_ylabel("Viento sostenido (kt)")

    # Aplicar traducciones a todos los textos (incluye subtítulo Initialized...)
    _traducir_textos_en_figura(ax)

    return ax

def generar_datos_tormentas(ruta_mapas, ruta_info):
    print("Iniciando la generación de datos de tormentas...")

    try:
        realtime_obj = realtime.Realtime()
    except Exception as e:
        print(f" Error al inicializar Tropycal: {e}")
        return

    tormentas_activas_ids = realtime_obj.list_active_storms(basin='north_atlantic') + \
                            realtime_obj.list_active_storms(basin='east_pacific')

    if not tormentas_activas_ids:
        print(" No hay tormentas activas en este momento.")
        return

    print(" Tormentas activas encontradas:\n")
    for storm_id in tormentas_activas_ids:
        try:
            storm = realtime_obj.get_storm(storm_id)
            print(f"- {storm.name} ({storm.id})")
        except Exception as e:
            print(f"- No se pudo obtener información para {storm_id}: {e}")

    for storm_id in tormentas_activas_ids:
        try:
            storm = realtime_obj.get_storm(storm_id)
            storm_name = storm.name
            print(f"\n Procesando tormenta: {storm_name} ({storm_id})")

            forecast_path = os.path.join(ruta_mapas, f'Forecast_{storm_id}.png')
            models_path = os.path.join(ruta_mapas, f'Modelos_{storm_id}.png')
            json_path = os.path.join(ruta_info, f'Info_{storm_id}.json')

            # ------------------------------------------------------
            # CREACIÓN DE FORECAST (YA TRADUCIDO)
            # ------------------------------------------------------
            if not storm.invest:
                try:
                    ax = storm.plot_forecast_realtime()   # generar en inglés
                    traducir_forecast(ax, storm_name)     # traducir
                    plt.savefig(forecast_path, dpi=150, bbox_inches='tight')
                    plt.close()
                    print(f" Mapa Forecast traducido guardado en {os.path.basename(forecast_path)}")
                except Exception as e:
                    print(f" No se pudo generar forecast para {storm_name}: {e}")

                # ------------------------------------------------------
                # CREACIÓN DE MODELOS (YA TRADUCIDO)
                # ------------------------------------------------------
                try:
                    ax = storm.plot_models_wind()
                    traducir_modelos(ax, storm_name)
                    plt.savefig(models_path, dpi=150, bbox_inches='tight')
                    plt.close()
                    print(f" Mapa de Modelos traducido guardado en {os.path.basename(models_path)}")
                except Exception as e:
                    print(f" No se pudo generar modelos para {storm_name}: {e}")
            else:
                print(f" Invest detectado: {storm_name}, solo guardando JSON")

            # Siempre guardar JSON
            if storm.invest:
                save_invest_json(storm, json_path)
            else:
                save_realtime_storm_json(storm, json_path)

        except Exception as e:
            print(f" Error fatal procesando {storm_id}: {e}")

    print("\nGeneración de datos COMPLETADA (con traducciones).")