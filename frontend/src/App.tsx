import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Plantations from './pages/Plantations';
import Operations from './pages/Operations';
import Productions from './pages/Productions';
import Ventes from './pages/Ventes';
import MouvementsCaisse from './pages/MouvementsCaisse';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plantations" element={<Plantations />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/productions" element={<Productions />} />
          <Route path="/ventes" element={<Ventes />} />
          <Route path="/mouvements-caisse" element={<MouvementsCaisse />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App; 