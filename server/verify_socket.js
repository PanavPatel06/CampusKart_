const io = require("socket.io-client");
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Vendor = require('./src/models/Vendor');
const User = require('./src/models/User');
const { updateOrderStatus } = require('./src/controllers/orderController'); // We might need to mock req/res or call logic directly
require('dotenv').config();

// Mock Express Request/Response
const mockReq = (body, user, params) => ({ body, user, params });
const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
};

const runTest = async () => {
    console.log("=== STARTING DELIVERY FLOW VERIFICATION ===");

    // 1. Setup DB Connection
    await mongoose.connect(process.env.MONGO_URI);
    console.log("1. DB Connected");

    // 2. Create Dummy Data
    const vendorUser = await User.findOne({ email: 'vendor@test.com' }) || await User.create({ name: 'TestVendor', email: 'vendor@test.com', password: 'hash', role: 'vendor' });
    const vendor = await Vendor.findOne({ user: vendorUser._id }) || await Vendor.create({ user: vendorUser._id, storeName: 'TestStore', location: 'Hostel A' }); // Note "Hostel A"

    const customer = await User.findOne({ email: 'cust@test.com' }) || await User.create({ name: 'TestCust', email: 'cust@test.com', password: 'hash' });

    const order = await Order.create({
        customer: customer._id,
        vendor: vendor._id,
        items: [{ name: 'TestItem', price: 10, qty: 1 }],
        totalAmount: 10,
        status: 'pending'
    });
    console.log(`2. Created Order ${order._id} for Vendor at '${vendor.location}'`);

    // 3. Connect Socket Client (The Agent)
    const socket = io("http://localhost:5001");

    const agentLocation = "Hostel A"; // MATCHING LOCATION

    return new Promise((resolve, reject) => {
        socket.on("connect", () => {
            console.log("3. Socket Connected. ID:", socket.id);

            // Join Room
            socket.emit("join_delivery", { userId: "agent123", location: agentLocation });
            console.log(`4. Emitted join_delivery for '${agentLocation}'`);

            // Start Listening
            socket.on("new_delivery_request", (data) => {
                console.log(">>> SUCCESS: Received 'new_delivery_request' event!");
                console.log("   Order ID:", data._id);
                console.log("   Vendor Loc:", data.vendor.location);

                // Cleanup
                cleanup(order._id);
                resolve();
            });

            // Trigger the Event after short delay to ensure room join
            setTimeout(async () => {
                console.log("5. Triggering Order Update (Simulating Vendor Accept)...");
                try {
                    // Manually simulate the Controller Logic to avoid HTTP overhead issues in script
                    // We can just call the status update logic or hitting the endpoint? 
                    // Let's use fetch if server is running, or DB update if we want to test pure logic.
                    // But the emitting happens IN the controller. So we must trigger the controller.

                    // We will just invoke the DB update + Emit logic block manually to test the EMITTER.
                    // Actually, the server IS running (Step Id 981). So let's just use `fetch` to hit the real API.

                    // Wait, we need auth token. Too complex. 
                    // Let's just USE THE DB + REQUIRE SOCKET to trigger it internally?
                    // No, `orderController` uses `require('../socket').getIO()`.
                    // If we run this script separately, `getIO()` will fail because WE didn't init the server in THIS process.

                    // ERROR: We cannot test "Server Emit" from a separate script unless we hit the API.
                    // So we MUST hit the API.

                    // ALTERNATIVE: We can just use the running server.
                    // We need a way to trigger the API without auth for this test? 
                    // No, let's just rely on the user manual test.

                    // WAIT. The user said "Test it yourself".
                    // I will create a script that CONNECTS as client, and waits.
                    // AND I will use a separate `curl` command (simulated) or just `fetch` with a simpler auth bypass if possible.

                    // Let's try to just update the Order in DB and EMIT manually in this script?
                    // No, that won't test the REAL server.

                    // OK, Plan B:
                    // This script is ONLY the LISTENER.
                    // I will run this script. It connects and waits.
                    // THEN, I (the agent) will trigger the API via `curl` (mocking the vendor).

                    console.log("WAITING FOR EVENT... (Manually trigger API or use separate curl)");

                    // To auto-trigger:
                    // I need to login as vendor.
                    // I'll skip the auto-trigger here and do it via curl in next step.

                } catch (e) {
                    console.error(e);
                }
            }, 1000);

            // Timeout fail safe
            setTimeout(() => {
                console.error("!!! FAILURE: Did not receive event after 10 seconds.");
                cleanup(order._id);
                process.exit(1);
            }, 10000);
        });
    });
};

async function cleanup(orderId) {
    if (orderId) await Order.findByIdAndDelete(orderId);
    // await User.deleteMany({ email: /test.com/ }); 
    // await Vendor.deleteMany({ storeName: 'TestStore' });
    console.log("Cleanup Done.");
    process.exit(0);
}

runTest();
