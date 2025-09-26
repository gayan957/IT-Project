import mongoose from "mongoose";
const { Schema, model } = mongoose;

const telemetrySchema = new Schema(
  {
    bin: { type: Schema.Types.ObjectId, ref: "Bin", index: true, required: true },
    fillLevel: { type: Number, min: 0, max: 100, required: true },
    distance_cm: { type: Number },     // nullable
    lid_open: { type: Boolean, default: false }
  },
  { timestamps: true }
);

telemetrySchema.index({ bin: 1, createdAt: -1 });
export default model("Telemetry", telemetrySchema);