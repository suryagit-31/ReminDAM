import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'react-toastify'
import { formatDate, getTimeSlotLabel } from '../lib/dateHelpers'
import { Calendar, Clock, CheckCircle2 } from 'lucide-react'

export default function TaskItem({ task, onTaskUpdated }) {
  const [loading, setLoading] = useState(false)

  const handleMarkComplete = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', task.id)

      if (error) throw error

      toast.success('Task marked as complete!')
      if (onTaskUpdated) onTaskUpdated()
    } catch (error) {
      toast.error(error.message || 'Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (task.status === 'completed') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Completed
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        Pending
      </span>
    )
  }

  const getReminderText = () => {
    const timeLabel = task.time_slot === 'custom' && task.custom_time
      ? new Date(task.custom_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : getTimeSlotLabel(task.time_slot)

    return `Reminds ${task.remind_before} day${task.remind_before > 1 ? 's' : ''} before at ${timeLabel}`
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
        {getStatusBadge()}
      </div>

      {task.description && (
        <p className="text-gray-600 mb-4">{task.description}</p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Due: {formatDate(task.due_date)}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>{getReminderText()}</span>
        </div>
      </div>

      {task.status === 'pending' && (
        <button
          onClick={handleMarkComplete}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Updating...' : 'Mark Complete'}
        </button>
      )}
    </div>
  )
}
