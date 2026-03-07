import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import TaskItem from './TaskItem'
import { ListTodo } from 'lucide-react'

export default function TaskList({ refreshTrigger }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })

      if (error) throw error

      setTasks(data || [])
    } catch (error) {
      toast.error(error.message || 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchTasks()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user.id])

  useEffect(() => {
    if (refreshTrigger) {
      fetchTasks()
    }
  }, [refreshTrigger])

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    if (filter === 'pending') return task.status === 'pending'
    if (filter === 'completed') return task.status === 'completed'
    return true
  })

  const getFilterButtonClass = (filterValue) => {
    const baseClass = "px-4 py-2 rounded-lg font-medium transition-colors"
    if (filter === filterValue) {
      return `${baseClass} bg-blue-600 text-white`
    }
    return `${baseClass} bg-gray-200 text-gray-700 hover:bg-gray-300`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <ListTodo className="w-7 h-7 mr-2" />
          My Tasks
        </h2>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={getFilterButtonClass('all')}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={getFilterButtonClass('pending')}
        >
          Pending ({tasks.filter(t => t.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={getFilterButtonClass('completed')}
        >
          Completed ({tasks.filter(t => t.status === 'completed').length})
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <ListTodo className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {filter === 'all' && 'No tasks found. Create one above!'}
            {filter === 'pending' && 'No pending tasks.'}
            {filter === 'completed' && 'No completed tasks yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onTaskUpdated={fetchTasks}
            />
          ))}
        </div>
      )}
    </div>
  )
}
