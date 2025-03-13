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
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { MouvementCaisse, mouvementCaisseService } from '../services/api';
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

const MouvementsCaisse = () => {
  const [mouvements, setMouvements] = useState<MouvementCaisse[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMouvement, setSelectedMouvement] = useState<Partial<MouvementCaisse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [bilan, setBilan] = useState<{
    total_entrees: number;
    total_sorties: number;
    solde: number;
  }>({
    total_entrees: 0,
    total_sorties: 0,
    solde: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [mouvementsRes, bilanRes] = await Promise.all([
        mouvementCaisseService.getAll(),
        mouvementCaisseService.getBilan(),
      ]);
      
      if (Array.isArray(mouvementsRes.data)) {
        setMouvements(mouvementsRes.data);
      } else {
        setMouvements([]);
        console.error('Les données des mouvements ne sont pas un tableau:', mouvementsRes.data);
      }
      
      if (bilanRes.data) {
        setBilan(bilanRes.data);
      } else {
        setBilan({ total_entrees: 0, total_sorties: 0, solde: 0 });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setMouvements([]);
      setBilan({ total_entrees: 0, total_sorties: 0, solde: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = (mouvement?: MouvementCaisse) => {
    setSelectedMouvement(mouvement || {});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedMouvement(null);
    setOpenDialog(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMouvement) return;

    const { date, type_mouvement, montant, description } = selectedMouvement;

    if (!date || !type_mouvement || !montant) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      if (selectedMouvement.id) {
        await mouvementCaisseService.update(selectedMouvement.id, selectedMouvement);
      } else {
        await mouvementCaisseService.create({
          date,
          type_mouvement,
          montant,
          description: description || ''
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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce mouvement ?')) {
      try {
        await mouvementCaisseService.delete(id);
        loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      flex: 1,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('fr-FR'),
    },
    {
      field: 'type_mouvement',
      headerName: 'Type',
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          color: params.value === 'ENTREE' ? 'success.main' : 'error.main',
        }}>
          {params.value === 'ENTREE' ? <TrendingUpIcon sx={{ mr: 1 }} /> : <TrendingDownIcon sx={{ mr: 1 }} />}
          {params.value === 'ENTREE' ? 'Entrée' : 'Sortie'}
        </Box>
      ),
    },
    {
      field: 'montant',
      headerName: 'Montant',
      flex: 1,
      valueFormatter: (params) => `${params.value.toLocaleString('fr-FR')} €`,
    },
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
    labels: mouvements
      .slice(-6)
      .map(m => new Date(m.date).toLocaleDateString('fr-FR')),
    datasets: [
      {
        label: 'Entrées (€)',
        data: mouvements
          .slice(-6)
          .map(m => m.type_mouvement === 'ENTREE' ? m.montant : 0),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Sorties (€)',
        data: mouvements
          .slice(-6)
          .map(m => m.type_mouvement === 'SORTIE' ? m.montant : 0),
        borderColor: 'rgb(255, 99, 132)',
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
        text: 'Évolution des mouvements de caisse',
      },
    },
  };

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Mouvements de Caisse
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouveau Mouvement
        </Button>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Line options={chartOptions} data={chartData} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Solde actuel
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h4">
                    {bilan.solde.toLocaleString('fr-FR')} €
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Total Entrées
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                  <TrendingUpIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {bilan.total_entrees.toLocaleString('fr-FR')} €
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Total Sorties
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
                  <TrendingDownIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {bilan.total_sorties.toLocaleString('fr-FR')} €
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Tableau des mouvements */}
      <Paper sx={{ height: 'calc(100vh - 400px)', width: '100%' }}>
        <DataGrid
          rows={mouvements}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: {
              sortModel: [{ field: 'date', sort: 'desc' }],
            },
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
          {selectedMouvement?.id ? 'Modifier le mouvement' : 'Nouveau mouvement'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="dense"
              label="Date"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={selectedMouvement?.date || ''}
              onChange={(e) => setSelectedMouvement({
                ...selectedMouvement,
                date: e.target.value,
              })}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Type de mouvement</InputLabel>
              <Select
                value={selectedMouvement?.type_mouvement || ''}
                onChange={(e) => setSelectedMouvement({
                  ...selectedMouvement,
                  type_mouvement: e.target.value as 'ENTREE' | 'SORTIE',
                })}
                required
              >
                <MenuItem value="ENTREE">Entrée</MenuItem>
                <MenuItem value="SORTIE">Sortie</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Montant (€)"
              type="number"
              fullWidth
              required
              value={selectedMouvement?.montant || ''}
              onChange={(e) => setSelectedMouvement({
                ...selectedMouvement,
                montant: parseFloat(e.target.value),
              })}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              required
              value={selectedMouvement?.description || ''}
              onChange={(e) => setSelectedMouvement({
                ...selectedMouvement,
                description: e.target.value,
              })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedMouvement?.id ? 'Modifier' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default MouvementsCaisse; 