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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Operation, Plantation, operationService, plantationService } from '../services/api';

const Operations = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Partial<Operation> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [operationsRes, plantationsRes] = await Promise.all([
        operationService.getAll(),
        plantationService.getAll(),
      ]);
      
      if (Array.isArray(operationsRes.data)) {
        setOperations(operationsRes.data);
      } else {
        setOperations([]);
        console.error('Les données des opérations ne sont pas un tableau:', operationsRes.data);
      }
      
      if (Array.isArray(plantationsRes.data)) {
        setPlantations(plantationsRes.data);
      } else {
        setPlantations([]);
        console.error('Les données des plantations ne sont pas un tableau:', plantationsRes.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setOperations([]);
      setPlantations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = (operation?: Operation) => {
    setSelectedOperation(operation || {});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedOperation(null);
    setOpenDialog(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (selectedOperation?.id) {
        await operationService.update(selectedOperation.id, selectedOperation);
      } else {
        await operationService.create(selectedOperation as Omit<Operation, 'id'>);
      }
      loadData();
      handleCloseDialog();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
      try {
        await operationService.delete(id);
        loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'plantation',
      headerName: 'Plantation',
      flex: 1,
      valueGetter: (params) => {
        const plantation = plantations.find(p => p.id === params.row.plantation);
        return plantation?.nom || '';
      },
    },
    { field: 'type_operation', headerName: 'Type d\'opération', flex: 1 },
    {
      field: 'date',
      headerName: 'Date',
      flex: 1,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('fr-FR'),
    },
    { field: 'description', headerName: 'Description', flex: 2 },
    {
      field: 'cout',
      headerName: 'Coût',
      flex: 1,
      valueFormatter: (params) => `${params.value.toLocaleString('fr-FR')} €`,
    },
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
          Opérations
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouvelle Opération
        </Button>
      </Box>

      <Paper sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
        <DataGrid
          rows={operations}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
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
          {selectedOperation?.id ? 'Modifier l\'opération' : 'Nouvelle opération'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="dense">
              <InputLabel>Plantation</InputLabel>
              <Select
                value={selectedOperation?.plantation || ''}
                onChange={(e) => setSelectedOperation({
                  ...selectedOperation,
                  plantation: e.target.value as number,
                })}
                required
              >
                {Array.isArray(plantations) && plantations.map((plantation) => (
                  <MenuItem key={plantation.id} value={plantation.id}>
                    {plantation.nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Type d'opération</InputLabel>
              <Select
                value={selectedOperation?.type_operation || ''}
                onChange={(e) => setSelectedOperation({
                  ...selectedOperation,
                  type_operation: e.target.value,
                })}
                required
              >
                <MenuItem value="ABATTAGE">Abattage</MenuItem>
                <MenuItem value="DEFRICHAGE">Défrichage</MenuItem>
                <MenuItem value="PIQUETAGE">Piquetage</MenuItem>
                <MenuItem value="PLANTATION">Plantation</MenuItem>
                <MenuItem value="ENTRETIEN">Entretien</MenuItem>
                <MenuItem value="RECOLTE">Récolte</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Date"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={selectedOperation?.date || ''}
              onChange={(e) => setSelectedOperation({
                ...selectedOperation,
                date: e.target.value,
              })}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={selectedOperation?.description || ''}
              onChange={(e) => setSelectedOperation({
                ...selectedOperation,
                description: e.target.value,
              })}
            />
            <TextField
              margin="dense"
              label="Coût (€)"
              type="number"
              fullWidth
              required
              value={selectedOperation?.cout || ''}
              onChange={(e) => setSelectedOperation({
                ...selectedOperation,
                cout: parseFloat(e.target.value),
              })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedOperation?.id ? 'Modifier' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Operations; 