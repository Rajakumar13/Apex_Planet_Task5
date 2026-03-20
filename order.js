const pool = require('../config/db');

// Place a new order
exports.placeOrder = async (req, res) => {
    const { product, quantity, name, email, phone, message } = req.body;
    
    if (!product || !quantity || !name || !email || !message) {
        return res.status(400).json({ 
            success: false, 
            message: 'Required fields are missing' 
        });
    }

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
        console.error('Order placement error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to place order' 
        });
    }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
    const { email } = req.query;
    
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email is required' 
        });
    }

    try {
        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE customer_email = ? ORDER BY order_date DESC',
            [email]
        );
        
        res.json({ 
            success: true, 
            orders: orders.map(order => ({
                id: order.id,
                product: order.product,
                quantity: order.quantity,
                customer_name: order.customer_name,
                customer_email: order.customer_email,
                customer_phone: order.customer_phone,
                customer_message: order.customer_message,
                order_date: order.order_date,
                status: order.status
            })) 
        });
    } catch (error) {
        console.error('Order fetch error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch orders' 
        });
    }
};

// Get all products
exports.getProducts = (req, res) => {
    const products = [
        { id: 1, name: 'Rajasthani Pottery', price: 599, image: '1.jpeg' },
        { id: 2, name: 'Traditional Bedcover', price: 1299, image: '2.jpeg' }, 
        { id: 3, name: 'Wooden Handicraft', price: 899, image: '3.jpeg' },
        { id: 4, name: 'Brass Decor', price: 1599, image: '4.jpeg' },
        { id: 5, name: 'Embroidery Art', price: 799, image: '5.jpeg' },
        { id: 6, name: 'Metal Handicraft', price: 999, image: '6.jpeg' }
    ];
    
    res.json({ success: true, products });
};
