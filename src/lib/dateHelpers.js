import { format, subDays, isSameDay, parseISO } from 'date-fns'

export const calculateReminderDate = (dueDate, remindBeforeDays) => {
  return subDays(new Date(dueDate), remindBeforeDays)
}

export const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy')
}

export const formatDateTime = (date) => {
  return format(new Date(date), 'MMM dd, yyyy h:mm a')
}

export const getTimeSlotLabel = (timeSlot) => {
  const labels = {
    morning: '9:00 AM',
    afternoon: '1:00 PM',
    evening: '7:00 PM',
    custom: 'Custom Time'
  }
  return labels[timeSlot] || timeSlot
}

export const isReminderDateValid = (dueDate, remindBeforeDays) => {
  const reminderDate = calculateReminderDate(dueDate, remindBeforeDays)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset to start of day for accurate comparison

  return reminderDate >= today
}

export const shouldSendReminder = (dueDate, remindBefore, timeSlot, customTime) => {
  const reminderDate = calculateReminderDate(dueDate, remindBefore)
  const today = new Date()

  // Check if today matches reminder date
  if (!isSameDay(today, reminderDate)) {
    return false
  }

  // Check time slot
  const currentHour = today.getHours()

  if (timeSlot === 'morning' && currentHour >= 9) return true
  if (timeSlot === 'afternoon' && currentHour >= 13) return true
  if (timeSlot === 'evening' && currentHour >= 19) return true
  if (timeSlot === 'custom' && customTime) {
    const customHour = new Date(customTime).getHours()
    return currentHour >= customHour
  }

  return false
}
