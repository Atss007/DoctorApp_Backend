const Doctor = require("../models/doctorModel");
const User = require("../models/userModel");
const Patient = require("../models/patientModel");
const Appointment = require("../models/appointmentModel");
const OTP = require("../models/otpModel")
const Notification = require("../models/notificationModel");
const { sendNotification, scheduleReminder } = require("../helper/handleNotifications");
const moment = require("moment-timezone");
const { generateOTP, generateToken } = require("../helper/generate");

// LOGIN (DOCTOR): 
module.exports.doctorLogin = async (req, res) => {
    try {
        const { phoneNo } = req.body;
        console.log("phone number: ", phoneNo);

        // Finding a doctor with given phone no: 
        const doctor = await Doctor.findOne({ phoneNo });

        // if a doctor is not found; creating a new record: 
        if (!doctor) {
            const newDoctor = new Doctor({
                phoneNo
            })
            await newDoctor.save();

            // Assign newly created doctor to the `doctor` variable: 
            doctor = newDoctor;
            console.log("NEW DOCTOR CREATED: ", newDoctor);
        }

        // Whether a doctor is new or old; generate and send OTP: 
        const providedOTP = await generateOTP();
        console.log("OTP Provided To Doctor: ", providedOTP);

        // Deleting previous OTP's of the doctor: 
        await OTP.deleteMany({ userId: doctor._id });

        // Creating new record for generated OTP to verify and Saving the OTP to DB:
        const otpDoc = new OTP({
            userId: doctor._id,
            otpCode: providedOTP
        })
        await otpDoc.save();

        // Sending sms to registered number for OTP: 
        // sendSMS(phoneNo, `${providedOTP} is your OTP for accessing your account. The OTP is valid for 5 minutes.`);

        return res.status(200).json({
            success: true,
            message: "OTP sent to your phone number!!",
            userId: doctor._id,
            isNewDoctor: doctor.isNewDoctor,
            otpDoc
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// OTP Verification: 
module.exports.verifyOTP = async (req, res) => {
    try {
        // Accessing user id: 
        const { userId } = req.params;

        // If user id is not provided:
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User id is required"
            });
        }

        // Getting OTP entered by user:
        const { otp } = req.body;

        // If OTP is not entered: 
        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "Provide OTP",
            });
        }

        // getting the otp associated with user from db for verification: 
        const userDbOTP = await OTP.findOne({ userId });

        // if otp is not found in the db: 
        if (!userDbOTP) {
            return res.status(410).json({
                success: false,
                message: "OTP expired"
            })
        }

        // if the generated otp and otp entered by user is not same:  
        if (userDbOTP.otpCode != otp) {
            return res.status(401).json({
                success: false,
                message: "Incorrect OTP",
            })
        }

        // if otp matches, finding user:
        const doctor = await Doctor.findById(userId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            })
        }

        // if correct otp is entered, it should be deleted from DB: 
        await OTP.deleteOne({ userId });

        const accessToken = await generateToken(doctor);
        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            accessToken,
            isNewDoctor: doctor.isNewDoctor
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// ADD DOCTOR's DETAILS: 
module.exports.addDoctorDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        // console.log("userid: ", id);
        const { doctorName, gender, city, phoneNo, consultationFee, experience, qualificationOne, qualificationTwo, specializationOne, specializationTwo, availableHours, serviceOne, serviceTwo, serviceThree, ratings, liveStatus, certifications } = req.body;

        const doctor = await Doctor.findById(userId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            })
        }

        // Update Doctor Details and save to DB: 
        doctor.doctorName = doctorName,
            doctor.gender = gender,
            doctor.city = city,
            doctor.phoneNo = phoneNo,
            doctor.consultationFee = consultationFee,
            doctor.experience = experience,
            doctor.qualificationOne = qualificationOne,
            doctor.qualificationTwo = qualificationTwo,
            doctor.specializationOne = specializationOne,
            doctor.specializationTwo = specializationTwo,
            doctor.availableHours = availableHours,
            doctor.serviceOne = serviceOne,
            doctor.serviceTwo = serviceTwo,
            doctor.serviceThree = serviceThree,
            doctor.ratings = ratings,
            doctor.liveStatus = liveStatus,
            doctor.certifications = certifications,
            await doctor.save();

        return res.status(201).json({
            success: true,
            message: "Details for doctor added successfully",
            doctor
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Get All doctors: 
module.exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find(); // Fetch all doctors
        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No doctors found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Doctors fetched",
            length: doctors.length,
            doctors
        })
    } catch (error) {
        res.status(500).json({ message: "Error fetching doctor details", error });
    }
}

// GET THE PROFILE OF A DOCTOR: 
module.exports.doctorProfile = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            })
        }

        return res.status(200).json({
            success: true,
            message: "Doctor's profile fetched!!",
            doctor,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// SEARCH A DOCTOR OR SPECIALIST: 
module.exports.searchDoctor = async (req, res) => {
    try {
        const { doctorName, specialization } = req.query;

        const searchQuery = {};
        console.log("search query 1: ", searchQuery);
        if (doctorName) {
            searchQuery['doctorName'] = { $regex: doctorName, $options: 'i' }; // Case-insensitive search for name
        }
        // if (specialization) {
        //     searchQuery['specialization'] = { $regex: specialization, $options: 'i' }; // Case-insensitive search for specialization
        // }
        if (specialization) {
            // Use `$or` to match specialization in either `specializationOne` or `specializationTwo`
            searchQuery['$or'] = [
                { specializationOne: { $regex: specialization, $options: 'i' } },
                { specializationTwo: { $regex: specialization, $options: 'i' } }
            ];
        }

        console.log("search query 2: ", searchQuery);

        const doctors = await Doctor.find(searchQuery);

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No doctors found"
            })
        }
        // console.log("doctors: ", doctors);

        return res.status(200).json({
            success: true,
            message: "Doctors found",
            doctors
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Search doctors by category: 
module.exports.searchDoctorByCategory = async (req, res) => {
    try {
        const { category } = req.query;
        console.log("category: ", category);

        const searchQuery = {};

        // // in case when only one field of specialization is there: 
        // if (category) {
        //     searchQuery['specialization'] = { $regex: specialization, $options: 'i' }; // Case-insensitive search for specialization   
        // }
        if (category) {
            // Use `$or` to match specialization in either `specializationOne` or `specializationTwo`
            searchQuery['$or'] = [
                { specializationOne: { $regex: category, $options: 'i' } },
                { specializationTwo: { $regex: category, $options: 'i' } }
            ];
        }
        const doctors = await Doctor.find(searchQuery);
        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No doctors found"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Doctors fetched according to category",
            doctors
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Filter doctors: 
module.exports.filterDoctors = async (req, res) => {
    try {
        const { specialization, location, minPrice, maxPrice, gender } = req.query;

        const filterQuery = {};

        console.log("filter query 1: ", filterQuery);
        if (specialization) {
            filterQuery['$or'] = [
                { specializationOne: { $regex: specialization, $options: 'i' } },
                { specializationTwo: { $regex: specialization, $options: 'i' } }
            ]
        }

        if (location) {
            filterQuery['city'] = { $regex: location, $options: 'i' };
        }

        if (gender) {
            filterQuery['gender'] = gender
        }
        if (minPrice || maxPrice) {
            filterQuery['consultationFee'] = {};

            // If minPrice is provided, filter for fees greater than or equal to minPrice
            if (minPrice) {
                filterQuery['consultationFee'].$gte = parseFloat(minPrice);
            }

            // If maxPrice is provided, filter for fees less than or equal to maxPrice
            if (maxPrice) {
                filterQuery['consultationFee'].$lte = parseFloat(maxPrice);
            }
        }



        console.log("filter query 2: ", filterQuery);
        const doctors = await Doctor.find(filterQuery);
        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No doctors found",
            })
        }

        console.log("doctors: ", doctors);
        return res.status(200).json({
            success: true,
            message: "Doctors fetched",
            doctors
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// UPDATE DOCTOR's FCM TOKEN:
module.exports.updateDoctorFCMToken = async (req, res) => {
    try {
        const userId = req.user._id;

        const { fcmToken } = req.body;
        console.log("fcm token fetched to store in user's record: ", fcmToken);

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            userId,
            { fcmToken },
            { new: true },
        );

        if (!updatedDoctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: "FCM Token added to the doctor's profile",
            isDoctor: true,
            updatedDoctor
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Confirm Appointment: 
module.exports.confirmAppointment = async (req, res) => {
    try {
        // // when the doctor is logged in:  
        // const doctorId = req.user._id;
        // console.log("doctor id: ", doctorId);

        const { doctorId, appointmentId, action } = req.body; // action could be "confirm" or "reject"
        // const appointmentId = req.params;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: "Appointment not found." });
        }

        const doctor = await Doctor.findById(doctorId);
        console.log("doctor: ", doctor);

        console.log("appointment: ", appointment)
        const patientId = appointment.patient;
        console.log("patient id: ", patientId);
        const patient = await Patient.findById(patientId);
        console.log("PATIENT: ", patient);
        if (action === "confirm") {
            appointment.status = "Confirmed";
            await appointment.save();

            // Log the date and time to debug
            console.log("Appointment Date:", appointment.date);
            console.log("Appointment Time:", appointment.time);

            // Extract date and time
            const appointmentDate = moment(appointment.date).tz("UTC").format("YYYY-MM-DD"); // Ensure the date is in the right format
            const appointmentTime = appointment.time; // e.g., "12:25"

            // Create a valid date string
            const appointmentDateTime = moment(`${appointmentDate} ${appointmentTime}`, "YYYY-MM-DD HH:mm").toDate();
            const reminderTime = new Date(appointmentDateTime.getTime() - parseInt(appointment.remindMeBefore) * 60000);

            console.log("Appointment Date:", appointmentDate);
            console.log("Appointment Time:", appointmentTime);
            console.log("Appointment DateTime:", appointmentDateTime);
            console.log("Reminder time for notification: ", reminderTime);


            // Create a confirmation notification for the patient
            const patientNotification = new Notification({
                patientId: appointment.patient,
                title: "Appointment Confirmed",
                message: `Your appointment with Dr. ${doctor.doctorName} has been confirmed for ${appointment.date} at ${appointment.time}.`,
                notificationType: "update",
                status: "pending",
                fcmToken: patient.fcmToken // Assuming patient's FCM token is available here
            });
            await patientNotification.save();
            sendNotification(patient.fcmToken, "Appointment Confirmed", patientNotification.message);

            // schedule reminder for patient: 
            scheduleReminder(reminderTime, patient.fcmToken, `Reminder: You have an appointment with Dr. ${doctor.doctorName} at ${appointment.time}.`)

            // Schedule Reminder for Doctor
            scheduleReminder(reminderTime, doctor.fcmToken, `Reminder: You have an appointment with ${patient.name} at ${appointment.time}.`);


            // // Create a reminder notification : 
            // const patientReminder = new Notification({
            //     patientId: appointment.patient,
            //     title: "REMINDER",
            //     message: `You have a scheduled appointment with Dr. ${doctor.doctorName} at ${appointment.time}`,
            //     notificationType: "reminder",
            //     status: "pending",
            //     remindAt: reminderTime,
            //     fcmToken: patient.fcmToken
            // })
            // await patientReminder.save();

            // // Create a doctor REminder: 
            // const doctorReminder = new Notification({
            //     doctorId,
            //     title: "APPOINTMENT REMINDER",
            //     message: `You have an appointment with ${patient.name} on ${appointment.date} at ${appointment.time}.`,
            //     notificationType: "reminder",
            //     status: "pending",
            //     remindAt: reminderTime,             // currently same as the reminder time of patient
            //     fcmToken: doctor.fcmToken
            // })
            // await doctorReminder.save();

            // scheduleReminder(reminderTime, appointment.patient, doctorId, {
            //     date: appointment.date,
            //     time: appointment.time
            // })

            return res.status(200).json({
                success: true,
                message: "Appointment confirmed and patient notified."
            });
        } else if (action === "reject") {
            appointment.status = "Cancelled";
            await appointment.save();

            // Notify the patient of the rejection
            sendNotification(patient.fcmToken, "Appointment Rejected", `Your appointment with Dr. ${doctor.doctorName} was not confirmed.`);

            return res.status(200).json({
                success: true,
                message: "Appointment rejected and patient notified."
            });
        }
    } catch (error) {
        console.log("error: ", error)
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}