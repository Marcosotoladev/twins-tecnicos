// src/app/dashboard/page.js

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, AlertTriangle, CheckCircle, Users, Clock, TrendingUp } from 'lucide-react';
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

        // Visitas de esta semana


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
          // Mostrar todas las pendientes, ordenadas por prioridad (urgentes primero)
          .sort((a, b) => {
            const priorityOrder = { 'urgent': 0, 'normal': 1, 'next_visit': 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          })
          .sort((a, b) => {
            const dateA = a.reportedDate.toDate ? a.reportedDate.toDate() : new Date(a.reportedDate);
            const dateB = b.reportedDate.toDate ? b.reportedDate.toDate() : new Date(b.reportedDate);
            return dateB - dateA; // Más recientes primero
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
      // Aquí podrías abrir un modal o navegar a una vista detallada
      console.log('Visitas para', date.toLocaleDateString('es-AR'), visits);
    }
  };

  // ... (mantener todas las funciones formatDate, formatTime, getDaysAgo, getDateStatus igual)
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

    if (diffDays === 0) return 'text-red-600 font-medium'; // Hoy
    if (diffDays === 1) return 'text-orange-600 font-medium'; // Mañana
    if (diffDays <= 3) return 'text-yellow-600'; // Próximos días
    return 'text-gray-600';
  };

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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* ... mantener todas las cards de estadísticas igual ... */}
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

          {/* Contenido principal en dos columnas */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* ... mantener las secciones de próximas visitas y tareas urgentes igual ... */}
            {/* Próximas visitas */}
            <div className="bg-white shadow rounded-lg">
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

            {/* Tareas pendientes */}
            <div className="bg-white shadow rounded-lg">
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
          </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Clientes Activos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalClientes}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 px-5 py-3">
                <div className="text-sm">
                  <Link href="/clients" className="font-medium text-green-700 hover:text-green-900">
                    Gestionar clientes
                  </Link>
                </div>
              </div>
            </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}