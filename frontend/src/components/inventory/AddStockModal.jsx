import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import Modal from "../UI/Modal";
import {
  Package,
  Hash,
  Barcode,
  Banknote,
  FileDigit,
  List,
} from "lucide-react";

const AddStockModal = ({ isOpen, onClose, existingBatches }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [batchDetails, setBatchDetails] = useState({
    batchNumber: "",
    billID: "",
    overallPrice: "",
  });

  const [validationError, setValidationError] = useState("");

  const isBatchValid =
    batchDetails.batchNumber &&
    batchDetails.billID &&
    batchDetails.overallPrice &&
    parseFloat(batchDetails.overallPrice) > 0;

  const handleBatchInputChange = (e) => {
    const { name, value } = e.target;
    setBatchDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (!isBatchValid) return;

    // Reset validation error
    setValidationError("");

    // Convert to lowercase for case-insensitive comparison
    const newBatchNumber = batchDetails.batchNumber.toLowerCase().trim();
    const newBillID = batchDetails.billID.toLowerCase().trim();

    // Create Sets for fast O(1) lookups
    const batchNumberSet = new Set();
    const billIDSet = new Set();

    // Populate Sets with existing values (lowercase and trimmed)
    existingBatches.forEach((batch) => {
      if (batch.batchNumber) {
        batchNumberSet.add(batch.batchNumber.toLowerCase().trim());
      }
      if (batch.billID) {
        billIDSet.add(batch.billID.toLowerCase().trim());
      }
    });

    // Check for duplicates using Set.has() for optimal performance
    const isBatchDuplicate = batchNumberSet.has(newBatchNumber);
    const isBillDuplicate = billIDSet.has(newBillID);

    // Handle validation errors
    if (isBatchDuplicate && isBillDuplicate) {
      setValidationError("Both batch number and bill ID already exist");
    } else if (isBatchDuplicate) {
      setValidationError("Batch number already exists");
    } else if (isBillDuplicate) {
      setValidationError("Bill ID already exists");
    } else {
      // If no duplicates, proceed
      navigate("/add-batch", { state: { batchDetails } });
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Batch"
      subtitle="Add new medicine batch to your inventory"
    >
      <div className="p-6 space-y-6">
        <div className="flex justify-center mb-6">
          <div
            className={`p-4 rounded-full bg-emerald-500 bg-opacity-20 border border-current text-emerald-500`}
          >
            <Package className="w-8 h-8" />
          </div>
        </div>

        {/* Add validation error display */}
        {validationError && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {validationError}
          </div>
        )}

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
              value={batchDetails.batchNumber}
              onChange={handleBatchInputChange}
              className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
              placeholder="Enter batch number"
              required
            />
          </div>
        </div>

        {/* Bill ID and Overall Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Cheque number *
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

          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Overall Price *
            </label>
            <div className="relative">
              <Banknote
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

        {/* Navigation Buttons */}
        <div className="flex justify-end pt-6">
          <div className="flex gap-5">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 ${theme.cardSecondary} ${theme.textSecondary} rounded-lg hover:bg-opacity-70 transition-colors`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!isBatchValid}
              className={`px-6 py-3 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>Next: Add Medicines</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddStockModal;
