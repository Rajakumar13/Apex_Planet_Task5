// DOM Elements
const showRegisteredBtn = document.getElementById('show-registered');
const showLoginBtn = document.getElementById('show-login');
const headerSignInBtn = document.getElementById('header-signin');
const authForm = document.getElementById('auth-form');
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const placeNewOrderBtn = document.getElementById('place-new-order');
const logoutBtn = document.getElementById('logout');
const dashboardSection = document.getElementById('dashboard');
const orderForm = document.getElementById('order-form');
const addToCartButtons = document.querySelectorAll('.add-to-cart');
const cartIcon = document.querySelector('.cart-icon');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

// Cart state
let cart = [];
let isLoggedIn = false;
let currentUser = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Toggle between login and register forms
    showRegisteredBtn.addEventListener('click', (e) => {
        e.preventDefault();
        authForm.style.display = 'none';
        registerForm.style.display = 'flex';
    });

    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        authForm.style.display = 'flex';
    });

    headerSignInBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        authForm.style.display = 'flex';
        registerForm.style.display = 'none';
    });

    // Registration Form Submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Registration successful! Please login to continue.');
                // Switch to login form after successful registration
                registerForm.style.display = 'none';
                authForm.style.display = 'flex';
                // Clear form
                signupForm.reset();
            } else {
                alert(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration. Please try again later.');
        }
    });

    // Login Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            
            if (response.ok) {
                isLoggedIn = true;
                currentUser = data.user;
                // Hide auth forms
                authForm.style.display = 'none';
                registerForm.style.display = 'none';
                // Show dashboard
                dashboardSection.style.display = 'block';
                // Load user orders
                loadUserOrders();
                alert('Login successful!');
            } else {
                alert(data.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login. Please try again later.');
        }
    });

    // Logout
    logoutBtn?.addEventListener('click', () => {
        isLoggedIn = false;
        currentUser = null;
        dashboardSection.style.display = 'none';
        authForm.style.display = 'flex';
    });

    // Place New Order Button
    placeNewOrderBtn?.addEventListener('click', () => {
        dashboardSection.style.display = 'none';
        orderForm.style.display = 'block';
    });

    // Add to Cart functionality
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const id = button.getAttribute('data-id');
            const name = button.getAttribute('data-name');
            const price = button.getAttribute('data-price');
            
            addToCart(id, name, price);
        });
    });

    // Cart Icon Click
    cartIcon?.addEventListener('click', () => {
        cartModal.style.display = cartModal.style.display === 'block' ? 'none' : 'block';
        updateCartDisplay();
    });

    // Checkout Button
    checkoutBtn?.addEventListener('click', () => {
        if (!isLoggedIn) {
            alert('Please login to proceed with checkout.');
            authForm.style.display = 'flex';
            cartModal.style.display = 'none';
            return;
        }
        
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        // Proceed with checkout
        alert('Proceeding to checkout...');
        // Here you would normally process the payment
        // For now, we'll just clear the cart
        cart = [];
        updateCartCount();
        cartModal.style.display = 'none';
    });
});

// Shopping Cart Functions
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    
    updateCartCount();
    if (cartModal.style.display === 'block') {
        updateCartDisplay();
    }
}

function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
}

function updateCartDisplay() {
    cartItems.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.quantity * parseFloat(item.price);
        total += itemTotal;
        
        const li = document.createElement('li');
        li.innerHTML = `
            ${item.name} 
            <span>₹${item.price} x ${item.quantity} = ₹${itemTotal}</span>
            <button class="remove-item" data-id="${item.id}">×</button>
        `;
        cartItems.appendChild(li);
    });
    
    cartTotal.textContent = `Total: ₹${total}`;
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-item').forEach(button => {
                button.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = e.target.getAttribute('data-id');
            removeFromCart(id);
        });
    });
}

function removeFromCart(id) {
    const index = cart.findIndex(item => item.id === id);
    if (index !== -1) {
        cart.splice(index, 1);
        updateCartCount();
        updateCartDisplay();
    }
}

// Load user orders
async function loadUserOrders() {
    if (!currentUser ) return;

    try {
        const response = await fetch(`/api/orders/${currentUser .email}`);
        const orders = await response.json();

        if (response.ok) {
            const ordersContainer = document.querySelector('.user-orders');
            if (orders.length > 0) {
                ordersContainer.innerHTML = `
                    <h3>Your Orders:</h3>
                    <ul class="orders-list">
                        ${orders.map(order => `
                            <li>
                                <strong>${order.product}</strong> - 
                                Quantity: ${order.quantity} - 
                                Date: ${new Date(order.order_date).toLocaleDateString()}
                                ${order.status ? `- Status: ${order.status}` : ''}
                            </li>
                        `).join('')}
                    </ul>
                `;
            } else {
                ordersContainer.innerHTML = `<p>You haven't placed any orders yet.</p>`;
            }
        } else {
            console.error('Failed to fetch orders:', orders.message);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Order Form Submission
document.getElementById('order-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
        alert('Please login to place an order.');
        authForm.style.display = 'flex';
        return;
    }

    const formData = {
        product: document.getElementById('product-select').value,
        quantity: document.querySelector('#order-form input[name="quantity"]').value,
        name: document.querySelector('#order-form input[name="name"]').value,
        email: document.querySelector('#order-form input[name="email"]').value,
        phone: document.querySelector('#order-form input[name="phone"]').value || '',
        message: document.querySelector('#order-form textarea[name="message"]').value
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Order placed successfully!');
            orderForm.style.display = 'none';
            dashboardSection.style.display = 'block';
            loadUserOrders();
            document.getElementById('order-form').reset();
        } else {
            alert(data.message || 'Failed to place order. Please try again.');
        }
    } catch (error) {
        console.error('Order submission error:', error);
        alert('An error occurred while placing your order. Please try again later.');
    }
});

// Initialize ScrollReveal animations
ScrollReveal({
    origin: 'top',
    distance: '60px',
    duration: 2500,
    delay: 400,
    // reset: true
});

// Reveal sections
ScrollReveal().reveal('.Home .app-store, .products-container .box, .reviews-container .box', { interval: 200 });
ScrollReveal().reveal('.about-container .about-img', { origin: 'left' });
ScrollReveal().reveal('.about-container .about-text', { origin: 'right' });
