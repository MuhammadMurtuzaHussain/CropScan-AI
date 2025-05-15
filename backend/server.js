const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configuration
const PROJECT_ID = 'crop-scan-ai';
const LOCATION = 'europe-west4';
const ENDPOINT_ID = '6829376782395768832';
const API_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/endpoints/${ENDPOINT_ID}:predict`;

// You can generate this token using: gcloud auth print-access-token
const ACCESS_TOKEN = 'ya29.a0AW4XtxhEWOz5m86-XSGfiliZTTcQ6BrfUZatJ5-VWkBCua2uCJo0PABrwIVOsRws7IpE0KglIFkWWovTsly6jUzYDt0KBhuC1-Nz4bKyV70tbp5Jq2_53xXsXzexOrVNzcYDxv84Zm5LAxQhmkGZ15q-1PmzQQTmyvernwD-B3-GkwaCgYKAcESARMSFQHGX2MiUij6mzaIqo3dtD-QWnIe9A0181'; // Replace with your token

app.post('/api/analyze', async (req, res) => {
    try {
        const { image } = req.body;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                instances: [{
                    image: {
                        bytesBase64Encoded: image
                    }
                }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('API Error:', error);
            throw new Error(error.error.message || 'Prediction failed');
        }

        const data = await response.json();
        console.log('API Response:', data);

        // Assuming your model returns a probability
        const prediction = data.predictions[0][0];
        const isHealthy = prediction > 0.5;

        res.json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            confidence: Math.round(prediction * 100),
            details: data.predictions
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            details: error.message
        });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));