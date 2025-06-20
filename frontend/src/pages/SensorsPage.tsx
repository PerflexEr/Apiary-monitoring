import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import { Add, Edit, Info } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useStore } from '../hooks/useStore';
import type { Hive } from '../types/stores';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { SensorStats } from '../types/stores';

const SensorsPage: React.FC = () => {
  const { monitoringStore, hiveStore } = useStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [sensorData, setSensorData] = useState<{
    name: string;
    sensor_type: string;
    hive_id: number | '';
    is_active: boolean;
  }>({
    name: '',
    sensor_type: '',
    hive_id: '',
    is_active: true
  });
  const [filterHiveId, setFilterHiveId] = useState('');
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [sensorStats, setSensorStats] = useState<SensorStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    hiveStore.fetchHives();
    monitoringStore.fetchSensors();
  }, []);

  const handleOpenDialog = (sensor?: any) => {
    if (sensor) {
      setEditMode(true);
      setSelectedSensor(sensor);
      setSensorData({
        name: sensor.name,
        sensor_type: sensor.sensor_type,
        hive_id: sensor.hive_id,
        is_active: sensor.is_active
      });
    } else {
      setEditMode(false);
      setSelectedSensor(null);
      setSensorData({ name: '', sensor_type: '', hive_id: '', is_active: true });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setSensorData((prev) => ({ ...prev, [name!]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<number | string>) => {
    const { name, value } = e.target;
    setSensorData((prev) => ({ ...prev, [name!]: value === '' ? '' : Number(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = { ...sensorData, hive_id: Number(sensorData.hive_id) };
    if (editMode && selectedSensor) {
      await monitoringStore.updateSensor(selectedSensor.id, dataToSend);
    } else {
      await monitoringStore.createSensor(dataToSend);
    }
    setOpenDialog(false);
    monitoringStore.fetchSensors();
  };

  const handleShowStats = async (sensorId: number) => {
    setStatsDialogOpen(true);
    setStatsLoading(true);
    setStatsError(null);
    try {
      const stats = await monitoringStore.fetchSensorStats(sensorId);
      setSensorStats(stats);
    } catch (e: any) {
      setStatsError(e?.message || 'Ошибка загрузки статистики');
    } finally {
      setStatsLoading(false);
    }
  };

  const filteredSensors = filterHiveId
    ? monitoringStore.sensors.filter((s) => String(s.hive_id) === filterHiveId)
    : monitoringStore.sensors;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sensors (Monitoring)
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="hive-filter-label">Hive Filter</InputLabel>
          <Select
            labelId="hive-filter-label"
            value={filterHiveId}
            label="Hive Filter"
            onChange={(e) => setFilterHiveId(e.target.value as string)}
          >
            <MenuItem value="">All Hives</MenuItem>
            {hiveStore.hives.map((hive: Hive) => (
              <MenuItem key={hive.id} value={String(hive.id)}>
                {hive.name} - {hive.location}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Sensor
        </Button>
      </Box>

      <Grid container spacing={2}>
        {filteredSensors.map((sensor) => (
          <Grid item xs={12} md={6} lg={4} key={sensor.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{sensor.name}</Typography>
                <Typography>Type: {sensor.sensor_type}</Typography>
                <Typography>Hive: {hiveStore.hives.find(h => h.id === sensor.hive_id)?.name || '—'}</Typography>
                <Typography>Status: {sensor.is_active ? 'Active' : 'Inactive'}</Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleOpenDialog(sensor)}><Edit /></IconButton>
                  </Tooltip>
                  <Tooltip title="Details">
                    <IconButton onClick={() => handleShowStats(sensor.id)}><Info /></IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editMode ? 'Edit Sensor' : 'Add Sensor'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ minWidth: 350 }}>
            <TextField
              margin="dense"
              label="Name"
              name="name"
              value={sensorData.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              margin="dense"
              label="Sensor Type"
              name="sensor_type"
              value={sensorData.sensor_type}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <FormControl fullWidth margin="dense">
              <InputLabel id="hive-select-label">Hive</InputLabel>
              <Select
                labelId="hive-select-label"
                name="hive_id"
                value={sensorData.hive_id}
                label="Hive"
                onChange={handleSelectChange}
                required
              >
                {hiveStore.hives.map((hive: Hive) => (
                  <MenuItem key={hive.id} value={hive.id}>
                    {hive.name} - {hive.location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">{editMode ? 'Save' : 'Add'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={statsDialogOpen} onClose={() => setStatsDialogOpen(false)}>
        <DialogTitle>Sensor Statistics</DialogTitle>
        <DialogContent sx={{ minWidth: 350 }}>
          {statsLoading && <Typography>Loading...</Typography>}
          {statsError && <Typography color="error">{statsError}</Typography>}
          {sensorStats && !statsLoading && !statsError && (
            <Box>
              <Typography><b>ID:</b> {sensorStats.sensor_id}</Typography>
              <Typography><b>Name:</b> {sensorStats.sensor_name}</Typography>
              <Typography><b>Type:</b> {sensorStats.sensor_type}</Typography>
              <Typography><b>Last Value:</b> {sensorStats.last_value ?? '—'}</Typography>
              <Typography><b>Min:</b> {sensorStats.min_value ?? '—'}</Typography>
              <Typography><b>Max:</b> {sensorStats.max_value ?? '—'}</Typography>
              <Typography><b>Average:</b> {sensorStats.avg_value ?? '—'}</Typography>
              <Typography><b>Battery:</b> {sensorStats.battery_level ?? '—'}</Typography>
              <Typography><b>Last Measurement:</b> {sensorStats.last_measurement_time ? new Date(sensorStats.last_measurement_time).toLocaleString() : '—'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default observer(SensorsPage);
