import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
// Updated import to include helper functions
import {
  MEDICINES,
  getMedicineById,
  getMedicineByName,
} from "../../constants/selectOptions";
import { getBatchById, updateBatchById } from "../../api/api";
import { useAuthStore } from "../../store/authStore";

const UpdateBatch = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { batchId } = useParams();
  const dropdownRef = useRef(null);

  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [batchDetails, setBatchDetails] = useState({
    batchNumber: "",
    billID: "",
    overallPrice: "",
  });
  const [medicines, setMedicines] = useState([]);
  const [miscellaneousAmount, setMiscellaneousAmount] = useState(0);

  // Updated currentMedicine state to include medicineId
  const [currentMedicine, setCurrentMedicine] = useState({
    medicineId: null,
    medicineName: "",
    quantity: "",
    price: "",
  });

  // Determine redirect path based on user role
  const redirectPath =
    user?.role === "admin"
      ? "/admin/inventory-management"
      : user?.role === "pharmacist_inventory"
      ? "/pharmacist_inventory/inventory-management"
      : "/inventory-management";

  // Determine submit redirect path based on user role
  const submitRedirectPath =
    user?.role === "admin"
      ? `/admin/inventory-management/${batchId}`
      : user?.role === "pharmacist_inventory"
      ? `/pharmacist_inventory/inventory-management/${batchId}`
      : "/inventory-management";

  // Updated fetch batch data to handle medicine IDs
  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        setLoading(true);
        const batch = await getBatchById(batchId);

        // Set batch details for the form fields
        setBatchDetails({
          batchNumber: batch.data.batchNumber,
          billID: batch.data.billID,
          overallPrice: batch.data.overallPrice,
        });

        // Convert existing medicines to include IDs if they don't have them
        const existingMedicines = Array.isArray(batch.data.medicines)
          ? batch.data.medicines.map((medicine) => {
              // If medicine doesn't have ID, find it by name
              if (!medicine.medicineId) {
                const foundMedicine = getMedicineByName(medicine.medicineName);
                return {
                  ...medicine,
                  medicineId: foundMedicine ? foundMedicine.id : null,
                };
              }
              return medicine;
            })
          : [];

        setMedicines(existingMedicines);
        setMiscellaneousAmount(batch.data.miscellaneousAmount || 0);
      } catch (error) {
        setError("Failed to fetch batch data. Please try again.");
        setMedicines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchData();
  }, [batchId]);

  // Updated medicine form validation to check for medicineId
  const isMedicineFormValid = useMemo(() => {
    if (currentMedicine.medicineId === 1) {
      // MISCELLANEOUS ID
      return true; // Miscellaneous doesn't need quantity/price validation
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
    if (!medicines || !Array.isArray(medicines)) return 0;
    return medicines.reduce((total, medicine) => {
      return (
        total +
        parseFloat(medicine.price || 0) * parseInt(medicine.quantity || 0)
      );
    }, 0);
  }, [medicines]);

  const totalQuantity = useMemo(() => {
    if (!medicines || !Array.isArray(medicines)) return 0;
    return medicines.reduce((total, medicine) => {
      return total + parseInt(medicine.quantity || 0);
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
  const canUpdateBatch = !hasPriceMismatch && medicines && medicines.length > 0;

  // Update miscellaneous amount when remaining amount changes
  useEffect(() => {
    if (currentMedicine.medicineId === 1) {
      // MISCELLANEOUS ID
      setCurrentMedicine((prev) => ({
        ...prev,
        price: remainingAmount.toFixed(2),
      }));
    }
  }, [remainingAmount, currentMedicine.medicineId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBatchDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMedicineInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentMedicine((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // Updated medicine selection handler to include ID
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

  // Updated add medicine function with duplicate checking
  const addMedicineToList = () => {
    if (!isMedicineFormValid) {
      setError("Please fill all required fields with valid values");
      return;
    }

    // Check for duplicate medicine by ID
    const existingMedicine = medicines.find(
      (med) => med.medicineId === currentMedicine.medicineId
    );
    if (existingMedicine) {
      setError(
        "This medicine is already added to the list. Please select a different medicine or update the existing entry."
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

  // Updated submit handler to include medicine IDs
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

    setUpdateLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        batchNumber: batchDetails.batchNumber,
        billID: batchDetails.billID,
        overallPrice: parseFloat(batchDetails.overallPrice),
        miscellaneousAmount: miscellaneousAmount,
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

      await updateBatchById(batchId, payload);
      setSuccess("Batch updated successfully!");

      setTimeout(() => {
        navigate(redirectPath);
      }, 1500);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to update batch. Please try again."
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  // Updated condition check for miscellaneous
  const isMiscellaneousSelected = currentMedicine.medicineId === 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!batchDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-center p-8 ${theme.cardOpacity} rounded-xl`}>
          <p className={`text-xl ${theme.textPrimary} mb-4`}>Batch not found</p>
          <button
            onClick={() => navigate(redirectPath)}
            className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg`}
          >
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

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
          Update Batch
        </h1>
        <p className={`${theme.textSecondary} mb-8`}>
          Update details for batch: {batchDetails.batchNumber}
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
            {/* Medicine Name - Updated dropdown */}
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

              {/* Updated dropdown to use medicine objects */}
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

          {/* Medicines Table - No changes needed here as it displays existing data */}
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
                  {medicines && medicines.length > 0 ? (
                    medicines.map((medicine, index) => (
                      <tr
                        key={`${medicine.medicineId}-${index}`} // Updated key to use medicineId
                        className={`${
                          index % 2 === 0 ? theme.card : theme.cardSecondary
                        } border-b ${theme.borderSecondary}`}
                      >
                        <td className="px-4 py-3">
                          <div
                            className={`flex items-center ${theme.textPrimary}`}
                          >
                            <Pill className="w-4 h-4 text-emerald-500 mr-2" />
                            <div>
                              <span>{medicine.medicineName}</span>
                            </div>
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

          {/* Rest of the component remains the same */}
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
                    PKR {parseFloat(batchDetails.overallPrice).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Mismatch Warning */}
          {medicines &&
            medicines.length > 0 &&
            hasPriceMismatch &&
            isPriceExceeded && (
              <div
                className={`p-4 rounded-lg border border-red-500 bg-red-500 bg-opacity-10 flex items-center mb-8`}
              >
                <AlertCircle className={`w-5 h-5 text-red-500 mr-2`} />
                <div>
                  <p className={`text-red-700 dark:text-red-300 font-medium`}>
                    Total medicine price has exceeded against this Cheque Number
                  </p>
                  <p className={`text-sm ${theme.textPrimary}`}>
                    Grand total (PKR {totalWithMiscellaneous.toFixed(2)})
                    exceeds batch price (PKR{" "}
                    {parseFloat(batchDetails?.overallPrice || 0).toFixed(2)}) by
                    PKR {priceDifference.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

          {/* Update Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateLoading || !canUpdateBatch}
              className={`flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {updateLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Updating Batch...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Update Batch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateBatch;
