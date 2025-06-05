// src/app/dashboard/page.js

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, AlertTriangle, CheckCircle, Users, Clock, TrendingUp, Bell, Plus, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Calendar from '@/components/Calendar';
import { getClients, getVisits, getCorrectiveTasks } from '@/lib/firebase/operations';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalVisitas: 0,
    visitasHoy: 0,
    visitasSemana: 0,
    tareasCorrectivas: 0,
    tareasPendientes: 0,
    tareasUrgentes: 0
  });

  const [visitasProximas, setVisitasProximas] = useState([]);
  const [tareasUrgentes, setTareasUrgentes] = useState([]);
  const [clients, setClients] = useState([]);
  const [allVisits, setAllVisits] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Cargar todos los datos en paralelo
        const [clientsData, visitsData, tasksData] = await Promise.all([
          getClients(),
          getVisits(),
          getCorrectiveTasks()
        ]);

        setClients(clientsData);
        setAllVisits(visitsData);

        // Cargar recordatorios del localStorage
        const savedReminders = localStorage.getItem('reminders');
        if (savedReminders) {
          const parsedReminders = JSON.parse(savedReminders);
          
          // Filtrar solo los pendientes y ordenar por fecha
          const pendingReminders = parsedReminders
            .filter(reminder => !reminder.completed)
            .sort((a, b) => {
              const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
              const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
              return dateA - dateB;
            })
            .slice(0, 5); // Mostrar máximo 5 recordatorios

          setReminders(pendingReminders);
        }

        // Crear mapa de clientes para referencias rápidas
        const clientsMap = clientsData.reduce((map, client) => {
          map[client.id] = client;
          return map;
        }, {});

        // Calcular estadísticas
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);

        // Visitas de hoy
        const visitasHoy = visitsData.filter(visit => {
          if (!visit.scheduledDate) return false;
          const visitDate = visit.scheduledDate.toDate ? visit.scheduledDate.toDate() : new Date(visit.scheduledDate);
          visitDate.setHours(0, 0, 0, 0);
          return visitDate.getTime() === today.getTime() && visit.status === 'scheduled';
        });

        // Próximas visitas (siguientes 5)
        const proximasVisitas = visitsData
          .filter(visit => {
            if (!visit.scheduledDate) return false;
            const visitDate = visit.scheduledDate.toDate ? visit.scheduledDate.toDate() : new Date(visit.scheduledDate);
            return visitDate >= today && visit.status === 'scheduled';
          })
          .sort((a, b) => {
            const dateA = a.scheduledDate.toDate ? a.scheduledDate.toDate() : new Date(a.scheduledDate);
            const dateB = b.scheduledDate.toDate ? b.scheduledDate.toDate() : new Date(b.scheduledDate);
            return dateA - dateB;
          })
          .slice(0, 5)
          .map(visit => ({
            ...visit,
            client: clientsMap[visit.clientId]
          }));

        // Tareas urgentes y pendientes
        const tareasPendientes = tasksData.filter(task => task.status === 'pending' || task.status === 'in_progress');

        const tareasUrgentesData = tareasPendientes
          .sort((a, b) => {
            const priorityOrder = { 'urgent': 0, 'normal': 1, 'next_visit': 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          })
          .sort((a, b) => {
            const dateA = a.reportedDate.toDate ? a.reportedDate.toDate() : new Date(a.reportedDate);
            const dateB = b.reportedDate.toDate ? b.reportedDate.toDate() : new Date(b.reportedDate);
            return dateB - dateA;
          })
          .slice(0, 5)
          .map(task => ({
            ...task,
            client: clientsMap[task.clientId]
          }));

        setStats({
          totalClientes: clientsData.length,
          totalVisitas: visitsData.length,
          visitasHoy: visitasHoy.length,
          tareasCorrectivas: tasksData.length,
          tareasPendientes: tareasPendientes.length,
          tareasUrgentes: tareasUrgentesData.length
        });

        setVisitasProximas(proximasVisitas);
        setTareasUrgentes(tareasUrgentesData);

      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleDateClick = (date, visits) => {
    if (visits.length > 0) {
      console.log('Visitas para', date.toLocaleDateString('es-AR'), visits);
    }
  };

  // Funciones para recordatorios
  const formatReminderDate = (date) => {
    const today = new Date();
    const reminderDate = new Date(date);
    
    today.setHours(0, 0, 0, 0);
    reminderDate.setHours(0, 0, 0, 0);
    
    const diffTime = reminderDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    if (diffDays < 0) return `Hace ${Math.abs(diffDays)} días`;
    if (diffDays <= 7) return `En ${diffDays} días`;
    
    return reminderDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const isReminderOverdue = (date, time) => {
    const reminderDateTime = new Date(date + ' ' + (time || '23:59'));
    return reminderDateTime < new Date();
  };

  const isReminderToday = (date) => {
    const today = new Date();
    const reminderDate = new Date(date);
    return today.toDateString() === reminderDate.toDateString();
  };

  // Funciones existentes
  const formatDate = (date) => {
    if (!date) return 'Sin fecha';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
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

  const getDaysAgo = (date) => {
    if (!date) return null;
    const d = date.toDate ? date.toDate() : new Date(date);
    const today = new Date();
    const diffTime = today - d;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDateStatus = (date) => {
    if (!date) return 'text-gray-500';
    const d = date.toDate ? date.toDate() : new Date(date);
    const today = new Date();
    const diffTime = d - today;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'text-red-600 font-medium';
    if (diffDays === 1) return 'text-orange-600 font-medium';
    if (diffDays <= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const pendingRemindersCount = reminders.length;
  const overdueRemindersCount = reminders.filter(r => isReminderOverdue(r.date, r.time)).length;

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando datos...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
            <p className="mt-1 text-sm text-gray-500">
              Resumen de actividades de mantenimiento
            </p>
          </div>

          {/* Stats Card - Solo Visitas Hoy */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Visitas Hoy
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.visitasHoy}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-red-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/visits" className="font-medium text-red-700 hover:text-red-900">
                  Ver agenda
                </Link>
              </div>
            </div>
          </div>

          {/* Calendario */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Calendario de Visitas</h2>
              <Link
                href="/visits/new"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Programar Visita
              </Link>
            </div>
            <Calendar
              visits={allVisits}
              clients={clients}
              onDateClick={handleDateClick}
            />
          </div>

          {/* Contenido principal - orden mobile-first */}
          <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
            {/* Próximas visitas - Orden 1 en mobile */}
            <div className="bg-white shadow rounded-lg order-1">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Próximas Visitas
                </h3>
                <div className="mt-5 space-y-4">
                  {visitasProximas.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay visitas programadas
                    </p>
                  ) : (
                    visitasProximas.map((visita) => (
                      <div key={visita.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Preventivo
                            </span>
                            <p className="ml-2 text-sm font-medium text-gray-900">
                              {visita.client?.companyName || 'Cliente no encontrado'}
                            </p>
                          </div>
                          <p className={`text-sm ${getDateStatus(visita.scheduledDate)}`}>
                            {formatDate(visita.scheduledDate)} a las {formatTime(visita.scheduledDate)}
                          </p>
                          {visita.technicians && visita.technicians.length > 0 && (
                            <p className="text-xs text-gray-500">
                              Técnicos: {visita.technicians.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4">
                  <Link
                    href="/visits"
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 text-center block"
                  >
                    Ver Todas las Visitas
                  </Link>
                </div>
              </div>
            </div>

            {/* Tareas pendientes - Orden 2 en mobile */}
            <div className="bg-white shadow rounded-lg order-2">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                  Tareas Pendientes
                </h3>
                <div className="mt-5 space-y-4">
                  {tareasUrgentes.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {stats.tareasPendientes === 0
                        ? 'No hay tareas pendientes'
                        : 'No hay tareas para mostrar'
                      }
                    </p>
                  ) : (
                    tareasUrgentes.slice(0, 5).map((tarea) => (
                      <div key={tarea.id} className={`p-3 border rounded-lg ${tarea.priority === 'urgent'
                          ? 'bg-red-50 border-red-200'
                          : tarea.priority === 'normal'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tarea.priority === 'urgent'
                                  ? 'bg-red-500 text-white'
                                  : tarea.priority === 'normal'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-blue-500 text-white'
                                }`}>
                                {tarea.priority === 'urgent' ? 'Urgente' :
                                  tarea.priority === 'normal' ? 'Normal' : 'Próxima Visita'}
                              </span>
                              <p className="ml-2 text-sm font-medium text-gray-900">
                                {tarea.client?.companyName || 'Cliente no encontrado'}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {tarea.description}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500">
                                Reportado: {formatDate(tarea.reportedDate)}
                              </p>
                              {(() => {
                                const days = getDaysAgo(tarea.reportedDate);
                                return days !== null && (
                                  <p className={`text-xs ${days > 7 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                    {days === 0 ? 'Hoy' :
                                      days === 1 ? 'Ayer' :
                                        `Hace ${days} días`}
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4">
                  <Link
                    href="/corrective-tasks"
                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-md text-sm hover:bg-orange-700 text-center block"
                  >
                    Ver Todas las Tareas
                  </Link>
                </div>
              </div>
            </div>

            {/* Recordatorios - Orden 3 en mobile */}
            <div className="bg-white shadow rounded-lg order-3">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-medium text-gray-900">Recordatorios</h3>
                    {pendingRemindersCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {pendingRemindersCount}
                      </span>
                    )}
                    {overdueRemindersCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {overdueRemindersCount} vencidos
                      </span>
                    )}
                  </div>
                  <Link
                    href="/reminders"
                    className="text-sm text-indigo-600 hover:text-indigo-900 font-medium flex items-center"
                  >
                    Ver todos
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {pendingRemindersCount === 0 ? (
                    <div className="text-center py-4">
                      <Bell className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-3">No hay recordatorios pendientes</p>
                      <Link
                        href="/reminders"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Crear recordatorio
                      </Link>
                    </div>
                  ) : (
                    reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className={`p-3 rounded-lg border ${
                          isReminderOverdue(reminder.date, reminder.time) 
                            ? 'border-red-200 bg-red-50' 
                            : isReminderToday(reminder.date)
                            ? 'border-orange-200 bg-orange-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {reminder.title}
                              </h4>
                              {isReminderOverdue(reminder.date, reminder.time) && (
                                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                            </div>
                            
                            {reminder.description && (
                              <p className="text-xs text-gray-600 mt-1 truncate">
                                {reminder.description}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-3 mt-2">
                              <div className="flex items-center text-xs text-gray-500">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                <span className={isReminderOverdue(reminder.date, reminder.time) ? 'text-red-600' : ''}>
                                  {formatReminderDate(reminder.date)}
                                </span>
                              </div>
                              
                              {reminder.time && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>{reminder.time}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4">
                  <Link
                    href="/reminders"
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 text-center block"
                  >
                    Ver Todos los Recordatorios
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}