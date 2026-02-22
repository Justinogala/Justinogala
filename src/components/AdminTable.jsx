import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';

const AdminTable = ({ 
  columns, 
  data, 
  onSearch, 
  onFilter, 
  isLoading, 
  pagination,
  onPageChange,
  actions 
}) => {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-white/10">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search..." 
            className="pl-9 h-9 bg-slate-900/50 border-white/10" 
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {actions}
          <Button variant="outline" size="sm" className="ml-auto border-white/10 bg-slate-900/50 hover:bg-slate-800">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-white/10 bg-slate-900/40">
        <Table>
          <TableHeader className="[&_tr]:border-b border-white/10">
            <TableRow className="border-b border-white/5 hover:bg-transparent">
              {columns.map((col) => (
                <TableHead 
                  key={col.key} 
                  className={`text-gray-400 ${col.sortable ? "cursor-pointer hover:text-white" : ""}`}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-200">
                  Loading data...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-200">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow key={row.id || rowIndex} className="border-b border-white/5 transition-colors hover:bg-white/5">
                  {columns.map((col) => (
                    <TableCell key={`${rowIndex}-${col.key}`} className="text-gray-200">
                      {col.render ? col.render(row) : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-400">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="border-white/10 bg-transparent hover:bg-white/5"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="border-white/10 bg-transparent hover:bg-white/5"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTable;