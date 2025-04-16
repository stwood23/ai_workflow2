"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface OptimizingLoadingModalProps {
  isOpen: boolean
}

const loadingMessages = [
  "Analyzing your request...",
  "Consulting the AI hive mind...",
  "Warming up the neural networks...",
  "Optimizing prompt structure...",
  "Generating a catchy title...",
  "Adding a sprinkle of AI magic...",
  "Almost ready!"
]

export default function OptimizingLoadingModal({
  isOpen
}: OptimizingLoadingModalProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    if (isOpen) {
      const intervalId = setInterval(() => {
        setCurrentMessageIndex(prevIndex =>
          prevIndex === loadingMessages.length - 1 ? 0 : prevIndex + 1
        )
      }, 2500) // Change message every 2.5 seconds

      // Clear interval on component unmount or when modal closes
      return () => clearInterval(intervalId)
    } else {
      // Reset index when modal closes
      setCurrentMessageIndex(0)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} modal={true}>
      {" "}
      {/* modal=true prevents closing on overlay click/escape */}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center">Optimizing Prompt</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-10 py-24">
          <Loader2 className="text-primary size-20 animate-spin" />
          <p className="text-muted-foreground text-center text-xl">
            {loadingMessages[currentMessageIndex]}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
