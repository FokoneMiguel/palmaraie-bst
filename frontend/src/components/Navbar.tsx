import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box
} from '@mui/material';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Palmaraie BST
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            Dashboard
          </Button>
          <Button color="inherit" component={RouterLink} to="/plantations">
            Plantations
          </Button>
          <Button color="inherit" component={RouterLink} to="/operations">
            Opérations
          </Button>
          <Button color="inherit" component={RouterLink} to="/productions">
            Productions
          </Button>
          <Button color="inherit" component={RouterLink} to="/ventes">
            Ventes
          </Button>
          <Button color="inherit" component={RouterLink} to="/mouvements-caisse">
            Caisse
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 