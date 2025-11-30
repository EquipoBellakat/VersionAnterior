// src/components/Eventos.tsx

import { useState, useEffect } from 'react';
import { Box, Heading, Text, Spinner } from '@chakra-ui/react';
import { MdCheckCircle } from 'react-icons/md';

import styles from './Eventos.module.css'; 

// Definimos la interfaz para nuestros datos
interface Evento {
  _id: string;
  id: string;
  name: string;
  snapshot_timestamp: string;
}

export const Eventos = () => {
  // ... (Toda la lógica de useState, useEffect, cargando y error sigue exactamente igual)
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/events/all');
        if (!response.ok) {
          throw new Error('Error al conectar con la API');
        }
        const data: Evento[] = await response.json();
        setEventos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
      } finally {
        setCargando(false);
      }
    };
    fetchEventos();
  }, []);

  if (cargando) {
    return (
      <Box textAlign="center" mt={10}>
        <Spinner size="xl" />
        <Text mt={4}>Cargando datos históricos...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" color="red.500" mt={10}>
        <Heading>Error</Heading>
        <Text>{error}</Text>
      </Box>
    );
  }

  // --- AQUÍ USAMOS LOS ESTILOS DEL MÓDULO ---
  return (
    <Box p={8} bg="#f9fafb" minH="100vh">
      <Heading 
        as="h2" 
        fontSize="1.25rem" 
        fontWeight="600" 
        color="#1f2937" 
        mb={6}
        textTransform="uppercase"
        letterSpacing="0.05em"
      >
        Historial de Snapshots de Eventos
      </Heading>
      <div className={styles.listContainer}>
        {eventos.map((evento) => (
          <div key={evento._id} className={styles.item}>
            <MdCheckCircle className={styles.icon} />
            <Text fontSize="0.875rem" color="#374151" lineHeight="1.5">
              <Text as="span" fontWeight="600" color="#1f2937">
                {evento.name} ({evento.id})
              </Text>
              {" "}- Snapshot del: {new Date(evento.snapshot_timestamp).toLocaleString()}
            </Text>
          </div>
        ))}
      </div>
    </Box>
  );
};