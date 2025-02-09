// import Event from '../models/Event.js';
// import cloudinary from 'cloudinary';

// export const addEvent = async (req, res) => {
//     try {
//         const { clubName, clubCoordinator, contactNumber, eventName, eventDescription, eventDate, eventTime, venue, registrationLink } = req.body;

//         const image = req.file.path;

//         const result = await cloudinary.uploader.upload(image);
//         const newEvent = new Event({
//             clubName,
//             clubCoordinator,
//             contactNumber,
//             eventName,
//             eventDescription,
//             eventDate,
//             eventTime,
//             venue,
//             registrationLink,
//             eventImage: result.secure_url 
//         });

//         const savedEvent = await newEvent.save();
//         res.json(savedEvent);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Server Error" });
//     }
// };

// export const getAllEvents = async (req, res) => {
//     try {
//         const events = await Event.find();
//         res.json(events);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Server Error" });
//     }
// };


import Event from '../models/Event.js';
import cloudinary from 'cloudinary'; // Not necessary to use this here anymore

export const addEvent = async (req, res) => {
    try {
        console.log(req.file); // Check if req.file exists and contains a path

        const { clubName, clubCoordinator, contactNumber, eventName, eventDescription, eventDate, eventTime, venue, registrationLink } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Image file is required." });
        }

        const imageUrl = req.file.path; // The Cloudinary URL of the uploaded image

        const newEvent = new Event({
            clubName,
            clubCoordinator,
            contactNumber,
            eventName,
            eventDescription,
            eventDate,
            eventTime,
            venue,
            registrationLink,
            eventImage: imageUrl // Save Cloudinary image URL
        });

        const savedEvent = await newEvent.save();
        res.json(savedEvent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};


export const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};
