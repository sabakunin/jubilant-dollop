import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Search, FileSpreadsheet, CheckCircle, AlertCircle, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";

type HotelRow = Record<string, any>;

export function App() {
  const [data, setData] = useState<HotelRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        
        // Parse data with headers
        const jsonData = XLSX.utils.sheet_to_json<HotelRow>(ws, { defval: "" });
        
        if (jsonData.length === 0) {
          setError("The file appears to be empty.");
          return;
        }

        const cols = Object.keys(jsonData[0]);
        setColumns(cols);
        setData(jsonData);
        setFileName(file.name);
        setError(null);
        setVisitedIndices(new Set());
        
        // Auto-select column if "name" or "hotel" is in the header
        const likelyColumn = cols.find(c => /name|hotel|title/i.test(c)) || cols[0];
        setSelectedColumn(likelyColumn);
        
      } catch (err) {
        console.error(err);
        setError("Failed to parse the file. Please ensure it is a valid Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSearch = (index: number, hotelName: string) => {
    if (!hotelName) return;
    
    // Mark as visited
    const newVisited = new Set(visitedIndices);
    newVisited.add(index);
    setVisitedIndices(newVisited);

    // Open Google Search for official site
    const query = `${hotelName} official site`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, "_blank");
  };

  const handleSearchNext = () => {
    const nextIndex = data.findIndex((_, index) => !visitedIndices.has(index));
    if (nextIndex !== -1) {
      const hotelName = data[nextIndex][selectedColumn];
      handleSearch(nextIndex, hotelName);
      
      // Scroll to the row
      setTimeout(() => {
        const row = document.getElementById(`row-${nextIndex}`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to clear all data?")) {
      setData([]);
      setColumns([]);
      setFileName("");
      setVisitedIndices(new Set());
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getProgress = () => {
    if (data.length === 0) return 0;
    return Math.round((visitedIndices.size / data.length) * 100);
  };

  const remainingCount = data.length - visitedIndices.size;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <Search size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Hotel Search Automator</h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Find official hotel sites quickly
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {data.length === 0 ? (
          <div className="max-w-xl mx-auto mt-12">
            <div 
              className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-300 p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <FileSpreadsheet size={40} />
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-slate-800">Upload Excel File</h2>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                Drag and drop or click to select an .xlsx or .xls file containing a list of hotel names.
              </p>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-lg shadow-indigo-200">
                Select Excel File
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
              />
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-slate-500">
              <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                <div className="font-semibold text-slate-700 mb-1">1. Upload</div>
                Select your Excel sheet with hotel names
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                <div className="font-semibold text-slate-700 mb-1">2. Search</div>
                Click to find official sites instantly
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                <div className="font-semibold text-slate-700 mb-1">3. Track</div>
                Monitor your progress automatically
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle size={24} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Control Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sticky top-20 z-10">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 text-green-700 p-3 rounded-lg hidden sm:block">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg truncate max-w-[200px] sm:max-w-md" title={fileName}>{fileName}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">{data.length} rows</span>
                    <span>&bull;</span>
                    <span className={remainingCount === 0 ? "text-green-600 font-medium" : "text-indigo-600 font-medium"}>
                      {remainingCount === 0 ? "All Complete!" : `${remainingCount} remaining`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <label className="text-sm font-medium text-slate-600 whitespace-nowrap pl-1">Column:</label>
                  <select 
                    value={selectedColumn} 
                    onChange={(e) => setSelectedColumn(e.target.value)}
                    className="bg-transparent font-medium text-slate-900 outline-none min-w-[120px] max-w-[200px]"
                  >
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 text-slate-600 hover:text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                >
                  <RotateCcw size={18} />
                  <span className="sm:hidden lg:inline">Reset</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
               <div className="flex justify-between text-sm mb-2">
                 <span className="font-medium text-slate-700">Progress</span>
                 <span className="text-slate-500">{visitedIndices.size} of {data.length} ({getProgress()}%)</span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                 <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${getProgress()}%` }}
                 ></div>
               </div>
            </div>

            {/* Data List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-700 w-16 text-center text-xs uppercase tracking-wider">No.</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Hotel Name</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-right text-xs uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((row, index) => {
                      const hotelName = row[selectedColumn];
                      const isVisited = visitedIndices.has(index);
                      
                      return (
                        <tr 
                          key={index} 
                          id={`row-${index}`}
                          className={cn(
                            "group transition-colors", 
                            isVisited ? "bg-slate-50/80" : "hover:bg-indigo-50/30"
                          )}
                        >
                          <td className="px-6 py-4 text-center text-slate-400 text-sm font-mono">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className={cn("font-medium transition-colors", isVisited ? "text-slate-500 line-through decoration-slate-300" : "text-slate-900")}>
                              {hotelName || <span className="text-slate-400 italic font-normal">Empty Cell</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleSearch(index, hotelName)}
                              disabled={!hotelName}
                              className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all focus:ring-2 focus:ring-offset-1 focus:outline-none",
                                !hotelName && "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400",
                                isVisited && hotelName
                                  ? "bg-white text-green-700 border border-green-200 hover:bg-green-50" 
                                  : hotelName && "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                              )}
                            >
                              {isVisited ? (
                                <>
                                  <CheckCircle size={16} />
                                  <span>Done</span>
                                </>
                              ) : (
                                <>
                                  <Search size={16} />
                                  <span>Search</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button for "Next" */}
      {data.length > 0 && remainingCount > 0 && (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={handleSearchNext}
            className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-full shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95 font-medium"
          >
            <span>Search Next</span>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
