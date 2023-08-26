const mongoose = require('mongoose');

const MessageSchema = mongoose.Schema(
    {
        sender: { type: mongoose.Schema.ObjectId, ref: 'User' },
        content: { type: String, trim: true },
        conversation: { type: mongoose.Schema.ObjectId, ref: 'Conversation' },
        readBy: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
