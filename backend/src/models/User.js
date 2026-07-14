const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },

    role: {
      type: String,
      enum: ['entrepreneur', 'investor'],
      required: [true, 'Role is required'],
    },

    bio: {
      type: String,
      default: '',
    },

    profilePhoto: {
      type: String,
      default: '',
    },

    location: {
      type: String,
      default: '',
    },

    phone: {
      type: String,
      default: '',
    },
  balance: {
  type: Number,
  default: 0,
},

    // Entrepreneur specific fields
    startupName: {
      type: String,
      default: '',
    },

    startupStage: {
      type: String,
      enum: ['', 'idea', 'mvp', 'growth', 'scaling'],
      default: '',
    },

    industry: {
      type: String,
      default: '',
    },

    fundingNeeded: {
      type: Number,
      default: 0,
    },

    pitchDeck: {
      type: String,
      default: '',
    },

    website: {
      type: String,
      default: '',
    },

    // Investor specific fields
    investmentFocus: {
      type: [String],
      default: [],
    },

    minimumInvestment: {
      type: Number,
      default: 0,
    },

    maximumInvestment: {
      type: Number,
      default: 0,
    },

    portfolioCompanies: {
      type: [String],
      default: [],
    },

    preferredStages: {
      type: [String],
      default: [],
    },

    // Connection fields
    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    pendingRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords on login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;