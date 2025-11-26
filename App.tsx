
import React, { useState } from 'react';
import { Pill, Database, BarChart3, RotateCcw, Loader2 } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { FileType, LMSDataRow, MasterDataRow, FinalReportRow } from './types';
import { parseExcel, processData } from './services/excelService';

const App: React.FC = () => {
  const [files, setFiles] = useState<Record<FileType, File | null>>({
    [FileType.TALENT]: null,
    [FileType.PHARMACY]: null,
    [FileType.MASTER]: null,
  });

  const [finalData, setFinalData] = useState<FinalReportRow[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (type: FileType, file: File) => {
    setFiles((prev) => ({ ...prev, [type]: file }));
    setError(null);
  };

  const handleProcess = async () => {
    if (!files[FileType.TALENT] || !files[FileType.PHARMACY] || !files[FileType.MASTER]) {
      setError("Please upload all 3 required files before processing.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Parse all files
      const talentData = await parseExcel<LMSDataRow>(files[FileType.TALENT]!);
      const pharmacyData = await parseExcel<LMSDataRow>(files[FileType.PHARMACY]!);
      const masterData = await parseExcel<MasterDataRow>(files[FileType.MASTER]!);

      // 2. Process logic
      const result = processData(talentData, pharmacyData, masterData);
      
      // Artificial delay for UX (so user sees the spinner)
      setTimeout(() => {
        setFinalData(result);
        setIsProcessing(false);
      }, 800);

    } catch (err: any) {
      console.error(err);
      setError("Error processing files. Please ensure the column names match the requirements exactly.");
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles({
      [FileType.TALENT]: null,
      [FileType.PHARMACY]: null,
      [FileType.MASTER]: null,
    });
    setFinalData(null);
    setError(null);
  };

  const allFilesUploaded = files[FileType.TALENT] && files[FileType.PHARMACY] && files[FileType.MASTER];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f5f5] to-[#efefef] text-gray-800 pb-12">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1e3a5f] via-[#2c5aa0] to-[#1e3a5f] text-white shadow-xl sticky top-0 z-50 border-b-4 border-[#20b2aa]">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-1 rounded-lg shadow-md">
               <img src={`${import.meta.env.BASE_URL}logo.png`} alt="United Pharmacy Logo" className="h-12 w-12 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">United Pharmacy</h1>
              <p className="text-[#20b2aa] text-sm font-semibold">LMS Automation Tool</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-sm bg-white/10 px-4 py-2 rounded-full border border-[#20b2aa]/30">
            <Database className="w-4 h-4" />
            <span>v1.1.0 Professional</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Intro */}
        {!finalData && (
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-4xl font-bold text-[#1e3a5f]">Data Processor</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Upload your raw data from <strong className="text-[#20b2aa]">Talent</strong> and <strong className="text-[#20b2aa]">Pharmacy</strong> platforms along with the Master Sheet.
            </p>
          </div>
        )}

        {/* Upload Section */}
        {!finalData && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border-2 border-[#20b2aa]/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <FileUpload 
                type={FileType.TALENT} 
                onFileSelect={handleFileSelect} 
                isUploaded={!!files[FileType.TALENT]} 
                fileName={files[FileType.TALENT]?.name} 
              />
              <FileUpload 
                type={FileType.PHARMACY} 
                onFileSelect={handleFileSelect} 
                isUploaded={!!files[FileType.PHARMACY]} 
                fileName={files[FileType.PHARMACY]?.name} 
              />
              <FileUpload 
                type={FileType.MASTER} 
                onFileSelect={handleFileSelect} 
                isUploaded={!!files[FileType.MASTER]} 
                fileName={files[FileType.MASTER]?.name} 
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleProcess}
                disabled={!allFilesUploaded || isProcessing}
                className={`
                  flex items-center space-x-2 px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105
                  ${allFilesUploaded && !isProcessing 
                    ? 'bg-gradient-to-r from-[#ff9500] to-[#ffc107] hover:from-[#ff8c00] hover:to-[#ffb300] text-white shadow-lg hover:shadow-yellow-300' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                `}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Processing Data...</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-6 h-6" />
                    <span>Run Automation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Section */}
        {finalData && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#1e3a5f] to-[#20b2aa] bg-clip-text text-transparent">Analytics Dashboard</h2>
              <button 
                onClick={handleReset}
                className="flex items-center space-x-2 text-[#1e3a5f] hover:text-[#ff9500] transition-colors px-4 py-2 rounded-lg hover:bg-[#ff9500]/10 border-2 border-[#1e3a5f]/20 hover:border-[#ff9500]/30"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Start Over</span>
              </button>
            </div>
            <Dashboard data={finalData} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
