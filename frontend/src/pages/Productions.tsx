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
  Grid,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Production, Plantation, productionService, plantationService } from '../services/api';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const Productions = () => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<Partial<Production> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statistiques, setStatistiques] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productionsRes, plantationsRes, statsRes] = await Promise.all([
        productionService.getAll(),
        plantationService.getAll(),
        productionService.getStatistiquesGlobales(),
      ]);

      if (Array.isArray(productionsRes.data)) {
        setProductions(productionsRes.data);
      } else {
        setProductions([]);
        console.error('Les données de production ne sont pas un tableau:', productionsRes.data);
      }

      if (Array.isArray(plantationsRes.data)) {
        setPlantations(plantationsRes.data);
      } else {
        setPlantations([]);
        console.error('Les données de plantation ne sont pas un tableau:', plantationsRes.data);
      }

      setStatistiques(statsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setProductions([]);
      setPlantations([]);
      setStatistiques(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = (production?: Production) => {
    setSelectedProduction(production || {});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedProduction(null);
    setOpenDialog(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProduction) return;

    const { plantation, date_recolte, quantite, poids_total, qualite } = selectedProduction;

    if (!plantation || !date_recolte || !quantite || !poids_total || !qualite) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      if (selectedProduction.id) {
        await productionService.update(selectedProduction.id, selectedProduction);
      } else {
        await productionService.create({
          plantation,
          date_recolte,
          quantite,
          poids_total,
          qualite,
          stock_disponible: poids_total
        });
      }
      await loadData();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(error.response?.data?.detail || 'Une erreur est survenue lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette production ?')) {
      try {
        await productionService.delete(id);
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
    {
      field: 'date_recolte',
      headerName: 'Date de récolte',
      flex: 1,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('fr-FR'),
    },
    {
      field: 'quantite',
      headerName: 'Nombre de régimes',
      flex: 1,
      valueFormatter: (params) => params.value.toLocaleString('fr-FR'),
    },
    {
      field: 'poids_total',
      headerName: 'Poids total (kg)',
      flex: 1,
      valueFormatter: (params) => `${params.value.toLocaleString('fr-FR')} kg`,
    },
    { field: 'qualite', headerName: 'Qualité', flex: 1 },
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

  // Données pour le graphique
  const chartData = {
    labels: (productions || [])
      .map(p => new Date(p.date_recolte).toLocaleDateString('fr-FR'))
      .slice(-6),
    datasets: [
      {
        label: 'Production (kg)',
        data: (productions || []).map(p => p.poids_total).slice(-6),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Évolution de la production',
      },
    },
  };

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestion des Productions
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouvelle Production
        </Button>
      </Box>

      {/* Graphique et statistiques */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Line options={chartOptions} data={chartData} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Statistiques globales
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Production totale : {statistiques?.total_poids?.toLocaleString('fr-FR')} kg
              </Typography>
              <Typography variant="body1">
                Nombre total de régimes : {statistiques?.total_regimes?.toLocaleString('fr-FR')}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tableau des productions */}
      <Paper sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
        <DataGrid
          rows={productions || []}
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

      {/* Formulaire de création/modification */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedProduction?.id ? 'Modifier la production' : 'Nouvelle production'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="dense">
              <InputLabel>Plantation</InputLabel>
              <Select
                value={selectedProduction?.plantation || ''}
                onChange={(e) => setSelectedProduction({
                  ...selectedProduction,
                  plantation: e.target.value as number,
                })}
                required
              >
                {plantations.map((plantation) => (
                  <MenuItem key={plantation.id} value={plantation.id}>
                    {plantation.nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Date de récolte"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={selectedProduction?.date_recolte || ''}
              onChange={(e) => setSelectedProduction({
                ...selectedProduction,
                date_recolte: e.target.value,
              })}
            />
            <TextField
              margin="dense"
              label="Nombre de régimes"
              type="number"
              fullWidth
              required
              value={selectedProduction?.quantite || ''}
              onChange={(e) => setSelectedProduction({
                ...selectedProduction,
                quantite: parseInt(e.target.value),
              })}
            />
            <TextField
              margin="dense"
              label="Poids total (kg)"
              type="number"
              fullWidth
              required
              value={selectedProduction?.poids_total || ''}
              onChange={(e) => setSelectedProduction({
                ...selectedProduction,
                poids_total: parseFloat(e.target.value),
              })}
            />
            <TextField
              margin="dense"
              label="Qualité"
              fullWidth
              required
              value={selectedProduction?.qualite || ''}
              onChange={(e) => setSelectedProduction({
                ...selectedProduction,
                qualite: e.target.value,
              })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedProduction?.id ? 'Modifier' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Productions; 