"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, Upload } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import axios from "axios";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const [extractedInfo, setExtractedInfo] = useState<Record<string, string> | null>(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setExtractedInfo(null); // Clear previous data

      const response = await axios.post("http://localhost:4000/api/user/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("API Response:", response.data); // Debug API response

      let extractedText = response.data.extracted_text || "";
      const extractedData: Record<string, string> = {};

      // Extract key-value pairs properly
      extractedText.split("\n").forEach((line) => {
        const parts = line.split(":"); // Split by :
        if (parts.length === 2) {
          const key = parts[0].trim(); // Remove extra spaces
          const value = parts[1].trim().replace(/[^a-zA-Z0-9\s-]/g, ""); // Remove unwanted characters
          extractedData[key] = value;
        }
      });

      console.log("Extracted Info:", extractedData); // Debug extracted info
      setExtractedInfo(extractedData);
    } catch (error) {
      console.error("Upload failed:", error);
      setExtractedInfo({ Error: "Failed to process the document. Try again." });
    } finally {
      setUploading(false);
    }
  }, []);

  useEffect(() => {
    console.log("Updated Extracted Info:", extractedInfo);
  }, [extractedInfo]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
      "application/pdf": [".pdf"],
    },
  });

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
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
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
              <Button variant="default" className="w-full bg-gray-900 hover:bg-gray-800" disabled={uploading}>
                {uploading ? "Uploading..." : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Scan Document
                  </>
                )}
              </Button>
              <Button variant="outline" className="w-full" disabled={uploading}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
            </div>
          </div>

          {/* Extracted Information Section */}
          <div className="border-l p-6">
            <h3 className="text-lg font-semibold mb-4">Extracted Information</h3>
            {extractedInfo && Object.keys(extractedInfo).length > 0 ? (
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2">Key</th>
                    <th className="border border-gray-300 px-4 py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(extractedInfo).map(([key, value], index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2 font-medium">{key}</td>
                      <td className="border border-gray-300 px-4 py-2">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p>Upload a document to see extracted information</p>
              </div>
            )}
            {/* AI Suggestion Notification (Only Shown If Table Exists) */}
            {extractedInfo && Object.keys(extractedInfo).length > 0 && (
              <div className="mt-6 p-4 border border-yellow-400 bg-yellow-100 text-yellow-900 rounded-lg shadow-md">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <h4 className="text-lg font-semibold">AI Suggestion:</h4>
                </div>
                <p className="mt-2 text-sm">
                  Your Date of Birth <strong>does not match</strong> with the Aadhaar Card Date of Birth.
                </p>
                <p className="mt-2 text-sm">
                  🔹 <strong>How to Change It?</strong> Visit the <a href="https://uidai.gov.in/" target="_blank" className="text-blue-600 font-medium underline">UIDAI Website</a> or your nearest Aadhaar center.  
                  🔹 <strong>Impact on Forms:</strong> Incorrect DOB can cause <strong>rejections in passport, and bank applications</strong>.  
                </p>
              </div>
            )}
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;