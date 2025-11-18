"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  onImageUpload: (file: File) => void
  currentImage?: string
  onImageRemove?: () => void
  maxSize?: number // in MB
  disabled?: boolean
}

export function ImageUpload({
  onImageUpload,
  currentImage,
  onImageRemove,
  maxSize = 5,
  disabled = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Call parent callback
        onImageUpload(file)
      }
    },
    [onImageUpload]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    multiple: false,
    disabled,
  })

  const handleRemove = () => {
    setPreview(null)
    if (onImageRemove) {
      onImageRemove()
    }
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {isDragActive ? (
              <>
                <Upload className="h-8 w-8 text-primary" />
                <p className="text-sm font-medium">Drop image here</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Drag & drop an image, or click to select</p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF, WebP up to {maxSize}MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="text-sm text-destructive">
          {fileRejections[0].errors[0].message}
        </div>
      )}
    </div>
  )
}

