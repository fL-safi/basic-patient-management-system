import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader } from "lucide-react";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useTheme } from '../hooks/useTheme';

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const navigate = useNavigate();
	
	const { login, isLoading, error } = useAuthStore();
	const { theme } = useTheme();

	const handleLogin = async (e) => {
		e.preventDefault();
		await login(email, password);
		navigate("/");
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className={`max-w-md w-full ${theme.cardOpacity} backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden`}
		>
			<div className='p-8'>
				<h2 className={`text-3xl font-bold mb-6 text-center bg-gradient-to-r ${theme.gradient} text-transparent bg-clip-text`}>
					Welcome Back
				</h2>

				<form onSubmit={handleLogin}>
					<Input
						icon={Mail}
						type='email'
						placeholder='Email Address'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>

					<Input
						icon={Lock}
						type='password'
						placeholder='Password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>

					<div className='flex items-center mb-6'>
						<Link to='/forgot-password' className={`text-sm ${theme.textMuted} hover:text-emerald-500 hover:underline transition-colors`}>
							Forgot password?
						</Link>
					</div>
					{error && <p className='text-red-500 font-semibold mb-2'>{error}</p>}

					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className={`w-full py-3 px-4 bg-gradient-to-r ${theme.buttonGradient} text-white font-bold rounded-lg shadow-lg ${theme.buttonGradientHover} focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-200`}
						type='submit'
						disabled={isLoading}
					>
						{isLoading ? <Loader className='w-6 h-6 animate-spin mx-auto' /> : "Login"}
					</motion.button>
				</form>
			</div>
			<div className={`px-8 py-4 ${theme.cardSecondary} flex justify-center`}>
				<p className={`text-sm ${theme.textMuted}`}>
					Don't have an account?{" "}
					<Link to='/signup' className={`${theme.textMuted} hover:text-emerald-500 hover:underline transition-colors`}>
						Sign up
					</Link>
				</p>
			</div>
		</motion.div>
	);
};

export default LoginPage;