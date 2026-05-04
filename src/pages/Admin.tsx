import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Edit2, LogIn, LogOut, Check, X, Box, Globe, Image as ImageIcon, Frame, Layers, Eye, EyeOff, Upload, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";
import { auth, db, signIn, logOut, OperationType, handleFirestoreError } from "../lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, Timestamp, doc, writeBatch } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { ProjectData } from "../components/ui/ProjectCard";
import { uploadToCloudinary } from "../lib/cloudinary";

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const ADMIN_EMAIL = "makeriadeal06@gmail.com";

  // Form State
  const initialFormState: Partial<ProjectData> = {
    title: "",
    category: "Development",
    description: "",
    tags: [],
    image: "",
    type: "WEB",
    model3d: "",
    modelFormat: "glb",
    projectUrl: "",
    previewType: "image",
    visible: true,
  };
  const [formData, setFormData] = useState<Partial<ProjectData>>(initialFormState);
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const [previews, setPreviews] = useState<{ [key: string]: string | null }>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(u?.email === ADMIN_EMAIL);
      setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }

    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribeProjects = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProjectData[];
      setProjects(projs);
    }, (error) => {
      // Only log if it's not a "cancelled" error (common on unmount/auth change)
      if (error.code !== 'cancelled') {
        handleFirestoreError(error, OperationType.LIST, "projects");
      }
    });

    return () => unsubscribeProjects();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const data = {
        ...formData,
        tags: formData.tags || [],
        updatedAt: Timestamp.now(),
      };

      if (isEditing) {
        await updateDoc(doc(db, "projects", isEditing), data);
        setIsEditing(null);
      } else {
        await addDoc(collection(db, "projects"), {
          ...data,
          createdAt: Timestamp.now(),
        });
      }
      setFormData(initialFormState);
      setTagInput("");
      setPreviews({});
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "projects");
    }
  };

  const handleEdit = (project: ProjectData) => {
    setIsEditing(project.id as string);
    setFormData(project);
    setTagInput(project.tags.join(", "));
    setPreviews({
      image: project.image,
      model3d: project.model3d
    });
  };

  const handleToggleVisibility = async (id: string, currentVisible: boolean) => {
    try {
      await updateDoc(doc(db, "projects", id), {
        visible: !currentVisible,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'model3d') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Create local preview if image
    if (file.type.startsWith("image/")) {
      const localUrl = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [field]: localUrl }));
    } else {
      setPreviews(prev => ({ ...prev, [field]: file.name }));
    }

    setIsUploading(prev => ({ ...prev, [field]: true }));
    try {
      const url = await uploadToCloudinary(file);
      
      setFormData(prev => {
        const next = { ...prev, [field]: url };
        if (field === 'model3d') {
          const extension = file.name.split('.').pop()?.toLowerCase();
          next.modelFormat = extension === 'stl' ? 'stl' : 'glb';
        }
        return next;
      });

      // Update preview to the final Cloudinary URL if it's an image
      if (file.type.startsWith("image/")) {
        setPreviews(prev => ({ ...prev, [field]: url }));
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message || "Upload failed. Check Cloudinary config.");
      setPreviews(prev => ({ ...prev, [field]: null }));
    } finally {
      setIsUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 5000);
      return;
    }

    try {
      await deleteDoc(doc(db, "projects", id));
      setDeletingId(null);
      setSelectedIds(prev => prev.filter(pId => pId !== id));
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(error.message || "Delete failed. Check permissions.");
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === projects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(projects.map(p => p.id!));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!showBatchConfirm) {
      setShowBatchConfirm(true);
      setTimeout(() => setShowBatchConfirm(false), 5000);
      return;
    }

    setIsBatchDeleting(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, "projects", id));
      });
      await batch.commit();
      
      setSelectedIds([]);
      setShowBatchConfirm(false);
    } catch (error: any) {
      console.error("Batch delete error:", error);
      alert(error.message || "Batch delete failed. Check permissions.");
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const addTag = () => {
    const tags = tagInput.split(",").map(t => t.trim()).filter(t => t !== "");
    setFormData(prev => ({ ...prev, tags }));
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-mono text-accent-green">SYSTEM_BOOTING...</div>;

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-panel p-8 text-center"
        >
          <Box className="w-12 h-12 text-accent-green mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4 tracking-tighter uppercase">
            {user && !isAdmin ? "Access_Denied" : "Admin_Authentication"}
          </h1>
          <p className="text-white/40 text-sm mb-8 font-mono italic">
            {user && !isAdmin 
              ? `Authorized access only. Account ${user.email} does not have administrative clearance.` 
              : "Access restricted to authorized personnel only."}
          </p>
          
          {user && !isAdmin ? (
            <button 
              onClick={logOut}
              className="w-full flex items-center justify-center gap-2 border border-red-500/50 text-red-500 py-3 font-bold hover:bg-red-500/10 transition-all rounded uppercase"
            >
              <LogOut className="w-4 h-4" />
              Terminate Unauthorized Session
            </button>
          ) : (
            <button 
              onClick={signIn}
              className="w-full flex items-center justify-center gap-2 bg-accent-green text-background py-3 font-bold hover:shadow-glow transition-all rounded uppercase"
            >
              <LogIn className="w-4 h-4" />
              Establish Connection
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 max-w-7xl mx-auto font-mono">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
            Admin_Panel <span className="text-accent-green text-xs font-mono animate-pulse">v2.0_ACTIVE</span>
          </h1>
          <p className="text-white/40 text-xs mt-1">LOGGED_IN_AS: {user.email}</p>
        </div>
        <button onClick={logOut} className="flex items-center gap-2 text-white/40 hover:text-red-500 transition-colors text-xs uppercase">
          <LogOut className="w-4 h-4" /> Terminate_Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8 items-start">
        {/* Project List */}
        <div className="space-y-4 order-2 lg:order-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Project_Database
            </h2>
            
            {projects.length > 0 && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSelectAll}
                  className="text-[10px] font-mono text-white/40 hover:text-accent-green transition-colors uppercase border border-white/5 px-3 py-1.5 rounded-sm bg-white/5"
                >
                  {selectedIds.length === projects.length ? "Deselect_All" : "Select_All"}
                </button>
                
                <AnimatePresence>
                  {selectedIds.length > 0 && (
                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onClick={handleBatchDelete}
                      disabled={isBatchDeleting}
                      className={cn(
                        "text-[10px] font-mono transition-all uppercase border px-3 py-1.5 rounded-sm flex items-center gap-2",
                        showBatchConfirm 
                          ? "bg-red-500 text-white border-red-500 animate-pulse" 
                          : "text-red-500 hover:bg-red-500/10 border-red-500/30 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                      )}
                    >
                      {isBatchDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      {showBatchConfirm ? `CONFIRM_DELETE_${selectedIds.length}?` : `Delete_Selected (${selectedIds.length})`}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {projects.map(project => (
            <div 
              key={project.id} 
              className={cn(
                "glass-panel p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group transition-all border",
                selectedIds.includes(project.id!) 
                  ? "border-accent-green/50 bg-accent-green/5" 
                  : "hover:border-accent-green/30"
              )}
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => handleToggleSelect(project.id!)}
                  className={cn(
                    "w-5 h-5 border flex items-center justify-center transition-all",
                    selectedIds.includes(project.id!) 
                      ? "bg-accent-green border-accent-green text-background" 
                      : "border-white/20 hover:border-accent-green/50"
                  )}
                >
                  {selectedIds.includes(project.id!) && <Check className="w-3 h-3" />}
                </button>
                
                {project.image ? (
                  <img src={project.image} alt="" className="w-12 h-12 flex-shrink-0 object-cover border border-white/10" />
                ) : (
                  <div className="w-12 h-12 flex-shrink-0 bg-white/5 border border-white/10 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-white/10" />
                  </div>
                )}
                <div className="min-w-0 flex-grow">
                  <h3 className="text-sm font-bold truncate">{project.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase mt-1">
                    {project.type === "3D" ? <Box className="w-3 h-3 text-accent-green" /> : <Globe className="w-3 h-3 text-accent-green" />}
                    <span>{project.type}</span>
                    <span>•</span>
                    <span className="truncate">{project.category}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full sm:w-auto justify-end">
                {project.type === "WEB" && project.previewType === "image" && project.projectUrl && (
                  <button 
                    onClick={() => window.open(project.projectUrl, "_blank")}
                    className="h-8 px-2 sm:px-3 hover:bg-accent-green/20 hover:text-accent-green text-white/30 border border-white/5 hover:border-accent-green/30 rounded-sm transition-all flex items-center gap-2 group/btn"
                    title="Open project URL"
                  >
                    <Globe className="w-3.5 h-3.5 group-hover/btn:rotate-12 transition-transform" />
                    <span className="text-[9px] font-mono tracking-widest hidden lg:inline">SITE</span>
                  </button>
                )}
                <button 
                  onClick={() => handleToggleVisibility(project.id!, project.visible)}
                  className={cn(
                    "h-8 px-2 sm:px-3 rounded-sm transition-all flex items-center gap-2 border group/btn",
                    project.visible 
                      ? "text-accent-green bg-accent-green/5 border-accent-green/20 hover:bg-accent-green/10" 
                      : "text-white/20 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white/40"
                  )}
                  title={project.visible ? "Hide project" : "Show project"}
                >
                  {project.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="text-[9px] font-mono tracking-widest uppercase hidden lg:inline">{project.visible ? "Visible" : "Hidden"}</span>
                </button>
                <button 
                  onClick={() => handleEdit(project)} 
                  className="h-8 px-2 sm:px-3 hover:bg-accent-green/20 hover:text-accent-green text-white/30 border border-white/5 hover:border-accent-green/30 rounded-sm transition-all flex items-center gap-2 group/btn"
                >
                  <Edit2 className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[9px] font-mono tracking-widest uppercase hidden lg:inline">Edit</span>
                </button>
                <button 
                  onClick={() => handleDelete(project.id!)} 
                  className={cn(
                    "h-8 px-2 sm:px-3 border rounded-sm transition-all flex items-center gap-2 group/btn",
                    deletingId === project.id 
                      ? "bg-red-500 text-white border-red-500 scale-105" 
                      : "hover:bg-red-500/20 hover:text-red-500 text-white/30 border-white/5 hover:border-red-500/30"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono tracking-widest uppercase hidden lg:inline">
                    {deletingId === project.id ? "CONFIRM_DELETE?" : "Delete"}
                  </span>
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && <div className="p-12 text-center text-white/20 border border-dashed border-white/10 rounded">NO_DATABASE_RECORDS_FOUND</div>}
        </div>

        {/* Add/Edit Form */}
        <div className="glass-panel p-6 space-y-6 lg:sticky lg:top-24 self-start order-1 lg:order-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-accent-green flex items-center gap-2">
            {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isEditing ? "Modify_Entity" : "Inject_New_Entity"}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[9px] text-white/40 uppercase mb-1 block">Title</label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 p-2 text-xs focus:border-accent-green outline-none transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] text-white/40 uppercase mb-1 block">Category</label>
                <input 
                  type="text" 
                  value={formData.category} 
                  onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 p-2 text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] text-white/40 uppercase mb-1 block">Type</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData(p => ({ ...p, type: e.target.value as "3D" | "WEB" }))}
                  className="w-full bg-white/5 border border-white/10 p-2 text-xs outline-none"
                >
                  <option value="WEB">WEB</option>
                  <option value="3D">3D</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] text-white/40 uppercase mb-1 block">Description</label>
              <textarea 
                value={formData.description} 
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 p-2 text-xs focus:border-accent-green outline-none min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-[9px] text-white/40 uppercase mb-2 block tracking-widest">Thumbnail Image</label>
              <div className="flex flex-col gap-4">
                <div className="relative group/upload h-32 w-full border border-white/10 bg-white/5 hover:border-accent-green/50 transition-all flex items-center justify-center overflow-hidden">
                  {previews.image ? (
                    <>
                      <img src={previews.image} alt="Preview" className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <label className="cursor-pointer bg-accent-green text-background p-2 rounded-full hover:scale-110 transition-transform shadow-glow">
                          <Upload className="w-4 h-4" />
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'image')} disabled={isUploading.image} />
                        </label>
                        <button type="button" onClick={() => { setFormData(p => ({ ...p, image: "" })); setPreviews(prev => ({ ...prev, image: null })); }} className="bg-red-500 text-white p-2 rounded-full hover:scale-110 transition-transform">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {isUploading.image && (
                         <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
                           <Loader2 className="w-6 h-6 animate-spin text-accent-green" />
                           <span className="text-[8px] font-mono text-accent-green animate-pulse">UPLOADING...</span>
                         </div>
                      )}
                    </>
                  ) : (
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-2 group/label">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover/label:border-accent-green/40 group-hover/label:bg-accent-green/5 transition-all">
                        {isUploading.image ? <Loader2 className="w-5 h-5 animate-spin text-accent-green" /> : <ImageIcon className="w-5 h-5 text-white/20 group-hover/label:text-accent-green" />}
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-mono text-white/40 tracking-widest uppercase group-hover/label:text-white">Click to upload</span>
                        <span className="text-[7px] font-mono text-white/20 uppercase">Drag and drop supported</span>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'image')} disabled={isUploading.image} />
                    </label>
                  )}
                </div>
                
                <input 
                  type="text" 
                  value={formData.image} 
                  onChange={e => {
                    const url = e.target.value;
                    setFormData(p => ({ ...p, image: url }));
                    setPreviews(p => ({ ...p, image: url || null }));
                  }}
                  className="w-full bg-white/5 border border-white/10 p-2 text-xs outline-none placeholder:text-white/10 focus:border-accent-green/30"
                  placeholder="External URL (optional)"
                />
              </div>
            </div>

            {formData.type === "3D" ? (
              <div className="p-3 bg-white/5 border border-white/10 space-y-3">
                 <div className="flex items-center gap-2 text-[10px] text-accent-green mb-2"><Box className="w-3 h-3" /> 3D_CONFIG</div>
                 <div>
                    <label className="text-[8px] text-white/40 uppercase mb-1 block">Model 3D File</label>
                    <div className="flex gap-4">
                      <div className="flex-grow space-y-2">
                        <input 
                          type="text" 
                          value={formData.model3d} 
                          onChange={e => setFormData(p => ({ ...p, model3d: e.target.value }))}
                          className="w-full bg-white/10 border border-white/10 p-2 text-xs outline-none"
                          placeholder="URL or upload →"
                        />
                        {previews.model3d && (
                          <div className="flex items-center gap-2 p-2 bg-accent-green/5 border border-accent-green/20 rounded">
                            <Box className="w-3 h-3 text-accent-green" />
                            <span className="text-[9px] text-white/60 truncate max-w-[200px]">{previews.model3d.startsWith('blob:') || previews.model3d.includes('cloudinary') ? 'FILE_LINKED' : previews.model3d}</span>
                            <button type="button" onClick={() => { setFormData(p => ({ ...p, model3d: "" })); setPreviews(prev => ({ ...prev, model3d: null })); }} className="ml-auto text-white/30 hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <label className="cursor-pointer bg-white/10 hover:bg-white/20 p-2 border border-white/10 transition-colors flex items-center justify-center min-w-[40px] h-fit" title="Upload 3D model to Cloudinary">
                        {isUploading.model3d ? <Loader2 className="w-4 h-4 animate-spin text-accent-green" /> : <Upload className="w-4 h-4" />}
                        <input type="file" accept=".glb,.stl" className="hidden" onChange={e => handleFileUpload(e, 'model3d')} disabled={isUploading.model3d} />
                      </label>
                    </div>
                 </div>
                 <div>
                    <label className="text-[8px] text-white/40 uppercase mb-1 block">Format (Auto-detected)</label>
                    <select 
                      value={formData.modelFormat} 
                      onChange={e => setFormData(p => ({ ...p, modelFormat: e.target.value as "glb" | "stl" }))}
                      className="w-full bg-white/10 border border-white/10 p-2 text-xs outline-none"
                    >
                      <option value="glb">GLB (Standard)</option>
                      <option value="stl">STL (Legacy)</option>
                    </select>
                 </div>
              </div>
            ) : (
              <div className="p-3 bg-white/5 border border-white/10 space-y-3">
                 <div className="flex items-center gap-2 text-[10px] text-accent-green mb-2"><Globe className="w-3 h-3" /> WEB_CONFIG</div>
                 <div>
                    <label className="text-[8px] text-white/40 uppercase mb-1 block">Project URL</label>
                    <input 
                      type="text" 
                      value={formData.projectUrl} 
                      onChange={e => setFormData(p => ({ ...p, projectUrl: e.target.value }))}
                      className="w-full bg-white/10 border border-white/10 p-2 text-xs outline-none"
                    />
                 </div>
                 <div>
                    <label className="text-[8px] text-white/40 uppercase mb-1 block">Preview Mode</label>
                    <div className="flex gap-4 mt-2">
                       <button 
                        type="button" 
                        onClick={() => setFormData(p => ({ ...p, previewType: "image" }))}
                        className={`flex-1 flex items-center justify-center gap-2 p-2 border text-[10px] ${formData.previewType === "image" ? "border-accent-green text-accent-green" : "border-white/10 text-white/40"}`}
                       >
                         <ImageIcon className="w-3 h-3" /> IMAGE
                       </button>
                       <button 
                        type="button" 
                        onClick={() => setFormData(p => ({ ...p, previewType: "iframe" }))}
                        className={`flex-1 flex items-center justify-center gap-2 p-2 border text-[10px] ${formData.previewType === "iframe" ? "border-accent-green text-accent-green" : "border-white/10 text-white/40"}`}
                       >
                         <Frame className="w-3 h-3" /> IFRAME
                       </button>
                    </div>
                 </div>
              </div>
            )}

            <div>
              <label className="text-[9px] text-white/40 uppercase mb-1 block">Tags (comma separated)</label>
              <input 
                type="text" 
                value={tagInput} 
                onChange={e => setTagInput(e.target.value)}
                onBlur={addTag}
                className="w-full bg-white/5 border border-white/10 p-2 text-xs outline-none"
                placeholder="react, threejs, ai"
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button 
                type="submit" 
                className="flex-grow bg-accent-green text-background py-3 font-bold hover:shadow-glow transition-all rounded uppercase text-xs"
              >
                {isEditing ? "Update_Entity" : "Record_Entity"}
              </button>
              {isEditing && (
                <button 
                  type="button"
                  onClick={() => { setIsEditing(null); setFormData(initialFormState); setTagInput(""); }}
                  className="p-3 border border-white/10 hover:border-red-500 hover:text-red-500 rounded transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
