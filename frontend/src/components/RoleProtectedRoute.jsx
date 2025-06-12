import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const RoleProtectedRoute = ({ children, allowedRoles }) => {
	const { isAuthenticated, user } = useAuthStore();

	if (!isAuthenticated) {
		return <Navigate to='/login' replace />;
	}

	if (allowedRoles && !allowedRoles.includes(user?.role)) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-900 flex items-center justify-center'>
				<div className='max-w-md w-full mx-auto mt-10 p-8 bg-gray-900 bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl border border-gray-800'>
					<h2 className='text-2xl font-bold mb-4 text-center text-red-400'>Access Denied</h2>
					<p className='text-gray-300 text-center'>
						You don't have permission to access this page.
						<br />
						Required role: {allowedRoles.join(" or ")}
					</p>
				</div>
			</div>
		);
	}

	return children;
};

export default RoleProtectedRoute;