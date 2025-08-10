


// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import './App.css';

// import Navbar from './Components/Navbar';
// import Feed from './Pages/Feed';
// import Events from './Pages/Events';
// import Academics from './Pages/Academics';
// import Notices from './Pages/Notices';
// import Account from './Pages/Account';
// import AddPostForm from './Pages/AddPost';
// import EventForm from './Components/EventForm';
// import MessageSection from './Pages/MessageSection/Message';

// function App() {
//   return (
//     <div className="relative min-h-screen overflow-hidden">
//       {/* Animated background */}
//       <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-500 animate-gradientBlur z-0" />

//       {/* Blur overlay to give a nice soft effect */}
//       <div className="absolute top-0 left-0 w-full h-full backdrop-blur-sm bg-opacity-30 z-10" />

//       <Router>
//         {/* Navbar on top layer */}
//         <div className="relative z-20">
//           <Navbar />
//         </div>

//         {/* Content */}
//         <div className="content relative z-20 p-4">
//           <ToastContainer />
//           <Routes>
//             <Route path="/" element={<Feed />} />
//             <Route path="/events" element={<Events />} />
//             <Route path="/academics" element={<Academics />} />
//             <Route path="/notices" element={<Notices />} />
//             <Route path="/account/:id" element={<Account />} />
//             <Route path="/addpost" element={<AddPostForm />} />
//             <Route path="/addEvent" element={<EventForm />} />
//             <Route path="/message/:recieverId" element={<MessageSection />} />
//           </Routes>
//         </div>
//       </Router>
//     </div>
//   );
// }

// export default App;


import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import Navbar from './Components/Navbar';
import Feed from './Pages/Feed';
import Events from './Pages/Events';
import Academics from './Pages/Academics';
import Notices from './Pages/Notices';
import Account from './Pages/Account';
import AddPostForm from './Pages/AddPost';
import EventForm from './Components/EventForm';
import MessageSection from './Pages/MessageSection/Message';

function App() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-[length:400%_400%]" />

      <Router>
        <Navbar />
        <div className="content relative px-4 py-6">
          <ToastContainer />
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/events" element={<Events />} />
            <Route path="/academics" element={<Academics />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/account/:id" element={<Account />} />
            <Route path="/addpost" element={<AddPostForm />} />
            <Route path="/addEvent" element={<EventForm />} />
            <Route path="/message/:recieverId" element={<MessageSection />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
