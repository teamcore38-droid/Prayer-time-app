import mongoose, { Schema, model, models } from 'mongoose';

const AnnouncementSchema = new Schema(
  {
    mosqueId: {
      type: Schema.Types.ObjectId,
      ref: 'Mosque',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide announcement title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide announcement description'],
      trim: true,
    },
    image: {
      type: String, // Optional URL to image
    },
    category: {
      type: String,
      enum: ['Quran Class', 'Event', 'Fundraiser', 'Ramadan Notice', 'General'],
      default: 'General',
    },
  },
  {
    timestamps: true,
  }
);

export default models.Announcement || model('Announcement', AnnouncementSchema);
