import { useEffect } from 'react'
import { Cpu } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BlurText } from '@/components/ui/BlurText'

export function SplashScreen() {
  const setSplashDone = useAuthStore((s) => s.setSplashDone)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashDone()
      navigate(isAuthenticated ? '/' : '/login')
    }, 2800) // Slightly longer to allow beautiful animations to play
    return () => clearTimeout(timer)
  }, [setSplashDone, isAuthenticated, navigate])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen flex-col items-center justify-center bg-bg-primary text-text-primary select-none overflow-hidden"
    >
      <div className="relative flex items-center justify-center">
        {/* Pulsing Concentric Rings using Framer Motion */}
        <motion.div
          animate={{
            scale: [1, 1.8, 1.8],
            opacity: [0.15, 0.4, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          className="absolute h-36 w-36 rounded-full bg-accent/20"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1.5],
            opacity: [0.2, 0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 0.6,
          }}
          className="absolute h-28 w-28 rounded-full bg-accent/20"
        />
        
        {/* Glowing Logo Container with Spring Entry */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 120,
            damping: 14,
            delay: 0.1,
          }}
          className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-accent shadow-2xl shadow-accent/40 ring-1 ring-accent/25"
        >
          <Cpu className="h-10 w-10 text-white" />
        </motion.div>
      </div>
      
      {/* Brand details with BlurText */}
      <div className="mt-8 text-center px-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
          <BlurText text="AlignAV" delay={0.06} />
        </h1>
        <p className="mt-2 text-sm text-text-muted font-medium tracking-wide">
          <BlurText text="IoT Device Simulation & Telemetry Monitoring" delay={0.03} />
        </p>
      </div>

      {/* Bounce loader dot indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 flex gap-1.5 justify-center"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-accent shadow-sm shadow-accent/50 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}
