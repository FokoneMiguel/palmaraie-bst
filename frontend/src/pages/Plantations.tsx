import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { Plantation, plantationService } from '../services/api';

const Plantations = () => {
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPlantation, setSelectedPlantation] = useState<Partial<Plantation> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPlantations = async () => {
    try {
      const response = await plantationService.getAll();
      if (Array.isArray(response.data)) {
        setPlantations(response.data);
      } else {
        console.error('Les données reçues ne sont pas un tableau:', response.data);
        setPlantations([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des plantations:', error);
      setPlantations([]);
    }
  };

  useEffect(() => {
    loadPlantations();
  }, []);

  const handleOpenDialog = (plantation?: Plantation) => {
    setSelectedPlantation(plantation || {});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedPlantation(null);
    setOpenDialog(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPlantation) return;

    const { nom, superficie, date_plantation, nombre_arbres, localisation } = selectedPlantation;
    
    // Validation des champs requis
    if (!nom || !superficie || !date_plantation || !nombre_arbres || !localisation) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      const plantationData = {
        nom: nom.trim(),
        superficie: parseFloat(superficie.toString()),
        date_plantation: date_plantation,
        nombre_arbres: parseInt(nombre_arbres.toString()),
        localisation: localisation.trim(),
        description: selectedPlantation.description?.trim() || ''
      };

      if (selectedPlantation.id) {
        await plantationService.update(selectedPlantation.id, plantationData);
      } else {
        await plantationService.create(plantationData);
      }
      
      await loadPlantations();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      if (error.response?.data) {
        // Afficher les erreurs spécifiques du serveur
        const errors = Object.entries(error.response.data)
          .map(([field, messages]) => `${field}: ${messages}`)
          .join('\n');
        alert(`Erreurs de validation:\n${errors}`);
      } else {
        alert('Une erreur est survenue lors de la sauvegarde');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette plantation ?')) {
      try {
        await plantationService.delete(id);
        loadPlantations();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const columns: GridColDef[] = [
    { field: 'nom', headerName: 'Nom', flex: 1 },
    { 
      field: 'superficie',
      headerName: 'Superficie (ha)',
      flex: 1,
      valueFormatter: (params) => `${params.value} ha`
    },
    {
      field: 'date_plantation',
      headerName: 'Date de plantation',
      flex: 1,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('fr-FR')
    },
    {
      field: 'nombre_arbres',
      headerName: 'Nombre d\'arbres',
      flex: 1,
      valueFormatter: (params) => params.value.toLocaleString('fr-FR')
    },
    { field: 'localisation', headerName: 'Localisation', flex: 1 },
    { field: 'description', headerName: 'Description', flex: 2 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Modifier">
            <IconButton onClick={() => handleOpenDialog(params.row)}>
              <EditIcon color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Statistiques">
            <IconButton onClick={() => console.log('Statistiques:', params.row.id)}>
              <AssessmentIcon color="info" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton onClick={() => handleDelete(params.row.id)}>
              <DeleteIcon color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Plantations
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouvelle Plantation
        </Button>
      </Box>

      <Paper sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
        <DataGrid
          rows={plantations}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
          sx={{
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              borderBottom: '2px solid #e0e0e0',
            },
          }}
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedPlantation?.id ? 'Modifier la plantation' : 'Nouvelle plantation'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nom"
              fullWidth
              required
              value={selectedPlantation?.nom || ''}
              onChange={(e) => setSelectedPlantation({ ...selectedPlantation, nom: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Superficie (ha)"
              type="number"
              fullWidth
              required
              value={selectedPlantation?.superficie || ''}
              onChange={(e) => setSelectedPlantation({ ...selectedPlantation, superficie: parseFloat(e.target.value) })}
            />
            <TextField
              margin="dense"
              label="Nombre d'arbres"
              type="number"
              fullWidth
              required
              value={selectedPlantation?.nombre_arbres || ''}
              onChange={(e) => setSelectedPlantation({ ...selectedPlantation, nombre_arbres: parseInt(e.target.value) })}
            />
            <TextField
              margin="dense"
              label="Localisation"
              fullWidth
              required
              value={selectedPlantation?.localisation || ''}
              onChange={(e) => setSelectedPlantation({ ...selectedPlantation, localisation: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Date de plantation"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={selectedPlantation?.date_plantation || ''}
              onChange={(e) => setSelectedPlantation({ ...selectedPlantation, date_plantation: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={selectedPlantation?.description || ''}
              onChange={(e) => setSelectedPlantation({ ...selectedPlantation, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedPlantation?.id ? 'Modifier' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Plantations; 