import os
import json
from pymongo import MongoClient
from datetime import datetime

# --- CONFIGURACIÓN ---
# La ruta a tu carpeta principal "datos"
ROOT_DIR = '../datos' 

# Conexión a MongoDB (si lo tienes en local, esta es la URL por defecto)
MONGO_URI = 'mongodb://localhost:27017/'
DATABASE_NAME = 'meteorologia_db'
COLLECTION_NAME = 'eventos'
# --------------------

def procesar_datos():
    # Conectarse a la base de datos
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
    
    print(f"Conectado a MongoDB. Base de datos: '{DATABASE_NAME}', Colección: '{COLLECTION_NAME}'")

    # Recorrer todas las carpetas de snapshots (ej. '2025-10-11_21-43-38')
    for snapshot_folder_name in os.listdir(ROOT_DIR):
        snapshot_path = os.path.join(ROOT_DIR, snapshot_folder_name)
        
        if os.path.isdir(snapshot_path):
            print(f"\n--- Procesando snapshot: {snapshot_folder_name} ---")
            
            # Convertir el nombre de la carpeta a un formato de fecha estándar (ISO 8601)
            try:
                # Reemplazamos el primer '_' por 'T' y los '-' por ':' para que sea compatible
                snapshot_datetime = datetime.strptime(snapshot_folder_name, "%Y-%m-%d_%H-%M-%S")
            except ValueError:
                print(f"  [ERROR] El nombre de la carpeta '{snapshot_folder_name}' no tiene el formato esperado. Saltando.")
                continue

            # Ruta a la carpeta de info_generada
            info_path = os.path.join(snapshot_path, 'info_generada')
            
            if not os.path.exists(info_path):
                print(f"  [AVISO] No se encontró la carpeta 'info_generada' en '{snapshot_folder_name}'.")
                continue

            # Recorrer todos los archivos JSON dentro de 'info_generada'
            for json_filename in os.listdir(info_path):
                if json_filename.endswith('.json'):
                    file_path = os.path.join(info_path, json_filename)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                        
                        # El ID del evento que usaremos como clave única en MongoDB
                        event_id = data.get('id')
                        if not event_id:
                            print(f"  [ERROR] El archivo {json_filename} no tiene una clave 'id'. Saltando.")
                            continue
                        
                        # Añadimos la fecha del snapshot al documento
                        data['snapshot_timestamp'] = snapshot_datetime
                        
                        # La magia sucede aquí: "update_one" con "upsert=True"
                        # - Busca un documento con el mismo "_id".
                        # - Si lo encuentra, lo reemplaza con los nuevos datos ($set).
                        # - Si NO lo encuentra, lo inserta como un nuevo documento (upsert=True).
                        # Esto asegura que siempre tengas la versión más reciente de cada evento.
                        unique_doc_id = f"{event_id}_{snapshot_folder_name}"

                        data['snapshot_timestamp'] = snapshot_datetime

                        collection.update_one(
                            {'_id': unique_doc_id},
                            {'$set': data},
                            upsert=True
                        )
                        print(f"  [OK] Procesado y guardado snapshot: {event_id} de la carpeta {snapshot_folder_name}")

                        
                    except json.JSONDecodeError:
                        print(f"  [ERROR] El archivo {json_filename} no es un JSON válido.")
                    except Exception as e:
                        print(f"  [ERROR] Ocurrió un error inesperado con {json_filename}: {e}")

    print("\n--- Proceso de importación finalizado. ---")
    client.close()

# Ejecutar la función principal
if __name__ == '__main__':
    procesar_datos()