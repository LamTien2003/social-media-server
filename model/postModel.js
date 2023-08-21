const mongoose = require('mongoose');
const moment = require('moment');

const postSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'The post must belong to someone'],
        },
        content: {
            type: String,
            maxlength: [1000, 'Description of the post should be less than 1000 character'],
        },
        imagePost: {
            type: [String],
            default: [],
        },
        likes: [
            {
                user: { type: mongoose.Schema.ObjectId, ref: 'User' },
                emotion: {
                    type: String,
                    enum: ['like', 'haha', 'sad', 'angry', 'wow', 'heart'],
                    default: 'like',
                },
            },
        ],
        isDelete: Boolean,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

// Have to use .populate('comments') to have comments property when find document
postSchema.virtual('comments', {
    ref: 'Comment',
    foreignField: 'postId',
    localField: '_id',
    default: [],
});

postSchema.virtual('createdAtFromNow').get(function () {
    return moment(this.createdAt).fromNow();
});
postSchema.virtual('updatedAtFromNow').get(function () {
    return moment(this.updatedAt).fromNow();
});

postSchema.pre(/^find/, function (next) {
    this.select('-__v');
    next();
});
const Post = mongoose.model('Post', postSchema);

module.exports = Post;
