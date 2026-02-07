require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/checkout', express.static(path.join(__dirname, 'checkout')));

// 1. Create MySQL Connection Pool
// Ensure your .env file has these variables set correctly
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 2. Configure Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 3. Configure Twilio Client (Optional)
let twilioClient;
if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
        twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch (err) {
        console.warn("Twilio not configured properly:", err.message);
    }
}

// --- Routes ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'checkout', 'checkout.html')));

app.post('/api/checkout', async (req, res) => {
    // 1. Validate Request Body
    const { customer, cart, total } = req.body;
    if (!customer || !cart || !total) {
        return res.status(400).json({ success: false, message: 'Missing order data' });
    }

    const orderRef = 'ORD-' + Date.now(); 
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 2. Prepare Data
        // Ensure transactionId is NULL if not provided or empty
        const trxId = (customer.transactionId && customer.transactionId.trim() !== '') 
                      ? customer.transactionId 
                      : null;

        // A. Insert into 'orders' table
        const [result] = await connection.execute(
            `INSERT INTO orders 
            (order_ref, customer_name, customer_email, customer_phone, customer_address, payment_method, transaction_id, total_amount) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                orderRef,
                customer.name,
                customer.email,
                customer.phone,
                customer.address,
                customer.paymentMethod,
                trxId, 
                total
            ]
        );

        // B. Insert into 'order_items' table
        // Loop through the cart and insert each item
        for (const item of cart) {
            await connection.execute(
                `INSERT INTO order_items (order_ref, product_title, quantity, price) VALUES (?, ?, ?, ?)`,
                [orderRef, item.title, item.quantity, item.price]
            );
        }

        await connection.commit();
        console.log(`✅ Order ${orderRef} saved to MySQL.`);

        // C. Send Email to Customer (Async - don't wait)
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: customer.email,
            subject: `Order Confirmation - ${orderRef}`,
            html: `
                <h2>Hello ${customer.name},</h2>
                <p>Thank you for shopping with Horizontal Shop!</p>
                <p><strong>Order ID:</strong> ${orderRef}</p>
                <p><strong>Total Amount:</strong> ৳${total}</p>
                <h3>Items:</h3>
                <ul>
                    ${cart.map(item => `<li>${item.title} (x${item.quantity}) - ৳${item.price}</li>`).join('')}
                </ul>
                <p>We will contact you shortly at ${customer.phone}.</p>
            `
        };
        transporter.sendMail(mailOptions).catch(err => console.error("Email Error:", err));

        // D. Send WhatsApp to Admin (Async - don't wait)
        if (twilioClient && process.env.TWILIO_WHATSAPP_NUMBER && process.env.ADMIN_PHONE_NUMBER) {
            const whatsappMsg = `🔔 *New Order Received!*\n\n` +
                `Ref: ${orderRef}\n` +
                `Customer: ${customer.name}\n` +
                `Phone: ${customer.phone}\n` +
                `Total: ৳${total}\n` +
                `Payment: ${customer.paymentMethod} ${trxId ? `(TrxID: ${trxId})` : ''}`;

            twilioClient.messages.create({
                body: whatsappMsg,
                from: process.env.TWILIO_WHATSAPP_NUMBER,
                to: process.env.ADMIN_PHONE_NUMBER
            }).then(msg => console.log('WhatsApp sent:', msg.sid)).catch(err => console.error("Twilio Error:", err));
        }

        res.json({ success: true, orderId: orderRef });

    } catch (error) {
        if (connection) await connection.rollback(); 
        console.error('❌ Checkout Error:', error); // Check your terminal for this error message!
        res.status(500).json({ success: false, message: 'Internal Server Error: ' + error.message });
    } finally {
        if (connection) connection.release();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});