import mongoose, { Schema, model, models } from 'mongoose';

const NotificationDeviceSchema = new Schema(
  {
    fcmToken: {
      type: String,
      required: [true, 'Please provide FCM token'],
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    subscribedMosques: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Mosque',
      },
    ],
    platform: {
      type: String,
      enum: ['android', 'ios'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default models.NotificationDevice || model('NotificationDevice', NotificationDeviceSchema);
