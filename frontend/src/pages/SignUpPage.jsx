import { motion } from "framer-motion";
import Input from "../components/Input";
import CNICInput from "../components/CNICInput";
import { Loader, Lock, Mail, User, UserCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { useAuthStore } from "../store/authStore";

const SignUpPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cnic, setCnic] = useState("");
  const [role, setRole] = useState("patient");
  const navigate = useNavigate();

  const { signup, error, isLoading } = useAuthStore();

  const handleSignUp = async (e) => {
    e.preventDefault();

    // Validate CNIC format before submission
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(cnic)) {
      return;
    }

    try {
      await signup(email, password, name, role, cnic);
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl 
			overflow-hidden"
    >
      <div className="px-8 py-6">
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-gray-400 to-emerald-500 text-transparent bg-clip-text">
          Create Account
        </h2>

        <form onSubmit={handleSignUp}>
          <Input
            icon={User}
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <CNICInput
            value={cnic}
            onChange={setCnic}
            placeholder="CNIC (12345-1234567-1)"
          />

          {/* Role Selection Dropdown */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <UserCheck className="w-5 h-5 text-gray-400" />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 transition duration-200"
            >
              <option value="patient" className="bg-gray-800">
                Patient
              </option>
              <option value="admin" className="bg-gray-800">
                Admin
              </option>
              <option value="operator" className="bg-gray-800">
                Operator
              </option>
            </select>
          </div>

          <Input
            icon={Mail}
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            icon={Lock}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-500 font-semibold mt-2">{error}</p>}
          <PasswordStrengthMeter password={password} />

          <motion.button
            className="mt-5 w-full py-3 px-4 bg-gradient-to-r from-gray-500 to-emerald-600 text-white 
						font-bold rounded-lg shadow-lg hover:from-gray-600
						hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
						 focus:ring-offset-gray-900 transition duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className=" animate-spin mx-auto" size={24} />
            ) : (
              "Sign Up"
            )}
          </motion.button>
        </form>
      </div>
      <div className="px-8 py-4 bg-gray-900 bg-opacity-50 flex justify-center">
        <p className="text-sm text-gray-400">
          Already have an account?{" "}
          <Link to={"/login"} className="text-gray-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </motion.div>
  );
};
export default SignUpPage;
