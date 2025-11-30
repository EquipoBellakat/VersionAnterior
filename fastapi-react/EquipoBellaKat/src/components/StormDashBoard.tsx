import { useState, useEffect } from "react";
import { Box, Text, Spinner, Image } from "@chakra-ui/react";
import styles from "./StormDashBoard.module.css";
import { Calendar } from "./Calendar";
import { LogosBar } from "./LogosBar";
import { InteractivePredictionMap } from "./InteractivePredictionMap";

// --- Interfaces ---
interface UniqueStorm {
  id: string;
  name: string;
}
interface HistoryPoint {
  time: string;
  lat: number;
  lon: number;
  vmax: number;
  mslp: number;
  type: string;
}
interface FormationProb {
  prob_2day: string;
  risk_2day: string;
  prob_7day: string;
  risk_7day: string;
}
interface FullStormData {
  _id: string;
  id: string;
  name: string;
  snapshot_timestamp: string;
  history?: HistoryPoint[];
  realtime_formation_prob?: FormationProb;
  images: {
    // <-- Ahora es un objeto
    model: string | null;
    forecast: string | null;
  };
}

interface PredictionData {
  success: boolean;
  storm_id: string;
  history?: HistoryPoint[];  // Historial para el mapa interactivo
  predictions: Array<{
    step: number;
    lat: number;
    lon: number;
    time: string;
  }>;
  image_path: string;
  message: string;
}

export const StormDashboard = () => {
  const [stormList, setStormList] = useState<UniqueStorm[]>([]);
  const [selectedStormId, setSelectedStormId] = useState<string>("");
  const [stormHistory, setStormHistory] = useState<FullStormData[]>([]);
  const [selectedHistoryPoint, setSelectedHistoryPoint] =
    useState<HistoryPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [generatingPrediction, setGeneratingPrediction] = useState(false);

  useEffect(() => {
    const fetchUniqueStorms = async () => {
      try {
      const response = await fetch("http://localhost:8000/api/events/unique");
      const data = await response.json();
        setStormList(data);
      } catch (error) {
        console.error("Error fetching storms:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchUniqueStorms();
  }, []);

  useEffect(() => {
    if (!selectedStormId) return;

    const fetchStormHistory = async () => {
      setLoading(true); // <-- Usando setLoading
      setStormHistory([]);
      setSelectedHistoryPoint(null);

      const response = await fetch(
        `http://localhost:8000/api/events/history/${selectedStormId}`
      );
      const historySnapshots: FullStormData[] = await response.json();

      setStormHistory(historySnapshots); // <-- Usando setStormHistory

      const mostRecentData = historySnapshots[historySnapshots.length - 1];
      if (mostRecentData.history && mostRecentData.history.length > 0) {
        setSelectedHistoryPoint(
          mostRecentData.history[mostRecentData.history.length - 1]
        ); // <-- Usando setSelectedHistoryPoint
      }

      setLoading(false); // <-- Usando setLoading
    };
    fetchStormHistory();
  }, [selectedStormId]);

  const handleStormSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStormId(event.target.value); // <-- Usando setSelectedStormId y event
  };

  const handleReset = () => {
    setSelectedStormId("");
    setStormHistory([]);
    setSelectedHistoryPoint(null);
    setPredictionData(null);
  };

  const handleGeneratePrediction = async () => {
    if (!selectedStormId) return;
    
    setGeneratingPrediction(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/predictions/generate/${selectedStormId}?horas=48`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
        throw new Error(errorData.detail || 'Error al generar la predicción');
      }
      
      const data: PredictionData = await response.json();
      setPredictionData(data);
    } catch (error) {
      console.error("Error generando predicción:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error al generar la predicción';
      alert(`Error al generar la predicción: ${errorMessage}`);
    } finally {
      setGeneratingPrediction(false);
    }
  };

  const handleDateSelect = (selectedTime: string) => {
    // Buscar el snapshot que contiene este punto de historial
    let foundPoint: HistoryPoint | null = null;
    let foundSnapshot: FullStormData | null = null;

    for (const snapshot of stormHistory) {
      if (snapshot.history) {
        const point = snapshot.history.find((p) => p.time === selectedTime);
        if (point) {
          foundPoint = point;
          foundSnapshot = snapshot;
          break;
        }
      }
    }

    setSelectedHistoryPoint(foundPoint);
  };

  // Encontrar el snapshot que corresponde a la fecha seleccionada
  const getSnapshotForSelectedDate = (): FullStormData | null => {
    if (!selectedHistoryPoint) {
      // Si no hay fecha seleccionada, usar el más reciente
      return stormHistory.length > 0 ? stormHistory[stormHistory.length - 1] : null;
    }

    // Buscar el snapshot que contiene el punto seleccionado
    for (const snapshot of stormHistory) {
      if (snapshot.history) {
        const point = snapshot.history.find((p) => p.time === selectedHistoryPoint.time);
        if (point) {
          return snapshot;
        }
      }
    }

    // Fallback: usar el más reciente
    return stormHistory.length > 0 ? stormHistory[stormHistory.length - 1] : null;
  };

  const mostRecentData =
    stormHistory.length > 0 ? stormHistory[stormHistory.length - 1] : null;
  const selectedSnapshot = getSnapshotForSelectedDate();
  const displayData = selectedSnapshot || mostRecentData;
  const fechaInicio = mostRecentData?.history?.[0]?.time;
  const fechaFin =
    mostRecentData?.history?.[mostRecentData.history.length - 1]?.time;

  return (
    <Box width="100%" maxWidth="100vw" overflowX="hidden" px={{ base: 2, md: 4 }} py={{ base: 2, md: 4 }}>
      <Box className={styles.mainPanel}>
        <Box className={styles.stormSelectorContainer}>
          <Box className={styles.stormSelectorWrapper}>
            <Box className={styles.selectorIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2 L2 7 L12 12 L22 7 L12 2 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17 L12 22 L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12 L12 17 L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
        <select
              className={styles.stormSelect}
          onChange={handleStormSelect}
              value={selectedStormId}
        >
          <option value="" disabled>
            Selecciona una tormenta
          </option>
          {stormList.map((storm) => (
            <option key={storm.id} value={storm.id}>
              {storm.name} ({storm.id})
            </option>
          ))}
        </select>
            {selectedStormId && (
              <button
                className={styles.resetButton}
                onClick={handleReset}
                title="Volver a la página principal"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 1.5 L1.5 9 L9 16.5 M1.5 9 L16.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </Box>
        </Box>
      </Box>

      {initialLoading ? (
        <Box className={styles.welcomeContainer}>
          <Box className={styles.loadingAnimation}>
            <Box className={styles.loadingSpinner}></Box>
          </Box>
          <Text className={styles.welcomeTitle}>
            Sistema de Monitoreo de Tormentas
          </Text>
          <Text className={styles.welcomeSubtitle}>
            Cargando datos meteorológicos...
          </Text>
        </Box>
      ) : !selectedStormId && !mostRecentData ? (
        <>
          <Box className={styles.welcomeContainer}>
            <Box className={styles.welcomeContent}>
              <Box className={styles.welcomeHeader}>
                <Text className={styles.welcomeTitleLine1}>EL MONITOREO DE</Text>
                <Text className={styles.welcomeTitleLine2}>LOS AGENTES</Text>
                <Text className={styles.welcomeTitleLine3}>CLIMATOLÓGICOS</Text>
              </Box>
              <Text className={styles.welcomeSubtitle}>
                Selecciona una tormenta del menú superior para comenzar el análisis
              </Text>
              <LogosBar />
              <Box className={styles.welcomeInfoGrid}>
              <Box className={styles.welcomeInfoCard}>
                <Box className={styles.infoCardIcon}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="6" width="24" height="20" rx="2" stroke="#2A3C65" strokeWidth="2" fill="none"/>
                    <path d="M4 12 L28 12" stroke="#2A3C65" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 18 L16 18" stroke="#2A3C65" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 22 L20 22" stroke="#2A3C65" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="24" cy="10" r="2" fill="#D7CC9D"/>
                  </svg>
                </Box>
                <Text className={styles.infoCardTitle}>Análisis en Tiempo Real</Text>
                <Text className={styles.infoCardText}>
                  Datos meteorológicos actualizados con información precisa de intensidad y trayectoria
                </Text>
              </Box>
              <Box className={styles.welcomeInfoCard}>
                <Box className={styles.infoCardIcon}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" stroke="#2A3C65" strokeWidth="2" fill="none"/>
                    <path d="M16 8 L16 16 L20 20" stroke="#2A3C65" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 16 L24 16" stroke="#2A3C65" strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/>
                    <path d="M16 8 L16 24" stroke="#2A3C65" strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/>
                    <circle cx="16" cy="16" r="2" fill="#D7CC9D"/>
                  </svg>
                </Box>
                <Text className={styles.infoCardTitle}>Mapas de Trayectoria</Text>
                <Text className={styles.infoCardText}>
                  Visualización detallada de rutas proyectadas y modelos de pronóstico
                </Text>
              </Box>
              <Box className={styles.welcomeInfoCard}>
                <Box className={styles.infoCardIcon}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="8" width="20" height="18" rx="2" stroke="#2A3C65" strokeWidth="2" fill="none"/>
                    <path d="M6 14 L26 14" stroke="#2A3C65" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="19" r="2" fill="#2A3C65"/>
                    <circle cx="16" cy="19" r="2" fill="#2A3C65"/>
                    <circle cx="20" cy="19" r="2" fill="#2A3C65"/>
                    <path d="M10 10 L10 12" stroke="#D7CC9D" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M14 10 L14 12" stroke="#D7CC9D" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M18 10 L18 12" stroke="#D7CC9D" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </Box>
                <Text className={styles.infoCardTitle}>Historial Completo</Text>
                <Text className={styles.infoCardText}>
                  Registro histórico completo con acceso a datos de fechas y horas específicas
                </Text>
              </Box>
              </Box>
            </Box>
          </Box>
        </>
      ) : loading ? (
        <Box className={styles.loadingContainer}>
          <Box className={styles.loadingSpinner}></Box>
          <Text className={styles.loadingText}>Cargando datos de la tormenta...</Text>
        </Box>
      ) : mostRecentData ? (
        <Box className={styles.dashboardWrapper}>
          <Box className={styles.stormHeader}>
            <Box className={styles.stormHeaderContent}>
              <Box className={styles.stormHeaderIcon}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2 L2 7 L14 12 L26 7 L14 2 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17 L14 22 L26 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12 L14 17 L26 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Box>
              <Box className={styles.stormHeaderText}>
                <Text className={styles.stormName}>{mostRecentData.name}</Text>
                <Text className={styles.stormId}>({mostRecentData.id})</Text>
              </Box>
            </Box>
          </Box>
        <Box className={styles.dashboardContainer}>
          {mostRecentData.history && mostRecentData.history.length > 0 ? (
            // --- VISTA PARA TORMENTAS CON HISTORIAL DE TRAYECTORIA ---
            <>
              <Box display="flex" flexDirection="column" gap="2rem">
                <Box className={styles.mapPlaceholder}>
                    {displayData?.images.model ? (
                    <Image
                        src={`http://localhost:8000${displayData.images.model}`}
                      alt="Mapa de la tormenta"
                      objectFit="contain"
                      maxHeight="100%"
                        width="100%"
                        height="auto"
                    />
                  ) : (
                      <Text className={styles.mapPlaceholderText}>MAPA (MODEL)</Text>
                  )}
                </Box>
                <Calendar
                  historyPoints={mostRecentData.history || []}
                  selectedDate={selectedHistoryPoint?.time || null}
                  onDateSelect={handleDateSelect}
                />
              </Box>
              <Box display="flex" flexDirection="column" gap="2rem">
                <Box className={styles.mapPlaceholder}>
                    {displayData?.images.forecast ? (
                    <Image
                        src={`http://localhost:8000${displayData.images.forecast}`}
                      alt="Mapa de forecast"
                      objectFit="contain"
                      maxHeight="100%"
                        width="100%"
                        height="auto"
                    />
                  ) : (
                      <Text className={styles.mapPlaceholderText}>MAPA (FORECAST NO DISPONIBLE)</Text>
                  )}
                </Box>
                <Box className={styles.predictionSection}>
                  <Box className={styles.predictionHeader}>
                    <Text className={styles.predictionTitle}>PREDICCIÓN DE MOVIMIENTO</Text>
                    <button
                      className={styles.generateButton}
                      onClick={handleGeneratePrediction}
                      disabled={generatingPrediction}
                    >
                      {generatingPrediction ? (
                        <>
                          <Spinner size="sm" mr={2} />
                          Generando...
                        </>
                      ) : (
                        "Generar Predicción (48h)"
                      )}
                    </button>
                  </Box>
                  {predictionData && (
                    <Box className={styles.predictionContent}>
                      <Box className={styles.mapPlaceholder} style={{ padding: 0 }}>
                        <InteractivePredictionMap
                          history={predictionData.history}
                          predictions={predictionData.predictions}
                          stormId={predictionData.storm_id}
                        />
                      </Box>
                      <Text className={styles.predictionInfo}>
                        {predictionData.message}
                      </Text>
                    </Box>
                  )}
                </Box>
                  <Box className={styles.dataSection}>
                    <Text className={styles.dataSectionTitle}>
                      DATOS DE LA TORMENTA
                    </Text>
                    <Box className={styles.dataGroup}>
                      <Box className={styles.dataRow}>
                        <Text className={styles.dataLabel}>ID:</Text>
                        <Text className={styles.dataValue}>{mostRecentData.id}</Text>
                      </Box>
                      <Box className={styles.dataRow}>
                        <Text className={styles.dataLabel}>NOMBRE:</Text>
                        <Text className={styles.dataValue}>{mostRecentData.name}</Text>
                      </Box>
                      <Box className={styles.dataRow}>
                        <Text className={styles.dataLabel}>FECHA DE INICIO:</Text>
                        <Text className={styles.dataValue}>
                          {fechaInicio ? new Date(fechaInicio).toLocaleString() : "N/A"}
                        </Text>
                      </Box>
                      <Box className={styles.dataRow}>
                        <Text className={styles.dataLabel}>FECHA DE FIN:</Text>
                        <Text className={styles.dataValue}>
                          {fechaFin ? new Date(fechaFin).toLocaleString() : "N/A"}
                        </Text>
                      </Box>
                      {selectedHistoryPoint && (
                        <>
                          <Box className={styles.dataDivider}></Box>
                          <Box className={styles.dataRow}>
                            <Text className={styles.dataLabel}>FECHA (seleccionada):</Text>
                            <Text className={styles.dataValue}>
                              {new Date(selectedHistoryPoint.time).toLocaleString()}
                            </Text>
                          </Box>
                          <Box className={styles.dataRow}>
                            <Text className={styles.dataLabel}>LATITUD:</Text>
                            <Text className={styles.dataValue}>{selectedHistoryPoint.lat}</Text>
                          </Box>
                          <Box className={styles.dataRow}>
                            <Text className={styles.dataLabel}>LONGITUD:</Text>
                            <Text className={styles.dataValue}>{selectedHistoryPoint.lon}</Text>
                          </Box>
                          <Box className={styles.dataRow}>
                            <Text className={styles.dataLabel}>VELOCIDAD MÁX (histórica):</Text>
                            <Text className={styles.dataValue}>
                              {mostRecentData.history.reduce(
                                (max, p) => (p.vmax > max ? p.vmax : max),
                                0
                              )}{" "}
                              kts
                            </Text>
                          </Box>
                          <Box className={styles.dataRow}>
                            <Text className={styles.dataLabel}>VELOCIDAD MÁX (actual):</Text>
                            <Text className={styles.dataValue}>{selectedHistoryPoint.vmax} kts</Text>
                          </Box>
                          <Box className={styles.dataRow}>
                            <Text className={styles.dataLabel}>TIPO:</Text>
                            <Text className={styles.dataValue}>{selectedHistoryPoint.type}</Text>
                          </Box>
                          <Box className={styles.dataRow}>
                            <Text className={styles.dataLabel}>MSLP:</Text>
                            <Text className={styles.dataValue}>{selectedHistoryPoint.mslp} hPa</Text>
                          </Box>
                          <Box className={styles.dataDivider}></Box>
                          <Box className={styles.dataRow}>
                            <Text className={styles.dataLabel}>HORA:</Text>
                            <select
                              className={styles.timeSelectInline}
                              value={selectedHistoryPoint.time}
                              onChange={(e) => handleDateSelect(e.target.value)}
                            >
                              {(() => {
                                const selectedDate = new Date(selectedHistoryPoint.time);
                                const dayKey = `${selectedDate.getFullYear()}-${String(
                                  selectedDate.getMonth() + 1
                                ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
                                
                                const hoursForDay = (mostRecentData.history || [])
                                  .filter((point) => {
                                    const pointDate = new Date(point.time);
                                    const pointDayKey = `${pointDate.getFullYear()}-${String(
                                      pointDate.getMonth() + 1
                                    ).padStart(2, "0")}-${String(pointDate.getDate()).padStart(2, "0")}`;
                                    return pointDayKey === dayKey;
                                  })
                                  .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

                                return hoursForDay.map((point) => {
                                  const date = new Date(point.time);
                                  const timeString = date.toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  });
                                  return (
                                    <option key={point.time} value={point.time}>
                                      {timeString}
                                    </option>
                                  );
                                });
                              })()}
                            </select>
                          </Box>
                        </>
                      )}
                      {!selectedHistoryPoint && (
                        <>
                          <Box className={styles.dataDivider}></Box>
                          <Box className={styles.dataRow}>
                            <Text className={styles.dataLabel}>VELOCIDAD MÁX (histórica):</Text>
                            <Text className={styles.dataValue}>
                              {mostRecentData.history.reduce(
                                (max, p) => (p.vmax > max ? p.vmax : max),
                                0
                              )}{" "}
                              kts
                            </Text>
                          </Box>
                        </>
                      )}
                    </Box>
                  </Box>
              </Box>
            </>
          ) : (
            // --- VISTA PARA ÁREAS DE INVESTIGACIÓN ---
            <Box
              gridColumn="1 / -1"
              display="flex"
              flexDirection="column"
              gap="1rem"
            >
                <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold" color="#1f2937">
                Historial de Investigación: {mostRecentData.name} (
                {mostRecentData.id})
              </Text>
              <Box className={styles.dataGroup}>
                  <Text fontWeight="bold" mb={2} color="#1f2937">
                  Evolución de Probabilidad de Formación
                </Text>
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>Fecha del Reporte</th>
                      <th>Prob. 2 Días</th>
                      <th>Prob. 7 Días</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stormHistory.map((snapshot) => (
                      <tr key={snapshot._id}>
                        <td>
                          {new Date(
                            snapshot.snapshot_timestamp
                          ).toLocaleString()}
                        </td>
                        <td>
                          {snapshot.realtime_formation_prob?.prob_2day ?? "N/A"}
                        </td>
                        <td>
                          {snapshot.realtime_formation_prob?.prob_7day ?? "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}
        </Box>
        </Box>
      ) : null}
    </Box>
  );
};
