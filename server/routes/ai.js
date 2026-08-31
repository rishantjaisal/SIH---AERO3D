import express from 'express';

const router = express.Router();

// GET /api/ai/analysis/:projectId
router.get('/analysis/:projectId', (req, res) => {
  const projectId = req.params.projectId;
  
  // Return structured AI detections
  res.json({
    success: true,
    projectId,
    isDemo: true,
    modeLabel: 'DEMO AI ANALYSIS',
    summary: {
      totalObjects: 14,
      buildingsDetected: 2,
      roadsDetected: 3,
      vegetationClusters: 5,
      vehiclesDetected: 4,
      structuralAnomalies: 2,
    },
    detections: [
      {
        id: 'det-01',
        category: 'Building',
        label: 'Main Academic Wing A',
        confidence: 0.96,
        areaM2: 855.6,
        status: 'Normal Structure',
        boundingBox: { min: [-15, 0, -10], max: [15, 18.2, 10] }
      },
      {
        id: 'det-02',
        category: 'Roof',
        label: 'Flat Concrete Roof System',
        confidence: 0.94,
        areaM2: 780.0,
        status: 'Requires Waterproof Inspection',
        boundingBox: { min: [-14, 17.5, -9], max: [14, 18.2, 9] }
      },
      {
        id: 'det-03',
        category: 'Road',
        label: 'North Perimeter Access Asphalt Road',
        confidence: 0.91,
        areaM2: 420.5,
        status: 'Good Pavement Condition',
        boundingBox: { min: [-25, 0.1, 15], max: [25, 0.2, 22] }
      },
      {
        id: 'det-04',
        category: 'Vegetation',
        label: 'Surrounding Tree Canopy Group',
        confidence: 0.89,
        areaM2: 310.0,
        status: 'No Power Line Encroachment',
        boundingBox: { min: [18, 0, -18], max: [30, 8.5, -5] }
      },
      {
        id: 'det-05',
        category: 'Vehicle',
        label: 'Maintenance Utility Van',
        confidence: 0.88,
        areaM2: 12.4,
        status: 'Parked in Designated Bay',
        boundingBox: { min: [-8, 0, 16], max: [-4, 2.1, 20] }
      },
      {
        id: 'det-06',
        category: 'Structural Anomaly',
        label: 'Facade Micro-Crack (North Wall)',
        confidence: 0.82,
        areaM2: 0.45,
        status: 'FLAGGED FOR MANUAL INSPECTION',
        severity: 'Medium',
        boundingBox: { min: [-4.2, 6.5, -10], max: [-3.8, 8.1, -9.9] }
      }
    ]
  });
});

export default router;
