import React from 'react';
import { Clock, Clock3, Sun, Moon, Ban, Clock2 as Clock24 } from 'lucide-react';
import type { Vendor } from '../types/database';

const DAYS = [
  { id: 'monday', label: 'Maanantai' },
  { id: 'tuesday', label: 'Tiistai' },
  { id: 'wednesday', label: 'Keskiviikko' },
  { id: 'thursday', label: 'Torstai' },
  { id: 'friday', label: 'Perjantai' },
  { id: 'saturday', label: 'Lauantai' },
  { id: 'sunday', label: 'Sunnuntai' }
];

type OperatingStatus = 'open' | 'closed' | '24h';

interface OperatingHoursProps {
  operatingHours: Vendor['operatingHours'];
  dayStatus: Record<string, OperatingStatus>;
  onStatusChange: (day: string, status: OperatingStatus) => void;
  onHoursChange: (day: string, type: 'open' | 'close', value: string) => void;
}

const OperatingHours: React.FC<OperatingHoursProps> = ({
  operatingHours,
  dayStatus,
  onStatusChange,
  onHoursChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b">
      <div className="flex items-center mb-6">
        <Clock3 className="h-6 w-6 text-blue-600 mr-2" />
        <h3 className="text-xl font-semibold">Aukioloajat</h3>
      </div>

        {/* Status Legend */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
            <span>Avoinna</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>24h</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Suljettu</span>
          </div>
        </div>
      </div>

      {/* Operating Hours Grid */}
      <div className="divide-y">
        {DAYS.map(day => (
          <div key={day.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">{day.label}</span>
              </div>

              {/* Status Selection */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => onStatusChange(day.id, 'open')}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                    dayStatus[day.id] === 'open'
                      ? 'bg-emerald-100 text-emerald-800 font-medium ring-2 ring-emerald-500 ring-opacity-50'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Sun className="w-4 h-4 mr-1.5" />
                  Auki
                </button>
                <button
                  type="button"
                  onClick={() => onStatusChange(day.id, '24h')}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                    dayStatus[day.id] === '24h'
                      ? 'bg-blue-100 text-blue-800 font-medium ring-2 ring-blue-500 ring-opacity-50'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Clock24 className="w-4 h-4 mr-1.5" />
                  24h
                </button>
                <button
                  type="button"
                  onClick={() => onStatusChange(day.id, 'closed')}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                    dayStatus[day.id] === 'closed'
                      ? 'bg-red-100 text-red-800 font-medium ring-2 ring-red-500 ring-opacity-50'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Ban className="w-4 h-4 mr-1.5" />
                  Suljettu
                </button>
              </div>

              {/* Time Inputs */}
              {dayStatus[day.id] === 'open' && (
                <div className="col-span-2 flex space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Sun className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={operatingHours[day.id]?.open || '09:00'}
                        onChange={(e) => onHoursChange(day.id, 'open', e.target.value)}
                        className="block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <Moon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={operatingHours[day.id]?.close || '17:00'}
                        onChange={(e) => onHoursChange(day.id, 'close', e.target.value)}
                        className="block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {dayStatus[day.id] === '24h' && (
                <div className="col-span-2 text-sm text-blue-600 flex items-center">
                  <Clock className="w-4 h-4 mr-1.5" />
                  Avoinna 24 tuntia
                </div>
              )}
              
              {dayStatus[day.id] === 'closed' && (
                <div className="col-span-2 text-sm text-red-600 flex items-center">
                  <Ban className="w-4 h-4 mr-1.5" />
                  Suljettu koko päivän
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperatingHours;
