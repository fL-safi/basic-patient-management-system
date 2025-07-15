import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";
import Modal from "../UI/Modal";
import { 
  Pill, 
  Plus, 
  Loader, 
  Package,
  Hash,
  Barcode,
  DollarSign,
  FileDigit,
  ChevronDown,
  Trash2,
  List,
  Edit,
  AlertCircle,
  Box
} from "lucide-react";
import { MEDICINES } from "../../constants/selectOptions";
import { updateBatchById, getBatchById } from "../../api/api";

const EditStockModal = ({ isOpen, onClose, batchId, onSuccess }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("batch");
  const dropdownRef = useRef(null);

  // State for batch details
  const [batchDetails, setBatchDetails] = useState({
    batchNumber: "",
    billID: "",
    overallPrice: ""
  });

  // State for medicines
  const [medicines, setMedicines] = useState([]);
  const [currentMedicine, setCurrentMedicine] = useState({
    medicineName: "",
    quantity: "",
    price: ""
  });

  // Calculate if batch details are valid
  const isBatchValid = batchDetails.batchNumber && 
                      batchDetails.billID && 
                      batchDetails.overallPrice && 
                      parseFloat(batchDetails.overallPrice) > 0;

  // Calculate if medicine form is valid
  const isMedicineFormValid = currentMedicine.medicineName && 
                             currentMedicine.quantity && 
                             parseInt(currentMedicine.quantity) > 0 &&
                             currentMedicine.price && 
                             parseFloat(currentMedicine.price) > 0;

  // Calculate total medicine prices
  const totalMedicinePrice = useMemo(() => {
    return medicines.reduce((total, medicine) => {
      return total + (parseFloat(medicine.price) * parseInt(medicine.quantity));
    }, 0);
  }, [medicines]);

  // Calculate total quantity
  const totalQuantity = useMemo(() => {
    return medicines.reduce((total, medicine) => {
      return total + parseInt(medicine.quantity);
    }, 0);
  }, [medicines]);

  // Calculate price mismatch
  const priceDifference = useMemo(() => {
    if (!batchDetails.overallPrice) return 0;
    return Math.abs(totalMedicinePrice - parseFloat(batchDetails.overallPrice));
  }, [totalMedicinePrice, batchDetails.overallPrice]);

  const hasPriceMismatch = priceDifference > 1000;
  const isOver = parseFloat(batchDetails.overallPrice) < totalMedicinePrice;

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

  // Fetch batch data when modal opens
  useEffect(() => {
    if (isOpen && batchId) {
      fetchBatchData();
    }
  }, [isOpen, batchId]);

  const fetchBatchData = async () => {
    try {
      setFetching(true);
      setError("");
      const response = await getBatchById(batchId);
      
      if (response.success) {
        const batch = response.data;
        setBatchDetails({
          batchNumber: batch.batchNumber,
          billID: batch.billID,
          overallPrice: batch.overallPrice.toString()
        });
        
        // Format medicines for the form
        setMedicines(batch.medicines.map(medicine => ({
          ...medicine,
          price: medicine.price.toString(),
          quantity: medicine.quantity.toString(),
          // Keep existing expiryDate and reorderLevel
          expiryDate: medicine.expiryDate,
          reorderLevel: medicine.reorderLevel
        })));
      } else {
        setError("Failed to fetch batch details");
      }
    } catch (err) {
      setError("Failed to fetch batch details");
      console.error("Error fetching batch:", err);
    } finally {
      setFetching(false);
    }
  };

  // Filter medicines based on search
  const filteredMedicines = MEDICINES
    .filter(medicine => 
      medicine.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 10);

  // Handle batch input changes
  const handleBatchInputChange = (e) => {
    const { name, value } = e.target;
    setBatchDetails(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // Handle medicine input changes
  const handleMedicineInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentMedicine(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // Handle medicine selection
  const handleMedicineSelect = (medicine) => {
    setCurrentMedicine(prev => ({ ...prev, medicineName: medicine }));
    setShowMedicineDropdown(false);
    setSearchTerm("");
  };

  // Add medicine to the list
  const addMedicineToList = () => {
    if (!isMedicineFormValid) {
      setError("Please fill all required fields with valid values");
      return;
    }

    // Keep existing expiry date logic (2 years from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 2);
    const expiryDateString = expiryDate.toISOString().split('T')[0];

    setMedicines(prev => [...prev, {
      ...currentMedicine,
      quantity: parseInt(currentMedicine.quantity),
      price: parseFloat(currentMedicine.price),
      expiryDate: expiryDateString,
      reorderLevel: 20 // Default reorder level
    }]);
    
    // Reset current medicine form
    setCurrentMedicine({
      medicineName: "",
      quantity: "",
      price: ""
    });
    setError("");
  };

  // Remove medicine from list
  const removeMedicine = (index) => {
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = () => {
    if (!isBatchValid) {
      setError("Please complete all batch details");
      return false;
    }
    
    if (medicines.length === 0) {
      setError("At least one medicine is required");
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
      // Prepare payload for update
      const payload = {
        batchNumber: batchDetails.batchNumber,
        billID: batchDetails.billID,
        overallPrice: parseFloat(batchDetails.overallPrice),
        medicines: medicines.map(medicine => ({
          medicineName: medicine.medicineName,
          quantity: parseInt(medicine.quantity),
          price: parseFloat(medicine.price),
          expiryDate: medicine.expiryDate,
          dateOfPurchase: medicine.dateOfPurchase || new Date().toISOString().split('T')[0],
          reorderLevel: medicine.reorderLevel || 20
        }))
      };

      const response = await updateBatchById(batchId, payload);
      
      setSuccess("Batch updated successfully");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      setError(
        error.response?.data?.message || 
        "Failed to update batch. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setBatchDetails({
      batchNumber: "",
      billID: "",
      overallPrice: ""
    });
    setMedicines([]);
    setCurrentMedicine({
      medicineName: "",
      quantity: "",
      price: ""
    });
    setError("");
    setSuccess("");
    setSearchTerm("");
    setActiveTab("batch");
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
      title="Edit Batch"
      subtitle="Update existing medicine batch in your inventory"
    >
      {fetching ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header Icon */}
          <div className="flex justify-center mb-6">
            <div
              className={`p-4 rounded-full bg-emerald-500 bg-opacity-20 border border-current text-emerald-500`}
            >
              <Package className="w-8 h-8" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                activeTab === "batch"
                  ? `text-emerald-500 border-b-2 border-emerald-500`
                  : `${theme.textMuted} hover:${theme.textPrimary}`
              }`}
              onClick={() => setActiveTab("batch")}
            >
              Batch Details
            </button>
            <button
              type="button"
              className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                activeTab === "medicines"
                  ? `text-emerald-500 border-b-2 border-emerald-500`
                  : `${theme.textMuted} hover:${theme.textPrimary}`
              }`}
              onClick={() => setActiveTab("medicines")}
            >
              Medicines
            </button>
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

          {/* Batch Details Tab */}
          {activeTab === "batch" && (
            <div className="space-y-6">
              {/* Batch Number (Full Width) */}
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
                    value={batchDetails.batchNumber}
                    onChange={handleBatchInputChange}
                    className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                    placeholder="Enter batch number"
                    required
                  />
                </div>
              </div>

              {/* Bill ID and Overall Price (50/50) */}
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
                      value={batchDetails.billID}
                      onChange={handleBatchInputChange}
                      className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                      placeholder="Enter bill ID"
                      required
                    />
                  </div>
                </div>

                {/* Overall Price */}
                <div>
                  <label
                    className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                  >
                    Overall Price *
                  </label>
                  <div className="relative">
                    <DollarSign
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                    />
                    <input
                      type="number"
                      name="overallPrice"
                      value={batchDetails.overallPrice}
                      onChange={handleBatchInputChange}
                      step="0.01"
                      min="0.01"
                      className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                      placeholder="Enter overall price"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Medicines Tab */}
          {activeTab === "medicines" && (
            <div className="space-y-6">
              {/* Medicine Name (Full Width) */}
              <div className="relative" ref={dropdownRef}>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  Medicine Name *
                </label>
                <div className="relative">
                  <Pill className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
                  <input
                    type="text"
                    name="medicineName"
                    value={currentMedicine.medicineName || searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowMedicineDropdown(true);
                      setCurrentMedicine(prev => ({ ...prev, medicineName: e.target.value }));
                    }}
                    onFocus={() => setShowMedicineDropdown(true)}
                    onClick={() => setShowMedicineDropdown(true)}
                    className={`w-full pl-10 pr-10 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                    placeholder="Search medicine..."
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

              {/* Price and Quantity (50/50) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label
                    className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                  >
                    Price *
                  </label>
                  <div className="relative">
                    <DollarSign
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                    />
                    <input
                      type="number"
                      name="price"
                      value={currentMedicine.price}
                      onChange={handleMedicineInputChange}
                      step="0.01"
                      min="0.01"
                      className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                      placeholder="Enter price"
                    />
                  </div>
                </div>

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
                      value={currentMedicine.quantity}
                      onChange={handleMedicineInputChange}
                      min="1"
                      className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                      placeholder="Enter quantity"
                    />
                  </div>
                </div>
              </div>

              {/* Add Medicine Button */}
              <div className="flex justify-end">
                <motion.button
                  type="button"
                  onClick={addMedicineToList}
                  disabled={!isMedicineFormValid}
                  whileHover={{ scale: isMedicineFormValid ? 1.02 : 1 }}
                  whileTap={{ scale: isMedicineFormValid ? 0.98 : 1 }}
                  className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Medicine</span>
                </motion.button>
              </div>

              {/* Medicines Table */}
              <div className={`${theme.card} rounded-lg overflow-hidden border ${theme.borderSecondary}`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`${theme.cardSecondary}`}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${theme.textPrimary}`}>Medicine</th>
                        <th className={`px-4 py-3 text-center text-sm font-medium ${theme.textPrimary}`}>Quantity</th>
                        <th className={`px-4 py-3 text-center text-sm font-medium ${theme.textPrimary}`}>Price</th>
                        <th className={`px-4 py-3 text-center text-sm font-medium ${theme.textPrimary}`}>Total</th>
                        <th className={`px-4 py-3 text-center text-sm font-medium ${theme.textPrimary}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.length > 0 ? (
                        medicines.map((medicine, index) => (
                          <tr key={index} className={`${index % 2 === 0 ? theme.card : theme.cardSecondary} border-b ${theme.borderSecondary}`}>
                            <td className="px-4 py-3">
                              <div className={`flex items-center ${theme.textPrimary}`}>
                                <Pill className="w-4 h-4 text-emerald-500 mr-2" />
                                <span>{medicine.medicineName}</span>
                              </div>
                            </td>
                            <td className={`px-4 py-3 text-center ${theme.textPrimary}`}>{medicine.quantity}</td>
                            <td className={`px-4 py-3 text-center ${theme.textPrimary}`}>${medicine.price}</td>
                            <td className={`px-4 py-3 text-center ${theme.textPrimary} font-medium`}>
                              ${(parseFloat(medicine.price) * parseInt(medicine.quantity)).toFixed(2)}
                            </td>
                            <td className={`px-4 py-3 text-center ${theme.textPrimary}`}>
                              <button
                                type="button"
                                onClick={() => removeMedicine(index)}
                                className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-red-500 hover:text-white transition-colors`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className={`text-center py-4 ${theme.textPrimary}`}>
                            No medicines added yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}>
                  <div className="flex items-center">
                    <Hash className="w-5 h-5 text-blue-500 mr-2" />
                    <div>
                      <p className={`text-sm ${theme.textMuted}`}>Total Quantity</p>
                      <p className={`text-xl font-bold ${theme.textPrimary}`}>{totalQuantity} units</p>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}>
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-green-500 mr-2" />
                    <div>
                      <p className={`text-sm ${theme.textMuted}`}>Total Medicines Price</p>
                      <p className={`text-xl font-bold ${theme.textPrimary}`}>${totalMedicinePrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}>
                  <div className="flex items-center">
                    <Box className="w-5 h-5 text-purple-500 mr-2" />
                    <div>
                      <p className={`text-sm ${theme.textMuted}`}>Batch Overall Price</p>
                      <p className={`text-xl font-bold ${theme.textPrimary}`}>
                        ${batchDetails.overallPrice ? parseFloat(batchDetails.overallPrice).toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Mismatch Warning */}
              {batchDetails.overallPrice && medicines.length > 0 && hasPriceMismatch && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className={`p-4 rounded-lg border ${isOver ? 'border-red-500 bg-red-500 bg-opacity-10' : 'border-yellow-500 bg-yellow-500 bg-opacity-10'} flex items-center`}
                >
                  <AlertCircle className={`w-5 h-5 ${isOver ? 'text-red-500' : 'text-yellow-500'} mr-2`} />
                  <div>
                    <p className={`${isOver ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'} font-medium`}>
                      Price Mismatch Detected!
                    </p>
                    <p className={`text-sm ${theme.textPrimary}`}>
                      {isOver
                        ? `Total medicine prices ($${totalMedicinePrice.toFixed(2)}) exceed batch overall price ($${parseFloat(batchDetails.overallPrice).toFixed(2)}) by $${priceDifference.toFixed(2)}`
                        : `Batch overall price ($${parseFloat(batchDetails.overallPrice).toFixed(2)}) exceeds total medicine prices ($${totalMedicinePrice.toFixed(2)}) by $${priceDifference.toFixed(2)}`}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <div>
              {/* Removed "Back to Batch" button as requested */}
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleClose}
                className={`px-6 py-3 ${theme.cardSecondary} ${theme.textSecondary} rounded-lg hover:bg-opacity-70 transition-colors`}
                disabled={loading}
              >
                Cancel
              </button>
              {activeTab === "batch" ? (
                <motion.button
                  type="button"
                  onClick={() => setActiveTab("medicines")}
                  disabled={!isBatchValid}
                  whileHover={{ scale: isBatchValid ? 1.02 : 1 }}
                  whileTap={{ scale: isBatchValid ? 0.98 : 1 }}
                  className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <List className="w-5 h-5" />
                  <span>Next: Edit Medicines</span>
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={loading || !isBatchValid || medicines.length === 0}
                  whileHover={{ scale: (loading || !isBatchValid || medicines.length === 0) ? 1 : 1.02 }}
                  whileTap={{ scale: (loading || !isBatchValid || medicines.length === 0) ? 1 : 0.98 }}
                  className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Updating Batch...</span>
                    </>
                  ) : (
                    <>
                      <Edit className="w-5 h-5" />
                      <span>Update Batch</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditStockModal;