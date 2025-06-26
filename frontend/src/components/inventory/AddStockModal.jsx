import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";
import Modal from "../UI/Modal";
import { 
  Pill, 
  Plus, 
  Loader, 
  Calendar,
  Package,
  Hash,
  Barcode,
  DollarSign,
  FileDigit,
  ChevronDown
} from "lucide-react";
import { MEDICINES } from "../../constants/selectOptions";
import { addToStock } from "../../api/api";

const AddStockModal = ({ isOpen, onClose, onSuccess }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  
  const [formData, setFormData] = useState({
    medicineName: "",
    quantity: "",
    batchNumber: "",
    strength: "",
    form: "",
    buyingCost: "",
    price: "",
    billID: "",
    expiryDate: ""
  });

   useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMedicineDropdown(false);
      }
    };

    if (showMedicineDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMedicineDropdown]);

  // Filter medicines based on search
  const filteredMedicines = MEDICINES
    .filter(medicine => 
      medicine.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 10);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // Handle medicine selection
  const handleMedicineSelect = (medicine) => {
    setFormData(prev => ({ ...prev, medicineName: medicine }));
    setShowMedicineDropdown(false);
    setSearchTerm("");
  };

  // Validate form
  const validateForm = () => {
    if (!formData.medicineName) {
      setError("Please select a medicine");
      return false;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setError("Quantity must be greater than 0");
      return false;
    }
    if (!formData.batchNumber) {
      setError("Batch number is required");
      return false;
    }
    if (!formData.strength) {
      setError("Please select strength");
      return false;
    }
    if (!formData.form) {
      setError("Please select form");
      return false;
    }
    if (!formData.buyingCost || parseFloat(formData.buyingCost) <= 0) {
      setError("Buying cost must be greater than 0");
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError("Price must be greater than 0");
      return false;
    }
    if (!formData.billID) {
      setError("Bill ID is required");
      return false;
    }
    if (!formData.expiryDate) {
      setError("Expiry date is required");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Prepare payload with additional fields
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity),
        buyingCost: parseFloat(formData.buyingCost),
        price: parseFloat(formData.price),
        dateOfPurchase: new Date().toISOString().split('T')[0],
        reorderLevel: 20
      };

      const response = await addToStock(payload);
      
      setSuccess(response.message);
      setTimeout(() => {
        onSuccess();
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      setError(
        error.response?.data?.message || 
        "Failed to add stock. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      medicineName: "",
      quantity: "",
      batchNumber: "",
      strength: "",
      form: "",
      buyingCost: "",
      price: "",
      billID: "",
      expiryDate: ""
    });
    setError("");
    setSuccess("");
    setSearchTerm("");
  };

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Stock"
      subtitle="Add new medicine to your inventory"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div
            className={`p-4 rounded-full bg-emerald-500 bg-opacity-20 border border-current text-emerald-500`}
          >
            <Package className="w-8 h-8" />
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-200"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg dark:bg-green-900 dark:border-green-700 dark:text-green-200"
          >
            {success}
          </motion.div>
        )}

        {/* Medicine Name (Searchable Select) */}
        <div className="relative" ref={dropdownRef}>
          <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
            Medicine Name *
          </label>
          <div className="relative">
            <Pill className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
            <input
              type="text"
              value={formData.medicineName || searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowMedicineDropdown(true);
                if (!e.target.value) {
                  setFormData(prev => ({ ...prev, medicineName: "" }));
                }
              }}
              onFocus={() => setShowMedicineDropdown(true)}
              onClick={() => setShowMedicineDropdown(true)}
              className={`w-full pl-10 pr-10 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
              placeholder="Search medicine..."
              required
            />
            <button
              type="button"
              onClick={() => setShowMedicineDropdown(!showMedicineDropdown)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme.textMuted}`}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
          
          {showMedicineDropdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-md ${theme.card} shadow-lg ${theme.border} border`}
            >
              <ul>
                {filteredMedicines.length > 0 ? (
                  filteredMedicines.map((medicine, index) => (
                    <li 
                      key={index}
                      onClick={() => handleMedicineSelect(medicine)}
                      className={`px-4 py-2 cursor-pointer hover:${theme.cardSecondary} ${theme.textPrimary}`}
                    >
                      {medicine}
                    </li>
                  ))
                ) : (
                  <li className={`px-4 py-2 ${theme.textMuted} text-center`}>
                    No medicines found
                  </li>
                )}
              </ul>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quantity */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Quantity *
            </label>
            <div className="relative">
              <Hash
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                placeholder="Enter quantity"
                required
              />
            </div>
          </div>

          {/* Batch Number */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Batch Number *
            </label>
            <div className="relative">
              <Barcode
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="text"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                placeholder="Enter batch number"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strength */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Strength *
            </label>
            <select
              name="strength"
              value={formData.strength}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
              required
            >
              <option value="">Select Strength</option>
              <option value="100mg">100mg</option>
              <option value="500mg">500mg</option>
              <option value="700mg">700mg</option>
              <option value="1,000mg">1,000mg</option>
            </select>
          </div>

          {/* Form */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Form *
            </label>
            <select
              name="form"
              value={formData.form}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
              required
            >
              <option value="">Select Form</option>
              <option value="tablet">Tablet</option>
              <option value="syrup">Syrup</option>
              <option value="ointment">Ointment</option>
              <option value="injection">Injection</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Buying Cost */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Buying Cost *
            </label>
            <div className="relative">
              <DollarSign
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="number"
                name="buyingCost"
                value={formData.buyingCost}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                placeholder="Enter buying cost"
                required
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Selling Price *
            </label>
            <div className="relative">
              <DollarSign
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                placeholder="Enter selling price"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bill ID */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Bill ID *
            </label>
            <div className="relative">
              <FileDigit
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="text"
                name="billID"
                value={formData.billID}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                placeholder="Enter bill ID"
                required
              />
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Expiry Date *
            </label>
            <div className="relative">
              <Calendar
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                required
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={handleClose}
            className={`px-6 py-3 ${theme.cardSecondary} ${theme.textSecondary} rounded-lg hover:bg-opacity-70 transition-colors`}
            disabled={loading}
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Adding Stock...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Add Stock</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
};

export default AddStockModal;