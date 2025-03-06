"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, AlertTriangle, CheckCircle } from "lucide-react";
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
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setExtractedInfo(null); // Clear previous data
      setComparisonResult(null); // Clear previous comparison results

      const response = await axios.post("http://localhost:4000/api/user/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("API Response:", response.data); // Debug API response

      // Parse the extracted_info from API response
      let extractedInfoStr = response.data.extracted_info || "";
      try {
        // Try to parse as JSON first
        const parsedInfo = JSON.parse(extractedInfoStr);
        const extractedData: Record<string, string> = {};
        
        // Convert the JSON object to key-value pairs for display
        Object.entries(parsedInfo).forEach(([key, value]) => {
          extractedData[key] = String(value);
        });
        
        setExtractedInfo(extractedData);
      } catch (e) {
        // If not valid JSON, try to parse as text (fallback)
        const extractedData: Record<string, string> = {};
        extractedInfoStr.split("\n").forEach((line) => {
          const parts = line.split(":");
          if (parts.length === 2) {
            const key = parts[0].trim();
            const value = parts[1].trim().replace(/[^a-zA-Z0-9\s-]/g, "");
            extractedData[key] = value;
          }
        });
        setExtractedInfo(extractedData);
      }

      // Process and save the comparison result
      if (response.data.comparison_result) {
        let result = response.data.comparison_result;
        
        // Check if we need to parse the message (it might contain the JSON inside a code block)
        if (typeof result.message === 'string' && result.message.includes('```json')) {
          try {
            // Extract and parse JSON from markdown code block if present
            const jsonMatch = result.message.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
              const parsedResult = JSON.parse(jsonMatch[1].trim());
              // Merge with the existing result
              result = { ...result, ...parsedResult };
            }
          } catch (e) {
            console.error("Error parsing JSON from message:", e);
          }
        }
        
        setComparisonResult(result);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setExtractedInfo({ Error: "Failed to process the document. Try again." });
    } finally {
      setUploading(false);
    }
  }, []);

  useEffect(() => {
    console.log("Updated Extracted Info:", extractedInfo);
    console.log("Comparison Result:", comparisonResult);
  }, [extractedInfo, comparisonResult]);

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
            
            {/* AI Suggestion Notification */}
            {extractedInfo && Object.keys(extractedInfo).length > 0 && (
              <div className={cn(
                "mt-6 p-4 border rounded-lg shadow-md",
                comparisonResult?.isMatch 
                  ? "border-green-400 bg-green-100 text-green-900" 
                  : "border-yellow-400 bg-yellow-100 text-yellow-900"
              )}>
                <div className="flex items-center space-x-3">
                  {comparisonResult?.isMatch ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  )}
                  <h4 className="text-lg font-semibold">AI Suggestion:</h4>
                </div>
                
                {comparisonResult ? (
                  // Display dynamic AI-generated message from the backend
                  <div className="mt-2 text-sm">
                    <p>{comparisonResult.message && comparisonResult.message.includes('```') 
                      ? comparisonResult.message.replace(/```json[\s\S]*?```/g, '') 
                      : comparisonResult.message}
                    </p>
                    
                    {!comparisonResult.isMatch && (
                      <p className="mt-2">
                        🔹 <strong>How to Change It?</strong> Visit the <a href="https://uidai.gov.in/" target="_blank" className="text-blue-600 font-medium underline">UIDAI Website</a> or your nearest Aadhaar center.
                        <br />
                        🔹 <strong>Impact on Forms:</strong> Incorrect information can cause <strong>rejections in passport, and bank applications</strong>.
                      </p>
                    )}
                  </div>
                ) : (
                  // Fallback to default message if no comparison result
                  <div className="mt-2 text-sm">
                    <p>
                      Your Date of Birth <strong>does not match</strong> with the Aadhaar Card Date of Birth.
                    </p>
                    <p className="mt-2">
                      🔹 <strong>How to Change It?</strong> Visit the <a href="https://uidai.gov.in/" target="_blank" className="text-blue-600 font-medium underline">UIDAI Website</a> or your nearest Aadhaar center.  
                      <br />
                      🔹 <strong>Impact on Forms:</strong> Incorrect DOB can cause <strong>rejections in passport, and bank applications</strong>.  
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;