import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  searchPlaceholder = 'Search table records...',
  searchKeys = [],
  filterOptions = [],
  filterKey = '',
  actionButton,
  pageSize = 7,
  defaultSortKey = '',
  defaultSortDirection = 'desc'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDirection, setSortDirection] = useState(defaultSortDirection);

  const safeData = Array.isArray(data) ? data : [];

  // Filtering Logic
  const filteredData = safeData.filter(item => {
    if (!item) return false;

    // 1. Category/Status filter
    if (selectedFilter !== 'All' && filterKey) {
      if (item[filterKey] !== selectedFilter) return false;
    }

    // 2. Search query matching
    if (!searchTerm || !searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    if (Array.isArray(searchKeys) && searchKeys.length > 0) {
      return searchKeys.some(key => {
        const val = item[key];
        if (val === undefined || val === null || typeof val === 'object') return false;
        return String(val).toLowerCase().includes(term);
      });
    }

    return Object.values(item).some(val =>
      val !== undefined && val !== null && typeof val !== 'object' && String(val).toLowerCase().includes(term)
    );
  });

  const getSortValue = (item, key) => {
    if (!item || !key) return '';
    const val = item[key];
    if (val === undefined || val === null) return '';
    // Date string check
    if (typeof val === 'string' && (key.toLowerCase().includes('date') || key.toLowerCase().includes('time') || key.toLowerCase().includes('at') || !isNaN(Date.parse(val)))) {
      const parsed = Date.parse(val);
      if (!isNaN(parsed)) return parsed;
    }
    if (typeof val === 'number') return val;
    if (!isNaN(Number(val)) && typeof val === 'string' && val.trim() !== '') {
      return Number(val);
    }
    return String(val).toLowerCase();
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = getSortValue(a, sortKey);
      const valB = getSortValue(b, sortKey);
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  const handleHeaderClick = (col) => {
    const key = col.sortKey || col.accessorKey;
    if (!key) return;
    if (sortKey === key) {
      if (sortDirection === 'desc') setSortDirection('asc');
      else if (sortDirection === 'asc') {
        setSortKey('');
        setSortDirection('desc');
      }
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Table Top Header Tools */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/40">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-xs"
            />
          </div>

          {filterOptions.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {filterOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => {
                    setSelectedFilter(opt);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                    selectedFilter === opt
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {actionButton && <div className="w-full sm:w-auto flex justify-end">{actionButton}</div>}
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-500 uppercase font-bold tracking-wider">
              {columns.map((col, idx) => {
                const isSortable = Boolean(col.sortKey || col.accessorKey);
                const isCurrentSort = (col.sortKey || col.accessorKey) === sortKey;
                return (
                  <th
                    key={idx}
                    onClick={() => isSortable && handleHeaderClick(col)}
                    className={`px-4 py-3.5 font-bold select-none ${col.className || ''} ${isSortable ? 'cursor-pointer hover:bg-gray-200/60 transition-colors' : ''}`}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {isSortable && (
                        <span className="text-gray-400">
                          {isCurrentSort ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-600" /> : <ArrowDown className="w-3 h-3 text-amber-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="hover:bg-gray-50/80 transition-colors group"
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3.5 align-middle text-gray-800 ${col.className || ''}`}>
                      {col.cell ? col.cell(row) : row[col.accessorKey]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-gray-400 font-medium">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/40 text-xs font-medium text-gray-500">
        <div>
          Showing <span className="font-bold text-gray-900">{filteredData.length > 0 ? startIndex + 1 : 0}</span> to{' '}
          <span className="font-bold text-gray-900">{Math.min(startIndex + pageSize, filteredData.length)}</span> of{' '}
          <span className="font-bold text-gray-900">{filteredData.length}</span> entries
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 font-bold text-gray-800">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
