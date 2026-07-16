/* ════════════════════════════════════════════════════════════════════
   Wildlife Guardian – Mongoose Schema: Feedback
   Collection: feedbacks
   ════════════════════════════════════════════════════════════════════ */
const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Họ tên là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên không quá 100 ký tự']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  type: {
    type: String,
    enum: ['suggestion', 'error', 'compliment', 'other'],
    default: 'suggestion'
  },
  /* ── Star rating (0 = chưa đánh giá, 1–5 sao) ── */
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  content: {
    type: String,
    required: [true, 'Nội dung phản hồi là bắt buộc'],
    minlength: [10, 'Nội dung tối thiểu 10 ký tự'],
    maxlength: [2000, 'Nội dung tối đa 2000 ký tự'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  }
}, {
  timestamps: true   /* tự động thêm createdAt + updatedAt */
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
