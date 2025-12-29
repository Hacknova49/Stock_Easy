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