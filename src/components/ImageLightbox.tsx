'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Trash2, Star } from 'lucide-react'

interface ImageLightboxProps {
  images: Array<{
    id: string
    url: string
    isPrimary: boolean
  }>
  initialIndex: number
  onClose: () => void
  onDelete?: (imageId: string) => void
  onSetPrimary?: (imageId: string) => void
  showActions?: boolean
}

export default function ImageLightbox({
  images,
  initialIndex,
  onClose,
  onDelete,
  onSetPrimary,
  showActions = false,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [onClose, handlePrevious, handleNext])

  const currentImage = images[currentIndex]

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Image Counter */}
      <div className="absolute top-4 left-4 text-white text-lg font-medium z-10">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-3"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-3"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Main Image */}
      <div
        className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.url}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-black/70 backdrop-blur-sm px-6 py-3 rounded-full"
          onClick={(e) => e.stopPropagation()}
        >
          {currentImage.isPrimary ? (
            <span className="flex items-center space-x-2 text-white">
              <Star size={20} className="fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">Immagine Principale</span>
            </span>
          ) : (
            onSetPrimary && (
              <button
                onClick={() => onSetPrimary(currentImage.id)}
                className="flex items-center space-x-2 bg-white hover:bg-gray-100 text-slate-900 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Star size={18} />
                <span>Imposta come principale</span>
              </button>
            )
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('Sei sicuro di voler eliminare questa immagine?')) {
                  onDelete(currentImage.id)
                  if (images.length === 1) {
                    onClose()
                  } else if (currentIndex === images.length - 1) {
                    setCurrentIndex(currentIndex - 1)
                  }
                }
              }}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Trash2 size={18} />
              <span>Elimina</span>
            </button>
          )}
        </div>
      )}

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 flex space-x-2 overflow-x-auto max-w-xl p-2"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-white scale-110'
                  : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <img
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
