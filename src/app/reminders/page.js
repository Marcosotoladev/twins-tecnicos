// src/app/reminders/page.js

'use client';

import { useState, useEffect } from 'react';
import { Bell, Plus, Calendar, Edit, Trash2, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    completed: false
  });

  // Cargar recordatorios del localStorage
  useEffect(() => {
    const savedReminders = localStorage.getItem('reminders');
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }
  }, []);

  // Guardar recordatorios en localStorage
  const saveReminders = (updatedReminders) => {
    localStorage.setItem('reminders', JSON.stringify(updatedReminders));
    setReminders(updatedReminders);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date) {
      alert('Por favor completa el título y la fecha');
      return;
    }

    const reminderData = {
      ...formData,
      id: editingReminder ? editingReminder.id : Date.now(),
      createdAt: editingReminder ? editingReminder.createdAt : new Date().toISOString()
    };

    let updatedReminders;
    if (editingReminder) {
      updatedReminders = reminders.map(reminder => 
        reminder.id === editingReminder.id ? reminderData : reminder
      );
    } else {
      updatedReminders = [...reminders, reminderData];
    }

    saveReminders(updatedReminders);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      completed: false
    });
    setEditingReminder(null);
    setShowForm(false);
  };

  const handleEdit = (reminder) => {
    setFormData(reminder);
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar este recordatorio?')) {
      const updatedReminders = reminders.filter(reminder => reminder.id !== id);
      saveReminders(updatedReminders);
    }
  };

  const toggleCompleted = (id) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
    );
    saveReminders(updatedReminders);
  };

  const sortedReminders = reminders.sort((a, b) => {
    // Primero los no completados, luego por fecha
    if (a.completed !== b.completed) {
      return a.completed - b.completed;
    }
    return new Date(a.date + ' ' + (a.time || '00:00')) - new Date(b.date + ' ' + (b.time || '00:00'));
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time;
  };

  const isOverdue = (date, time, completed) => {
    if (completed) return false;
    const reminderDateTime = new Date(date + ' ' + (time || '23:59'));
    return reminderDateTime < new Date();
  };

  const pendingReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);
  const overdueReminders = reminders.filter(r => isOverdue(r.date, r.time, r.completed));

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recordatorios</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestiona tus recordatorios personales y tareas
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Nuevo Recordatorio</span>
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pendientes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {pendingReminders.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Vencidos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {overdueReminders.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completados
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {completedReminders.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          {showForm && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingReminder ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Llevar taladro especial"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Fecha *
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Hora
                      </label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Detalles adicionales sobre el recordatorio..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    {editingReminder ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de recordatorios */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {sortedReminders.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">No hay recordatorios</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Crear primer recordatorio
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sortedReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`p-6 hover:bg-gray-50 ${reminder.completed ? 'opacity-60' : ''} ${
                      isOverdue(reminder.date, reminder.time, reminder.completed) ? 'bg-red-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={reminder.completed}
                          onChange={() => toggleCompleted(reminder.id)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <h3 className={`text-lg font-medium ${reminder.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {reminder.title}
                          </h3>
                          {reminder.description && (
                            <p className="mt-1 text-sm text-gray-600">
                              {reminder.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{formatDate(reminder.date)}</span>
                            </div>
                            {reminder.time && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{formatTime(reminder.time)}</span>
                              </div>
                            )}
                            {isOverdue(reminder.date, reminder.time, reminder.completed) && (
                              <div className="flex items-center text-red-600">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span>Vencido</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(reminder)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(reminder.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}