
import React, { useMemo, useState } from 'react';
import { FinalReportRow, ProcessedStats } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Download, Filter, FileText, MessageCircle } from 'lucide-react';
import { generateExcelFile } from '../services/excelService';
import { generatePDF } from '../services/pdfService';
import ReminderGenerator from './ReminderGenerator';

interface DashboardProps {
  data: FinalReportRow[];
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [supervisorFilter, setSupervisorFilter] = useState<string>('All');
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Unique values for filters
  const districts = useMemo(() => ['All', ...Array.from(new Set(data.map(d => d.District))).sort()], [data]);
  const supervisors = useMemo(() => ['All', ...Array.from(new Set(data.map(d => d["Supervisor Name"]))).sort()], [data]);

  // Filtered Data
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchDistrict = districtFilter === 'All' || row.District === districtFilter;
      const matchSupervisor = supervisorFilter === 'All' || row["Supervisor Name"] === supervisorFilter;
      return matchDistrict && matchSupervisor;
    });
  }, [data, districtFilter, supervisorFilter]);

  // Statistics Calculation
  const stats: ProcessedStats = useMemo(() => {
    const totalPharmacists = filteredData.length;
    
    // Status Logic: 
    // Data comes as Decimal (0.0 - 1.0)
    // 1.0 (or close to it) = Completed
    // 0 < x < 1.0 = In Progress
    // 0 = Not Started
    const totalCompleted = filteredData.filter(d => d["Completion Rate"] >= 0.999).length;
    const totalInProgress = filteredData.filter(d => d["Completion Rate"] > 0 && d["Completion Rate"] < 0.999).length;
    const totalNotStarted = filteredData.filter(d => d["Completion Rate"] === 0).length;
    
    const completionPercentage = totalPharmacists > 0 ? (totalCompleted / totalPharmacists) * 100 : 0;

    // By District for Chart
    const districtCounts: Record<string, { total: number; completed: number }> = {};
    filteredData.forEach(row => {
      if (!districtCounts[row.District]) districtCounts[row.District] = { total: 0, completed: 0 };
      districtCounts[row.District].total++;
      if (row["Completion Rate"] >= 0.999) districtCounts[row.District].completed++;
    });

    const byDistrict = Object.entries(districtCounts).map(([name, val]) => ({
      name: name || 'Unknown',
      Completed: val.completed,
      Pending: val.total - val.completed
    })).sort((a, b) => b.Completed - a.Completed).slice(0, 10); // Top 10

    // Completion Distribution for Pie
    const byStatus = [
        { name: 'Completed', value: totalCompleted },
        { name: 'In Progress', value: totalInProgress },
        { name: 'Not Started', value: totalNotStarted }
    ];

    // Extended stats for the table
    return {
      totalPharmacists,
      totalCompleted,
      completionPercentage,
      byDistrict,
      bySupervisor: [], 
      byStatus,
      // Add extra stats for the summary table
      totalInProgress,
      totalNotStarted
    } as any; 
  }, [filteredData]);

  // Format percent helper
  const fmtPct = (val: number, total: number) => total > 0 ? Math.round((val / total) * 100) + '%' : '0%';

  // Drill down handler
  const handleChartClick = (data: any) => {
    if (data && data.name) {
      setDistrictFilter(data.name);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
      
      {/* Action Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full xl:w-auto">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-[#20b2aa]" />
            <span className="font-semibold text-[#1e3a5f]">Filters:</span>
          </div>
          
          <select 
            className="border-2 border-[#20b2aa] rounded-md px-3 py-1.5 text-sm bg-gray-50 focus:ring-2 focus:ring-[#ff9500] outline-none w-full sm:w-auto"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
          >
            {districts.map(d => <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>)}
          </select>

          <select 
            className="border-2 border-[#20b2aa] rounded-md px-3 py-1.5 text-sm bg-gray-50 focus:ring-2 focus:ring-[#ff9500] outline-none w-full sm:w-auto"
            value={supervisorFilter}
            onChange={(e) => setSupervisorFilter(e.target.value)}
          >
            {supervisors.map(s => <option key={s} value={s}>{s === 'All' ? 'All Supervisors' : s}</option>)}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-3 w-full xl:w-auto">
          <button 
            onClick={() => setShowReminderModal(true)}
            className="flex items-center space-x-2 bg-[#20b2aa] hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Reminders</span>
          </button>

          <button 
            onClick={() => generatePDF(stats, filteredData)}
            className="flex items-center space-x-2 bg-[#1e3a5f] hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Summary</span>
          </button>

          <button 
            onClick={() => generateExcelFile(filteredData)}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#ff9500] to-[#ffc107] hover:from-[#ff8c00] hover:to-[#ffb300] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Excel Report</span>
          </button>
        </div>
      </div>

      {/* Summarization Status Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-[#20b2aa]">
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#20b2aa] text-white px-6 py-3 font-bold text-lg">
          Summarization Status
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#20b2aa] to-[#1e3a5f] text-white border-t border-teal-300">
                <th className="px-6 py-2 text-left w-1/2">Summarization Status</th>
                <th className="px-6 py-2 text-center w-1/4">Number Count</th>
                <th className="px-6 py-2 text-center w-1/4">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-teal-50">
                <td className="px-6 py-3 font-medium text-gray-700">Number Of Student</td>
                <td className="px-6 py-3 text-center font-bold text-[#20b2aa]">{stats.totalPharmacists}</td>
                <td className="px-6 py-3 text-center text-gray-600">100%</td>
              </tr>
              <tr className="hover:bg-teal-50">
                <td className="px-6 py-3 font-medium text-gray-700">Number Of Student Who Completed</td>
                <td className="px-6 py-3 text-center font-bold text-[#20b2aa]">{(stats as any).totalCompleted}</td>
                <td className="px-6 py-3 text-center text-gray-600">{fmtPct((stats as any).totalCompleted, stats.totalPharmacists)}</td>
              </tr>
              <tr className="hover:bg-teal-50">
                <td className="px-6 py-3 font-medium text-gray-700">Number OF Student Who In Progress</td>
                <td className="px-6 py-3 text-center font-bold text-[#ff9500]">{(stats as any).totalInProgress}</td>
                <td className="px-6 py-3 text-center text-gray-600">{fmtPct((stats as any).totalInProgress, stats.totalPharmacists)}</td>
              </tr>
              <tr className="hover:bg-teal-50">
                <td className="px-6 py-3 font-medium text-gray-700">Number Of Students Who Did Not Started</td>
                <td className="px-6 py-3 text-center font-bold text-[#1e3a5f]">{(stats as any).totalNotStarted}</td>
                <td className="px-6 py-3 text-center text-gray-600">{fmtPct((stats as any).totalNotStarted, stats.totalPharmacists)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Completion by District */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border-2 border-[#20b2aa]/20">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-[#1e3a5f]">Completion by District (Top 10)</h3>
             <span className="text-xs text-gray-400 bg-[#20b2aa]/5 px-2 py-1 rounded border border-[#20b2aa]/30">Click bar to filter table</span>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byDistrict} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <RechartsTooltip />
                <Legend />
                <Bar 
                  dataKey="Completed" 
                  stackId="a" 
                  fill="#20b2aa" 
                  radius={[0, 4, 4, 0]} 
                  cursor="pointer"
                  onClick={handleChartClick}
                />
                <Bar 
                  dataKey="Pending" 
                  stackId="a" 
                  fill="#ff9500" 
                  radius={[0, 4, 4, 0]} 
                  cursor="pointer"
                  onClick={handleChartClick}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Overall Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-[#20b2aa]/20">
          <h3 className="text-lg font-bold text-[#1e3a5f] mb-4">Overall Status</h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#20b2aa" /> {/* Completed */}
                  <Cell fill="#ff9500" /> {/* In Progress */}
                  <Cell fill="#1e3a5f" /> {/* Not Started */}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800">Detailed Report Preview</h3>
          <span className="text-sm text-gray-500">Showing {filteredData.length} entries</span>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-100 text-gray-600 font-semibold sticky top-0">
              <tr>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Pharmacist Name</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Supervisor</th>
                <th className="px-4 py-3 text-center">Rate</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.slice(0, 50).map((row, idx) => {
                const displayRate = Math.round(row["Completion Rate"] * 100);
                
                return (
                  <tr key={`${row["User/Employee ID"]}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-500">{row["User/Employee ID"]}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row["Display Name (Pharmacist name)"]}</td>
                    <td className="px-4 py-3 text-gray-600">{row.District}</td>
                    <td className="px-4 py-3 text-gray-600">{row["Supervisor Name"]}</td>
                    <td className="px-4 py-3 text-center font-bold">
                      <span className={`${displayRate === 100 ? 'text-green-600' : displayRate > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {displayRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {displayRate === 100 ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Completed</span>
                      ) : displayRate > 0 ? (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs">In Progress</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">Not Started</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredData.length > 50 && (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-center text-gray-500 italic bg-gray-50">
                    ... and {filteredData.length - 50} more rows (Download to see full report)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <ReminderGenerator data={filteredData} onClose={() => setShowReminderModal(false)} />
      )}

    </div>
  );
};

export default Dashboard;
