// /* eslint-disable no-unused-vars */
// import  { useState } from 'react';
// import axios from 'axios';
// import BASE_API from '../api';
// import {  toast } from 'react-toastify';

// const EventForm = () => {
//     const [formData, setFormData] = useState({
//         clubName: '',
//         clubCoordinator: '',
//         contactNumber: '',
//         eventName: '',
//         eventDescription: '',
//         eventDate: '',
//         eventTime: '',
//         venue: '',
//         registrationLink: '',
//         eventImage: null
//     });

//     const handleChange = (e) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     const handleImageChange = (e) => {
//         setFormData({ ...formData, eventImage: e.target.files[0] });
//     };

//   const handleSubmit = async (e) => {
//   e.preventDefault();
//   const { clubName, clubCoordinator, contactNumber, eventName, eventDescription, eventDate, eventTime, venue, registrationLink, eventImage } = formData;

//   if (!(eventImage instanceof File)) {
//     toast.error("Image file is missing");
//     return;
//   }

//   const data = new FormData();
//   data.append('clubName', clubName);
//   data.append('clubCoordinator', clubCoordinator);
//   data.append('contactNumber', contactNumber);
//   data.append('eventName', eventName);
//   data.append('eventDescription', eventDescription);
//   data.append('eventDate', eventDate);
//   data.append('eventTime', eventTime);
//   data.append('venue', venue);
//   data.append('registrationLink', registrationLink);
//   data.append('eventImage', eventImage); // ✅ Make sure this key matches `upload.single('eventImage')`

//   try {
//     const res = await axios.post('http://localhost:7071/events/addEvent', data); // ❌ Don't set Content-Type
//     toast.success("✅ Event Added");
//   } catch (err) {
//     console.error("❌ Event Upload Error:", err);
//     toast.error("Something went wrong!");
//   }
// };

    

//     return (
// <form className="w-1/2 mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 mt-8" onSubmit={handleSubmit}>
//     <div className="mb-4">
//         <h1 className='text-center text-xl text-black font-bold'>Club Details</h1>
//         <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clubName">
//             Club Name
//         </label>
//         <input
//             className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline placeholder:text-gray-600"
//             id="clubName"
//             name="clubName"
//             type="text"
//             placeholder="Club Name"
//             onChange={handleChange}
//             required
//         />
//     </div>
//     <div className="mb-4">
//         <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clubCoordinator">
//             Club Coordinator
//         </label>
//         <input
//             className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline placeholder:text-gray-600"
//             id="clubCoordinator"
//             name="clubCoordinator"
//             type="text"
//             placeholder="Club Coordinator"
//             onChange={handleChange}
//             required
//         />
//     </div>
//     <div className="mb-4">
//         <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactNumber">
//             Contact Number
//         </label>
//         <input
//             className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline placeholder:text-gray-600"
//             id="contactNumber"
//             name="contactNumber"
//             type="text"
//             placeholder="Contact Number"
//             onChange={handleChange}
//             required
//         />
//     </div>
//     <h1 className='text-center text-xl text-black font-bold'>Event Details</h1>

//     <div className="mb-4">
//         <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eventName">
//             Event Name
//         </label>
//         <input
//             className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline placeholder:text-gray-600"
//             id="eventName"
//             name="eventName"
//             type="text"
//             placeholder="Event Name"
//             onChange={handleChange}
//             required
//         />
//     </div>
//     <div className="mb-4">
//         <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eventDescription">
//             Event Description
//         </label>
//         <textarea
//             className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline placeholder:text-gray-600"
//             id="eventDescription"
//             name="eventDescription"
//             placeholder="Event Description"
//             onChange={handleChange}
//             required
//         ></textarea>
//     </div>
//     <div className="mb-4">
//         <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eventDate">
//             Event Date
//         </label>
//         <input
//             className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline placeholder:text-gray-600"
//             id="eventDate"
//             name="eventDate"
//             type="date"
//             onChange={handleChange}
//             required
//         />
//     </div>
//     <div className="mb-4">
//         <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eventTime">
//             Event Time
//         </label>
//         <input
//             className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline placeholder:text-gray-600"
//             id="eventTime"
//             name="eventTime"
//             type="time"
//             onChange={handleChange}
//             required
//         />
//     </div>
//     <div className="mb-4">
//         <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="venue">
//             Venue
//         </label>
//         <input
//             className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline placeholder:text-gray-600"
//             id="venue"
//             name="venue"
//             type="text"
//             placeholder="Venue"
//             onChange={handleChange}
//             required
//         />
//     </div>
//     <div className="mb-4">
//         <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="registrationLink">
//             Registration Link
//         </label>
//         <input
//             className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline placeholder:text-gray-600"
//             id="registrationLink"
//             name="registrationLink"
//             type="text"
//             placeholder="Registration Link"
//             onChange={handleChange}
//             required
//         />
//     </div>
//     <div className="mb-4">
//         <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eventImage">
//             Event Image
//         </label>
//         <input
//             className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline placeholder:text-gray-600"
//             id="eventImage"
//             name="eventImage"
//             type="file"
//             onChange={handleImageChange}
//             required
//         />
//     </div>
//     <div className="flex items-center justify-between">
//               <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline placeholder:text-gray-600" type="submit">
//                   Submit
//               </button>
//           </div>
//       </form>
//   );
  
// };

// export default EventForm;




/* eslint-disable no-unused-vars */
import { useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import { toast } from 'react-toastify';

const EventForm = () => {
  const [formData, setFormData] = useState({
    clubName: '',
    clubCoordinator: '',
    contactNumber: '',
    eventName: '',
    eventDescription: '',
    eventDate: '',
    eventTime: '',
    venue: '',
    registrationLink: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(buildApiUrl('/events/addEvent'), formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      toast.success("✅ Event Added Successfully");
    } catch (err) {
      console.error("❌ Error adding event:", err);
      toast.error("Something went wrong!");
    }
  };

  return (
    <form className="w-1/2 mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 mt-8" onSubmit={handleSubmit}>
      <h1 className='text-center text-xl text-black font-bold mb-4'>Club Details</h1>

      <InputField name="clubName" label="Club Name" onChange={handleChange} />
      <InputField name="clubCoordinator" label="Club Coordinator" onChange={handleChange} />
      <InputField name="contactNumber" label="Contact Number" onChange={handleChange} />

      <h1 className='text-center text-xl text-black font-bold mb-4'>Event Details</h1>

      <InputField name="eventName" label="Event Name" onChange={handleChange} />
      <TextAreaField name="eventDescription" label="Event Description" onChange={handleChange} />
      <InputField name="eventDate" label="Event Date" type="date" onChange={handleChange} />
      <InputField name="eventTime" label="Event Time" type="time" onChange={handleChange} />
      <InputField name="venue" label="Venue" onChange={handleChange} />
      <InputField name="registrationLink" label="Registration Link" onChange={handleChange} />

      <div className="flex items-center justify-between mt-6">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
          Submit
        </button>
      </div>
    </form>
  );
};

// Reusable Input component
const InputField = ({ name, label, type = "text", onChange }) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={name}>
      {label}
    </label>
    <input
      className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline placeholder:text-gray-600"
      id={name}
      name={name}
      type={type}
      placeholder={label}
      onChange={onChange}
      required
    />
  </div>
);

// Reusable Textarea component
const TextAreaField = ({ name, label, onChange }) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={name}>
      {label}
    </label>
    <textarea
      className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline placeholder:text-gray-600"
      id={name}
      name={name}
      placeholder={label}
      onChange={onChange}
      required
    ></textarea>
  </div>
);

export default EventForm;


