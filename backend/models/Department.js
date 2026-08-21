import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  officerCount: { type: Number, default: 0 },
  officers: [{
    name: { type: String, required: true },
    email: { type: String },
    isAvailable: { type: Boolean, default: true }
  }]
}, { timestamps: true });

departmentSchema.set("toJSON", { virtuals: true });
departmentSchema.set("toObject", { virtuals: true });

const Department = mongoose.model("Department", departmentSchema);
export default Department;
