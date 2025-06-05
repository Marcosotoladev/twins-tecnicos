// src/components/Calendar.js

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Clock, User, Building, CheckCircle } from 'lucide-react';

export default function Calendar({ visits, clients, onDateClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleDayClick = (day, dayVisits) => {
    setSelectedDay({ date: day, visits: dayVisits });
    setIsModalOpen(true);
    
    // También llamar al callback original si existe
    if (onDateClick) {
      onDateClick(day, dayVisits);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDay(null);
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

  const formatFullDate = (date) => {
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <>
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
            const allVisits = dayVisits;
            
            return (
              <div
                key={index}
                className={`
                  min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b border-gray-200 
                  ${isCurrentMonth(day) ? 'bg-white' : 'bg-gray-50'}
                  ${isToday(day) ? 'bg-blue-50' : ''}
                  hover:bg-gray-50 cursor-pointer transition-colors
                `}
                onClick={() => handleDayClick(day, dayVisits)}
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
                  {/* En móvil solo mostrar indicadores */}
                  <div className="sm:hidden">
                    {allVisits.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {allVisits.slice(0, 4).map((visit, visitIndex) => (
                          <div
                            key={visit.id}
                            className={`
                              w-2 h-2 rounded-full
                              ${visit.status === 'scheduled' ? 'bg-blue-500' : 'bg-green-500'}
                            `}
                          />
                        ))}
                        {allVisits.length > 4 && (
                          <div className="text-xs text-gray-500 font-bold">
                            +{allVisits.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* En desktop mostrar como antes */}
                  <div className="hidden sm:block space-y-1">
                    {allVisits.slice(0, 3).map((visit, visitIndex) => (
                      <div
                        key={visit.id}
                        className={`
                          text-xs px-1 py-0.5 rounded truncate
                          ${visit.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                        `}
                        title={`${visit.client?.companyName} - ${visit.status === 'scheduled' ? 'Programada' : 'Completada'} - ${visit.technicians?.join(', ') || 'Sin asignar'}`}
                      >
                        {visit.client?.companyName || 'Sin cliente'}
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
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Programadas</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Completadas</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-50 border-2 border-blue-200 rounded mr-2"></div>
              <span className="text-gray-600">Hoy</span>
            </div>
            <div className="sm:hidden text-gray-500">
              Toca un día para ver detalles
            </div>
          </div>
        </div>
      </div>

      {/* Modal para vista de día */}
      {isModalOpen && selectedDay && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-[9998]"
              onClick={closeModal}
            />

            {/* Modal panel */}
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-[9999]">
              {/* Header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 capitalize">
                      {formatFullDate(selectedDay.date)}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedDay.visits.length === 0 
                        ? 'No hay visitas programadas' 
                        : `${selectedDay.visits.length} visita${selectedDay.visits.length > 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                {selectedDay.visits.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      No hay visitas programadas para este día
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDay.visits
                      .sort((a, b) => {
                        // Ordenar por hora si existe
                        if (a.scheduledDate && b.scheduledDate) {
                          const timeA = a.scheduledDate.toDate ? a.scheduledDate.toDate() : new Date(a.scheduledDate);
                          const timeB = b.scheduledDate.toDate ? b.scheduledDate.toDate() : new Date(b.scheduledDate);
                          return timeA - timeB;
                        }
                        return 0;
                      })
                      .map((visit) => (
                        <div
                          key={visit.id}
                          className={`
                            p-4 rounded-lg border-l-4
                            ${visit.status === 'scheduled' 
                              ? 'bg-blue-50 border-l-blue-500' 
                              : 'bg-green-50 border-l-green-500'
                            }
                          `}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`
                                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                  ${visit.status === 'scheduled'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                  }
                                `}>
                                  {visit.status === 'scheduled' ? 'Programada' : 'Completada'}
                                </span>
                                {visit.status === 'completed' && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <Building className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {visit.client?.companyName || 'Cliente no encontrado'}
                                  </span>
                                </div>

                                {visit.client?.address && (
                                  <div className="text-sm text-gray-600 ml-6">
                                    {visit.client.address}
                                  </div>
                                )}

                                {visit.scheduledDate && (
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                    <span className="text-sm text-gray-600">
                                      {formatTime(visit.scheduledDate)}
                                    </span>
                                  </div>
                                )}

                                {visit.technicians && visit.technicians.length > 0 && (
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 text-gray-400 mr-2" />
                                    <span className="text-sm text-gray-600">
                                      {visit.technicians.join(', ')}
                                    </span>
                                  </div>
                                )}

                                {visit.notes && (
                                  <div className="text-sm text-gray-600 ml-6 mt-1">
                                    <em>"{visit.notes}"</em>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={closeModal}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}