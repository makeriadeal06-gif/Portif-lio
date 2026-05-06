import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Edit2, LogIn, LogOut, Check, X, Box, Globe, Image as ImageIcon, Frame, Layers, Eye, EyeOff, Upload, Loader2, AlertTriangle, ChevronUp, ChevronDown, FlaskConical, Briefcase, Calendar, MapPin, Zap } from "lucide-react";
import { cn } from "../lib/utils";
import { auth, db, signIn, logOut, OperationType, handleFirestoreError, getRedirectResult, testConnection } from "../lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, Timestamp, doc, writeBatch } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { ProjectData, ExperimentData } from "../types";
import { uploadToCloudinary } from "../lib/cloudinary";

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"projects" | "experiments">("projects");
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [experiments, setExperiments] = useState<ExperimentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const ADMIN_EMAIL = "makeriadeal06@gmail.com";

  // Form State - Projects
  const initialProjectForm: Partial<ProjectData> = {
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

  // Form State - Experiments
  const initialExperimentForm: Partial<ExperimentData> = {
    title: "",
    description: "",
    details: "",
    type: "LAB",
    dateRange: "",
    location: "",
    tech: [],
    visible: true,
    status: "STABLE",
    projectUrl: "",
  };

  const [projectFormData, setProjectFormData] = useState<Partial<ProjectData>>(initialProjectForm);
  const [experimentFormData, setExperimentFormData] = useState<Partial<ExperimentData>>(initialExperimentForm);
  const [tagInput, setTagInput] = useState("");
  const [techInput, setTechInput] = useState("");
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const [previews, setPreviews] = useState<{ [key: string]: string | null }>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);

  useEffect(() => {
    console.log("[Admin] Initializing System...");
    
    let isMounted = true;

    const initAuth = async () => {
      try {
        // 1. Check for redirect result (crucial for mobile/iframe flow)
        const result = await getRedirectResult(auth);
        if (result?.user && isMounted) {
          console.log("[Admin] Redirect result identified:", result.user.email);
          setUser(result.user);
          setIsAdmin(result.user.email === ADMIN_EMAIL);
        }
      } catch (error: any) {
        console.error("[Admin] Redirect check failed:", error);
        if (isMounted) setAuthError(error.message);
      }

      // 2. Test Firestore connection
      const isConnected = await testConnection();
      if (!isConnected && isMounted) {
        console.warn("[Admin] System might be offline or Firestore unreachable.");
      }
    };

    // 3. Listen for Auth State Changes
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      console.log("[Admin] Auth state delta:", u ? u.email : "GUEST");
      if (isMounted) {
        setUser(u);
        setIsAdmin(u?.email === ADMIN_EMAIL);
        setIsLoading(false);
      }
    });

    initAuth();

    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setExperiments([]);
      return;
    }

    // projects subscription
    const qProjects = query(collection(db, "projects"));
    const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProjectData[];
      setProjects(data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
    }, (error) => {
      if (error.code !== 'cancelled') handleFirestoreError(error, OperationType.LIST, "projects");
    });

    // experiments subscription
    const qExp = query(collection(db, "experiments"));
    const unsubscribeExperiments = onSnapshot(qExp, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ExperimentData[];
      setExperiments(data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
    }, (error) => {
      if (error.code !== 'cancelled') handleFirestoreError(error, OperationType.LIST, "experiments");
    });

    return () => {
      unsubscribeProjects();
      unsubscribeExperiments();
    };
  }, [user]);

  const handleMove = async (index: number, direction: 'up' | 'down', collectionName: 'projects' | 'experiments') => {
    const dataItems = collectionName === 'projects' ? projects : experiments;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= dataItems.length) return;

    const currentItem = dataItems[index];
    const targetItem = dataItems[targetIndex];

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, collectionName, currentItem.id!), { 
        order: targetItem.order ?? targetIndex,
        updatedAt: Timestamp.now()
      });
      batch.update(doc(db, collectionName, targetItem.id!), { 
        order: currentItem.order ?? index,
        updatedAt: Timestamp.now()
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, collectionName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const collectionName = activeTab;
    const currentData = collectionName === 'projects' ? projectFormData : experimentFormData;
    const dataList = collectionName === 'projects' ? projects : experiments;

    try {
      const data = {
        ...currentData,
        updatedAt: Timestamp.now(),
      };

      if (isEditing) {
        await updateDoc(doc(db, collectionName, isEditing), data);
        setIsEditing(null);
      } else {
        await addDoc(collection(db, collectionName), {
          ...data,
          order: dataList.length,
          createdAt: Timestamp.now(),
        });
      }
      
      if (collectionName === 'projects') {
        setProjectFormData(initialProjectForm);
        setTagInput("");
      } else {
        setExperimentFormData(initialExperimentForm);
        setTechInput("");
      }
      setPreviews({});
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionName);
    }
  };

  const handleEdit = (item: any) => {
    setIsEditing(item.id as string);
    if (activeTab === 'projects') {
      const project = item as ProjectData;
      setProjectFormData(project);
      setTagInput(project.tags?.join(", ") || "");
      setPreviews({
        image: project.image,
        model3d: project.model3d
      });
    } else {
      const exp = item as ExperimentData;
      setExperimentFormData(exp);
      setTechInput(exp.tech?.join(", ") || "");
      setPreviews({});
    }
  };

  const handleToggleVisibility = async (id: string, currentVisible: boolean) => {
    try {
      await updateDoc(doc(db, activeTab, id), {
        visible: !currentVisible,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${activeTab}/${id}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'model3d') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.type.startsWith("image/")) {
      const localUrl = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [field]: localUrl }));
    } else {
      setPreviews(prev => ({ ...prev, [field]: file.name }));
    }

    setIsUploading(prev => ({ ...prev, [field]: true }));
    try {
      const url = await uploadToCloudinary(file);
      
      if (activeTab === 'projects') {
        setProjectFormData(prev => {
          const next = { ...prev, [field]: url };
          if (field === 'model3d') {
            const extension = file.name.split('.').pop()?.toLowerCase();
            next.modelFormat = extension === 'stl' ? 'stl' : 'glb';
          }
          return next;
        });
      } else {
        setExperimentFormData(prev => ({ ...prev, [field === 'image' ? 'projectUrl' : 'details']: url } as any));
      }

      if (file.type.startsWith("image/")) {
        setPreviews(prev => ({ ...prev, [field]: url }));
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message || "Upload failed.");
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
      await deleteDoc(doc(db, activeTab, id));
      setDeletingId(null);
      setSelectedIds(prev => prev.filter(pId => pId !== id));
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `${activeTab}/${id}`);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const dataList = activeTab === 'projects' ? projects : experiments;
    if (selectedIds.length === dataList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(dataList.map(p => p.id!));
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
        batch.delete(doc(db, activeTab, id));
      });
      await batch.commit();
      
      setSelectedIds([]);
      setShowBatchConfirm(false);
    } catch (error: any) {
      console.error("Batch delete error:", error);
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const addTag = () => {
    const tags = tagInput.split(",").map(t => t.trim()).filter(t => t !== "");
    setProjectFormData(prev => ({ ...prev, tags }));
  };

  const addTech = () => {
    const tech = techInput.split(",").map(t => t.trim()).filter(t => t !== "");
    setExperimentFormData(prev => ({ ...prev, tech }));
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
          <div className="text-white/40 text-[10px] space-y-2 mb-8 font-mono border border-white/5 p-4 bg-white/2 text-left">
            <p className="italic">
              {user && !isAdmin 
                ? `Authorized access only. Account [${user.email}] does not have administrative clearance for [${ADMIN_EMAIL}].` 
                : authError?.includes("unauthorized-domain")
                  ? "CRITICAL: The current domain is not authorized in your Firebase Project."
                  : authError 
                    ? `System Error: ${authError}. Please try again or open in a new tab if you are on a mobile device.`
                    : "Access restricted to authorized personnel only."}
            </p>
            {authError?.includes("unauthorized-domain") && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-[9px] space-y-2">
                <p className="text-red-400 font-bold uppercase">Manual Authorization Required:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to Firebase Console &gt; Authentication &gt; Settings</li>
                  <li>Go to "Authorized domains"</li>
                  <li>Add this domain: <code className="bg-black/40 px-1">{window.location.hostname}</code></li>
                </ol>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.hostname);
                    alert("Domain copied: " + window.location.hostname);
                  }}
                  className="mt-2 text-accent-green hover:underline uppercase"
                >
                  Copy Domain URL
                </button>
              </div>
            )}
            {user && !authError?.includes("unauthorized-domain") && (
              <div className="pt-2 border-t border-white/5 flex flex-col gap-1 items-start text-left">
                <span className="text-accent-green/60 uppercase">Session_Info:</span>
                <span>UID: {user.uid.slice(0, 8)}...</span>
                <span>EMAIL: {user.email}</span>
                <span>VERIFIED: {user.emailVerified ? "TRUE" : "FALSE"}</span>
              </div>
            )}
          </div>
          
          {user && !isAdmin ? (
            <div className="space-y-4">
              <p className="text-[9px] text-red-500/60 uppercase animate-pulse">Unauthorized identity detected</p>
              <button 
                onClick={logOut}
                className="w-full flex items-center justify-center gap-2 border border-red-500/50 text-red-500 py-3 font-bold hover:bg-red-500/10 transition-all rounded uppercase"
              >
                <LogOut className="w-4 h-4" />
                Terminate Unauthorized Session
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={async () => {
                  setAuthError(null);
                  try {
                    await signIn();
                  } catch (e: any) {
                    setAuthError(e.message);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-accent-green text-background py-3 font-bold hover:shadow-glow transition-all rounded uppercase"
              >
                <LogIn className="w-4 h-4" />
                Establish Connection
              </button>
              <p className="text-[8px] text-white/20 uppercase tracking-widest">
                Hint: If connection hangs in AI Studio, use "Open in new tab"
              </p>
            </div>
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
        
        <div className="flex items-center gap-4">
          <div className="flex bg-white/10 p-1 rounded border border-white/20">
            <button 
              onClick={() => { setActiveTab("projects"); setIsEditing(null); setSelectedIds([]); }}
              className={cn(
                "px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest transition-all rounded-sm",
                activeTab === "projects" ? "bg-accent-green text-background font-bold" : "text-white/40 hover:text-white"
              )}
            >
              Projects
            </button>
            <button 
              onClick={() => { setActiveTab("experiments"); setIsEditing(null); setSelectedIds([]); }}
              className={cn(
                "px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest transition-all rounded-sm",
                activeTab === "experiments" ? "bg-accent-green text-background font-bold" : "text-white/40 hover:text-white"
              )}
            >
              Experiments
            </button>
          </div>
          
          <button onClick={logOut} className="flex items-center gap-2 text-white/40 hover:text-red-500 transition-colors text-xs uppercase ml-4">
            <LogOut className="w-4 h-4" /> Terminate_Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8 items-start">
        {/* Collection List */}
        <div className="space-y-4 order-2 lg:order-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
              {activeTab === "projects" ? <Layers className="w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
              {activeTab === "projects" ? "Project_Database" : "Experiment_Database"}
            </h2>
            
            {(activeTab === "projects" && projects.length > 0 || activeTab === "experiments" && experiments.length > 0) && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSelectAll}
                  className="text-[10px] font-mono text-white/60 hover:text-accent-green transition-colors uppercase border border-white/10 px-3 py-1.5 rounded-sm bg-white/10 shadow-sm"
                >
                  {selectedIds.length === (activeTab === "projects" ? projects.length : experiments.length) ? "Deselect_All" : "Select_All"}
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

          {(activeTab === "projects" ? projects : experiments).map((item: any, index) => (
            <div 
              key={item.id} 
              className={cn(
                "glass-panel p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group transition-all border",
                selectedIds.includes(item.id!) 
                  ? "border-accent-green/50 bg-accent-green/5" 
                  : "hover:border-accent-green/30"
              )}
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => handleToggleSelect(item.id!)}
                  className={cn(
                    "w-5 h-5 flex-shrink-0 border flex items-center justify-center transition-all",
                    selectedIds.includes(item.id!) 
                      ? "bg-accent-green border-accent-green text-background" 
                      : "border-white/20 hover:border-accent-green/50"
                  )}
                >
                  {selectedIds.includes(item.id!) && <Check className="w-3 h-3" />}
                </button>
                
                {activeTab === "projects" ? (
                  item.image ? (
                    <img src={item.image} alt="" className="w-12 h-12 flex-shrink-0 object-cover border border-white/10" />
                  ) : (
                    <div className="w-12 h-12 flex-shrink-0 bg-white/5 border border-white/10 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-white/10" />
                    </div>
                  )
                ) : (
                  <div className={cn(
                    "w-12 h-12 flex-shrink-0 flex items-center justify-center border",
                    item.type === "LAB" ? "bg-accent-green/5 border-accent-green/20" : "bg-blue-500/5 border-blue-500/20"
                  )}>
                    {item.type === "LAB" ? <FlaskConical className="w-5 h-5 text-accent-green/40" /> : <Briefcase className="w-5 h-5 text-blue-500/40" />}
                  </div>
                )}
                
                <div className="min-w-0 flex-grow">
                  <h3 className="text-sm font-bold truncate">{item.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase mt-1">
                    {activeTab === "projects" ? (
                      <>
                        {item.type === "3D" ? <Box className="w-3 h-3 text-accent-green/60" /> : <Globe className="w-3 h-3 text-accent-green/60" />}
                        <span>{item.type}</span>
                        <span>•</span>
                        <span className="truncate">{item.category}</span>
                      </>
                    ) : (
                      <>
                        <span>{item.type}</span>
                        <span>•</span>
                        <span>{item.status || "STABLE"}</span>
                        {item.dateRange && (
                           <>
                             <span>•</span>
                             <span className="truncate">{item.dateRange}</span>
                           </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full sm:w-auto justify-end">
                <div className="flex flex-col gap-0.5">
                  <button 
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up', activeTab)}
                    className="p-1 hover:text-accent-green disabled:opacity-30 disabled:hover:text-current transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    disabled={index === (activeTab === "projects" ? projects.length : experiments.length) - 1}
                    onClick={() => handleMove(index, 'down', activeTab)}
                    className="p-1 hover:text-accent-green disabled:opacity-30 disabled:hover:text-current transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <button 
                  onClick={() => handleToggleVisibility(item.id!, item.visible)}
                  className={cn(
                    "h-8 px-2 sm:px-3 rounded-sm transition-all flex items-center gap-2 border",
                    item.visible 
                      ? "text-accent-green bg-accent-green/5 border-accent-green/20" 
                      : "text-white/20 bg-white/5 border-white/10"
                  )}
                >
                  {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                
                <button 
                  onClick={() => handleEdit(item)} 
                  className="h-8 px-2 sm:px-3 hover:bg-accent-green/20 hover:text-accent-green text-white/30 border border-white/5 rounded-sm transition-all flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                
                <button 
                  onClick={() => handleDelete(item.id!)} 
                  className={cn(
                    "h-8 px-2 sm:px-3 border rounded-sm transition-all flex items-center gap-2",
                    deletingId === item.id ? "bg-red-500 text-white border-red-500" : "text-white/30 border-white/5 hover:border-red-500/30 hover:text-red-500"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {(activeTab === "projects" ? projects.length : experiments.length) === 0 && <div className="p-12 text-center text-white/20 border border-dashed border-white/10 rounded">NO_DATABASE_RECORDS_FOUND</div>}
        </div>

        {/* Form Section */}
        <div className="glass-panel p-6 space-y-6 lg:sticky lg:top-24 self-start order-1 lg:order-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-accent-green flex items-center gap-2">
            {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isEditing ? "Modify_Entity" : "Inject_New_Entity"}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "projects" ? (
              // PROJECTS FORM
              <>
                <div>
                  <label className="text-[9px] text-white/40 uppercase mb-1 block">Title</label>
                  <input 
                    type="text" 
                    value={projectFormData.title} 
                    onChange={e => setProjectFormData(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 p-2 text-xs focus:border-accent-green outline-none text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] text-white/40 uppercase mb-1 block">Category</label>
                    <input 
                      type="text" 
                      value={projectFormData.category} 
                      onChange={e => setProjectFormData(p => ({ ...p, category: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 p-2 text-xs outline-none text-white focus:border-accent-green"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-white/40 uppercase mb-1 block">Type</label>
                    <select 
                      value={projectFormData.type} 
                      onChange={e => setProjectFormData(p => ({ ...p, type: e.target.value as "3D" | "WEB" }))}
                      className="w-full bg-white/10 border border-white/20 p-2 text-xs outline-none text-white focus:border-accent-green"
                    >
                      <option value="WEB" className="bg-[#1a1a1a] text-white">WEB</option>
                      <option value="3D" className="bg-[#1a1a1a] text-white">3D</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-white/40 uppercase mb-1 block">Description</label>
                  <textarea 
                    value={projectFormData.description} 
                    onChange={e => setProjectFormData(p => ({ ...p, description: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 p-2 text-xs focus:border-accent-green outline-none min-h-[80px] text-white"
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
                            <button type="button" onClick={() => { setProjectFormData(p => ({ ...p, image: "" })); setPreviews(prev => ({ ...prev, image: null })); }} className="bg-red-500 text-white p-2 rounded-full hover:scale-110 transition-transform">
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
                      value={projectFormData.image} 
                      onChange={e => {
                        const url = e.target.value;
                        setProjectFormData(p => ({ ...p, image: url }));
                        setPreviews(p => ({ ...p, image: url || null }));
                      }}
                      className="w-full bg-white/10 border border-white/20 p-2 text-xs outline-none placeholder:text-white/20 focus:border-accent-green text-white"
                      placeholder="External URL (optional)"
                    />
                  </div>
                </div>

                {projectFormData.type === "3D" ? (
                  <div className="p-3 bg-white/5 border border-white/10 space-y-3">
                     <div className="flex items-center gap-2 text-[10px] text-accent-green mb-2"><Box className="w-3 h-3" /> 3D_CONFIG</div>
                     <div>
                        <label className="text-[8px] text-white/40 uppercase mb-1 block">Model 3D File</label>
                        <div className="flex gap-4">
                          <div className="flex-grow space-y-2">
                            <input 
                              type="text" 
                              value={projectFormData.model3d} 
                              onChange={e => setProjectFormData(p => ({ ...p, model3d: e.target.value }))}
                              className="w-full bg-white/10 border border-white/20 p-2 text-xs outline-none text-white focus:border-accent-green"
                              placeholder="URL or upload →"
                            />
                            {previews.model3d && (
                              <div className="flex items-center gap-2 p-2 bg-accent-green/5 border border-accent-green/20 rounded">
                                <Box className="w-3 h-3 text-accent-green" />
                                <span className="text-[9px] text-white/60 truncate max-w-[200px]">{previews.model3d.startsWith('blob:') || previews.model3d.includes('cloudinary') ? 'FILE_LINKED' : previews.model3d}</span>
                                <button type="button" onClick={() => { setProjectFormData(p => ({ ...p, model3d: "" })); setPreviews(prev => ({ ...prev, model3d: null })); }} className="ml-auto text-white/30 hover:text-red-500">
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
                          value={projectFormData.modelFormat} 
                          onChange={e => setProjectFormData(p => ({ ...p, modelFormat: e.target.value as "glb" | "stl" }))}
                          className="w-full bg-white/15 border border-white/20 p-2 text-xs outline-none text-white focus:border-accent-green"
                        >
                          <option value="glb" className="bg-[#1a1a1a] text-white">GLB (Standard)</option>
                          <option value="stl" className="bg-[#1a1a1a] text-white">STL (Legacy)</option>
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
                          value={projectFormData.projectUrl} 
                          onChange={e => setProjectFormData(p => ({ ...p, projectUrl: e.target.value }))}
                          className="w-full bg-white/15 border border-white/20 p-2 text-xs outline-none text-white focus:border-accent-green"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-white/40 uppercase mb-1 block">Preview Mode</label>
                        <div className="flex gap-4 mt-2">
                           <button 
                            type="button" 
                            onClick={() => setProjectFormData(p => ({ ...p, previewType: "image" }))}
                            className={`flex-1 flex items-center justify-center gap-2 p-2 border text-[10px] ${projectFormData.previewType === "image" ? "border-accent-green text-accent-green" : "border-white/10 text-white/40"}`}
                           >
                             <ImageIcon className="w-3 h-3" /> IMAGE
                           </button>
                           <button 
                            type="button" 
                            onClick={() => setProjectFormData(p => ({ ...p, previewType: "iframe" }))}
                            className={`flex-1 flex items-center justify-center gap-2 p-2 border text-[10px] ${projectFormData.previewType === "iframe" ? "border-accent-green text-accent-green" : "border-white/10 text-white/40"}`}
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
                    className="w-full bg-white/10 border border-white/20 p-2 text-xs outline-none text-white focus:border-accent-green"
                  />
                </div>
              </>
            ) : (
              // EXPERIMENTS FORM
              <>
                <div>
                  <label className="text-[9px] text-white/40 uppercase mb-1 block">Title</label>
                  <input 
                    type="text" 
                    value={experimentFormData.title} 
                    onChange={e => setExperimentFormData(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 p-2 text-xs focus:border-accent-green outline-none text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] text-white/40 uppercase mb-1 block">Type</label>
                    <select 
                      value={experimentFormData.type} 
                      onChange={e => setExperimentFormData(p => ({ ...p, type: e.target.value as "LAB" | "EXPERIENCE" }))}
                      className="w-full bg-white/10 border border-white/20 p-2 text-xs outline-none text-white focus:border-accent-green"
                    >
                      <option value="LAB" className="bg-[#1a1a1a] text-white">LAB</option>
                      <option value="EXPERIENCE" className="bg-[#1a1a1a] text-white">EXPERIENCE</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-white/40 uppercase mb-1 block">Status</label>
                    <input 
                      type="text" 
                      value={experimentFormData.status} 
                      onChange={e => setExperimentFormData(p => ({ ...p, status: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 p-2 text-xs outline-none text-white focus:border-accent-green"
                      placeholder="STABLE, BETA, 2021-2023..."
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-white/40 uppercase mb-1 block">Description</label>
                  <textarea 
                    value={experimentFormData.description} 
                    onChange={e => setExperimentFormData(p => ({ ...p, description: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 p-2 text-xs focus:border-accent-green outline-none min-h-[60px] text-white"
                    placeholder="Short summary..."
                  />
                </div>
                {experimentFormData.type === "EXPERIENCE" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] text-white/40 uppercase mb-1 block">Date Range</label>
                      <input 
                        type="text" 
                        value={experimentFormData.dateRange} 
                        onChange={e => setExperimentFormData(p => ({ ...p, dateRange: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 p-2 text-xs outline-none text-white focus:border-accent-green"
                        placeholder="Jan 2022 - Mar 2023"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-white/40 uppercase mb-1 block">Location</label>
                      <input 
                        type="text" 
                        value={experimentFormData.location} 
                        onChange={e => setExperimentFormData(p => ({ ...p, location: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 p-2 text-xs outline-none text-white focus:border-accent-green"
                        placeholder="Remoto / São Paulo"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[9px] text-white/40 uppercase mb-1 block">Tech Stack (comma separated)</label>
                  <input 
                    type="text" 
                    value={techInput} 
                    onChange={e => setTechInput(e.target.value)}
                    onBlur={addTech}
                    className="w-full bg-white/10 border border-white/20 p-2 text-xs outline-none text-white focus:border-accent-green"
                    placeholder="react, firestore, glassmorphism"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-white/40 uppercase mb-1 block">Project/Lab URL (Optional)</label>
                  <input 
                    type="text" 
                    value={experimentFormData.projectUrl} 
                    onChange={e => setExperimentFormData(p => ({ ...p, projectUrl: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 p-2 text-xs outline-none text-white focus:border-accent-green"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button 
                type="submit" 
                className="flex-grow bg-accent-green text-background py-3 font-bold hover:shadow-glow transition-all rounded uppercase text-xs"
              >
                {isEditing ? `Update_${activeTab === 'projects' ? 'Project' : 'Exp'}` : `Inject_New_${activeTab === 'projects' ? 'Project' : 'Exp'}`}
              </button>
              {isEditing && (
                <button 
                  type="button"
                  onClick={() => { 
                    setIsEditing(null); 
                    setProjectFormData(initialProjectForm); 
                    setExperimentFormData(initialExperimentForm);
                    setTagInput("");
                    setTechInput("");
                  }}
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
