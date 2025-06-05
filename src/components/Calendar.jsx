// src/components/Calendar.js

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function Calendar({ visits, clients, onDateClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Crear mapa de clientes para búsquedas rápidas
  const clientsMap = clients.reduce((map, client) => {
    map[client.id] = client;
    return map;
  }, {});

  // Obtener el primer día del mes
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Calcular el primer día a mostrar (puede ser del mes anterior)
  const firstDayToShow = new Date(firstDayOfMonth);
  firstDayToShow.setDate(firstDayToShow.getDate() - firstDayOfMonth.getDay());
  
  // Calcular el último día a mostrar (puede ser del mes siguiente)
  const lastDayToShow = new Date(lastDayOfMonth);
  lastDayToShow.setDate(lastDayToShow.getDate() + (6 - lastDayOfMonth.getDay()));

  // Generar array de días
  const days = [];
  const current = new Date(firstDayToShow);
  while (current <= lastDayToShow) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Agrupar visitas por fecha
  const visitsByDate = visits.reduce((acc, visit) => {
    if (!visit.scheduledDate) return acc;
    
    const visitDate = visit.scheduledDate.toDate ? visit.scheduledDate.toDate() : new Date(visit.scheduledDate);
    const dateKey = visitDate.toDateString();
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    
    acc[dateKey].push({
      ...visit,
      client: clientsMap[visit.clientId]
    });
    
    return acc;
  }, {});

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('es-AR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header del calendario */}
      <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
              {formatMonthYear(currentDate)}
            </h3>
            <button
              onClick={goToToday}
              className="hidden sm:inline-flex px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200"
            >
              Hoy
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        {/* Botón "Hoy" para móvil */}
        <div className="mt-2 sm:hidden">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200"
          >
            Ir a Hoy
          </button>
        </div>
      </div>

      {/* Encabezados de días */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {dayNames.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Grid del calendario */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayVisits = visitsByDate[day.toDateString()] || [];
          const allVisits = dayVisits; // Mostrar todas las visitas (programadas y completadas)
          
          return (
            <div
              key={index}
              className={`
                min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b border-gray-200 
                ${isCurrentMonth(day) ? 'bg-white' : 'bg-gray-50'}
                ${isToday(day) ? 'bg-blue-50' : ''}
                hover:bg-gray-50 cursor-pointer transition-colors
              `}
              onClick={() => onDateClick && onDateClick(day, dayVisits)}
            >
              {/* Número del día */}
              <div className={`
                text-sm font-medium mb-1
                ${isCurrentMonth(day) ? 'text-gray-900' : 'text-gray-400'}
                ${isToday(day) ? 'text-blue-600 font-bold' : ''}
              `}>
                {day.getDate()}
              </div>

              {/* Visitas del día */}
              <div className="space-y-1">
                {allVisits.slice(0, 3).map((visit, visitIndex) => (
                  <div
                    key={visit.id}
                    className={`
                      text-xs px-1 py-0.5 rounded truncate
                      ${visit.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                    `}
                    title={`${visit.client?.companyName} - ${visit.status === 'scheduled' ? 'Programada' : 'Completada'} - ${visit.technicians?.join(', ') || 'Sin asignar'}`}
                  >
                    <span className="hidden sm:inline">
                      {visit.client?.companyName || 'Sin cliente'}
                    </span>
                    <span className="sm:hidden">
                      {visit.client?.companyName ? 
                        visit.client.companyName.split(' ').map(word => word.charAt(0)).join('').slice(0, 3) 
                        : 'SC'
                      }
                      {/* Indicador de estado en móvil */}
                      <span className="ml-1">
                        {visit.status === 'scheduled' ? '📅' : '✅'}
                      </span>
                    </span>
                  </div>
                ))}
                
                {/* Indicador de más visitas */}
                {allVisits.length > 3 && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{allVisits.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
            <span className="text-gray-600">Programadas 📅</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
            <span className="text-gray-600">Completadas ✅</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-50 border-2 border-blue-200 rounded mr-2"></div>
            <span className="text-gray-600">Hoy</span>
          </div>
        </div>
      </div>
    </div>
  );
}