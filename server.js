const express = require('express');
const path = require('path');
const app = express();

app.use(express.json()); 

app.use(express.static(path.join(__dirname, 'public')));
app.use('/checkout', express.static(path.join(__dirname, 'checkout')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about', 'about.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'checkout', 'checkout.html'));
});


app.post('/api/checkout', (req, res) => {
    const { customer, cart, total } = req.body;

    console.log("=== NEW ORDER RECEIVED ===");
    console.log(`Customer: ${customer.name} (${customer.email})`);
    console.log(`Items: ${cart.length}`);
    console.log(`Total: ${total}`);
    console.log("==========================");

    res.json({ success: true, orderId: 'ORD-' + Date.now() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});