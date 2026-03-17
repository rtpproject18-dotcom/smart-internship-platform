export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  bio?: string;
  domainInterests?: string[];
  skills?: string[];
  github?: string;
  portfolio?: string;
  codingScore: number;
  points: number;
  challengesSolved?: number;
  interests?: string[];
  specialization?: string;
  atsScore?: number;
  resumeUrl?: string;
  resumeData?: any;
  createdAt: string;
}

export interface Internship {
  id: string;
  recruiterId: string;
  companyName: string;
  title: string;
  description: string;
  requiredSkills: string[];
  duration: string;
  stipend: string;
  hashtags: string[];
  createdAt: string;
}

export interface Application {
  id: string;
  internshipId: string;
  candidateId: string;
  recruiterId: string;
  companyName: string;
  internshipTitle: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
}

export interface Certificate {
  id: string;
  candidateId: string;
  title: string;
  issuer: string;
  url: string;
  verifiedHash?: string;
  createdAt: string;
}

export interface CodingChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  testCases: { input: any; expected: any }[];
  starterCode: { [key: string]: string };
}
