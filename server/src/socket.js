let io;

const initSocket = (server) => {
    const { Server } = require("socket.io");
    io = new Server(server, {
        cors: {
            origin: "*", // Allow all origins for development
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("New client connected: " + socket.id);

        socket.on("join_delivery", ({ userId, location }) => {
            const normalizedLocation = location.trim().toLowerCase().replace(/\s+/g, '_');
            console.log(`User ${userId} joined delivery room for location: '${location}' -> '${normalizedLocation}'`);
            socket.join(`delivery_${normalizedLocation}`);
            // Also join a global room if needed
            socket.join("delivery_agents");
        });

        socket.on("leave_delivery", ({ userId, location }) => {
            const normalizedLocation = location.trim().toLowerCase().replace(/\s+/g, '_');
            console.log(`User ${userId} LEFT delivery room for location: '${location}'`);
            socket.leave(`delivery_${normalizedLocation}`);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected: " + socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIO };
