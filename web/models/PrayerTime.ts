import mongoose, { Schema, model, models } from 'mongoose';

const TimePairSchema = new Schema({
  adhan: {
    type: String,
    required: [true, 'Adhan time is required'],
  },
  iqamah: {
    type: String,
    required: [true, 'Iqamah time is required'],
  },
}, { _id: false });

const PrayerTimeSchema = new Schema(
  {
    mosqueId: {
      type: Schema.Types.ObjectId,
      ref: 'Mosque',
      required: true,
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    sunrise: {
      type: String,
      required: true,
    },
    fajr: {
      type: TimePairSchema,
      required: true,
    },
    dhuhr: {
      type: TimePairSchema,
      required: true,
    },
    asr: {
      type: TimePairSchema,
      required: true,
    },
    maghrib: {
      type: TimePairSchema,
      required: true,
    },
    isha: {
      type: TimePairSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique prayer times for a mosque per date
PrayerTimeSchema.index({ mosqueId: 1, date: 1 }, { unique: true });

export default models.PrayerTime || model('PrayerTime', PrayerTimeSchema);
