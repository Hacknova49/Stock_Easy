const express = require('express');
const app = express();
app.use(express.json());

// Fake Inventory Data
let inventory = { "Milk": 10, "Bread": 5 };

app.get('/stock', (req, res) => res.json(inventory));

// Logic to "Sell" an item and check for low stock
app.post('/sell', (req, res) => {
    const { item } = req.body;
    if (inventory[item] > 0) {
        inventory[item]--;
        
        // Threshold check: If stock is low, trigger "Autonomous Order"
        if (inventory[item] < 3) {
            console.log(`⚠️ LOW STOCK: Ordering more ${item}...`);
            // This is where we will add the Polygon payment logic next!
        }
        res.send({ message: "Sold!", currentStock: inventory[item] });
    } else {
        res.status(400).send({ message: "Out of stock!" });
    }
});

const PORT = 3000;
// This handles the homepage (/)
app.get('/', (req, res) => {
    res.send(`
        <h1>🏪 Shopkeeper Backend is Live</h1>
        <p>Check inventory at: <a href="/stock">/stock</a></p>
        <p>Status: <span style="color: green;">Online</span></p>
    `);
});
app.listen(PORT, () => console.log(`Backend live on port ${PORT}`));

const axios = require('axios');

// Add this route to server.js
app.get('/test-api-connection', async (req, res) => {
    try {
        // FastAPI usually runs on port 8000
        const fastApiResponse = await axios.get('http://127.0.0.1:8000/');
        
        res.json({
            status: "Success! ✅",
            message: "Node.js successfully reached FastAPI",
            dataFromFastApi: fastApiResponse.data
        });
    } catch (error) {
        res.status(500).json({
            status: "Failed ❌",
            message: "Node.js could not reach FastAPI. Is the Python server running?",
            error: error.message
        });
    }
});

// Add this exact block to your server.js
app.get('/test-api-connection', async (req, res) => {
    try {
        const axios = require('axios'); // Ensure axios is installed
        // This attempts to "ping" your partner's FastAPI on port 8000
        const fastApiResponse = await axios.get('http://127.0.0.1:8000/');
        
        res.json({
            status: "Success! ✅",
            message: "Node.js successfully reached FastAPI",
            dataFromFastApi: fastApiResponse.data
        });
    } catch (error) {
        res.status(500).json({
            status: "Failed ❌",
            message: "Node.js could not reach FastAPI. Is the Python server running on port 8000?",
            error: error.message
        });
    }
});
