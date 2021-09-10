import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';

export enum SequenceType {
  PROJECT= 'PROJECT',
  ORGANIZATION= 'ORGANIZATION'
}

const sequenceSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [SequenceType.PROJECT, SequenceType.ORGANIZATION]
    },
    reference: {
      type: Schema.Types.ObjectId,
      required: true
    },
    key: {
      type: String,
      required: true
    },
    seq: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true,
    collection: 'project_manager__sequence'
  }
);

export const SequenceSchema = Db.connection.model('Sequence', sequenceSchema);
