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
  TrendingUp as TrendingUpIcon,
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
import { Vente, Production, venteService, productionService } from '../services/api';

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

const Ventes = () => {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVente, setSelectedVente] = useState<Partial<Vente> | null>(null);
  const [loading, setLoading] = useState(true);
  const [chiffreAffaires, setChiffreAffaires] = useState<number>(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ventesRes, productionsRes] = await Promise.all([
        venteService.getAll(),
        productionService.getAll(),
      ]);
      
      if (Array.isArray(ventesRes.data)) {
        setVentes(ventesRes.data);
      } else {
        setVentes([]);
        console.error('Les données des ventes ne sont pas un tableau:', ventesRes.data);
      }
      
      if (Array.isArray(productionsRes.data)) {
        setProductions(productionsRes.data);
      } else {
        setProductions([]);
        console.error('Les données des productions ne sont pas un tableau:', productionsRes.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setVentes([]);
      setProductions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = (vente?: Vente) => {
    setSelectedVente(vente || {});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedVente(null);
    setOpenDialog(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedVente) return;

    const { production, date_vente, quantite, prix_unitaire, client } = selectedVente;

    if (!production || !date_vente || !quantite || !prix_unitaire || !client) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const montant_total = quantite * prix_unitaire;

    try {
      if (selectedVente.id) {
        await venteService.update(selectedVente.id, {
          ...selectedVente,
          montant_total
        });
      } else {
        await venteService.create({
          production,
          date_vente,
          quantite,
          prix_unitaire,
          client,
          montant_total
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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) {
      try {
        await venteService.delete(id);
        loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'production',
      headerName: 'Production',
      flex: 1,
      valueGetter: (params) => {
        const production = productions.find(p => p.id === params.row.production);
        return production ? `Récolte du ${new Date(production.date_recolte).toLocaleDateString('fr-FR')}` : '';
      },
    },
    {
      field: 'date_vente',
      headerName: 'Date de vente',
      flex: 1,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('fr-FR'),
    },
    { field: 'client', headerName: 'Client', flex: 1 },
    {
      field: 'quantite',
      headerName: 'Quantité (kg)',
      flex: 1,
      valueFormatter: (params) => `${params.value.toLocaleString('fr-FR')} kg`,
    },
    {
      field: 'prix_unitaire',
      headerName: 'Prix unitaire',
      flex: 1,
      valueFormatter: (params) => `${params.value.toLocaleString('fr-FR')} €/kg`,
    },
    {
      field: 'montant_total',
      headerName: 'Montant total',
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

  // Données pour le graphique
  const chartData = {
    labels: ventes
      .slice(-6)
      .map(v => new Date(v.date_vente).toLocaleDateString('fr-FR')),
    datasets: [
      {
        label: 'Montant des ventes (€)',
        data: ventes.slice(-6).map(v => v.montant_total),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
      {
        label: 'Quantité vendue (kg)',
        data: ventes.slice(-6).map(v => v.quantite),
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
        text: 'Évolution des ventes',
      },
    },
  };

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestion des Ventes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouvelle Vente
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
              Chiffre d'affaires
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h4">
                {chiffreAffaires.toLocaleString('fr-FR')} €
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tableau des ventes */}
      <Paper sx={{ height: 'calc(100vh - 400px)', width: '100%' }}>
        <DataGrid
          rows={ventes}
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

      {/* Formulaire de création/modification */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedVente?.id ? 'Modifier la vente' : 'Nouvelle vente'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="dense">
              <InputLabel>Production</InputLabel>
              <Select
                value={selectedVente?.production || ''}
                onChange={(e) => setSelectedVente({
                  ...selectedVente,
                  production: e.target.value as number,
                })}
                required
              >
                {Array.isArray(productions) && productions.map((production) => (
                  <MenuItem key={production.id} value={production.id}>
                    {`Production du ${new Date(production.date_recolte).toLocaleDateString('fr-FR')} - ${production.poids_total}kg`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Date de vente"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={selectedVente?.date_vente || ''}
              onChange={(e) => setSelectedVente({
                ...selectedVente,
                date_vente: e.target.value,
              })}
            />
            <TextField
              margin="dense"
              label="Client"
              fullWidth
              required
              value={selectedVente?.client || ''}
              onChange={(e) => setSelectedVente({
                ...selectedVente,
                client: e.target.value,
              })}
            />
            <TextField
              margin="dense"
              label="Quantité (kg)"
              type="number"
              fullWidth
              required
              value={selectedVente?.quantite || ''}
              onChange={(e) => setSelectedVente({
                ...selectedVente,
                quantite: parseFloat(e.target.value),
              })}
            />
            <TextField
              margin="dense"
              label="Prix unitaire (€/kg)"
              type="number"
              fullWidth
              required
              value={selectedVente?.prix_unitaire || ''}
              onChange={(e) => setSelectedVente({
                ...selectedVente,
                prix_unitaire: parseFloat(e.target.value),
              })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedVente?.id ? 'Modifier' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Ventes; 