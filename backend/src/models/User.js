const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  displayName: String,
  accessToken: String,
  refreshToken: String,
  botPreferences: {
    prioritizeTypes: {
      type: [String],
      default: ['job', 'important'] // example defaults
    },
    ignoreTypes: {
      type: [String],
      default: ['promotions', 'spam']
    }
  },
  isSetupComplete: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
