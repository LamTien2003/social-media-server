const mongoose = require('mongoose');

const ConversationSchema = mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        members: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
        latestMessage: { type: mongoose.Schema.ObjectId, ref: 'Message' },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

// ConversationSchema.pre('save', function (next) {
//     console.log(this.members);
//     next();
// });

const Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;
