import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  images: [{
    type: String
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  weightOptions: [{
    weight: {
      type: String,
      enum: ['½ kg', '1 kg', '2 kg'],
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  isEggless: {
    type: Boolean,
    default: false
  },
  hasEggOption: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  orderCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPreOrder: {
    type: Boolean,
    default: false,
    description: 'If true, product is available for pre-order.'
  },
  preOrderAvailableDate: {
    type: Date,
    default: null,
    description: 'Date from which pre-order is available.'
  },
  preOrderDeliveryDate: {
    type: Date,
    default: null,
    description: 'Estimated delivery date for pre-orders.'
  }
}, {
  timestamps: true
});

export default mongoose.model('Product', productSchema);

