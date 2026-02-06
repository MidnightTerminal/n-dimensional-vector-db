require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise'); // Using promise wrapper for cleaner async/await
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/checkout', express.static(path.join(__dirname, 'checkout')));

// 1. Create MySQL Connection Pool
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

// 3. Configure Twilio Client
let twilioClient;
try {
    twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
} catch (err) {
    console.warn("Twilio not configured properly:", err.message);
}

// --- Routes ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'checkout', 'checkout.html')));

app.post('/api/checkout', async (req, res) => {
    const { customer, cart, total } = req.body;
    const orderRef = 'ORD-' + Date.now(); // Unique Order ID
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

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
                customer.transactionId || null, // Handle null if not bKash
                total
            ]
        );

        // B. Insert into 'order_items' table
        // We loop through the cart and insert each item
        for (const item of cart) {
            await connection.execute(
                `INSERT INTO order_items (order_ref, product_title, quantity, price) VALUES (?, ?, ?, ?)`,
                [orderRef, item.title, item.quantity, item.price]
            );
        }

        await connection.commit();
        console.log(`✅ Order ${orderRef} saved to MySQL.`);

        // C. Send Email to Customer
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

        transporter.sendMail(mailOptions).catch(console.error);

        // D. Send WhatsApp to Admin (You)
        if (twilioClient) {
            const whatsappMsg = `🔔 *New Order Received!*\n\n` +
                `Ref: ${orderRef}\n` +
                `Customer: ${customer.name}\n` +
                `Phone: ${customer.phone}\n` +
                `Total: ৳${total}\n` +
                `Payment: ${customer.paymentMethod} ${customer.transactionId ? `(TrxID: ${customer.transactionId})` : ''}`;

            twilioClient.messages.create({
                body: whatsappMsg,
                from: process.env.TWILIO_WHATSAPP_NUMBER,
                to: process.env.ADMIN_PHONE_NUMBER
            }).then(msg => console.log('WhatsApp sent:', msg.sid)).catch(console.error);
        }

        res.json({ success: true, orderId: orderRef });

    } catch (error) {
        await connection.rollback(); // Undo database changes if error occurs
        console.error('Checkout Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        connection.release();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});