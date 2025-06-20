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

        // Validate required fields for pharmacist_dispenser
        if (!email || !password || !name || !cnic || !phoneNumber || !address) {
            return res.status(400).json({ 
                success: false, 
                message: "All required fields must be provided for pharmacist_dispenser registration" 
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
                return res.status(400).json({ success: false, message: "Pharmacist_dispenser with this email already exists" });
            }
            if (userAlreadyExists.cnic === cnic) {
                return res.status(400).json({ success: false, message: "Pharmacist_dispenser with this CNIC already exists" });
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

        // Create pharmacist_dispenser user
        const pharmacistDispenser = new User({
            email,
            password: hashedPassword,
            name,
            cnic,
            role: "pharmacist_dispenser",
            phoneNumber,
            address,
            gender,
            isActive: true,
            isVerified: false
        });

        await pharmacistDispenser.save();

        res.status(201).json({
            success: true,
            message: "Pharmacist_dispenser registered successfully",
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

        // Validate required fields for pharmacist_inventory
        if (!email || !password || !name || !cnic || !phoneNumber || !address) {
            return res.status(400).json({ 
                success: false, 
                message: "All required fields must be provided for pharmacist_inventory registration" 
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
                return res.status(400).json({ success: false, message: "Pharmacist_inventory with this email already exists" });
            }
            if (userAlreadyExists.cnic === cnic) {
                return res.status(400).json({ success: false, message: "Pharmacist_inventory with this CNIC already exists" });
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

        // Create pharmacist_inventory user
        const pharmacistInventory = new User({
            email,
            password: hashedPassword,
            name,
            cnic,
            role: "pharmacist_inventory",
            phoneNumber,
            address,
            gender,
            isActive: true,
            isVerified: false
        });

        await pharmacistInventory.save();

        res.status(201).json({
            success: true,
            message: "Pharmacist_inventory registered successfully",
            user: {
                ...pharmacistInventory._doc,
                password: undefined,
            },
        });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};


export const getAllUsersData = async (req, res) => {
    try {
        // Fetch all users, excluding passwords
        const users = await User.find({}, { password: 0 });

        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: "No users found" });
        }

        // Create summaries for each role
        const roleSummary = {
            admin: 0,
            doctor: 0,
            receptionist: 0,
            pharmacist_dispenser: 0,
            pharmacist_inventory: 0
        };

        // Populate the role counts
        users.forEach(user => {
            if (roleSummary[user.role] !== undefined) {
                roleSummary[user.role]++;
            }
        });

        // Prepare the response data
        const response = {
            success: true,
            message: "Users fetched successfully",
            roles: roleSummary, // Role counts
            users: users, // List of all users
            quickSummary: {
                totalUsers: users.length,
                roleCounts: roleSummary
            }
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getUserDataByRoleAndId = async (req, res) => {
    try {
        const { role, id } = req.params;

        // Validate that the role is one of the allowed roles
        const validRoles = ["doctor", "receptionist", "pharmacist_dispenser", "pharmacist_inventory"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }

        // Find the user by role and ID
        const user = await User.findOne({ _id: id, role: role }).select("-password");  // Exclude password

        if (!user) {
            return res.status(404).json({ success: false, message: `${role} not found` });
        }

        // Return the found user data
        res.status(200).json({
            success: true,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} data fetched successfully`,
            user: user,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const updateUserDataByRoleAndId = async (req, res) => {
    try {
        const { role, id } = req.params;
        const updatedData = req.body;  // The new data sent in the request body

        // Validate that the role is one of the allowed roles
        const validRoles = ["doctor", "receptionist", "pharmacist_dispenser", "pharmacist_inventory"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }

        // Find the user by role and ID
        const user = await User.findOne({ _id: id, role: role });

        if (!user) {
            return res.status(404).json({ success: false, message: `${role.charAt(0).toUpperCase() + role.slice(1)} not found` });
        }

        // Validate fields if needed based on role
        if (role === "doctor") {
            if (updatedData.speciality && !updatedData.registrationNumber) {
                return res.status(400).json({ success: false, message: "Registration number is required for doctors" });
            }
        }

        // Use findByIdAndUpdate for partial update, only the provided fields will be updated
        const updatedUser = await User.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });

        // Return the updated user data
        res.status(200).json({
            success: true,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} data updated successfully`,
            user: updatedUser,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const deleteUserDataByRoleAndId = async (req, res) => {
    try {
        const { role, id } = req.params;

        // Validate that the role is one of the allowed roles
        const validRoles = ["doctor", "receptionist", "pharmacist_dispenser", "pharmacist_inventory"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }

        // Find and delete the user by role and ID
        const user = await User.findOneAndDelete({ _id: id, role: role });

        if (!user) {
            return res.status(404).json({ success: false, message: `${role.charAt(0).toUpperCase() + role.slice(1)} not found` });
        }

        // Return a success response
        res.status(200).json({
            success: true,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} deleted successfully`,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
