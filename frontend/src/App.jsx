import { Navigate, Route, Routes } from "react-router-dom";
import FloatingShape from "./components/FloatingShape";
import Header from "./components/Header";

import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import LoadingSpinner from "./components/LoadingSpinner";

import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";
import { useTheme } from "./hooks/useTheme";
import { useEffect } from "react";

// protect routes that require authentication
const ProtectedRoute = ({ children }) => {
	const { isAuthenticated, user } = useAuthStore();

	if (!isAuthenticated) {
		return <Navigate to='/login' replace />;
	}

	return children;
};

// redirect authenticated users to the home page
const RedirectAuthenticatedUser = ({ children }) => {
	const { isAuthenticated, user } = useAuthStore();

	if (isAuthenticated && user.isVerified) {
		return <Navigate to='/' replace />;
	}

	return children;
};

function App() {
	const { isCheckingAuth, checkAuth, isAuthenticated } = useAuthStore();
	const { initializeTheme } = useThemeStore();
	const { theme } = useTheme();

	useEffect(() => {
		checkAuth();
		initializeTheme();
	}, [checkAuth, initializeTheme]);

	if (isCheckingAuth) return <LoadingSpinner />;

	return (
		<div className={`min-h-screen bg-gradient-to-br ${theme.primary} relative overflow-hidden`}>
			{/* Header - only show when authenticated */}
			{isAuthenticated && <Header />}
			
			{/* Main Content */}
			<div className={`${isAuthenticated ? 'pt-0' : ''} flex items-center justify-center ${isAuthenticated ? 'min-h-[calc(100vh-4rem)]' : 'min-h-screen'}`}>
				{/* <FloatingShape color='bg-green-500' size='w-64 h-64' top='-5%' left='10%' delay={0} />
				<FloatingShape color='bg-emerald-500' size='w-48 h-48' top='70%' left='80%' delay={5} />
				<FloatingShape color='bg-lime-500' size='w-32 h-32' top='40%' left='-10%' delay={2} /> */}

				<Routes>
					<Route
						path='/'
						element={
							<ProtectedRoute>
								<DashboardPage />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/signup'
						element={
							<RedirectAuthenticatedUser>
								<SignUpPage />
							</RedirectAuthenticatedUser>
						}
					/>
					<Route
						path='/login'
						element={
							<RedirectAuthenticatedUser>
								<LoginPage />
							</RedirectAuthenticatedUser>
						}
					/>
					{/* <Route path='/verify-email' element={<EmailVerificationPage />} /> */}
					{/* <Route
						path='/forgot-password'
						element={
							<RedirectAuthenticatedUser>
								<ForgotPasswordPage />
							</RedirectAuthenticatedUser>
						}
					/> */}

					{/* <Route
						path='/reset-password/:token'
						element={
							<RedirectAuthenticatedUser>
								<ResetPasswordPage />
							</RedirectAuthenticatedUser>
						}
					/> */}
					{/* catch all routes */}
					<Route path='*' element={<Navigate to='/' replace />} />
				</Routes>
			</div>
			<Toaster />
		</div>
	);
}

export default App;