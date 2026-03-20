const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./config/db'); // Ensure this path is correct
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'client')));

// API Endpoints
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Registration successful! Please login' 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (!users.length) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        res.json({ 
            success: true, 
            message: 'Login successful', 
            user: { id: user.id, name: user.name, email: user.email } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/api/products', (req, res) => {
    const products = [
        { id: 1, name: 'Rajasthani Pottery', price: 599, image: '1.jpeg' },
        { id: 2, name: 'Traditional Bedcover', price: 1299, image: '2.jpeg' }, 
        { id: 3, name: 'Wooden Handicraft', price: 899, image: '3.jpeg' },
        { id: 4, name: 'Brass Decor', price: 1599, image: '4.jpeg' },
        { id: 5, name: 'Embroidery Art', price: 799, image: '5.jpeg' },
        { id: 6, name: 'Metal Handicraft', price: 999, image: '6.jpeg' }
    ];
    res.json({ success: true, products });
});

app.post('/api/orders', async (req, res) => {
    const { product, quantity, name, email, phone, message } = req.body;
    
    try {
        const [result] = await pool.query(
            `INSERT INTO orders 
            (product, quantity, customer_name, customer_email, customer_phone, customer_message, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [product, quantity, name, email, phone || null, message, 'Pending']
        );

        res.status(201).json({ 
            success: true, 
            message: 'Order placed successfully!',
            orderId: result.insertId 
        });
    } catch (error) {
        console.error('Order error:', error);
        res.status(500).json({ success: false, message: 'Failed to place order' });
    }
});

app.get('/api/user-orders', async (req, res) => {
    const { email } = req.query;
    
    try {
        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE customer_email = ? ORDER BY order_date DESC',
            [email]
        );
        
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Orders fetch error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});

// Serve HTML
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'final.html'));
});

// Import controllers
const authController = require('./routes/auth');
const orderController = require('./routes/order');

// Route handlers
app.post('/api/register', authController.register);
app.post('/api/login', authController.login);
app.post('/api/orders', orderController.placeOrder);
app.get('/api/orders', orderController.getUserOrders);
app.get('/api/products', orderController.getProducts);

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
