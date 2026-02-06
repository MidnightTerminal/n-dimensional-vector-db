document.addEventListener('DOMContentLoaded', () => {
    loadCheckoutCart();
});

const form = document.getElementById('checkoutForm');
const successModal = document.getElementById('successModal');
let cart = JSON.parse(localStorage.getItem('SHOPPING_CART')) || [];
const SHIPPING_COST = 60;

function loadCheckoutCart() {
    const container = document.getElementById('summaryItems');
    const subtotalEl = document.getElementById('summarySubtotal');
    const totalEl = document.getElementById('summaryTotal');

    if (cart.length === 0) {
        window.location.href = '/'; // Redirect if empty
        return;
    }

    container.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const itemRow = document.createElement('div');
        itemRow.className = 'summary-item';
        itemRow.innerHTML = `
            <div class="item-info">
                <img src="${item.image}" alt="${item.title}">
                <div>
                    <h4>${item.title}</h4>
                    <p>Qty: ${item.quantity}</p>
                </div>
            </div>
            <div class="item-price">৳${itemTotal}</div>
        `;
        container.appendChild(itemRow);
    });

    subtotalEl.innerText = '৳' + subtotal.toFixed(2);
    totalEl.innerText = '৳' + (subtotal + SHIPPING_COST).toFixed(2);
}

// Handle Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.querySelector('.place-order-btn-large');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Processing...';
    submitBtn.disabled = true;
    // 1. Get Selected Payment Method
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
    const trxId = document.getElementById('bkashTrxId').value;

    // 2. Include it in the data object
    const customerData = {
        name: document.getElementById('custName').value,
        email: document.getElementById('custEmail').value,
        phone: document.getElementById('custPhone').value,
        address: document.getElementById('custAddress').value,
        paymentMethod: paymentMethod, // <--- NEW
        transactionId: paymentMethod === 'bkash' ? trxId : null // <--- NEW
    };
    // 1. Gather Data
    // const customerData = {
    //     name: document.getElementById('custName').value,
    //     email: document.getElementById('custEmail').value,
    //     phone: document.getElementById('custPhone').value,
    //     address: document.getElementById('custAddress').value
    // };

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const total = subtotal + SHIPPING_COST;

    // 2. Send to Server
    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer: customerData,
                cart: cart,
                total: total
            })
        });

        const result = await response.json();

        if (result.success) {
            // Show Success
            document.getElementById('successOrderId').innerText = result.orderId;
            document.getElementById('successEmailDisplay').innerText = customerData.email;
            successModal.classList.add('active');

            // Clear Cart
            localStorage.removeItem('SHOPPING_CART');
        } else {
            alert('Order failed: ' + result.message);
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }

    } catch (error) {
        console.error(error);
        alert('Network error. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
});

function clearCartAndRedirect() {
    // Cart is already cleared in submit handler
    // Just a helper for the button onclick
}


// Toggle Payment Method UI
function selectPayment(method) {
    // 1. Update Visual Selection
    document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));

    // Find the clicked input's parent label and add 'selected'
    const selectedInput = document.querySelector(`input[value="${method}"]`);
    if (selectedInput) {
        selectedInput.closest('.payment-option').classList.add('selected');
        selectedInput.checked = true;
    }

    // 2. Show/Hide bKash Details
    const bkashDetails = document.getElementById('bkashDetails');
    const trxInput = document.getElementById('bkashTrxId');

    if (method === 'bkash') {
        bkashDetails.classList.remove('hidden');
        trxInput.setAttribute('required', 'true'); // Make TrxID mandatory
    } else {
        bkashDetails.classList.add('hidden');
        trxInput.removeAttribute('required'); // Remove requirement
        trxInput.value = ''; // Clear input
    }
}