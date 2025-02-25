"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Camera, Upload } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [extractedInfo, setExtractedInfo] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Handle file upload here
    console.log(acceptedFiles)
    // Simulate extraction
    setExtractedInfo("Processing...")
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
      "application/pdf": [".pdf"],
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] p-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Upload Section */}
          <div className="p-6">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg h-64 flex flex-col items-center justify-center cursor-pointer transition-colors",
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 text-center">
                {isDragActive ? "Drop your document here" : "Drag and drop your document here"}
              </p>
              <p className="text-sm text-gray-500 mt-2">or click to upload</p>
            </div>

            <div className="mt-6 space-y-3">
              <Button variant="default" className="w-full bg-gray-900 hover:bg-gray-800">
                <Camera className="w-4 h-4 mr-2" />
                Scan Document
              </Button>
              <Button variant="outline" className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
            </div>
          </div>

          {/* Extracted Information Section */}
          <div className="border-l">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Extracted Information</h3>
              {extractedInfo ? (
                <div className="space-y-4">
                  <p>{extractedInfo}</p>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <p>Upload a document to see extracted information</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

