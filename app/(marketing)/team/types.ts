export type TeamMember = {
  id: string;
  name: string;
  roleTitle: string;
  qualifications: string[];
  photoUrl: string;
  imageWidth: number;
  imageHeight: number;
  bio?: string;
  funFact?: string;
  certifications?: string[];
};
