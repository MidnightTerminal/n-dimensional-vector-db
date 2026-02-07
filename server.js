require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const app = express();

app.use(express.json());



app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,                  
    secure: true,                
    auth: {
        user: process.env.EMAIL_USER, // Your cPanel email
        pass: process.env.EMAIL_PASS  // Your cPanel email password
    }
});

let twilioClient;
if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
        twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch (err) {
        console.warn("Twilio not configured properly:", err.message);
    }
}


app.post('/api/checkout', async (req, res) => {
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
        for (const item of cart) {
            await connection.execute(
                `INSERT INTO order_items (order_ref, product_title, quantity, price) VALUES (?, ?, ?, ?)`,
                [orderRef, item.title, item.quantity, item.price]
            );
        }

        await connection.commit();
        console.log(`✅ Order ${orderRef} saved to MySQL.`);
        res.json({ success: true, orderId: orderRef });

        // C. Send Email to Customer (Professional HTML Template)
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: customer.email,
            subject: `Order Confirmation - ${orderRef}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #4CAF50; padding: 20px; text-align: center; color: white;">
                        <h1 style="margin: 0;">Order Confirmed!</h1>
                        <p style="margin: 5px 0 0;">Thank you for shopping with Horizontal Shop</p>
                    </div>
                    
                    <div style="padding: 20px;">
                        <h3 style="color: #333;">Hi ${customer.name},</h3>
                        <p style="color: #666;">We have received your order and are getting it ready!</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderRef}</p>
                            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${customer.paymentMethod.toUpperCase()}</p>
                            <p style="margin: 5px 0;"><strong>Shipping Address:</strong> ${customer.address}</p>
                            <p style="margin: 5px 0;"><strong>Phone:</strong> ${customer.phone}</p>
                        </div>

                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <thead>
                                <tr style="background-color: #eeeeee;">
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
                                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cart.map(item => `
                                    <tr>
                                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                            <strong>${item.title}</strong>
                                        </td>
                                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                                        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">৳${item.price}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div style="text-align: right; margin-top: 20px;">
                            <p style="font-size: 18px; margin: 5px 0;"><strong>Total Amount:</strong> <span style="color: #4CAF50;">৳${total}</span></p>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            If you have any questions, contact us at ${process.env.EMAIL_USER} or call us.
                        </p>
                    </div>
                </div>
            `
        };
        transporter.sendMail(mailOptions).catch(err => console.error("Email Error:", err));

        // // D. Send WhatsApp to Admin (Async - don't wait)
        // if (twilioClient && process.env.TWILIO_WHATSAPP_NUMBER && process.env.ADMIN_PHONE_NUMBER) {
        //     const whatsappMsg = `🔔 *New Order Received!*\n\n` +
        //         `Ref: ${orderRef}\n` +
        //         `Customer: ${customer.name}\n` +
        //         `Phone: ${customer.phone}\n` +
        //         `Total: ৳${total}\n` +
        //         `Payment: ${customer.paymentMethod} ${trxId ? `(TrxID: ${trxId})` : ''}`;

        //     twilioClient.messages.create({
        //         body: whatsappMsg,
        //         from: process.env.TWILIO_WHATSAPP_NUMBER,
        //         to: process.env.ADMIN_PHONE_NUMBER
        //     }).then(msg => console.log('WhatsApp sent:', msg.sid)).catch(err => console.error("Twilio Error:", err));
        // }


        // D. Send Email to Admin (Detailed HTML Version)
        const adminMailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Sends to YOU
            subject: `🔔 New Order: ${orderRef} - ৳${total}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #333;">
                    <div style="background-color: #333; padding: 15px; text-align: center; color: white;">
                        <h2 style="margin: 0;">🔔 New Order Received!</h2>
                    </div>
                    
                    <div style="padding: 20px;">
                        <h3 style="color: #333;">Customer Details:</h3>
                        <p><strong>Name:</strong> ${customer.name}</p>
                        <p><strong>Phone:</strong> <a href="tel:${customer.phone}">${customer.phone}</a></p>
                        <p><strong>Email:</strong> ${customer.email}</p>
                        <p><strong>Address:</strong> ${customer.address}</p>
                        <p><strong>Payment:</strong> ${customer.paymentMethod} ${trxId ? `(TrxID: ${trxId})` : ''}</p>

                        <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Order Items:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #f2f2f2;">
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Product</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Qty</th>
                                    <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cart.map(item => `
                                    <tr>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${item.title}</td>
                                        <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                                        <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">৳${item.price}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div style="text-align: right; margin-top: 15px;">
                            <h3>Total: ৳${total}</h3>
                        </div>
                    </div>
                </div>
            `
        };
        transporter.sendMail(adminMailOptions).catch(err => console.error("Admin Email Error:", err));

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Checkout Error:', error); 
        res.status(500).json({ success: false, message: 'Internal Server Error: ' + error.message });
    } finally {
        if (connection) connection.release();
    }
});


// Catch-all route for any other request to serve index.html (useful for SPAs)
// Note: In Express 5, wildcards must be named, e.g., '/*' or '/:any*'
// Fix for Express 5: Wildcards must be named using the :any* syntax
// app.get('/:any*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});