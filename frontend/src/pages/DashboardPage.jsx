import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../hooks/useTheme";
import { formatDate } from "../utils/date";

const DashboardPage = () => {
	const { user } = useAuthStore();
	const { theme } = useTheme();

	const getRoleColor = (role) => {
		switch (role) {
			case 'admin':
				return 'text-red-400';
			case 'operator':
				return 'text-blue-400';
			case 'doctor':
				return 'text-green-400';
			case 'pharmacist':
				return 'text-purple-400';
			default:
				return theme.textMuted.replace('text-', 'text-');
		}
	};

	const getRoleBadgeColor = (role) => {
		switch (role) {
			case 'admin':
				return 'bg-red-500 bg-opacity-20 border-red-500';
			case 'operator':
				return 'bg-blue-500 bg-opacity-20 border-blue-500';
			case 'doctor':
				return 'bg-green-500 bg-opacity-20 border-green-500';
			case 'pharmacist':
				return 'bg-purple-500 bg-opacity-20 border-purple-500';
			default:
				return 'bg-gray-500 bg-opacity-20 border-gray-500';
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ duration: 0.5 }}
			className={`max-w-md w-full mx-auto mt-10 p-8 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl ${theme.border} border`}
		>
			<h2 className={`text-3xl font-bold mb-6 text-center bg-gradient-to-r ${theme.gradient} text-transparent bg-clip-text`}>
				Dashboard
			</h2>

			<div className='space-y-6'>
				<motion.div
					className={`p-4 ${theme.cardSecondary} rounded-lg ${theme.borderSecondary} border`}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					<h3 className={`text-xl font-semibold ${theme.textMuted} mb-3`}>Profile Information</h3>
					<p className={theme.textSecondary}>Name: {user.name}</p>
					<p className={theme.textSecondary}>Email: {user.email}</p>
					<p className={theme.textSecondary}>CNIC: {user.cnic}</p>
					<div className='flex items-center mt-2'>
						<span className={`${theme.textSecondary} mr-2`}>Role:</span>
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
					className={`p-4 ${theme.cardSecondary} rounded-lg ${theme.borderSecondary} border`}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
				>
					<h3 className={`text-xl font-semibold ${theme.textMuted} mb-3`}>Account Activity</h3>
					<p className={theme.textSecondary}>
						<span className='font-bold'>Joined: </span>
						{new Date(user.createdAt).toLocaleDateString("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</p>
					<p className={theme.textSecondary}>
						<span className='font-bold'>Last Login: </span>
						{formatDate(user.lastLogin)}
					</p>
				</motion.div>
			</div>
		</motion.div>
	);
};
export default DashboardPage;