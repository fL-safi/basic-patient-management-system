import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";
import {
  Pill,
  Plus,
  Loader,
  Hash,
  Barcode,
  Banknote,
  FileDigit,
  ChevronDown,
  Trash2,
  ArrowLeft,
  AlertCircle,
  Box,
  DollarSign,
} from "lucide-react";
import {
  MEDICINES,
  getMedicineById,
  getMedicineByName,
} from "../../constants/selectOptions";
import { addToStock } from "../../api/api";
import { useAuthStore } from "../../store/authStore";

const AddBatch = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { batchDetails, attachments = [] } = location.state || {};

  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const [medicines, setMedicines] = useState([]);
  const [miscellaneousAmount, setMiscellaneousAmount] = useState(0);
  const [currentMedicine, setCurrentMedicine] = useState({
    medicineName: "",
    quantity: "",
    price: "",
  });

  useEffect(() => {
    if (!batchDetails) {
      navigate("/inventory-management");
    }
  }, [batchDetails, navigate]);

  // Determine redirect path based on user role
  const redirectPath =
    user?.role === "admin"
      ? "/admin/inventory-management"
      : user?.role === "pharmacist_inventory"
      ? "/pharmacist_inventory/inventory-management"
      : "/inventory-management";

  const isMedicineFormValid = useMemo(() => {
    if (currentMedicine.medicineId === 1) {
      // MISCELLANEOUS ID
      return true;
    }
    return (
      currentMedicine.medicineId &&
      currentMedicine.medicineName &&
      currentMedicine.quantity &&
      parseInt(currentMedicine.quantity) > 0 &&
      currentMedicine.price &&
      parseFloat(currentMedicine.price) > 0
    );
  }, [currentMedicine]);

  const totalMedicinePrice = useMemo(() => {
    return medicines.reduce((total, medicine) => {
      return total + parseFloat(medicine.price) * parseInt(medicine.quantity);
    }, 0);
  }, [medicines]);

  const totalQuantity = useMemo(() => {
    return medicines.reduce((total, medicine) => {
      return total + parseInt(medicine.quantity);
    }, 0);
  }, [medicines]);

  const remainingAmount = useMemo(() => {
    if (!batchDetails?.overallPrice) return 0;
    const remaining =
      parseFloat(batchDetails.overallPrice) - totalMedicinePrice;
    return Math.max(0, remaining);
  }, [totalMedicinePrice, batchDetails]);

  const totalWithMiscellaneous = totalMedicinePrice + miscellaneousAmount;

  const priceDifference = useMemo(() => {
    if (!batchDetails?.overallPrice) return 0;
    return Math.abs(
      totalWithMiscellaneous - parseFloat(batchDetails.overallPrice)
    );
  }, [totalWithMiscellaneous, batchDetails]);

  const hasPriceMismatch = priceDifference > 0.01;
  const isPriceExceeded =
    totalWithMiscellaneous > parseFloat(batchDetails?.overallPrice || 0);
  const canAddBatch = !hasPriceMismatch && medicines.length > 0;

  // Update miscellaneous amount when remaining amount changes
  useEffect(() => {
    if (currentMedicine.medicineName === "MISCELLANEOUS") {
      setCurrentMedicine((prev) => ({
        ...prev,
        price: remainingAmount.toFixed(2),
      }));
    }
  }, [remainingAmount, currentMedicine.medicineName]);

  const handleMedicineInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentMedicine((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleMedicineSelect = (medicine) => {
    setCurrentMedicine((prev) => ({
      ...prev,
      medicineId: medicine.id,
      medicineName: medicine.name,
      quantity: medicine.id === 1 ? "" : prev.quantity, // MISCELLANEOUS
      price: medicine.id === 1 ? remainingAmount.toFixed(2) : prev.price,
    }));
    setShowMedicineDropdown(false);
    setSearchTerm("");
  };

  const addMedicineToList = () => {
    if (!isMedicineFormValid) {
      setError("Please fill all required fields with valid values");
      return;
    }

    // Check for duplicate medicine
    const existingMedicine = medicines.find(
      (med) => med.medicineId === currentMedicine.medicineId
    );
    if (existingMedicine) {
      setError(
        "This medicine is already added to the list. Please select a different medicine."
      );
      return;
    }

    if (currentMedicine.medicineId === 1) {
      // MISCELLANEOUS
      const miscAmount = parseFloat(currentMedicine.price) || 0;
      setMiscellaneousAmount(miscAmount);
    } else {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 2);
      const expiryDateString = expiryDate.toISOString().split("T")[0];

      setMedicines((prev) => [
        ...prev,
        {
          ...currentMedicine,
          quantity: parseInt(currentMedicine.quantity),
          price: parseFloat(currentMedicine.price),
          expiryDate: expiryDateString,
        },
      ]);
    }

    setCurrentMedicine({
      medicineId: null,
      medicineName: "",
      quantity: "",
      price: "",
    });
    setError("");
  };

  const removeMedicine = (index) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const removeMiscellaneous = () => {
    setMiscellaneousAmount(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (medicines.length === 0) {
      setError("At least one medicine is required");
      return;
    }

    if (hasPriceMismatch) {
      if (isPriceExceeded) {
        setError("Total medicine price has exceeded against this Cheque Number");
      }
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        batchNumber: batchDetails.batchNumber,
        billID: batchDetails.billID,
        overallPrice: parseFloat(batchDetails.overallPrice),
        miscellaneousAmount: miscellaneousAmount,
        attachments,
        medicines: medicines.map((medicine) => ({
          medicineId: medicine.medicineId,
          medicineName: medicine.medicineName,
          quantity: medicine.quantity,
          price: medicine.price,
          expiryDate: medicine.expiryDate,
          dateOfPurchase: new Date().toISOString().split("T")[0],
          reorderLevel: 20,
        })),
      };

      const response = await addToStock(payload);
      setSuccess("Batch added successfully!");

      setTimeout(() => {
        navigate(redirectPath);
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

  const isMiscellaneousSelected = currentMedicine.medicineId === 1;

  return (
    <div className={`${theme.background} min-h-screen p-6`}>
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(redirectPath)}
          className={`flex items-center ${theme.textPrimary} mb-6`}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Inventory
        </button>

        <h1 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
          Add Medicines to Batch
        </h1>
        <p className={`${theme.textSecondary} mb-8`}>
          Add medicines to batch: {batchDetails?.batchNumber}
        </p>

        {/* Batch Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
          >
            <div className="flex items-center">
              <Barcode className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className={`text-sm ${theme.textMuted}`}>Batch Number</p>
                <p className={`text-lg font-bold ${theme.textPrimary}`}>
                  {batchDetails?.batchNumber}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
          >
            <div className="flex items-center">
              <FileDigit className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <p className={`text-sm ${theme.textMuted}`}>Cheque Number</p>
                <p className={`text-lg font-bold ${theme.textPrimary}`}>
                  {batchDetails?.billID}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
          >
            <div className="flex items-center">
              <Banknote className="w-5 h-5 text-purple-500 mr-2" />
              <div>
                <p className={`text-sm ${theme.textMuted}`}>Overall Price</p>
                <p className={`text-lg font-bold ${theme.textPrimary}`}>
                  PKR{" "}
                  {batchDetails?.overallPrice
                    ? parseFloat(batchDetails.overallPrice).toFixed(2)
                    : "0.00"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Medicine Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg mb-6">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Medicine Name */}
            <div className="relative" ref={dropdownRef}>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Medicine Name *
              </label>
              <div className="relative">
                <Pill
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                />
                <input
                  type="text"
                  name="medicineName"
                  value={currentMedicine.medicineName || searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowMedicineDropdown(true);
                    setCurrentMedicine((prev) => ({
                      ...prev,
                      medicineName: e.target.value,
                    }));
                  }}
                  onFocus={() => setShowMedicineDropdown(true)}
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
                <div
                  className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-md ${theme.card} shadow-lg ${theme.border} border`}
                >
                  <ul>
                    {MEDICINES.filter((medicine) =>
                      medicine.name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    )
                      .slice(0, 10)
                      .map((medicine) => (
                        <li
                          key={medicine.id}
                          onClick={() => handleMedicineSelect(medicine)}
                          className={`px-4 py-2 cursor-pointer hover:${
                            theme.cardSecondary
                          } ${theme.textPrimary} ${
                            medicine.name === "MISCELLANEOUS"
                              ? "bg-yellow-50 border-l-4 border-yellow-400"
                              : ""
                          }`}
                        >
                          {medicine.name}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Conditional Fields */}
            {isMiscellaneousSelected ? (
              <div>
                <label
                  className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                >
                  Miscellaneous Amount *
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
                    min="0"
                    max={remainingAmount}
                    className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                    placeholder={`Remaining: ${remainingAmount.toFixed(2)}`}
                  />
                </div>
                <p className={`text-xs ${theme.textMuted} mt-1`}>
                  Remaining amount: PKR {remainingAmount.toFixed(2)}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                  >
                    Price *
                  </label>
                  <div className="relative">
                    <Banknote
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
            )}
          </div>

          <div className="flex justify-end mb-8">
            <button
              type="button"
              onClick={addMedicineToList}
              disabled={!isMedicineFormValid}
              className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {isMiscellaneousSelected ? "Add Miscellaneous" : "Add Medicine"}
              </span>
            </button>
          </div>

          {/* Medicines Table */}
          <div
            className={`${theme.card} rounded-lg overflow-hidden border ${theme.borderSecondary} mb-4`}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme.cardSecondary}`}>
                  <tr>
                    <th
                      className={`px-4 py-3 text-left text-sm font-medium ${theme.textPrimary}`}
                    >
                      Medicine
                    </th>
                    <th
                      className={`px-4 py-3 text-center text-sm font-medium ${theme.textPrimary}`}
                    >
                      Quantity
                    </th>
                    <th
                      className={`px-4 py-3 text-center text-sm font-medium ${theme.textPrimary}`}
                    >
                      Price
                    </th>
                    <th
                      className={`px-4 py-3 text-center text-sm font-medium ${theme.textPrimary}`}
                    >
                      Total
                    </th>
                    <th
                      className={`px-4 py-3 text-center text-sm font-medium ${theme.textPrimary}`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.length > 0 ? (
                    medicines.map((medicine, index) => (
                      <tr
                        key={index}
                        className={`${
                          index % 2 === 0 ? theme.card : theme.cardSecondary
                        } border-b ${theme.borderSecondary}`}
                      >
                        <td className="px-4 py-3">
                          <div
                            className={`flex items-center ${theme.textPrimary}`}
                          >
                            <Pill className="w-4 h-4 text-emerald-500 mr-2" />
                            <span>{medicine.medicineName}</span>
                          </div>
                        </td>
                        <td
                          className={`px-4 py-3 text-center ${theme.textPrimary}`}
                        >
                          {medicine.quantity}
                        </td>
                        <td
                          className={`px-4 py-3 text-center ${theme.textPrimary}`}
                        >
                          PKR {medicine.price.toFixed(2)}
                        </td>
                        <td
                          className={`px-4 py-3 text-center ${theme.textPrimary} font-medium`}
                        >
                          PKR {(medicine.quantity * medicine.price).toFixed(2)}
                        </td>
                        <td
                          className={`px-4 py-3 text-center ${theme.textPrimary}`}
                        >
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
                      <td
                        colSpan="5"
                        className={`text-center py-4 ${theme.textPrimary}`}
                      >
                        No medicines added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Miscellaneous Section */}
          {miscellaneousAmount > 0 && (
            <div
              className={`${theme.card} rounded-lg border ${theme.borderSecondary} mb-8 p-4`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-yellow-500 mr-2" />
                  <div>
                    <p className={`text-sm ${theme.textMuted}`}>
                      Miscellaneous Amount
                    </p>
                    <p className={`text-lg font-bold ${theme.textPrimary}`}>
                      PKR {miscellaneousAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeMiscellaneous}
                  className={`p-1.5 rounded-lg ${theme.cardSecondary} ${theme.textPrimary} hover:bg-red-500 hover:text-white transition-colors`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div
              className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
            >
              <div className="flex items-center">
                <Hash className="w-5 h-5 text-blue-500 mr-2" />
                <div>
                  <p className={`text-sm ${theme.textMuted}`}>Total Quantity</p>
                  <p className={`text-xl font-bold ${theme.textPrimary}`}>
                    {totalQuantity} units
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
            >
              <div className="flex items-center">
                <Banknote className="w-5 h-5 text-green-500 mr-2" />
                <div>
                  <p className={`text-sm ${theme.textMuted}`}>
                    Medicines Total
                  </p>
                  <p className={`text-xl font-bold ${theme.textPrimary}`}>
                    PKR {totalMedicinePrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
            >
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-yellow-500 mr-2" />
                <div>
                  <p className={`text-sm ${theme.textMuted}`}>Grand Total</p>
                  <p className={`text-xl font-bold ${theme.textPrimary}`}>
                    PKR {totalWithMiscellaneous.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
            >
              <div className="flex items-center">
                <Box className="w-5 h-5 text-purple-500 mr-2" />
                <div>
                  <p className={`text-sm ${theme.textMuted}`}>Batch Price</p>
                  <p className={`text-xl font-bold ${theme.textPrimary}`}>
                    PKR{" "}
                    {batchDetails?.overallPrice
                      ? parseFloat(batchDetails.overallPrice).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Mismatch Warning */}
          {medicines.length > 0 && hasPriceMismatch && isPriceExceeded && (
            <div
              className={`p-4 rounded-lg border border-red-500 bg-red-500 bg-opacity-10 flex items-center mb-8`}
            >
              <AlertCircle className={`w-5 h-5 text-red-500 mr-2`} />
              <div>
                <p className={`text-red-700 dark:text-red-300 font-medium`}>
                  Total medicine price has exceeded against this Cheque Number
                </p>
                <p className={`text-sm ${theme.textPrimary}`}>
                  Grand total (PKR {totalWithMiscellaneous.toFixed(2)}) exceeds
                  batch price (PKR{" "}
                  {parseFloat(batchDetails?.overallPrice || 0).toFixed(2)}) by
                  PKR {priceDifference.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !canAddBatch}
              className={`flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Adding Batch...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Add Batch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBatch;
