const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const Appointment = require("../models/appointmentModel");
const cron = require("node-cron")
const moment = require('moment-timezone');
const Notification = require("../models/notificationModel");
const admin = require("firebase-admin")
const { sendNotification } = require("../helper/handleNotifications");


// SCHEDULE A PATIENT's APPOINTMENT: 
module.exports.scheduleAppointment = async (req, res) => {
    try {
        // getting patient's id: (from login):
        const patientId = req.user._id;

        // getting doctor's id:
        const doctorId = req.params.doctorId;

        // finding doctor: 
        const doctor = await Doctor.findById(doctorId);

        // if no doctor is found: 
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found!!"
            })
        }

        // finding patient and patient's fcm token:
        const patient = await Patient.findById(patientId);
        const fcmToken = patient.fcmToken
        const doctorFCMToken = doctor.fcmToken;

        // getting appointment data:
        const { date, time, status, remindMeBefore } = req.body;

        // creating a new appointment (with status as pending until the doctor confirms): 
        const newAppointment = new Appointment({
            patient: patientId,
            doctor: doctorId,
            date,
            time,
            status: "Pending",
            createdAt: Date.now(),
            remindMeBefore,         // time to notify before appointment (by patient)
        })
        // saving the appointment details: 
        await newAppointment.save();

        const appointmentDate = new Date(`${date}T${time}`);
        const reminderTime = new Date(appointmentDate.getTime() - parseInt(remindMeBefore) * 60000); // remindMeBefore in minutes
        console.log("reminderTime: ", reminderTime);

        // Sending a notification to the doctor: (patient awaiting confirmation)
        const doctorNotification = new Notification({
            doctorId,
            title: "Appointment Request",
            message: `A new appointment has been requested by ${patient.name} for ${date} at ${time}.`,
            notificationType: "update",    // appointment confirmation
            status: "pending",
            fcmToken: doctorFCMToken        // as the notification is to be sent to the doctor
        });

        // saving notification for doctor and sending the notification: 
        await doctorNotification.save();
        sendNotification(doctorFCMToken, doctorNotification.title, doctorNotification.message);

        return res.status(201).json({
            success: true,
            message: "Appointment created.. Awaiting confirmation",
            newAppointment,
            doctorNotification
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// GET LIST OF PATIENT's APPOINTMENTS:  
module.exports.getMyAppointments = async (req, res) => {
    try {
        // Getting patient details: 
        const patientId = req.user._id;
        // console.log("user id: ", userId);
        const patient = await Patient.findById(patientId)
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        // Finding appointments of the user from db: 
        const appointments = await Appointment.find({ patient: patient._id });
        // If user has no appointments: 
        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No appointments found!!",
            })
        }
        // If user appointments are found: 
        return res.status(200).json({
            success: true,
            message: "Appointments fetched!!",
            appointments
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// MODIFY APPOINTMENT: 
module.exports.updateAppointment = async (req, res) => {
    try {
        // Getting user id and finding associated user: 
        const userId = req.user._id;
        console.log("user id: ", userId);
        const patient = await Patient.findById(userId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            })
        }

        // Getting appointment id and finding appointment:
        const { appointmentId } = req.params;
        const appointment = await Appointment.findById(appointmentId);
        console.log("appointment: ", appointment);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found..",
            })
        }

        // Fetch doctor details (from the appointment):
        const doctor = await Doctor.findById(appointment.doctor);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found."
            });
        }
        const doctorFCMToken = doctor.fcmToken;

        // // Step 4: Store the previous appointment date and time before updating
        // const previousDate = appointment.date;
        // const previousTime = appointment.time;
        // Store the previous appointment date and time before updating
        const previousDate = moment(appointment.date).format('YYYY-MM-DD');
        const previousTime = appointment.time;

        // If user has provided new date and new time for appointment: 
        const { newDate, newTime } = req.body;
        if (newDate) appointment.date = newDate;
        if (newTime) appointment.time = newTime;
        // Saving the updated appointment: 
        await appointment.save();

        // Format new date and time for the notification
        const formattedNewDate = moment(appointment.date).format('YYYY-MM-DD');
        const formattedNewTime = appointment.time;


        // Notification to update doctor about the modified appointment: 
        // const doctorNotification = new Notification({
        //     // patientId,
        //     doctorId: appointment.doctorId,
        //     title: "Appointment Updated",
        //     // message: `A new appointment has been requested by ${patient.name} for ${date} at ${time}.`,
        //     message: `The appointment scheduled by ${patient.name} for ${appointment.date} at ${appointment.time} is modified to ${newDate} at ${newTime}`,
        //     notificationType: "update",    // appointment confirmation
        //     status: "pending",
        //     // remindAt: reminderTime, // Store reminder time
        //     // createdAt: new Date(),
        //     // fcmToken: fcmToken // Store FCM token for later use
        //     fcmToken: doctorFCMToken        // as the notification is to be sent to the doctor
        // });

        // Notification for the doctor:
        const doctorNotification = new Notification({
            doctorId: appointment.doctorId,
            title: "Appointment Updated",
            message: `The appointment with ${patient.name} has been updated from ${previousDate} at ${previousTime} to ${formattedNewDate} at ${formattedNewTime}.`,
            notificationType: "update",
            status: "pending",
            fcmToken: doctorFCMToken
        });
        console.log("doctor notification: ", doctorNotification);

        // saving notification for doctor and sending the notification: 
        await doctorNotification.save();
        sendNotification(doctorFCMToken, doctorNotification.title, doctorNotification.message);

        return res.status(200).json({
            success: true,
            message: "Appointment updated..",
            doctorNotification,
            appointment,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// CANCEL APPOINTMENT: 
module.exports.cancelAppointment = async (req, res) => {
    try {
        // Getting user and user details: 
        const userId = req.user._id;
        const patient = await Patient.findById(userId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            })
        }

        // Getting appointment id and appointment details: 
        const appointmentId = req.params.appointmentId;
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found!!",
            })
        }

        // Fetch doctor details (from appointment):
        const doctor = await Doctor.findById(appointment.doctor);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found."
            });
        }
        const doctorFCMToken = doctor.fcmToken;

        const date = moment(appointment.date).format('YYYY-MM-DD');
        const time = appointment.time;

        // Changing status to cancelled: 
        appointment.status = 'Cancelled';
        await appointment.save();
        // Create a notification for the doctor
        const doctorNotification = new Notification({
            doctorId: appointment.doctorId,
            title: "Appointment Cancelled",
            message: `The appointment with ${patient.name} scheduled for ${date} at ${time} has been cancelled.`,
            notificationType: "update",
            status: "pending",
            fcmToken: doctorFCMToken
        });
        await doctorNotification.save();
        console.log("doctor notification: ", doctorNotification);

        return res.status(200).json({
            success: true,
            message: "Appointment Cancelled",
            appointment
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}



// // Schedule reminders every minute (adjust interval as needed)
// cron.schedule("* * * * *", async () => {
//     const now = new Date(); // Get the current time at the start of each cron job execution

//     const notifications = await Notification.find({
//         notificationType: "reminder",
//         status: "pending", // Only fetch unsent reminders
//         remindAt: { $lte: now }, // Reminder time is less than or equal to current time
//     });

//     notifications.forEach(async (notification) => {
//         const { patientId, title, message, fcmToken } = notification;

//         // Send FCM Notification
//         await sendNotification(fcmToken, title, message);

//         // Mark as sent to avoid re-sending
//         await Notification.findByIdAndUpdate(notification._id, { status: "sent" });
//     });
// });
