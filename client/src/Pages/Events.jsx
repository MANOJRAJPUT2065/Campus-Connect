// import { useState, useEffect } from 'react';
// import { BiCalendar, BiTime, BiMap } from 'react-icons/bi';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import EventList from '../Components/EventList';
// const Events = () => {
//   const [events, setEvents] = useState([]);
//   const [expanded, setExpanded] = useState({});
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await axios.get("http://localhost:7071/events/getEvents");

//         const sortedEvents = response.data.sort((a, b) => {
//           return new Date(a.eventDate) - new Date(b.eventDate);
//         });
//         setEvents(sortedEvents);
//       } catch (error) {
//         console.error('Error fetching events:', error);
//       }
//     };

//     fetchData();
//   }, []);

//   const trimDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       month: 'long',
//       day: 'numeric',
//       year: 'numeric',
//     });
//   };

//   const handleRegister = (event) => {
//     navigate('/addEvent', { state: event });
//   };

//   const toggleExpand = (id) => {
//     setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
//   };

//   return (
//     <div className="EventsContainer w-full flex flex-col justify-center items-center gap-5">
//       <div className="timeLine w-1/2 mb-20 p-8 rounded-lg bg-gray-200">
//         <h1 className="text-3xl mb-4 font-extrabold text-black text-center">Timeline</h1>

//         <ol className="relative border-l border-gray-300">
//           {events.map((event) => {
//             const isExpanded = expanded[event._id];
//             const isLong = event.eventDescription.length > 150;
//             const displayDescription = isExpanded
//               ? event.eventDescription
//               : event.eventDescription.slice(0, 150);

//             return (
//               <li key={event._id} className="mb-10 ml-4">
//                 <div className="absolute w-3 h-3 bg-gray-300 rounded-full mt-1.5 -left-1.5 border border-white"></div>
//                 <div className="flex items-center mb-1 text-lg font-semibold text-gray-700">
//                   <BiCalendar className="inline-block mr-1" /> {trimDate(event.eventDate)}
//                 </div>
//                 <div className="flex items-center mb-1 text-lg font-semibold text-gray-700">
//                   <BiTime className="inline-block mr-1" /> {event.eventTime}
//                 </div>
//                 <div className="flex items-center mb-1 text-lg font-semibold text-gray-700">
//                   <BiMap className="inline-block mr-1" /> {event.venue}
//                 </div>
//                 <h3 className="text-2xl font-extrabold text-black">
//                   {event.eventName} - {event.clubName}
//                 </h3>
//                 <p className="mb-2 text-lg font-normal text-gray-800">
//                   {displayDescription}
//                   {isLong && !isExpanded && '...'}
//                 </p>

//                 {isLong && (
//                   <button
//                     className="text-blue-600 underline mb-3"
//                     onClick={() => toggleExpand(event._id)}
//                   >
//                     {isExpanded ? 'Read Less' : 'Read More'}
//                   </button>
//                 )}

//                 <button
//                   onClick={() => handleRegister(event)}
//                   className="inline-flex items-center px-4 py-2 text-lg font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-blue-700"
//                 >
//                   Register
//                   <svg
//                     className="w-4 h-4 ml-2 rtl:rotate-180"
//                     aria-hidden="true"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 14 10"
//                   >
//                     <path
//                       stroke="currentColor"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M1 5h12m0 0L9 1m4 4L9 9"
//                     />
//                   </svg>
//                 </button>
//               </li>
//             );
//           })}
//         </ol>
//       </div>
//       <EventList/>
//     </div>
//   );
// };

// export default Events;

import { useNavigate } from 'react-router-dom';
import EventList from '../Components/EventList';
import { motion } from 'framer-motion';

const Events = () => {
  const navigate = useNavigate();

  const handleAddNewEvent = () => {
    navigate('/addEvent');
  };

  return (
    <motion.div
      className="EventsContainer w-full flex flex-col justify-center items-center gap-5 p-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Add New Event Button */}
      <motion.div
        className="mb-6"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <button
          onClick={handleAddNewEvent}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded shadow-lg hover:bg-green-700 transition-colors duration-300"
        >
          Add New Event
        </button>
      </motion.div>

      {/* EventList Component */}
      <EventList />
    </motion.div>
  );
};

export default Events;
