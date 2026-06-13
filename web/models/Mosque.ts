import mongoose, { Schema, model, models } from 'mongoose';

const JumuahSessionSchema = new Schema({
  sessionNumber: {
    type: Number,
  },
  khutbah: {
    type: String,
    required: [true, 'Please provide Khutbah time'],
  },
  iqamah: {
    type: String,
    required: [true, 'Please provide Iqamah time'],
  },
});

const MosqueSchema = new Schema(
  {
    mosqueName: {
      type: String,
      required: [true, 'Please provide mosque name'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please provide address'],
    },
    city: {
      type: String,
      required: [true, 'Please provide city'],
      index: true,
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'Please provide district'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Please provide country'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    logo: {
      type: String, // URL or base64 image representation
    },
    latitude: {
      type: Number,
      required: [true, 'Please provide latitude coordinates'],
    },
    longitude: {
      type: Number,
      required: [true, 'Please provide longitude coordinates'],
    },
    jumuahSessions: {
      type: [JumuahSessionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default models.Mosque || model('Mosque', MosqueSchema);
