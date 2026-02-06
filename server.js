const express = require('express');
const path = require('path');
const app = express();

// 1. [FIX] Enable JSON parsing so server can read POST data
app.use(express.json());

// 2. Serve 'public' folder at the root (for images, main style.css)
app.use(express.static(path.join(__dirname, 'public')));

// 3. [FIX] Serve 'checkout' folder specifically at /checkout path
// This allows the browser to find /checkout/checkout.js and /checkout/style.css
app.use('/checkout', express.static(path.join(__dirname, 'checkout')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about', 'about.html'));
});

// Checkout Page Route
app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'checkout', 'checkout.html'));
});

// 4. [FIX] Create the API Endpoint to receive the order
app.post('/api/checkout', (req, res) => {
    const { customer, cart, total } = req.body;

    console.log("=== NEW ORDER RECEIVED ===");
    console.log(`Customer: ${customer.name} (${customer.email})`);
    console.log(`Items: ${cart.length}`);
    console.log(`Total: ${total}`);
    console.log("==========================");

    // Simulate database success
    res.json({ success: true, orderId: 'ORD-' + Date.now() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});