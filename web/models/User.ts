import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
    },
    role: {
      type: String,
      enum: ['super_admin', 'mosque_admin', 'community_user'],
      default: 'community_user',
    },
    mosqueId: {
      type: Schema.Types.ObjectId,
      ref: 'Mosque',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default models.User || model('User', UserSchema);
