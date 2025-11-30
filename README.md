# EquipoBellaKat - Sistema de Datos Meteorológicos

Un sistema completo para el procesamiento, almacenamiento y visualización de datos meteorológicos de tormentas tropicales, construido con **FastAPI** (backend), **React + TypeScript** (frontend), y **MongoDB** para el almacenamiento de datos.

## 🌪️ Características del Sistema

- ✅ **Pipeline de datos meteorológicos** - Importación automática de datos de tormentas tropicales
- 🗄️ **Base de datos MongoDB** - Almacenamiento eficiente de snapshots históricos
- 🎨 **Interfaz moderna** con Chakra UI para visualización de datos
- 🔄 **API REST completa** con FastAPI para acceso a datos
- 📊 **Visualización de mapas** - Modelos y pronósticos meteorológicos
- 📱 **Diseño responsivo** adaptable a diferentes dispositivos
- ⚡ **Desarrollo rápido** con hot reload configurado
- 🔒 **CORS configurado** para desarrollo local

## 🛠️ Tecnologías Utilizadas

### Backend

- **FastAPI** - Framework web moderno y rápido para Python
- **MongoDB** - Base de datos NoSQL para almacenamiento de datos meteorológicos
- **PyMongo** - Driver de Python para MongoDB
- **Uvicorn** - Servidor ASGI para FastAPI
- **Python 3.13** - Lenguaje de programación

### Frontend

- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Superset tipado de JavaScript
- **Chakra UI** - Biblioteca de componentes de React
- **Vite** - Herramienta de construcción rápida
- **ESLint** - Linter para JavaScript/TypeScript

## 📁 Estructura del Proyecto

```
EquipoBellaKat/
├── fastapi-react/
│   ├── backend/                    # API Backend (FastAPI)
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   └── api.py             # Rutas y lógica de la API
│   │   ├── main.py                # Punto de entrada del servidor
│   │   └── venv/                  # Entorno virtual de Python
│   ├── data_ingestion/            # Scripts de importación de datos
│   │   └── importar_datos.py      # Script principal de importación
│   ├── datos/                     # Datos meteorológicos (snapshots)
│   │   ├── 2025-10-11_21-43-38/  # Snapshots por fecha
│   │   │   ├── info_generada/     # Archivos JSON con datos
│   │   │   └── mapas_generados/   # Imágenes PNG de mapas
│   │   └── ...
│   └── EquipoBellaKat/            # Frontend (React + TypeScript)
│       ├── src/
│       │   ├── components/        # Componentes React
│       │   ├── App.tsx           # Componente raíz
│       │   └── main.tsx          # Punto de entrada de React
│       ├── package.json          # Dependencias de Node.js
│       └── vite.config.ts        # Configuración de Vite
└── README.md                     # Este archivo
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Python 3.13+**
- **Node.js 18+**
- **npm** o **yarn**
- **MongoDB** (Community Edition)

### 1. Instalar MongoDB

#### En macOS (con Homebrew):

```bash
# Instalar Homebrew si no lo tienes
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Agregar el tap de MongoDB
brew tap mongodb/brew

# Instalar MongoDB Community Edition
brew install mongodb-community

# Iniciar el servicio de MongoDB
brew services start mongodb-community
```

#### En Ubuntu/Debian:

```bash
# Importar clave pública de MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Agregar repositorio de MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Actualizar e instalar MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### En Windows:

1. Descargar MongoDB Community Server desde: https://www.mongodb.com/try/download/community
2. Ejecutar el instalador y seguir las instrucciones
3. Iniciar MongoDB desde el menú de inicio o con `mongod`

### 2. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd EquipoBellaKat
```

### 3. Configurar el Backend (FastAPI)

```bash
# Navegar al directorio del backend
cd fastapi-react/backend

# Crear y activar entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install fastapi uvicorn pymongo

# El servidor estará disponible en: http://localhost:8000
```

### 4. Configurar el Frontend (React)

```bash
# Navegar al directorio del frontend
cd fastapi-react/EquipoBellaKat

# Instalar dependencias
npm install

# La aplicación estará disponible en: http://localhost:5173
```

## 📊 Proceso de Importación de Datos

### Importar Datos Meteorológicos

El sistema incluye un script automatizado para importar datos de tormentas tropicales:

```bash
# Navegar al directorio de data ingestion
cd fastapi-react/data_ingestion

# Ejecutar el script de importación
python importar_datos.py
```

**¿Qué hace este script?**

- Se conecta a MongoDB (`mongodb://localhost:27017/`)
- Procesa todos los snapshots en la carpeta `datos/`
- Importa archivos JSON de `info_generada/` a la base de datos `meteorologia_db`
- Almacena los datos en la colección `eventos`
- Maneja snapshots históricos con timestamps únicos

**Estructura de datos esperada:**

```
datos/
├── 2025-10-11_21-43-38/          # Snapshot por fecha
│   ├── info_generada/            # Datos JSON
│   │   ├── Info_AL102025.json   # Datos de tormenta
│   │   └── Info_EP172025.json
│   └── mapas_generados/          # Imágenes de mapas
│       ├── Forecast_AL102025.png
│       └── Modelos_AL102025.png
```

## 🌐 API Endpoints

### Base URL: `http://localhost:8000`

| Método | Endpoint                                 | Descripción                               | Parámetros                     |
| ------ | ---------------------------------------- | ----------------------------------------- | ------------------------------ |
| `GET`  | `/`                                      | Mensaje de bienvenida                     | -                              |
| `GET`  | `/api/events/all`                        | Obtener todos los snapshots de eventos    | -                              |
| `GET`  | `/api/events/unique`                     | Obtener lista de eventos únicos           | -                              |
| `GET`  | `/api/events/history/{event_id}`         | Obtener historial de un evento específico | `event_id` (string)            |
| `GET`  | `/api/maps/{snapshot}/{type}/{filename}` | Servir imágenes de mapas                  | `snapshot`, `type`, `filename` |

### Ejemplos de uso:

#### Obtener todos los eventos

```bash
curl http://localhost:8000/api/events/all
```

#### Obtener eventos únicos

```bash
curl http://localhost:8000/api/events/unique
```

#### Obtener historial de un evento específico

```bash
curl http://localhost:8000/api/events/history/EP912025
```

#### Acceder a documentación interactiva

Visitar: `http://localhost:8000/docs` (Swagger UI automático)

## 🚀 Ejecución del Sistema

### Orden de ejecución recomendado:

1. **MongoDB** → Asegúrate de que esté corriendo

   ```bash
   # Verificar estado
   brew services list | grep mongo
   # O iniciar si es necesario
   brew services start mongodb-community
   ```

2. **Importar datos** → Ejecutar script de importación

   ```bash
   cd fastapi-react/data_ingestion
   python importar_datos.py
   ```

3. **Backend** → Iniciar servidor API

   ```bash
   cd fastapi-react/backend
   python main.py
   ```

4. **Frontend** → Iniciar aplicación web
   ```bash
   cd fastapi-react/EquipoBellaKat
   npm run dev
   ```

### URLs de acceso:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs
- **MongoDB**: mongodb://localhost:27017/meteorologia_db

## 📊 Estructura de Datos

### Base de datos: `meteorologia_db`

### Colección: `eventos`

**Campos principales:**

- `_id`: Identificador único del snapshot
- `id`: ID de la tormenta (ej: "EP912025", "AL102025")
- `name`: Nombre de la tormenta
- `snapshot_timestamp`: Fecha y hora del snapshot
- `images`: URLs de mapas asociados
  - `model`: URL del mapa de modelos
  - `forecast`: URL del mapa de pronósticos
- Otros campos meteorológicos específicos

## 🔧 Scripts Disponibles

### Frontend

```bash
npm run dev      # Ejecutar en modo desarrollo
npm run build    # Construir para producción
npm run preview  # Vista previa de la construcción
npm run lint     # Ejecutar linter
```

### Backend

```bash
python main.py   # Ejecutar servidor de desarrollo
```

### Data Ingestion

```bash
python importar_datos.py  # Importar datos a MongoDB
```

## 🐛 Troubleshooting

### Problemas comunes:

#### 1. Error "Connection refused" en MongoDB

```bash
# Verificar que MongoDB esté corriendo
brew services list | grep mongo

# Iniciar MongoDB si no está corriendo
brew services start mongodb-community

# Verificar puerto
lsof -i :27017
```

#### 2. Error de dependencias de Python

```bash
# Asegúrate de estar en el entorno virtual
source venv/bin/activate

# Reinstalar dependencias
pip install -r requirements.txt
```

#### 3. Error de dependencias de Node.js

```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

#### 4. CORS errors en el frontend

- Verificar que el backend esté corriendo en puerto 8000
- Verificar configuración CORS en `api.py`

## 📈 Funcionalidades del Sistema

### Backend

- **API RESTful** completa para datos meteorológicos
- **Conexión a MongoDB** con manejo de errores
- **Servicio de archivos estáticos** para mapas
- **CORS configurado** para desarrollo
- **Documentación automática** con Swagger UI
- **Parsing inteligente** de datos MongoDB

### Frontend

- **Interfaz moderna** con Chakra UI
- **Componentes modulares** y reutilizables
- **TypeScript** para tipado fuerte
- **Diseño responsivo** adaptable
- **Integración con API** backend

### Data Pipeline

- **Importación automática** de datos meteorológicos
- **Manejo de snapshots** históricos
- **Detección automática** de mapas asociados
- **Upsert inteligente** para evitar duplicados
- **Logging detallado** del proceso

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Notas de Desarrollo

- **Datos meteorológicos**: El sistema procesa datos de tormentas tropicales del Pacífico y Atlántico
- **Snapshots temporales**: Cada snapshot representa un momento específico en el tiempo
- **Mapas asociados**: Los mapas se vinculan automáticamente a los eventos
- **Escalabilidad**: La arquitectura está diseñada para manejar grandes volúmenes de datos

## 🔄 Próximos Pasos

- [ ] Implementar autenticación y autorización
- [ ] Agregar más tipos de visualizaciones
- [ ] Implementar notificaciones en tiempo real
- [ ] Optimizar consultas de base de datos
- [ ] Agregar tests automatizados
- [ ] Implementar cache para mejor rendimiento

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**Desarrollado con ❤️ por EquipoBellaKat**

_Sistema de datos meteorológicos para el análisis y visualización de tormentas tropicales_
