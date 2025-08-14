import mongoose from 'mongoose';

const signupSchema = new mongoose.Schema({
    id : { type: String, required: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true },
    profilePicture: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const Signin = mongoose.model('Signin', signupSchema, 'signin');