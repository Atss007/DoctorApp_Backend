const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['Speciality', 'Condition'], // e.g., Specialty (Heart Surgeon) or Condition (Heart Attack)
        // required: true
    },
    categoryImage: {
        key: {
            type: String,
        },
        url: {
            type: String
        }
    }
});

const categoryModel = mongoose.model('CategoryModel', categorySchema);

module.exports = categoryModel;