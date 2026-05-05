export interface ProjectData {
  id?: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  image: string;
  type: "3D" | "WEB";
  model3d?: string;
  modelFormat?: "glb" | "stl";
  projectUrl?: string;
  previewType?: "image" | "iframe";
  github?: string;
  visible: boolean;
  order?: number;
  createdAt: any;
  updatedAt?: any;
}

export interface ExperimentData {
  id?: string;
  title: string;
  description: string;
  details?: string;
  type: "LAB" | "EXPERIENCE";
  dateRange: string;
  location?: string;
  tech: string[];
  visible: boolean;
  order?: number;
  status?: string;
  projectUrl?: string;
  createdAt: any;
  updatedAt?: any;
}
