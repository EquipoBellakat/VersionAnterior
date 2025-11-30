import { ChakraProvider, Box  } from "@chakra-ui/react";
import { defaultSystem } from "@chakra-ui/react";
//import Header from "./components/Header";
//import Todos from "./components/Todos"; // new
//import { Eventos } from "./components/Eventos";
import { StormDashboard } from "./components/StormDashBoard";

function App() {
  return (
    <ChakraProvider value={defaultSystem}>
      
      {/*
      <Header />
      
      <Todos />   
      
      */}

      <Box as="main" width="100%" maxWidth="100vw" overflowX="hidden">
        {/*
      <Eventos />    
      
      */}
      <StormDashboard />  
      </Box>
    </ChakraProvider>
  );
}

export default App;
