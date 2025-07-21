import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Pill,
  AlertCircle,
  CalendarX,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Box,
  Gauge,
  CalendarCheck,
  BarChart2,
  ArrowDownUp,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { getStocksData, deleteStockById } from "../../api/api";
import AddStockModal from "../../components/inventory/AddStockModal";
import ConfirmDeleteModal from "../../components/inventory/ConfirmDeleteModal";
import UpdateBatch from "../../components/inventory/UpdateBatch.jsx";
import Modal from "../../components/UI/Modal.jsx";

import formatDate from "../../utils/date.js";
import { useAuthStore } from "../../store/authStore";

// Helper function to calculate total medicine price
const calculateTotalMedicinePrice = (medicines) => {
  return medicines.reduce((total, medicine) => total + medicine.totalAmount, 0);
};

const Stocks = () => {
  const { theme } = useTheme();
  const [allStockData, setAllStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [expandedBatches, setExpandedBatches] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [allBatches, setAllBatches] = useState([]);

  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);

  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  // Toggle batch expansion
  const toggleBatchExpansion = (batchId) => {
    setExpandedBatches((prev) => ({
      ...prev,
      [batchId]: !prev[batchId],
    }));
  };

  const handleDeleteClick = (batch) => {
    setSelectedStock(batch);
    setDeleteModalOpen(true);
  };

  const handleDeleteSuccess = (deletedBatchId) => {
    setAllStockData((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        batches: prev.data.batches.filter(
          (batch) => batch._id !== deletedBatchId
        ),
        summary: {
          ...prev.data.summary,
          totalBatches: prev.data.summary.totalBatches - 1,
        },
      },
    }));
    setDeleteModalOpen(false);
  };

  const handleStockAdded = () => {
    fetchData();
    setIsModalOpen(false);
  };

  // Fetch ALL stock data from API (no pagination)
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getStocksData();
      setAllStockData(data);
    } catch (err) {
      setError("Failed to fetch inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Inside fetchData after setting allStockData:
  useEffect(() => {
    if (allStockData && allStockData.data?.batches) {
      const batches = allStockData.data.batches.map((batch) => ({
        batchNumber: batch.batchNumber,
        billID: batch.billID,
      }));
      setAllBatches(batches);
    }
  }, [allStockData]);

  const handleAddStock = () => {
    setIsModalOpen(true);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Frontend filtering and sorting
  const filteredAndSortedBatches = useMemo(() => {
    if (!allStockData || !allStockData.data?.batches) return [];

    let batches = [...allStockData.data.batches];

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      batches = batches.filter(
        (batch) =>
          batch.batchNumber.toLowerCase().includes(lowerSearch) ||
          batch.billID.toLowerCase().includes(lowerSearch) ||
          batch.medicines.some((med) =>
            med.medicineName.toLowerCase().includes(lowerSearch)
          )
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      batches.sort((a, b) => {
        // Handle nested properties
        let aValue, bValue;

        if (sortConfig.key === "summary.totalMedicines") {
          aValue = a.summary.totalMedicines;
          bValue = b.summary.totalMedicines;
        } else if (sortConfig.key === "summary.totalQuantity") {
          aValue = a.summary.totalQuantity;
          bValue = b.summary.totalQuantity;
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        // Convert to number if possible
        if (typeof aValue === "string" && !isNaN(aValue)) {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return batches;
  }, [allStockData, searchTerm, sortConfig]);

  // Summary cards data
  const summaryCards = [
    {
      title: "Total Batches",
      value: allStockData?.data?.summary?.totalBatches || 0,
      icon: Box,
      color: "text-blue-500",
      bgColor: "bg-blue-500 bg-opacity-20 border-blue-500",
    },
    {
      title: "Total Medicines",
      value: allStockData?.data?.summary?.totalMedicines || 0,
      icon: Pill,
      color: "text-green-500",
      bgColor: "bg-green-500 bg-opacity-20 border-green-500",
    },
    {
      title: "Low Stock Batches",
      value: allStockData?.data?.summary?.batchesWithLowStock || 0,
      icon: Gauge,
      color: "text-orange-500",
      bgColor: "bg-orange-500 bg-opacity-20 border-orange-500",
    },
    {
      title: "Expired Batches",
      value: allStockData?.data?.summary?.batchesWithExpiredItems || 0,
      icon: CalendarX,
      color: "text-red-500",
      bgColor: "bg-red-500 bg-opacity-20 border-red-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-center p-8 ${theme.cardOpacity} rounded-xl`}>
          <p className={`text-xl ${theme.textPrimary} mb-4`}>{error}</p>
          <button
            onClick={fetchData}
            className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const AttachmentsModal = ({
    isOpen,
    onClose,
    attachments,
    currentIndex,
    setCurrentIndex,
  }) => {
    const { theme } = useTheme();

    const handlePrev = () => {
      setCurrentIndex(
        (prev) => (prev - 1 + attachments.length) % attachments.length
      );
    };

    const handleNext = () => {
      setCurrentIndex((prev) => (prev + 1) % attachments.length);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div
          className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border max-w-4xl w-full max-h-[90vh] flex flex-col`}
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className={`text-xl font-semibold ${theme.textPrimary}`}>
              Batch Attachments
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${theme.cardSecondary} hover:opacity-75`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center p-8">
            {attachments.length > 1 && (
              <button
                onClick={handlePrev}
                className={`absolute left-4 z-10 p-2 rounded-full ${theme.cardSecondary} hover:opacity-75`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            <div className="w-full h-full flex items-center justify-center">
              <img
                src={attachments[currentIndex]}
                className="max-w-full max-h-[60vh] object-contain"
                alt={`Attachment ${currentIndex + 1}`}
              />
            </div>

            {attachments.length > 1 && (
              <button
                onClick={handleNext}
                className={`absolute right-4 z-10 p-2 rounded-full ${theme.cardSecondary} hover:opacity-75`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>

          <div className="p-4 flex justify-center items-center">
            {attachments.length > 1 && (
              <div className="flex space-x-2">
                {attachments.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-3 h-3 rounded-full ${
                      idx === currentIndex
                        ? "bg-blue-500"
                        : `${theme.cardSecondary}`
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className={`text-3xl font-bold ${theme.textPrimary} mb-2`}>
          Batch Inventory Management
        </h1>
        <p className={`${theme.textMuted}`}>
          Manage medicine stock levels by batches, track expiry dates, and
          monitor inventory health
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${theme.textMuted}`}>
                  {card.title}
                </p>
                <p className={`text-3xl font-bold ${theme.textPrimary} mt-2`}>
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor} border`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
      >
        <div className="p-6">
          {/* Header with Add Button */}
          <div className="flex flex-col sm:flex-row gap-5 justify-between items-start mb-6">
            <div>
              <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
                Medicine Stock - Batch View
              </h2>
              <p className={`${theme.textMuted}`}>
                View and manage batches with expandable medicine details
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddStock}
              className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200`}
            >
              <Plus className="w-5 h-5" />
              <span>Add Batch</span>
            </motion.button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="text"
                placeholder="Search batches, medicines, or bills..."
                value={searchTerm}
                onChange={handleSearch}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
              />
            </div>
          </div>

          {/* Table */}
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme.borderSecondary} border-b`}>
                  <th className="w-8 px-2 py-3"></th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium cursor-pointer"
                    onClick={() => requestSort("batchNumber")}
                  >
                    <div className={`flex items-center ${theme.textPrimary}`}>
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Batch
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer"
                    onClick={() => requestSort("billID")}
                  >
                    <div
                      className={`flex items-center ${theme.textPrimary} justify-center`}
                    >
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Bill ID
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer"
                    onClick={() => requestSort("summary.totalQuantity")}
                  >
                    <div
                      className={`flex items-center ${theme.textPrimary} justify-center`}
                    >
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Total Quantity
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer"
                    onClick={() => requestSort("overallPrice")}
                  >
                    <div
                      className={`flex items-center ${theme.textPrimary} justify-center`}
                    >
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Total Price
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className={`px-6 py-3 text-center text-xs font-medium ${theme.textMuted} tracking-wider`}
                  >
                    Status
                  </th>
                  <th
                    className={`px-6 py-3 text-center text-xs font-medium ${theme.textMuted} tracking-wider`}
                  >
                    Attachments
                  </th>
                  {isAdmin && (
                    <th
                      className={`px-6 py-3 text-center text-xs font-medium ${theme.textMuted} tracking-wider`}
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedBatches.map((batch) => {
                  // Calculate total medicine price
                  const totalMedicinePrice = calculateTotalMedicinePrice(
                    batch.medicines
                  );
                  const hasMiscAmount = batch.miscellaneousAmount !== 0;
                  const miscAmountSign =
                    batch.miscellaneousAmount > 0 ? "+" : "-";
                  const miscAmountColor =
                    batch.miscellaneousAmount > 0
                      ? "text-yellow-500"
                      : "text-red-500";

                  return (
                    <React.Fragment key={batch._id}>
                      {/* Batch Row */}
                      <tr
                        className={`${theme.borderSecondary} border-b hover:bg-opacity-50 ${theme.cardSecondary} transition-colors`}
                      >
                        <td className="px-2 py-4 text-center">
                          <button
                            onClick={() => toggleBatchExpansion(batch._id)}
                            className={`${theme.textPrimary} p-1 rounded-full `}
                          >
                            {expandedBatches[batch._id] ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div
                              className={`w-10 h-10 rounded-full ${theme.cardSecondary} flex items-center justify-center mr-3`}
                            >
                              <Layers className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <div
                                className={`font-medium ${theme.textPrimary}`}
                              >
                                {batch.batchNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                        >
                          {batch.billID}
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                        >
                          {batch.summary.totalQuantity}
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                        >
                          <div className="flex items-center justify-center">
                            PKR {batch.overallPrice}
                            {hasMiscAmount && (
                              <div className="ml-2 relative group inline-flex">
                                <div
                                  className={`p-1 rounded-full ${miscAmountColor} bg-opacity-20`}
                                >
                                  <AlertCircle
                                    className={`w-4 h-4 ${miscAmountColor}`}
                                  />
                                </div>
                                <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded w-64 z-10 left-1/2 transform -translate-x-1/2 bottom-full mb-2">
                                  Miscellaneous Amount: Rs.
                                  {batch.miscellaneousAmount}
                                  <br />
                                  {batch.miscellaneousAmount > 0
                                    ? `Added to total price`
                                    : `Deducted from total price`}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 min-w-40 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              batch.summary.batchStatus === "Good"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : batch.summary.batchStatus === "Warning"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {batch.summary.batchStatus}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 text-center cursor-pointer"
                          onClick={() => {
                            if (batch.attachments?.length) {
                              setSelectedAttachments(batch.attachments);
                              setCurrentAttachmentIndex(0);
                              setAttachmentModalOpen(true);
                            }
                          }}
                        >
                          {batch.attachments?.length ? (
                            <div className="flex justify-center -space-x-2">
                              {batch.attachments.slice(0, 2).map((url, idx) => (
                                <img
                                  key={idx}
                                  src={url}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-white"
                                  alt={`Attachment ${idx + 1}`}
                                />
                              ))}
                              {batch.attachments.length > 2 && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                                  +{batch.attachments.length - 2}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              No attachment
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex justify-center items-center space-x-2">
                              <button
                                className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                              >
                                <Eye className="w-4 h-4 text-blue-500" />
                              </button>
                              <button
                                className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                                onClick={() => {
                                  setEditingBatchId(batch._id);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4 text-green-500" />
                              </button>
                              <button
                                title="Delete Batch"
                                onClick={() => handleDeleteClick(batch)}
                                className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Medicine Details - Expanded View */}
                      {expandedBatches[batch._id] && (
                        <tr className={`${theme.primary}`}>
                          <td
                            colSpan={isAdmin ? "9" : "8"}
                            className="px-6 py-4"
                          >
                            <div className="ml-10">
                              <div className="overflow-x-auto">
                                <table className="min-w-full">
                                  <thead>
                                    <tr
                                      className={`${theme.borderSecondary} border-b`}
                                    >
                                      <th
                                        className={`px-4 py-2 text-center text-sm font-medium ${theme.textSecondary}`}
                                      >
                                        Medicine
                                      </th>
                                      <th
                                        className={`px-4 py-2 text-center text-sm font-medium ${theme.textSecondary}`}
                                      >
                                        Quantity
                                      </th>
                                      <th
                                        className={`px-4 py-2 text-center text-sm font-medium ${theme.textSecondary}`}
                                      >
                                        Unit Price
                                      </th>
                                      <th
                                        className={`px-4 py-2 text-center text-sm font-medium ${theme.textSecondary}`}
                                      >
                                        Total Price
                                      </th>
                                      <th
                                        className={`px-4 py-2 text-center text-sm font-medium ${theme.textSecondary}`}
                                      >
                                        Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {batch.medicines.map((medicine) => (
                                      <tr
                                        key={medicine._id}
                                        className={`${theme.borderSecondary} border-b hover:bg-opacity-30 ${theme.cardSecondary}`}
                                      >
                                        <td className="px-4 py-3">
                                          <div className="flex items-center">
                                            <Pill className="w-4 h-4 text-emerald-500 mr-2" />
                                            <span
                                              className={`${theme.textPrimary}`}
                                            >
                                              {medicine.medicineName}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <div className="flex items-center justify-center">
                                            <span
                                              className={
                                                medicine.quantity >
                                                medicine.reorderLevel
                                                  ? "text-green-500"
                                                  : "text-red-500"
                                              }
                                            >
                                              {medicine.quantity} units
                                            </span>
                                          </div>
                                        </td>
                                        <td
                                          className={`px-4 py-3 text-center ${theme.textPrimary}`}
                                        >
                                          Rs. {medicine.price}
                                        </td>
                                        <td
                                          className={`px-4 py-3 text-center font-semibold ${theme.textPrimary}`}
                                        >
                                          Rs. {medicine.totalAmount}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              medicine.quantity >
                                              medicine.reorderLevel
                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                            }`}
                                          >
                                            {medicine.quantity >
                                            medicine.reorderLevel
                                              ? "In Stock"
                                              : "Low Stock"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}

                                    {/* Subtotal Row */}
                                    <tr
                                      className={`${theme.borderSecondary} border-t font-semibold`}
                                    >
                                      <td
                                        className={`${theme.textPrimary} px-4 py-3 text-right`}
                                        colSpan="3"
                                      >
                                        Subtotal (Medicines):
                                      </td>
                                      <td
                                        className={`${theme.textPrimary} px-4 py-3 text-center`}
                                      >
                                        Rs. {totalMedicinePrice}
                                      </td>
                                      <td></td>
                                    </tr>

                                    {/* Miscellaneous Amount Row */}
                                    {hasMiscAmount && (
                                      <tr
                                        className={`${theme.borderSecondary} border-t`}
                                      >
                                        <td
                                          className={`${theme.textPrimary} px-4 py-3 text-right`}
                                          colSpan="3"
                                        >
                                          Miscellaneous Amount:
                                        </td>
                                        <td
                                          className={`${miscAmountColor} px-4 py-3 text-center font-semibold`}
                                        >
                                          {miscAmountSign}Rs.
                                          {Math.abs(batch.miscellaneousAmount)}
                                        </td>
                                        <td></td>
                                      </tr>
                                    )}

                                    {/* Overall Total Row */}
                                    <tr
                                      className={`${theme.borderSecondary} border-t font-semibold`}
                                    >
                                      <td
                                        className={`${theme.textPrimary} px-4 py-3 text-right`}
                                        colSpan="3"
                                      >
                                        Batch Total:
                                      </td>

                                      <td
                                        className={`${theme.textPrimary} px-4 py-3 text-center`}
                                      >
                                        PKR {batch.overallPrice}
                                      </td>
                                      <td
                                        className={`${theme.textPrimary} px-4 py-3 text-center`}
                                      ></td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredAndSortedBatches.length === 0 && (
            <div className="text-center py-12">
              <Package
                className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`}
              />
              <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                {searchTerm
                  ? `No batches found matching "${searchTerm}"`
                  : "No inventory batches found"}
              </h3>
              <p className={`${theme.textMuted} mb-4`}>
                {searchTerm
                  ? "Try adjusting your search terms or clear the search to see all batches"
                  : "Get started by adding your first batch"}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleAddStock}
                  className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 mx-auto`}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Batch</span>
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <AddStockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleStockAdded}
        existingBatches={allBatches}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        stockItem={selectedStock}
        onSuccess={handleDeleteSuccess}
      />

      {/* Add this with other modals */}
      <Modal
        isOpen={attachmentModalOpen}
        onClose={() => setAttachmentModalOpen(false)}
        title="Batch Attachments"
        subtitle={`${currentAttachmentIndex + 1} of ${
          selectedAttachments.length
        }`}
      >
        <div className="relative w-full h-96 flex items-center justify-center">
          {selectedAttachments.length > 0 ? (
            <>
              <img
                src={selectedAttachments[currentAttachmentIndex]}
                alt={`Attachment ${currentAttachmentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />

              {/* Navigation buttons */}
              {selectedAttachments.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentAttachmentIndex(
                        (prev) =>
                          (prev - 1 + selectedAttachments.length) %
                          selectedAttachments.length
                      );
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentAttachmentIndex(
                        (prev) => (prev + 1) % selectedAttachments.length
                      );
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Dots indicator */}
              {selectedAttachments.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                  {selectedAttachments.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentAttachmentIndex(index);
                      }}
                      className={`w-3 h-3 rounded-full ${
                        index === currentAttachmentIndex
                          ? "bg-blue-500"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500">No attachments to display</div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Stocks;
