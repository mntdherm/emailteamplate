import React from 'react';
import { Clock, Coins } from 'lucide-react';
import type { Service } from '../types/database';

interface ServiceCardProps {
  service: Service;
  onEdit: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onEdit }) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow p-6 ${
        service.available ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{service.name}</h3>
          <p className="text-gray-600 mt-2">{service.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="text-blue-600 hover:text-blue-800"
            onClick={onEdit}
          >
            Muokkaa
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-400 mr-1" />
              <span className="text-sm text-gray-600">{service.duration} min</span>
            </div>
            <span className="text-lg font-semibold">{service.price}€</span>
          </div>
          <div className="flex items-center">
            <span className={`text-sm ${service.available ? 'text-green-600' : 'text-red-600'}`}>
              {service.available ? 'Saatavilla' : 'Ei saatavilla'}
            </span>
          </div>
        </div>
        {service.coinReward > 0 && (
          <div className="flex items-center text-yellow-600">
            <Coins className="h-4 w-4 mr-1" />
            <span className="text-sm">+{service.coinReward} kolikkoa</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
