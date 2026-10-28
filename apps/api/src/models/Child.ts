import { Schema, model, type InferSchemaType } from 'mongoose';

const childSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    /** YYYY-MM-DD, kept as a string so the date never shifts with time zones. */
    birthDate: { type: String, required: true },
    /** Parents linked to this child. Every child-scoped request is checked against this list. */
    parents: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [], index: true },
    /** The child's own login, created only from age 10 (US-02). */
    account: { type: Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export type Child = InferSchemaType<typeof childSchema>;
export const ChildModel = model('Child', childSchema);
