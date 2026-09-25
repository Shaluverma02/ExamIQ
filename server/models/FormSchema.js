const mongoose = require('mongoose');

const FieldSchema = new mongoose.Schema({
  fieldId: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  fieldType: {
    type: String,
    enum: ['text', 'number', 'select', 'textarea', 'checkbox', 'date'],
    default: 'text',
  },
  required: {
    type: Boolean,
    default: false,
  },
  options: [{
    type: String,
  }],
  placeholder: {
    type: String,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  },
});

const FormSchema = new mongoose.Schema(
  {
    formType: {
      type: String,
      required: true,
      enum: ['college_registration', 'course_registration', 'student_registration'],
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    fields: [FieldSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

FormSchema.index({ collegeId: 1, formType: 1 }, { unique: true });

module.exports = mongoose.model('FormSchema', FormSchema);
