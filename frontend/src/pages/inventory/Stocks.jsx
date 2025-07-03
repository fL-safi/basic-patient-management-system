import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { getStocksData, deleteStockById } from "../../api/api";
import AddStockModal from "../../components/inventory/AddStockModal";
import ConfirmDeleteModal from "../../components/inventory/ConfirmDeleteModal";
import formatDate from "../../utils/date.js";

const Stocks = () => {
  const { theme } = useTheme();
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  // Add these functions
  const handleDeleteClick = (stock) => {
    setSelectedStock(stock);
    setDeleteModalOpen(true);
  };

  const handleDeleteSuccess = (deletedStockId) => {
    setStockData((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        items: prev.data.items.filter((item) => item._id !== deletedStockId),
        summary: {
          ...prev.data.summary,
          totalBatches: prev.data.summary.totalBatches - 1,
        },
      },
    }));
    setDeleteModalOpen(false);
  };

  const handleStockAdded = () => {
    fetchData(); // Refresh stock data
    setIsModalOpen(false);
  };

  // Fetch stock data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getStocksData();
      setStockData(data);
    } catch (err) {
      setError("Failed to fetch inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle opening the modal
  const handleAddStock = () => {
    setIsModalOpen(true);
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting
  const getSortedItems = () => {
    if (!stockData?.data?.items || !sortConfig.key)
      return stockData?.data?.items;

    return [...stockData.data.items].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  };

  // Filter items based on search term
  const filteredItems =
    getSortedItems()?.filter((item) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        item.medicineName.toLowerCase().includes(searchLower) ||
        item.batchNumber.toLowerCase().includes(searchLower) ||
        item.form.toLowerCase().includes(searchLower)
      );
    }) || [];

  // Summary cards data
  const summaryCards = [
    {
      title: "Total Items",
      value: stockData?.data?.summary?.totalItems || 0,
      icon: Box,
      color: "text-blue-500",
      bgColor: "bg-blue-500 bg-opacity-20 border-blue-500",
    },
    {
      title: "Low Stock",
      value: stockData?.data?.summary?.lowStockItems || 0,
      icon: Gauge,
      color: "text-orange-500",
      bgColor: "bg-orange-500 bg-opacity-20 border-orange-500",
    },
    {
      title: "Expired Items",
      value: stockData?.data?.summary?.expiredItems || 0,
      icon: CalendarX,
      color: "text-red-500",
      bgColor: "bg-red-500 bg-opacity-20 border-red-500",
    },
    {
      title: "Avg. Stock Level",
      value: stockData?.data?.items?.length
        ? Math.round(
            stockData.data.items.reduce(
              (sum, item) => sum + item.stockLevel,
              0
            ) / stockData.data.items.length
          )
        : 0,
      icon: BarChart2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500 bg-opacity-20 border-emerald-500",
    },
  ];

  // If loading, return loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Handle error
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
          Inventory Management
        </h1>
        <p className={`${theme.textMuted}`}>
          Manage medicine stock levels, track expiry dates, and monitor
          inventory health
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
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
                Medicine Stock
              </h2>
              <p className={`${theme.textMuted}`}>
                Batch-wise inventory tracking and management
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddStock}
              className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200`}
            >
              <Plus className="w-5 h-5" />
              <span>Add Stock</span>
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
                placeholder="Search medicines or batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme.borderSecondary} border-b`}>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium cursor-pointer"
                    onClick={() => requestSort("medicineName")}
                  >
                    <div className={`flex items-center ${theme.textPrimary}`}>
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Medicine
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>

                  <th
                    className={`px-6 py-3 text-center text-xs font-medium ${theme.textMuted} tracking-wider`}
                  >
                    Form
                  </th>
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
                    onClick={() => requestSort("stockLevel")}
                  >
                    <div
                      className={`flex items-center ${theme.textPrimary} justify-center`}
                    >
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Stock Level
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
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer"
                    onClick={() => requestSort("expiryDate")}
                  >
                    <div
                      className={`flex items-center ${theme.textPrimary} justify-center`}
                    >
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Expiry Date
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className={`px-6 py-3 text-center text-xs font-medium ${theme.textMuted} tracking-wider`}
                  >
                    Bill ID
                  </th>
                  <th
                    className={`px-6 py-3 text-center text-xs font-medium ${theme.textMuted} tracking-wider`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item) => (
                  <tr
                    key={item._id}
                    className={`${theme.borderSecondary} border-b hover:bg-opacity-50 ${theme.cardSecondary} transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full ${theme.cardSecondary} flex items-center justify-center mr-3`}
                        >
                          <Pill className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <div className={`font-medium ${theme.textPrimary}`}>
                            {item.medicineName}
                          </div>
                          <div className={`text-xs ${theme.textMuted}`}>
                            {item.strength}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td
                      className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                    >
                      <span className="capitalize">{item.form}</span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${theme.textSecondary}`}>
                      {item.batchNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                          <div
                            className={`h-2 rounded-full ${
                              item.stockLevel > item.reorderLevel * 1.5
                                ? "bg-emerald-500"
                                : item.stockLevel > item.reorderLevel
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                (item.stockLevel / (item.reorderLevel * 3)) *
                                  100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <span
                          className={`text-xs ${
                            item.stockLevel > item.reorderLevel * 1.5
                              ? "text-emerald-500"
                              : item.stockLevel > item.reorderLevel
                              ? "text-amber-500"
                              : "text-red-500"
                          }`}
                        >
                          {item.stockLevel} units
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === "In Stock"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : item.status === "Low Stock"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                    >
                      <div className="flex items-center justify-center">
                        <CalendarCheck className="w-4 h-4 mr-1 text-amber-500" />
                        {formatDate(item.expiryDate)}
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                    >
                      {item.billID}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                        >
                          <Edit className="w-4 h-4 text-green-500" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => handleDeleteClick(item)}
                          className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package
                className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`}
              />
              <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                {searchTerm
                  ? `No stock items found matching "${searchTerm}"`
                  : "No inventory items found"}
              </h3>
              <p className={`${theme.textMuted} mb-4`}>
                {searchTerm
                  ? "Try adjusting your search terms or clear the search to see all items"
                  : "Get started by adding your first stock item"}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleAddStock}
                  className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 mx-auto`}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Stock</span>
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Stock Modal */}
      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleStockAdded}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        stockItem={selectedStock}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default Stocks;
