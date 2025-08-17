import React, { useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { Bell, BellRing } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import NotificationCenter from './NotificationCenter'

export default function NotificationBell() {
  const { stats, isLoading } = useNotifications()
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)

  const hasUnread = stats.unread > 0

  return (
    <>
      <motion.button
        onClick={() => setIsNotificationCenterOpen(true)}
        className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded-md"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Bell icon with animation */}
        <motion.div
          animate={hasUnread ? { rotate: [0, -10, 10, -10, 0] } : {}}
          transition={{ repeat: hasUnread ? Infinity : 0, duration: 2, repeatDelay: 3 }}
        >
          {hasUnread ? (
            <BellRing className="w-6 h-6" />
          ) : (
            <Bell className="w-6 h-6" />
          )}
        </motion.div>
        
        {/* Notification badge */}
        <AnimatePresence>
          {hasUnread && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center"
            >
              {stats.unread > 99 ? '99+' : stats.unread}
            </motion.span>
          )}
        </AnimatePresence>
        
        {/* Pulse indicator for urgent notifications */}
        {stats.by_priority?.urgent > 0 && (
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-600"
          />
        )}
      </motion.button>
      
      {/* Notification Center */}
      <AnimatePresence>
        {isNotificationCenterOpen && (
          <NotificationCenter
            isOpen={isNotificationCenterOpen}
            onClose={() => setIsNotificationCenterOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
