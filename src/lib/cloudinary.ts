/**
 * Cloudinary Upload Service
 * Handles images and 3D models (.glb, .stl)
 */

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ddjtkxzt6";
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "portfolio_upload";

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration missing in .env (VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET)");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  
  // Use 'raw' for 3D models to ensure Cloudinary doesn't try to process them as images
  const resourceType = file.name.match(/\.(glb|stl)$/i) ? "raw" : "auto";
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Cloudinary upload failed");
  }

  const data = await response.json();
  return data.secure_url;
};
