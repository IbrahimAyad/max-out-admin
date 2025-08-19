import { useEffect, useRef } from 'react'

export const useSoundNotification = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  useEffect(() => {
    // Create luxury bell sound using Web Audio API
    const createLuxuryBell = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      const playBell = () => {
        // Create a complex bell sound with multiple harmonics
        const duration = 2
        const frequency = 587.33 // D5 note
        
        // Main oscillator
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        // Second harmonic
        const oscillator2 = audioContext.createOscillator()
        const gainNode2 = audioContext.createGain()
        
        // Third harmonic
        const oscillator3 = audioContext.createOscillator()
        const gainNode3 = audioContext.createGain()
        
        // Connect nodes
        oscillator.connect(gainNode)
        oscillator2.connect(gainNode2)
        oscillator3.connect(gainNode3)
        gainNode.connect(audioContext.destination)
        gainNode2.connect(audioContext.destination)
        gainNode3.connect(audioContext.destination)
        
        // Set frequencies (fundamental + harmonics)
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
        oscillator2.frequency.setValueAtTime(frequency * 2, audioContext.currentTime)
        oscillator3.frequency.setValueAtTime(frequency * 3, audioContext.currentTime)
        
        // Set waveforms
        oscillator.type = 'sine'
        oscillator2.type = 'sine'
        oscillator3.type = 'triangle'
        
        // Create bell-like envelope (quick attack, slow decay)
        const now = audioContext.currentTime
        
        // Main oscillator envelope
        gainNode.gain.setValueAtTime(0, now)
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)
        
        // Second harmonic envelope (softer)
        gainNode2.gain.setValueAtTime(0, now)
        gainNode2.gain.linearRampToValueAtTime(0.15, now + 0.01)
        gainNode2.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.8)
        
        // Third harmonic envelope (even softer)
        gainNode3.gain.setValueAtTime(0, now)
        gainNode3.gain.linearRampToValueAtTime(0.08, now + 0.01)
        gainNode3.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.6)
        
        // Start oscillators
        oscillator.start(now)
        oscillator2.start(now)
        oscillator3.start(now)
        
        // Stop oscillators
        oscillator.stop(now + duration)
        oscillator2.stop(now + duration)
        oscillator3.stop(now + duration)
      }
      
      return playBell
    }
    
    try {
      const playBell = createLuxuryBell()
      audioRef.current = { play: playBell } as any
    } catch (error) {
      console.warn('Could not create audio context for notifications:', error)
    }
  }, [])
  
  const playNotificationSound = () => {
    if (audioRef.current && typeof audioRef.current.play === 'function') {
      try {
        audioRef.current.play()
      } catch (error) {
        console.warn('Could not play notification sound:', error)
      }
    }
  }
  
  return { playNotificationSound }
}