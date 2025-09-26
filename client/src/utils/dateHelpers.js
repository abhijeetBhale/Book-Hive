import { format, formatDistanceToNow, addDays, isAfter, isBefore } from 'date-fns'

export const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy')
}

export const formatDateTime = (date) => {
  return format(new Date(date), 'MMM dd, yyyy at h:mm a')
}

export const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const calculateDueDate = (borrowDate, days = 14) => {
  return addDays(new Date(borrowDate), days)
}

export const isOverdue = (dueDate) => {
  return isAfter(new Date(), new Date(dueDate))
}

export const isDueSoon = (dueDate, days = 3) => {
  const warningDate = addDays(new Date(), days)
  return isBefore(new Date(dueDate), warningDate)
}

export const getDaysUntilDue = (dueDate) => {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
