import os
import time

from datetime import datetime

# Paso 1: Importar la función principal desde nuestro otro módulo.
# PyCharm entenderá esta conexión y te ayudará con el autocompletado.
from data_generator import generar_datos_tormentas

def ejecutar_ciclo_de_monitoreo():
    """
    Esta función define el flujo de trabajo completo para un ciclo de monitoreo.
    1. Prepara el entorno (crea carpetas si es necesario).
    2. Llama al módulo generador para que haga su trabajo.
    """

    # Imprime una cabecera clara para saber cuándo empieza un nuevo ciclo.
    # time.ctime() da la fecha y hora actual de forma legible.
    print("##################################################")
    print(f"### INICIANDO CICLO DE MONITOREO: {time.ctime()} ###")
    print("##################################################\n")


    timestamp_carpeta = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    print(f"Creando directorio para esta ejecución: {timestamp_carpeta}")

    # Construimos las rutas finales dentro de esta carpeta única
    ruta_base_ejecucion = os.path.join('datos', timestamp_carpeta)
    ruta_mapas = os.path.join(ruta_base_ejecucion, 'mapas_generados')
    ruta_info = os.path.join(ruta_base_ejecucion, 'info_generada')

    # os.makedirs creará toda la estructura de carpetas necesaria
    print(f"Verificando que las carpetas de destino existan...")
    os.makedirs(ruta_mapas, exist_ok=True)
    os.makedirs(ruta_info, exist_ok=True)
    print(f"✅ Carpetas listas en: '{ruta_base_ejecucion}'\n")

    # --- PASO 1: GENERACIÓN DE DATOS ---
    # Le pasamos las rutas recién creadas al generador.
    print("--- [TAREA] Llamando al módulo de generación de datos de Tropycal ---")
    generar_datos_tormentas(ruta_mapas, ruta_info)
    print("--- [TAREA] Módulo de generación finalizado. ---\n")

    # Imprime un pie de página para marcar el final del ciclo.
    print("\n##################################################")
    print("### CICLO DE MONITOREO COMPLETADO ###")
    print("##################################################")


# --- PUNTO DE ENTRADA DEL PROGRAMA ---
# El bloque `if __name__ == "__main__":` es el estándar en Python
# para indicar "el código a ejecutar cuando este archivo se corre directamente".
if __name__ == "__main__":

    # Usamos un bucle infinito `while True` para que el monitoreo
    # se ejecute para siempre hasta que detengamos el programa manualmente (con Ctrl+C).
    while True:


        ejecutar_ciclo_de_monitoreo()

        # --- PERIODO DE ESPERA ---
        # Después de que el ciclo termina, el programa se detiene aquí.
        tiempo_de_espera_segundos = 10800  # 1 hora = 60 minutos * 60 segundos

        print(f"\nPróxima ejecución programada en {int(tiempo_de_espera_segundos / 60)} minutos...")

        # time.sleep() pausa la ejecución del programa por el número de segundos especificado.
        time.sleep(tiempo_de_espera_segundos)