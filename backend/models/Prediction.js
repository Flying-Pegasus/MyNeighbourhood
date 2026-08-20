import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  riskFactor: { type: Number, default: 0.5 },
  reason: { type: String }
}, { timestamps: true });

predictionSchema.set("toJSON", { virtuals: true });
predictionSchema.set("toObject", { virtuals: true });

const Prediction = mongoose.model("Prediction", predictionSchema);
export default Prediction;
