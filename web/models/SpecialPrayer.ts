import mongoose, { Schema, model, models } from 'mongoose';

const SpecialPrayerSchema = new Schema(
  {
    mosqueId: {
      type: Schema.Types.ObjectId,
      ref: 'Mosque',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide special prayer title'],
      trim: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Please provide special prayer date'],
      index: true,
    },
    adhanTime: {
      type: String, // Optional, format: HH:MM
    },
    iqamahTime: {
      type: String, // Required, format: HH:MM
      required: [true, 'Please provide special prayer Iqamah time'],
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default models.SpecialPrayer || model('SpecialPrayer', SpecialPrayerSchema);
