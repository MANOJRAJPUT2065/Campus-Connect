import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  userId: {
    type: String,
    ref: 'User',
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);
export default EventRegistration;
