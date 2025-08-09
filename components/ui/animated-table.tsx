"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Column {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface AnimatedTableProps {
  columns: Column[];
  data: any[];
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: any[]) => void;
}

export default function AnimatedTable({
  columns,
  data,
  className,
  loading = false,
  emptyMessage = "No data available",
  onRowClick,
  selectable = false,
  onSelectionChange,
}: AnimatedTableProps) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection]);

  const handleRowSelection = (row: any) => {
    const newSelection = selectedRows.includes(row)
      ? selectedRows.filter((r) => r !== row)
      : [...selectedRows, row];
    
    setSelectedRows(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleSelectAll = () => {
    const newSelection = selectedRows.length === data.length ? [] : [...data];
    setSelectedRows(newSelection);
    onSelectionChange?.(newSelection);
  };

  if (loading) {
    return (
      <div className={cn("w-full bg-white rounded-xl shadow-sm p-8", className)}>
        <div className="flex flex-col items-center justify-center space-y-4">
          <motion.div
            className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-gray-500">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={cn("w-full bg-white rounded-xl shadow-sm overflow-hidden", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <tr>
              {selectable && (
                <th className="px-6 py-4 text-left">
                  <motion.input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  />
                </th>
              )}
              {columns.map((column) => (
                <motion.th
                  key={column.key}
                  className={cn(
                    "px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider",
                    column.sortable && "cursor-pointer hover:text-blue-600"
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                  whileHover={column.sortable ? { scale: 1.02 } : {}}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <motion.div
                        className="flex flex-col"
                        animate={{
                          opacity: sortField === column.key ? 1 : 0.3,
                        }}
                      >
                        <motion.svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          animate={{
                            color:
                              sortField === column.key && sortDirection === "asc"
                                ? "#2563eb"
                                : "#9ca3af",
                          }}
                        >
                          <path d="M5 12l5-5 5 5H5z" />
                        </motion.svg>
                        <motion.svg
                          className="w-3 h-3 -mt-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          animate={{
                            color:
                              sortField === column.key && sortDirection === "desc"
                                ? "#2563eb"
                                : "#9ca3af",
                          }}
                        >
                          <path d="M15 8l-5 5-5-5h10z" />
                        </motion.svg>
                      </motion.div>
                    )}
                  </div>
                </motion.th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <AnimatePresence>
              {sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-6 py-12 text-center"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center space-y-3"
                    >
                      <span className="text-4xl">📭</span>
                      <p className="text-gray-500">{emptyMessage}</p>
                    </motion.div>
                  </td>
                </tr>
              ) : (
                sortedData.map((row, rowIndex) => (
                  <motion.tr
                    key={rowIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: rowIndex * 0.03 }}
                    className={cn(
                      "hover:bg-gray-50 transition-colors",
                      selectedRows.includes(row) && "bg-blue-50",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row)}
                    onMouseEnter={() => setHoveredRow(rowIndex)}
                    onMouseLeave={() => setHoveredRow(null)}
                    whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                  >
                    {selectable && (
                      <td className="px-6 py-4">
                        <motion.input
                          type="checkbox"
                          checked={selectedRows.includes(row)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleRowSelection(row);
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        />
                      </td>
                    )}
                    {columns.map((column, colIndex) => (
                      <motion.td
                        key={column.key}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: rowIndex * 0.03 + colIndex * 0.01 }}
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key]}
                      </motion.td>
                    ))}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}