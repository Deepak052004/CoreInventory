import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['admin', 'manager', 'user'], default: 'user' },
    // OTP fields for password reset (OTP is hashed before saving)
    otpCode: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    otpVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password only when password field is modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** Compare plain OTP with stored hashed OTP */
userSchema.methods.compareOtp = async function (plainOtp) {
  if (!this.otpCode) return false;
  return bcrypt.compare(plainOtp, this.otpCode);
};

/** Clear OTP fields after successful reset or expiry */
userSchema.methods.clearOtp = function () {
  this.otpCode = undefined;
  this.otpExpires = undefined;
  this.otpVerified = false;
};

export default mongoose.model('User', userSchema);
