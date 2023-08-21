const mongoose = require('mongoose');
const moment = require('moment');

const commentSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'The comment must belong to someone'],
        },
        postId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Post',
            required: [true, 'The comment must belong to certain post'],
        },
        comment: {
            type: String,
            maxlength: [250, 'The comment should be less than 250 character'],
        },
        imageComment: String,
        reply: [
            {
                type: String,
                maxlength: [250, 'The comment replay should be less than 250 character'],
            },
        ],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);
commentSchema.virtual('createdAtFromNow').get(function () {
    return moment(this.createdAt).fromNow();
});
commentSchema.virtual('updatedAtFromNow').get(function () {
    return moment(this.updatedAt).fromNow();
});

commentSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'firstName lastName photo',
    });
    this.select('-__v');
    next();
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
