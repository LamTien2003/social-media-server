const mongoose = require('mongoose');
const moment = require('moment');

const reportSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'The report must belong to someone'],
        },
        post: {
            type: mongoose.Schema.ObjectId,
            ref: 'Post',
            required: [true, 'The report must belong to certain post'],
        },
        userPost: {
            type: mongoose.Schema.ObjectId,
            required: [true, 'The report must belong to certain user who post the post'],
        },
        reason: {
            type: String,
            maxlength: [250, 'The Reason for report should be less than 100 character'],
            required: [true, 'The report must have reason'],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);
reportSchema.virtual('createdAtFromNow').get(function () {
    return moment(this.createdAt).fromNow();
});
reportSchema.virtual('updatedAtFromNow').get(function () {
    return moment(this.updatedAt).fromNow();
});

reportSchema.pre(/^find/, function (next) {
    this.select('-__v');
    next();
});

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
