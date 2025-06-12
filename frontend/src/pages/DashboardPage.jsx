import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { formatDate } from "../utils/date";

const DashboardPage = () => {
	const { user, logout } = useAuthStore();

	const handleLogout = () => {
		logout();
	};

	const getRoleColor = (role) => {
		switch (role) {
			case 'admin':
				return 'text-red-400';
			case 'operator':
				return 'text-blue-400';
			case 'patient':
				return 'text-green-400';
			default:
				return 'text-gray-400';
		}
	};

	const getRoleBadgeColor = (role) => {
		switch (role) {
			case 'admin':
				return 'bg-red-500 bg-opacity-20 border-red-500';
			case 'operator':
				return 'bg-blue-500 bg-opacity-20 border-blue-500';
			case 'patient':
				return 'bg-green-500 bg-opacity-20 border-green-500';
			default:
				return 'bg-gray-500 bg-opacity-20 border-gray-500';
		}
	};

	const maskCNIC = (cnic) => {
		if (!cnic) return '';
		// Show only first 5 and last 1 digit, mask the middle part
		const parts = cnic.split('-');
		if (parts.length === 3) {
			return `${parts[0]}-*******-${parts[2]}`;
		}
		return cnic;
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ duration: 0.5 }}
			className='max-w-md w-full mx-auto mt-10 p-8 bg-gray-900 bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl border border-gray-800'
		>
			<h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-gray-400 to-emerald-600 text-transparent bg-clip-text'>
				Dashboard
			</h2>

			<div className='space-y-6'>
				<motion.div
					className='p-4 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					<h3 className='text-xl font-semibold text-gray-400 mb-3'>Profile Information</h3>
					<p className='text-gray-300'>Name: {user.name}</p>
					<p className='text-gray-300'>Email: {user.email}</p>
					<p className='text-gray-300'>CNIC: {user.cnic}</p>
					<div className='flex items-center mt-2'>
						<span className='text-gray-300 mr-2'>Role:</span>
						<span
							className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
								user.role
							)} ${getRoleColor(user.role)}`}
						>
							{user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
						</span>
					</div>
				</motion.div>
				<motion.div
					className='p-4 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
				>
					<h3 className='text-xl font-semibold text-gray-400 mb-3'>Account Activity</h3>
					<p className='text-gray-300'>
						<span className='font-bold'>Joined: </span>
						{new Date(user.createdAt).toLocaleDateString("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</p>
					<p className='text-gray-300'>
						<span className='font-bold'>Last Login: </span>
						{formatDate(user.lastLogin)}
					</p>
				</motion.div>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.6 }}
				className='mt-4'
			>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={handleLogout}
					className='w-full py-3 px-4 bg-gradient-to-r from-gray-500 to-emerald-600 text-white 
				font-bold rounded-lg shadow-lg hover:from-gray-600 hover:to-emerald-700
				 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900'
				>
					Logout
				</motion.button>
			</motion.div>
		</motion.div>
	);
};
export default DashboardPage;