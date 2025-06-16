import { CreditCard } from "lucide-react";
import { useTheme } from '../hooks/useTheme';

const CNICInput = ({ value, onChange, placeholder = "CNIC (12345-1234567-1)" }) => {
	const { theme } = useTheme();
	
	const formatCNIC = (input) => {
		// Remove all non-numeric characters
		const cleaned = input.replace(/\D/g, '');
		
		// Apply formatting: 12345-1234567-1
		if (cleaned.length <= 5) {
			return cleaned;
		} else if (cleaned.length <= 12) {
			return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
		} else {
			return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
		}
	};

	const handleChange = (e) => {
		const formatted = formatCNIC(e.target.value);
		onChange(formatted);
	};

	return (
		<div className='relative mb-6'>
			<div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
				<CreditCard className={`w-5 h-5 ${theme.textMuted}`} />
			</div>
			<input
				type='text'
				placeholder={placeholder}
				value={value}
				onChange={handleChange}
				maxLength={15} // 13 digits + 2 dashes
				className={`w-full pl-10 pr-3 py-2 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} placeholder-${theme.textMuted.split('-')[1]}-400 transition duration-200`}
			/>
		</div>
	);
};

export default CNICInput;