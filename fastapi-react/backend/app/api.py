from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pymongo import MongoClient
import json
from bson import json_util 
from fastapi import Response
from datetime import datetime 
from bson import ObjectId 

app = FastAPI()

origins = [
    "http://localhost:5173",
    "localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

MONGO_URI = 'mongodb://localhost:27017/'
DATABASE_NAME = 'meteorologia_db'
COLLECTION_NAME = 'eventos'

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]
print("Conectado a MongoDB desde api.py.")

datos_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'datos')
app.mount("/api/maps", StaticFiles(directory=datos_dir), name="maps")

def parse_mongo_json(data):
    results = []
    for item in data:
        # 1. Conversión de tipos de datos
        if '_id' in item and isinstance(item['_id'], ObjectId):
            item['_id'] = str(item['_id'])
        if 'snapshot_timestamp' in item and isinstance(item['snapshot_timestamp'], datetime):
            item['snapshot_timestamp'] = item['snapshot_timestamp'].isoformat()
            
        # 2. BÚSQUEDA INTELIGENTE DE IMÁGENES
        # Preparamos un objeto para guardar las imágenes encontradas
        item['images'] = { "model": None, "forecast": None }
        
        # Necesitamos el ID de la tormenta para buscar en los nombres de archivo
        storm_id = item.get('id')
        if not storm_id: # Si no hay ID, no podemos buscar imágenes
            results.append(item)
            continue

        try:
            snapshot_folder = item['_id'].split('_', 1)[1]
            mapas_path = os.path.join(datos_dir, snapshot_folder, 'mapas_generados')
            
            if os.path.isdir(mapas_path):
                # Iteramos sobre todos los archivos de la carpeta
                for filename in os.listdir(mapas_path):
                    # --- ¡AQUÍ ESTÁ LA LÓGICA CLAVE! ---
                    # Comprobamos si el ID de la tormenta está en el nombre del archivo
                    if storm_id in filename:
                        url = f"/api/maps/{snapshot_folder}/mapas_generados/{filename}"
                        # Clasificamos la imagen según su nombre
                        if 'modelos' in filename.lower():
                            item['images']['model'] = url
                        elif 'forecast' in filename.lower():
                            item['images']['forecast'] = url
        except IndexError:
            pass # Si el _id no tiene el formato esperado, no hace nada

        results.append(item)
    return results



@app.get("/", tags=["Root"])
async def read_root() -> dict:
    return {"message": "Bienvenido a la API de Datos Meteorológicos."}

@app.get("/api/events/all", tags=["Events"])
async def get_all_events():
    """
    Obtiene todos los snapshots de todos los eventos, ordenados por fecha.
    """
    # 1. Obtenemos los datos de MongoDB
    events_cursor = collection.find({}).sort("snapshot_timestamp", 1)
    
    # 2. Usamos nuestra función auxiliar para limpiar y formatear los datos
    results = parse_mongo_json(events_cursor)
    
    # 3. FastAPI se encarga de convertir la lista a JSON y enviarla
    return results

@app.get("/api/events/history/{event_id}", tags=["Events"])
async def get_event_history(event_id: str):
    """
    Obtiene el historial completo de un evento específico, ordenado por fecha.
    """
    # 1. Obtenemos los datos de MongoDB
    history_cursor = collection.find({"id": event_id}).sort("snapshot_timestamp", 1)
    
    # 2. Usamos nuestra función auxiliar para limpiar y formatear los datos
    results = parse_mongo_json(history_cursor)
    
    # 3. FastAPI se encarga de convertir la lista a JSON y enviarla
    return results

@app.get("/api/events/unique", tags=["Events"])
async def get_unique_events():
    """
    Obtiene una lista de eventos únicos, mostrando el último nombre registrado
    y el ID de cada evento.
    """
    # Usamos una "pipeline de agregación" de MongoDB. Es muy potente.
    pipeline = [
        # 1. Ordena todos los documentos por su fecha de snapshot (el más nuevo primero)
        { "$sort": { "snapshot_timestamp": -1 } },
        # 2. Agrupa los documentos por su campo "id"
        { 
            "$group": {
                "_id": "$id", # Agrupa por el ID del evento
                "name": { "$first": "$name" }, # Toma el nombre del primer documento que encuentre (el más reciente)
                "id": { "$first": "$id" } # Toma el id también
            }
        },
        # 3. Ordena la lista final alfabéticamente por nombre
        { "$sort": { "name": 1 } }
    ]
    
    events_cursor = collection.aggregate(pipeline)
    results = parse_mongo_json(events_cursor)
    return results