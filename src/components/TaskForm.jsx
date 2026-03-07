import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import { calculateReminderDate, formatDate, getTimeSlotLabel } from '../lib/dateHelpers'
import { Calendar, Clock, Mail, FileText } from 'lucide-react'

const remindBeforeOptions = [
  { value: 1, label: '1 day before' },
  { value: 2, label: '2 days before' },
  { value: 3, label: '3 days before' },
  { value: 5, label: '5 days before' },
  { value: 7, label: '7 days before' },
  { value: 10, label: '10 days before' }
]

const timeSlotOptions = [
  { value: 'morning', label: 'Morning (9:00 AM)' },
  { value: 'afternoon', label: 'Afternoon (1:00 PM)' },
  { value: 'evening', label: 'Evening (7:00 PM)' },
  { value: 'custom', label: 'Custom Time' }
]

export default function TaskForm({ onTaskCreated }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    remind_before: 1,
    time_slot: 'morning',
    custom_time: '',
    email: user?.email || ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const getReminderPreview = () => {
    if (!formData.due_date || !formData.remind_before) return null

    const reminderDate = calculateReminderDate(formData.due_date, formData.remind_before)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const isPast = reminderDate < today

    const timeLabel = formData.time_slot === 'custom' && formData.custom_time
      ? new Date(formData.custom_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : getTimeSlotLabel(formData.time_slot)

    return {
      message: `Reminder will be sent on ${formatDate(reminderDate)} at ${timeLabel}`,
      isPast,
      reminderDate
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.title || !formData.due_date || !formData.email) {
      toast.error('Please fill in all required fields')
      return
    }

    if (new Date(formData.due_date) < new Date()) {
      toast.error('Due date must be in the future')
      return
    }

    // Check if reminder date has already passed
    const reminderDate = calculateReminderDate(formData.due_date, formData.remind_before)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day for comparison

    if (reminderDate < today) {
      toast.error(
        `Reminder date (${formatDate(reminderDate)}) has already passed. ` +
        `Please choose a later due date or select fewer days for the reminder.`
      )
      return
    }

    if (formData.time_slot === 'custom' && !formData.custom_time) {
      toast.error('Please select a custom time')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('tasks').insert([{
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date,
        remind_before: parseInt(formData.remind_before),
        time_slot: formData.time_slot,
        custom_time: formData.time_slot === 'custom' ? formData.custom_time : null,
        email: formData.email,
        user_id: user.id,
        status: 'pending',
        reminder_sent: false
      }])

      if (error) throw error

      toast.success('Task created successfully!')

      // Reset form
      setFormData({
        title: '',
        description: '',
        due_date: '',
        remind_before: 1,
        time_slot: 'morning',
        custom_time: '',
        email: user?.email || ''
      })

      // Trigger task list refresh
      if (onTaskCreated) onTaskCreated()
    } catch (error) {
      toast.error(error.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Task</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Complete project report"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add more details about the task..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
              Due Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="due_date"
                name="due_date"
                type="date"
                value={formData.due_date}
                onChange={handleChange}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="remind_before" className="block text-sm font-medium text-gray-700 mb-2">
              Remind Me <span className="text-red-500">*</span>
            </label>
            <select
              id="remind_before"
              name="remind_before"
              value={formData.remind_before}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {remindBeforeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="time_slot" className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Time <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              id="time_slot"
              name="time_slot"
              value={formData.time_slot}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {timeSlotOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formData.time_slot === 'custom' && (
          <div>
            <label htmlFor="custom_time" className="block text-sm font-medium text-gray-700 mb-2">
              Custom Time <span className="text-red-500">*</span>
            </label>
            <input
              id="custom_time"
              name="custom_time"
              type="datetime-local"
              value={formData.custom_time}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email for Reminders <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        {getReminderPreview() && (
          <div className={`border rounded-lg p-4 ${
            getReminderPreview().isPast
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-sm ${
              getReminderPreview().isPast ? 'text-red-800' : 'text-blue-800'
            }`}>
              <span className="font-medium">
                {getReminderPreview().isPast ? '⚠️ Warning: ' : 'Preview: '}
              </span>
              {getReminderPreview().message}
              {getReminderPreview().isPast && (
                <span className="block mt-2 font-medium">
                  This reminder date has already passed. Please select a later due date or fewer reminder days.
                </span>
              )}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Creating Task...' : 'Create Task'}
        </button>
      </form>
    </div>
  )
}
