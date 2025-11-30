import { Box, Image } from "@chakra-ui/react";
import styles from "./LogosBar.module.css";

// Importar las imágenes de los logos
import semarLogo from "../assets/logos/semar.png";
import noaaLogo from "../assets/logos/noaa.png";
import gobiernoLogo from "../assets/logos/gobierno.png";

export const LogosBar = () => {
  const logos = [
    {
      image: semarLogo,
      alt: "Logo SEMAR",
    },
    {
      image: noaaLogo,
      alt: "Logo NOAA",
    },
    {
      image: gobiernoLogo,
      alt: "Logo Gobierno de México",
    },
  ];

  // Duplicar los logos múltiples veces para crear un loop infinito suave
  const duplicatedLogos = [...logos, ...logos, ...logos, ...logos, ...logos];

  return (
    <Box className={styles.logosBarContainer}>
      <Box className={styles.logosBar}>
        <Box className={styles.logosTrack}>
          {duplicatedLogos.map((logo, index) => (
            <Box key={index} className={styles.logoItem}>
              <Image
                src={logo.image}
                alt={logo.alt}
                className={styles.logoImage}
                objectFit="contain"
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

