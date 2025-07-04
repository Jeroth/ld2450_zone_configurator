import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(1);
  const [coordinates, setCoordinates] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });

  useEffect(() => {
    const fetchZones = async () => {
      const response = await axios.get('/api/zones');
      setZones(response.data);
      if (response.data.length > 0) {
        setCoordinates({
          x1: response.data[0].x1,
          y1: response.data[0].y1,
          x2: response.data[0].x2,
          y2: response.data[0].y2,
        });
      }
    };
    fetchZones();
  }, []);

  const handleZoneChange = (zone) => {
    setSelectedZone(zone);
    const zoneData = zones.find(z => z.zone === zone);
    if (zoneData) {
      setCoordinates({ x1: zoneData.x1, y1: zoneData.y1, x2: zoneData.x2, y2: zoneData.y2 });
    }
  };

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    setCoordinates({ ...coordinates, [name]: parseInt(value) });
  };

  const handleSave = async () => {
    await axios.post('/api/zones', { zone: selectedZone, ...coordinates });
    const response = await axios.get('/api/zones');
    setZones(response.data);
    alert('Zone updated successfully!');
  };

  const drawZone = (ctx, zone) => {
    ctx.beginPath();
    ctx.rect(
      (zone.x1 + 3000) * 100 / 6000, // Scale x from -3000,3000 to 0,100
      (6000 - zone.y2) * 100 / 6000, // Scale y from 0,6000 to 0,100
      (zone.x2 - zone.x1) * 100 / 6000,
      (zone.y2 - zone.y1) * 100 / 6000
    );
    ctx.strokeStyle = zone.zone === selectedZone ? 'red' : 'blue';
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = document.getElementById('zoneCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'lightgray';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    zones.forEach(zone => drawZone(ctx, zone));
  }, [zones, selectedZone]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">LD2450 Zone Configurator</h1>
      <div className="mb-4">
        <label className="mr-2">Select Zone:</label>
        <select
          value={selectedZone}
          onChange={(e) => handleZoneChange(parseInt(e.target.value))}
          className="border p-1"
        >
          {[1, 2, 3].map(zone => (
            <option key={zone} value={zone}>Zone {zone}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1">X1 (-3000 to 3000):</label>
        <input
          type="number"
          name="x1"
          value={coordinates.x1}
          onChange={handleCoordinateChange}
          min="-3000"
          max="3000"
          className="border p-1 w-full"
        />
        <label className="block mb-1 mt-2">Y1 (0 to 6000):</label>
        <input
          type="number"
          name="y1"
          value={coordinates.y1}
          onChange={handleCoordinateChange}
          min="0"
          max="6000"
          className="border p-1 w-full"
        />
        <label className="block mb-1 mt-2">X2 (-3000 to 3000):</label>
        <input
          type="number"
          name="x2"
          value={coordinates.x2}
          onChange={handleCoordinateChange}
          min="-3000"
          max="3000"
          className="border p-1 w-full"
        />
        <label className="block mb-1 mt-2">Y2 (0 to 6000):</label>
        <input
          type="number"
          name="y2"
          value={coordinates.y2}
          onChange={handleCoordinateChange}
          min="0"
          max="6000"
          className="border p-1 w-full"
        />
      </div>
      <button
        onClick={handleSave}
        className="bg-blue-500 text-white p-2 rounded"
      >
        Save Zone
      </button>
      <canvas
        id="zoneCanvas"
        width="300"
        height="300"
        className="border mt-4"
      ></canvas>
    </div>
  );
};

export default App;