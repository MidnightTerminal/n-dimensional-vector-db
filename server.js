const express = require('express');
const path = require('path');
const app = express();

// 1. Enable JSON parsing (REQUIRED for checkout form data)
app.use(express.json()); 

// 2. Serve 'public' folder for the root path (Home page, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// 3. Serve 'checkout' folder specifically for the /checkout path
// This fixes the CSS/JS loading issue
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

// 4. API to handle the Order
app.post('/api/checkout', (req, res) => {
    const { customer, cart, total } = req.body;

    console.log("=== NEW ORDER RECEIVED ===");
    console.log(`Customer: ${customer.name} (${customer.email})`);
    console.log(`Items: ${cart.length}`);
    console.log(`Total: ${total}`);
    console.log("==========================");

    // Send success response
    res.json({ success: true, orderId: 'ORD-' + Date.now() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});