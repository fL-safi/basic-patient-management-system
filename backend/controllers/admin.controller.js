import bcryptjs from "bcryptjs";
import { User } from "../models/user.model.js";

export const registerDoctorFromAdmin = async (req, res) => {
    try {
        const { 
            email, 
            password, 
            name, 
            cnic, 
            phoneNumber, 
            address, 
            gender,
            speciality,
            registrationNumber,
            doctorSchedule
        } = req.body;

        // Validate required fields for doctor
        if (!email || !password || !name || !cnic || !phoneNumber || !address || !speciality || !registrationNumber || !doctorSchedule) {
            return res.status(400).json({ 
                success: false, 
                message: "All required fields must be provided for doctor registration" 
            });
        }

        // Validate CNIC format
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
        if (!cnicRegex.test(cnic)) {
            return res.status(400).json({ 
                success: false, 
                message: "CNIC must be in format: 12345-1234567-1" 
            });
        }

        // Check if user already exists
        const userAlreadyExists = await User.findOne({ 
            $or: [{ email }, { cnic }, { registrationNumber }] 
        });

        if (userAlreadyExists) {
            if (userAlreadyExists.email === email) {
                return res.status(400).json({ success: false, message: "Doctor with this email already exists" });
            }
            if (userAlreadyExists.cnic === cnic) {
                return res.status(400).json({ success: false, message: "Doctor with this CNIC already exists" });
            }
            if (userAlreadyExists.registrationNumber === registrationNumber) {
                return res.status(400).json({ success: false, message: "Doctor with this registration number already exists" });
            }
        }

        // Validate gender if provided
        if (gender && !['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({ 
                success: false, 
                message: "Gender must be male, female, or other" 
            });
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create doctor user
        const doctor = new User({
            email,
            password: hashedPassword,
            name,
            cnic,
            role: "doctor",
            phoneNumber,
            address,
            gender,
            speciality,
            registrationNumber,
            doctorSchedule,
            isActive: true,
            isVerified: false
        });

        await doctor.save();

        res.status(201).json({
            success: true,
            message: "Doctor registered successfully",
            user: {
                ...doctor._doc,
                password: undefined,
            },
        });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const registerReceptionistFromAdmin = async (req, res) => {
    try {
        const { 
            email, 
            password, 
            name, 
            cnic, 
            phoneNumber, 
            address, 
            gender
        } = req.body;

        // Validate required fields for receptionist
        if (!email || !password || !name || !cnic || !phoneNumber || !address) {
            return res.status(400).json({ 
                success: false, 
                message: "All required fields must be provided for receptionist registration" 
            });
        }

        // Validate CNIC format
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
        if (!cnicRegex.test(cnic)) {
            return res.status(400).json({ 
                success: false, 
                message: "CNIC must be in format: 12345-1234567-1" 
            });
        }

        // Check if user already exists
        const userAlreadyExists = await User.findOne({ 
            $or: [{ email }, { cnic }] 
        });

        if (userAlreadyExists) {
            if (userAlreadyExists.email === email) {
                return res.status(400).json({ success: false, message: "Receptionist with this email already exists" });
            }
            if (userAlreadyExists.cnic === cnic) {
                return res.status(400).json({ success: false, message: "Receptionist with this CNIC already exists" });
            }
        }

        // Validate gender if provided
        if (gender && !['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({ 
                success: false, 
                message: "Gender must be male, female, or other" 
            });
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create receptionist user
        const receptionist = new User({
            email,
            password: hashedPassword,
            name,
            cnic,
            role: "receptionist",
            phoneNumber,
            address,
            gender,
            isActive: true,
            isVerified: false
        });

        await receptionist.save();

        res.status(201).json({
            success: true,
            message: "Receptionist registered successfully",
            user: {
                ...receptionist._doc,
                password: undefined,
            },
        });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const registerPharmacistDispenserFromAdmin = async (req, res) => {
    try {
        const { 
            email, 
            password, 
            name, 
            cnic, 
            phoneNumber, 
            address, 
            gender
        } = req.body;

        // Validate required fields for pharmacist-dispenser
        if (!email || !password || !name || !cnic || !phoneNumber || !address) {
            return res.status(400).json({ 
                success: false, 
                message: "All required fields must be provided for pharmacist-dispenser registration" 
            });
        }

        // Validate CNIC format
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
        if (!cnicRegex.test(cnic)) {
            return res.status(400).json({ 
                success: false, 
                message: "CNIC must be in format: 12345-1234567-1" 
            });
        }

        // Check if user already exists
        const userAlreadyExists = await User.findOne({ 
            $or: [{ email }, { cnic }] 
        });

        if (userAlreadyExists) {
            if (userAlreadyExists.email === email) {
                return res.status(400).json({ success: false, message: "Pharmacist-dispenser with this email already exists" });
            }
            if (userAlreadyExists.cnic === cnic) {
                return res.status(400).json({ success: false, message: "Pharmacist-dispenser with this CNIC already exists" });
            }
        }

        // Validate gender if provided
        if (gender && !['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({ 
                success: false, 
                message: "Gender must be male, female, or other" 
            });
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create pharmacist-dispenser user
        const pharmacistDispenser = new User({
            email,
            password: hashedPassword,
            name,
            cnic,
            role: "pharmacist-dispenser",
            phoneNumber,
            address,
            gender,
            isActive: true,
            isVerified: false
        });

        await pharmacistDispenser.save();

        res.status(201).json({
            success: true,
            message: "Pharmacist-dispenser registered successfully",
            user: {
                ...pharmacistDispenser._doc,
                password: undefined,
            },
        });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const registerPharmacistInventoryFromAdmin = async (req, res) => {
    try {
        const { 
            email, 
            password, 
            name, 
            cnic, 
            phoneNumber, 
            address, 
            gender
        } = req.body;

        // Validate required fields for pharmacist-inventory
        if (!email || !password || !name || !cnic || !phoneNumber || !address) {
            return res.status(400).json({ 
                success: false, 
                message: "All required fields must be provided for pharmacist-inventory registration" 
            });
        }

        // Validate CNIC format
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
        if (!cnicRegex.test(cnic)) {
            return res.status(400).json({ 
                success: false, 
                message: "CNIC must be in format: 12345-1234567-1" 
            });
        }

        // Check if user already exists
        const userAlreadyExists = await User.findOne({ 
            $or: [{ email }, { cnic }] 
        });

        if (userAlreadyExists) {
            if (userAlreadyExists.email === email) {
                return res.status(400).json({ success: false, message: "Pharmacist-inventory with this email already exists" });
            }
            if (userAlreadyExists.cnic === cnic) {
                return res.status(400).json({ success: false, message: "Pharmacist-inventory with this CNIC already exists" });
            }
        }

        // Validate gender if provided
        if (gender && !['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({ 
                success: false, 
                message: "Gender must be male, female, or other" 
            });
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create pharmacist-inventory user
        const pharmacistInventory = new User({
            email,
            password: hashedPassword,
            name,
            cnic,
            role: "pharmacist-inventory",
            phoneNumber,
            address,
            gender,
            isActive: true,
            isVerified: false
        });

        await pharmacistInventory.save();

        res.status(201).json({
            success: true,
            message: "Pharmacist-inventory registered successfully",
            user: {
                ...pharmacistInventory._doc,
                password: undefined,
            },
        });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};