import mongoose from 'mongoose';


const authorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address.'],
    },
    password: {
        type: String,  //password hash
        required: true,
    },
    bio: {
        type: String,
        maxlength: 600,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

// index for quick searching by name
authorSchema.index({ name: 1 })

const Author = mongoose.model('Author', authorSchema) 
export default Author

