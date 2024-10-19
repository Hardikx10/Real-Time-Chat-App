
const { User, Message, Room } = require('./models');

const socketHandler = (io) => {
    // Track active users and their rooms
    const activeUsers = new Map(); // socketId -> { userId, username, roomId }

    const broadcastRoomUsers = async (roomId) => {
        const roomUsers = Array.from(activeUsers.values())
            .filter(user => user.roomId === roomId)
            .map(user => ({
                userId: user.userId,
                username: user.username
            }));
            
        io.to(roomId).emit('roomUsers', roomUsers);
    };

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('typing', ({ roomId, userId, username }) => {
          socket.to(roomId).emit('userTyping', { userId, username });
        });

        socket.on('stopTyping', ({ roomId, userId, username }) => {
          socket.to(roomId).emit('userStoppedTyping', { userId, username });
        });


        socket.on('joinRoom', async ({ roomId, userId, username }) => {
            try {
                // Leave previous room if exists
                const previousRoom = activeUsers.get(socket.id)?.roomId;
                if (previousRoom) {
                    socket.leave(previousRoom);
                    activeUsers.delete(socket.id);
                    await broadcastRoomUsers(previousRoom);
                }

                // Join new room
                const room = await Room.findById(roomId);
                if (!room) {
                    socket.emit('error', 'Room not found');
                    return;
                }

                // Update room users if needed
                if (!room.users.includes(userId)) {
                    await Room.findByIdAndUpdate(roomId, {
                        $addToSet: { users: userId }
                    });
                }

                socket.join(roomId);
                activeUsers.set(socket.id, { userId, username, roomId });

                // Notify room
                // socket.to(roomId).emit('userJoined', {
                //     username,
                //     message: `${username} has joined the room`,
                //     timestamp: new Date()
                // });

                await broadcastRoomUsers(roomId);

            } catch (error) {
                console.error('Error joining room:', error);
                socket.emit('error', 'Failed to join room');
            }
        });

        socket.on('createRoom', (newRoom) => {
            
            io.emit('newRoomCreated', newRoom);
        });

        socket.on('viewRoom', async ({ roomId }) => {
            try {
                const messages = await Message.find({ room: roomId })
                    .populate('user', 'username')
                    .sort({ timestamp: 1 })
                    .lean();

                socket.emit('roomHistory', { messages });
            } catch (error) {
                console.error('Error fetching messages:', error);
                socket.emit('error', 'Failed to fetch messages');
            }
        });

        socket.on('sendMessage', async ({ roomId, userId, message, username }) => {
            try {
                const newMessage = new Message({
                    room: roomId,
                    user: userId,
                    message: message.trim(),
                    timestamp: new Date()
                });

                await newMessage.save();

                // Broadcast to everyone in the room including sender
                io.to(roomId).emit('chatMessage', {
                    msgId: newMessage._id,
                    roomId,
                    userId,
                    username,
                    message: newMessage.message,
                    timestamp: newMessage.timestamp
                });

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', 'Failed to send message');
            }
        });

        socket.on('leaveRoom', async ({ roomId }) => {
            socket.leave(roomId);
            const user = activeUsers.get(socket.id);
            if (user) {
                activeUsers.delete(socket.id);
                await broadcastRoomUsers(roomId);
                // socket.to(roomId).emit('userLeft', {
                //     username: user.username,
                //     message: `${user.username} has left the room`,
                //     timestamp: new Date()
                // });
            }
        });

        socket.on('disconnect', async () => {
            const user = activeUsers.get(socket.id);
            if (user) {
                const { roomId, username } = user;
                activeUsers.delete(socket.id);
                await broadcastRoomUsers(roomId);
                // socket.to(roomId).emit('userLeft', {
                //     username,
                //     message: `${username} has disconnected`,
                //     timestamp: new Date()
                // });
            }
        });
    });
};

module.exports = socketHandler;