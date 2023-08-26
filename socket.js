const User = require('./model/userModel');

let users = [];

const addUser = (userId, socketId) => {
    !users.some((user) => user.userId === userId) && users.push({ userId, socketId });
};

const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId);
};

const getOnlineFriends = (currentUser) => {
    return users.filter((user) => {
        const isFriend = currentUser.friends.some((friend) => {
            return friend.id === user.userId;
        });
        if (isFriend) {
            return user;
        }
    });
};
const socketIo = (io) => {
    io.on('connection', (socket) => {
        // Connect
        socket.on('join', async (userId) => {
            socket.join(userId);
            addUser(userId, socket.id);
            const currentUser = await User.findById(userId).populate('friends');
            const usersOnline = getOnlineFriends(currentUser);
            socket.emit('connected', [...usersOnline]);
            currentUser.friends.forEach((friend) => socket.in(friend.id).emit('getOnlines'));
        });

        // Get online friends
        socket.on('getOnlinesCurrently', async (userId) => {
            const currentUser = await User.findById(userId).populate('friends');
            const friendsOnline = getOnlineFriends(currentUser);
            socket.emit('currentlyOnlines', [...friendsOnline]);
        });

        // Receive noti from client
        socket.on('notification sending', (notification) => {
            socket.in(notification.receiver.id).emit('notification received', notification);
        });

        // Chat
        socket.on('joinRoom', (conversationId) => {
            socket.join(conversationId);
        });
        socket.on('typing', ({ conversationId, sender }) => {
            const { id, firstName, lastName, photo } = sender;
            socket.in(conversationId).emit('typing', { id, firstName, lastName, photo });
        });
        socket.on('stopTyping', ({ conversationId, sender }) => {
            const { id, firstName, lastName, photo } = sender;
            socket.in(conversationId).emit('stopTyping', { id, firstName, lastName, photo });
        });
        socket.on('sendingMessage', (message) => {
            socket.in(message.conversation).emit('messageReceived', message);
        });

        //when disconnect
        socket.on('disconnect', async () => {
            const currentUser = users.find((user) => user.socketId === socket.id);
            if (!currentUser) return;

            const user = await User.findById(currentUser.userId).populate('friends');
            removeUser(socket.id);
            user.friends.forEach((friend) => socket.in(friend.id).emit('getOnlines'));
            console.log('a user disconnected!');
        });
    });
};
module.exports = socketIo;
