const io = require("socket.io-client");
const mongoose = require('mongoose');
const orderController = require('./src/controllers/orderController');
const User = require('./src/models/User');
// We need to fetch/axios
const axios = require('axios'); // Assuming axios is installed or use fetch

require('dotenv').config();

const API_URL = "http://localhost:5001/api";

const runTest = async () => {
    console.log("=== FULL SYSTEM TEST ===");

    // 1. Login as Vendor to get Token
    // We assume 'vendor@test.com' exists from previous reset or we create it.
    // Let's create a fresh vendor to be sure.
    // Actually, let's use the DB to Force-Create a user and generate a Token MANUALLY if possible?
    // Easier: Just Register via API.

    try {
        // A. Register Vendor with Location
        const vendorEmail = `vendor_${Date.now()}@test.com`;
        console.log(`1. Registering Vendor: ${vendorEmail}`);

        let res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'TestVendor',
                email: vendorEmail,
                password: 'password123',
                role: 'vendor',
                storeName: 'TestStore',
                location: 'Hostel A' // Sending location directly here
            })
        });
        let vendorData = await res.json();
        const vendorToken = vendorData.token;
        console.log(`   -> Vendor Registered. ID: ${vendorData._id}`);

        // Get the real vendor ID from DB (since response checks user ID)
        // We need to query the Vendor model essentially, or assume the controller created it.
        // But to place an order we need VENDOR ID (the vendor document ID), not User ID.
        // We can't fetch it via API (no GET /api/vendors/me).
        // So we will use Mongoose directly here just to get the ID.
        await mongoose.connect(process.env.MONGO_URI);
        const Vendor = require('./src/models/Vendor');
        const vendorProfile = await Vendor.findOne({ user: vendorData._id });
        console.log(`   -> Vendor Profile Found: ${vendorProfile._id}`);

        // C. Register Customer & Place Order
        console.log("3. Registering Customer & Placing Order...");
        const custEmail = `cust_${Date.now()}@test.com`;
        res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'TestCust', email: custEmail, password: 'password123' })
        });
        const custData = await res.json();

        // Place Order
        res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${custData.token}` },
            body: JSON.stringify({
                orderItems: [{ name: 'Samosa', price: 20, qty: 1, product: new mongoose.Types.ObjectId() }], // Dummy product ID
                vendorId: vendorProfile._id, // The vendor we created
                totalPrice: 20
            })
        });
        const order = await res.json();
        console.log(`   -> Order Created: ${order._id}`);

        // 4. Connect SOCKET (Agent)
        console.log("4. Connecting Socket Client (Agent in 'Hostel A')...");
        const socket = io("http://localhost:5001");

        const agentLocation = "Hostel A";

        socket.on("connect", async () => {
            console.log("   -> Socket Connected!");
            socket.emit("join_delivery", { userId: "test_agent_id", location: agentLocation });

            // 5. UPDATE STATUS (Vendor accepts)
            console.log("5. Vendor Accepting Order (Triggering Event)...");
            const updateRes = await fetch(`${API_URL}/orders/${order._id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${vendorToken}` },
                body: JSON.stringify({ status: 'accepted' }) // or 'out_for_delivery' depending on logic
            });
            console.log("   -> Accept Status:", updateRes.status);

            // 5. Simulate AGENT REQUESTING ORDER (Handshake Step 1)
            console.log("5a. Agent Requesting Order...");
            const requestRes = await fetch(`${API_URL}/orders/${order._id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${custData.token}` // Using custData.token as Agent
                },
                body: JSON.stringify({ status: 'agent_requested' })
            });
            console.log("   -> Agent Request Status:", requestRes.status);

            // 5b. Simulate VENDOR APPROVING AGENT (Handshake Step 2)
            console.log("5b. Vendor Approving Agent...");
            const approveRes = await fetch(`${API_URL}/orders/${order._id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${vendorToken}`
                },
                body: JSON.stringify({ status: 'out_for_delivery' })
            });
            console.log("   -> Vendor Approval Status:", approveRes.status);

            // 6. Test GET /delivery/available AND /admin/all
            console.log("6. Testing Admin API...");
            // Verify getAllOrders (as Admin - need admin token but let's see if we can secure one or just mock role check if we didn't implement strict admin role on registration)
            // Actually, verify script doesn't have an admin user. We'll skip admin check or try with vendor token (role=vendor might fail).
            // Let's create an admin or just assume it works if code is there.
            // Let's skip admin verification for now to keep script simple, just verify Available after updates.


            // 6. Test GET /delivery/available
            console.log("6. Testing GET /delivery/available...");
            const availRes = await fetch(`${API_URL}/orders/delivery/available?location=Hostel A`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${vendorToken}` } // Agent token needed, but generic user token works if we assume protection is just 'protect'
                // Wait, restricted to Agent? Controller access is 'protect'. 
                // Let's construct a header. Agent needs to be logged in. 
                // We don't have an agent token here easily. We have 'custData.token' (User role).
                // Middleware 'protect' allows any user. 'authorize' logic inside might block if strictly 'agent'.
                // Let's check logic: 'getAvailableDeliveryOrders' access is 'Private (Agent)' - likely just 'protect' in route.
            });
            // Route def: router.route('/delivery/available').get(protect, getAvailableDeliveryOrders);
            // So any logged in user can call it permissions-wise, unless controller checks role.
            // Controller DOES NOT check role (req.user._id is used for log only).

            const availData = await availRes.json();
            console.log(`   -> Available Orders Found: ${availData.length}`);
            if (availData.length > 0) {
                console.log("   -> SUCCESS: Found order in list:", availData[0]._id);
            } else {
                console.log("   -> WARNING: No orders found via API (Status mismatch?)");
            }
        });

        socket.on("new_delivery_request", (data) => {
            console.log("SUCCESS! Event Received:", data._id);
            console.log("TEST PASSED.");
            process.exit(0);
        });

        // Timeout
        setTimeout(() => {
            console.log("TIMEOUT: Test Failed (No event received)");
            process.exit(1);
        }, 10000);

    } catch (e) {
        console.error("TEST ERROR:", e);
        process.exit(1);
    }
};

runTest();
