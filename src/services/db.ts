import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Internship, Application, Certificate, CodingChallenge } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const createUserProfile = async (profile: Partial<UserProfile>) => {
  if (!profile.uid) return;
  const path = `users/${profile.uid}`;
  try {
    const userRef = doc(db, 'users', profile.uid);
    await setDoc(userRef, {
      ...profile,
      codingScore: 0,
      points: 0,
      createdAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() as UserProfile : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const postInternship = async (internship: Omit<Internship, 'id' | 'createdAt'>) => {
  const path = 'internships';
  try {
    const colRef = collection(db, 'internships');
    const docRef = await addDoc(colRef, {
      ...internship,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const applyForInternship = async (application: Omit<Application, 'id' | 'appliedAt' | 'status'>) => {
  const path = 'applications';
  try {
    const colRef = collection(db, 'applications');
    const docRef = await addDoc(colRef, {
      ...application,
      status: 'pending',
      appliedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const updateApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
  const path = `applications/${applicationId}`;
  try {
    const appRef = doc(db, 'applications', applicationId);
    await updateDoc(appRef, { status });

    if (status === 'accepted') {
      const appSnap = await getDoc(appRef);
      const appData = appSnap.data() as Application;
      
      // Check if candidate has 3 applications and at least one is accepted (Reward Logic)
      const q = query(collection(db, 'applications'), where('candidateId', '==', appData.candidateId));
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs.map(d => d.data() as Application);
      
      if (apps.length >= 3 && apps.some(a => a.status === 'accepted')) {
        const userRef = doc(db, 'users', appData.candidateId);
        await updateDoc(userRef, {
          points: increment(500) // Reward for getting selected
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const addCertificate = async (cert: Omit<Certificate, 'id' | 'createdAt'>) => {
  const path = 'certificates';
  try {
    const colRef = collection(db, 'certificates');
    const docRef = await addDoc(colRef, {
      ...cert,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const getCodingChallenges = async () => {
  const path = 'challenges';
  try {
    const colRef = collection(db, 'challenges');
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CodingChallenge));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const updateCodingScore = async (uid: string, points: number) => {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      codingScore: increment(points),
      points: increment(points),
      challengesSolved: increment(1)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const getApplicationsForCandidate = async (candidateId: string) => {
  const path = 'applications';
  try {
    const q = query(collection(db, 'applications'), where('candidateId', '==', candidateId), orderBy('appliedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const seedInitialData = async () => {
  try {
    const challengesRef = collection(db, 'challenges');
    const challengesSnap = await getDocs(challengesRef);
    if (challengesSnap.empty) {
      const initialChallenges = [
        {
          title: "Reverse String",
          description: "Write a function that reverses a string. The input string is given as an array of characters s.",
          difficulty: "easy",
          points: 100,
          testCases: [
            { input: "hello", expected: "olleh" },
            { input: "world", expected: "dlrow" }
          ],
          starterCode: {
            javascript: "function reverseString(s) {\n  // Your code here\n}",
            python: "def reverse_string(s):\n    # Your code here\n    pass",
            java: "class Solution {\n    public String reverseString(String s) {\n        // Your code here\n    }\n}",
            cpp: "class Solution {\npublic:\n    string reverseString(string s) {\n        // Your code here\n    }\n}"
          }
        },
        {
          title: "Palindrome Check",
          description: "Given a string s, return true if it is a palindrome, or false otherwise.",
          difficulty: "easy",
          points: 100,
          testCases: [
            { input: "racecar", expected: "true" },
            { input: "hello", expected: "false" }
          ],
          starterCode: {
            javascript: "function isPalindrome(s) {\n  // Your code here\n}",
            python: "def is_palindrome(s):\n    # Your code here\n    pass"
          }
        },
        {
          title: "Two Sum",
          description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
          difficulty: "medium",
          points: 250,
          testCases: [{ input: "[2,7,11,15], 9", expected: "[0,1]" }],
          starterCode: {
            javascript: "function twoSum(nums, target) {\n  // Your code here\n}",
            python: "def two_sum(nums, target):\n    # Your code here\n    pass"
          }
        },
        {
          title: "Longest Substring Without Repeating Characters",
          description: "Given a string s, find the length of the longest substring without repeating characters.",
          difficulty: "medium",
          points: 300,
          testCases: [{ input: "abcabcbb", expected: "3" }],
          starterCode: {
            javascript: "function lengthOfLongestSubstring(s) {\n  // Your code here\n}"
          }
        },
        {
          title: "Graph Traversal (BFS)",
          description: "Implement Breadth First Search for a given adjacency list starting from node 0.",
          difficulty: "hard",
          points: 500,
          testCases: [{ input: "{0:[1,2], 1:[2], 2:[0,3], 3:[3]}", expected: "[0,1,2,3]" }],
          starterCode: {
            python: "def bfs(graph, start_node):\n    # Your code here\n    pass"
          }
        },
        {
          title: "Dynamic Programming: Knapsack",
          description: "Given weights and values of n items, put these items in a knapsack of capacity W to get the maximum total value in the knapsack.",
          difficulty: "hard",
          points: 600,
          testCases: [{ input: "W=50, weights=[10,20,30], values=[60,100,120]", expected: "220" }],
          starterCode: {
            python: "def knapsack(W, weights, values):\n    # Your code here\n    pass"
          }
        }
      ];
      for (const c of initialChallenges) {
        await addDoc(challengesRef, c);
      }
    }

    const internshipsRef = collection(db, 'internships');
    const internshipsSnap = await getDocs(internshipsRef);
    if (internshipsSnap.empty) {
      const initialInternships = [
        {
          recruiterId: "system",
          companyName: "Tech Mahindra",
          title: "Frontend Developer Intern",
          description: "Join our team to build modern web applications using React and Tailwind CSS.",
          duration: "6 Months",
          stipend: "₹25,000/month",
          requiredSkills: ["React", "JavaScript", "Tailwind CSS"],
          hashtags: ["WebDevelopment", "Frontend", "React"],
          createdAt: new Date().toISOString()
        },
        {
          recruiterId: "system",
          companyName: "Infosys",
          title: "Data Science Intern",
          description: "Work on real-world data science projects and machine learning models.",
          duration: "3 Months",
          stipend: "₹20,000/month",
          requiredSkills: ["Python", "Pandas", "Machine Learning"],
          hashtags: ["DataScience", "AI", "Python"],
          createdAt: new Date().toISOString()
        },
        {
          recruiterId: "system",
          companyName: "Wipro",
          title: "Cloud Engineering Intern",
          description: "Learn and implement cloud infrastructure solutions using AWS and Azure.",
          duration: "4 Months",
          stipend: "₹18,000/month",
          requiredSkills: ["AWS", "Cloud Computing", "Linux"],
          hashtags: ["CloudComputing", "AWS", "DevOps"],
          createdAt: new Date().toISOString()
        }
      ];
      for (const i of initialInternships) {
        await addDoc(internshipsRef, i);
      }
    }

    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(query(usersRef, limit(1)));
    if (usersSnap.empty) {
      const sampleUsers = [
        {
          uid: "sample1",
          email: "rahul@example.com",
          displayName: "Rahul Sharma",
          role: "candidate",
          codingScore: 1250,
          points: 1500,
          challengesSolved: 12,
          skills: ["React", "Node.js", "Python"],
          bio: "Passionate competitive programmer and web developer.",
          domainInterests: ["Web Development", "AI"],
          createdAt: new Date().toISOString()
        },
        {
          uid: "sample2",
          email: "priya@example.com",
          displayName: "Priya Patel",
          role: "candidate",
          codingScore: 980,
          points: 1100,
          challengesSolved: 8,
          skills: ["Java", "Spring Boot", "SQL"],
          bio: "Backend enthusiast looking for challenging internships.",
          domainInterests: ["Backend Development", "Cloud Computing"],
          createdAt: new Date().toISOString()
        },
        {
          uid: "sample3",
          email: "amit@example.com",
          displayName: "Amit Kumar",
          role: "candidate",
          codingScore: 2100,
          points: 2500,
          challengesSolved: 25,
          skills: ["Python", "TensorFlow", "PyTorch"],
          bio: "AI researcher and machine learning engineer.",
          domainInterests: ["Artificial Intelligence", "Data Science"],
          createdAt: new Date().toISOString()
        },
        {
          uid: "sample4",
          email: "sneha@example.com",
          displayName: "Sneha Reddy",
          role: "candidate",
          codingScore: 1550,
          points: 1800,
          challengesSolved: 15,
          skills: ["Figma", "React", "UI/UX"],
          bio: "Creative designer with strong frontend development skills.",
          domainInterests: ["UI/UX Design", "Frontend Development"],
          createdAt: new Date().toISOString()
        },
        {
          uid: "sample5",
          email: "vikram@example.com",
          displayName: "Vikram Singh",
          role: "candidate",
          codingScore: 1800,
          points: 2000,
          challengesSolved: 20,
          skills: ["C++", "Algorithms", "Data Structures"],
          bio: "Competitive programmer and algorithm enthusiast.",
          domainInterests: ["Competitive Programming", "Software Engineering"],
          createdAt: new Date().toISOString()
        },
        {
          uid: "sample6",
          email: "ananya@example.com",
          displayName: "Ananya Iyer",
          role: "candidate",
          codingScore: 2400,
          points: 2800,
          challengesSolved: 30,
          skills: ["Python", "Django", "PostgreSQL"],
          bio: "Full-stack developer with a focus on scalable backend systems.",
          domainInterests: ["Backend Development", "System Design"],
          createdAt: new Date().toISOString()
        },
        {
          uid: "sample7",
          email: "karthik@example.com",
          displayName: "Karthik Raja",
          role: "candidate",
          codingScore: 1300,
          points: 1450,
          challengesSolved: 10,
          skills: ["JavaScript", "Vue.js", "Firebase"],
          bio: "Frontend developer who loves building interactive user interfaces.",
          domainInterests: ["Frontend Development", "Mobile Apps"],
          createdAt: new Date().toISOString()
        },
        {
          uid: "sample8",
          email: "megha@example.com",
          displayName: "Megha Gupta",
          role: "candidate",
          codingScore: 1950,
          points: 2200,
          challengesSolved: 22,
          skills: ["R", "Statistics", "Tableau"],
          bio: "Data analyst passionate about storytelling through data visualization.",
          domainInterests: ["Data Analytics", "Business Intelligence"],
          createdAt: new Date().toISOString()
        },
        {
          uid: "sample9",
          email: "arjun@example.com",
          displayName: "Arjun Das",
          role: "candidate",
          codingScore: 1650,
          points: 1900,
          challengesSolved: 18,
          skills: ["Go", "Docker", "Kubernetes"],
          bio: "Cloud-native enthusiast exploring distributed systems.",
          domainInterests: ["Cloud Computing", "DevOps"],
          createdAt: new Date().toISOString()
        },
        {
          uid: "sample10",
          email: "tanvi@example.com",
          displayName: "Tanvi Sharma",
          role: "candidate",
          codingScore: 2250,
          points: 2600,
          challengesSolved: 28,
          skills: ["Swift", "iOS Development", "CoreData"],
          bio: "Mobile developer creating elegant iOS applications.",
          domainInterests: ["Mobile Development", "UI/UX"],
          createdAt: new Date().toISOString()
        },
        {
          uid: "sample11",
          email: "rohan@example.com",
          displayName: "Rohan Mehta",
          role: "candidate",
          codingScore: 2600,
          points: 3000,
          challengesSolved: 35,
          skills: ["Rust", "WebAssembly", "C"],
          bio: "Systems programmer interested in high-performance web applications.",
          domainInterests: ["Systems Programming", "Web Performance"],
          createdAt: new Date().toISOString()
        },
        {
          uid: "sample12",
          email: "ishani@example.com",
          displayName: "Ishani Bose",
          role: "candidate",
          codingScore: 1450,
          points: 1600,
          challengesSolved: 14,
          skills: ["Angular", "TypeScript", "RxJS"],
          bio: "Enterprise frontend developer with a love for structured code.",
          domainInterests: ["Frontend Architecture", "Enterprise Apps"],
          createdAt: new Date().toISOString()
        },
        {
          uid: "sample13",
          email: "zoya@example.com",
          displayName: "Zoya Khan",
          role: "candidate",
          codingScore: 2050,
          points: 2400,
          challengesSolved: 24,
          skills: ["Kotlin", "Android Jetpack", "Coroutines"],
          bio: "Android developer building modern and responsive mobile experiences.",
          domainInterests: ["Mobile Development", "Kotlin Multiplatform"],
          createdAt: new Date().toISOString()
        },
        {
          uid: "sample14",
          email: "kabir@example.com",
          displayName: "Kabir Malhotra",
          role: "candidate",
          codingScore: 1750,
          points: 2100,
          challengesSolved: 19,
          skills: ["Ruby", "Rails", "Redis"],
          bio: "Backend developer who values clean code and developer productivity.",
          domainInterests: ["Backend Development", "Open Source"],
          createdAt: new Date().toISOString()
        },
        {
          uid: "sample15",
          email: "sanya@example.com",
          displayName: "Sanya Verma",
          role: "candidate",
          codingScore: 2350,
          points: 2750,
          challengesSolved: 29,
          skills: ["GraphQL", "Apollo", "Next.js"],
          bio: "Full-stack developer specializing in modern web architectures.",
          domainInterests: ["Web Development", "GraphQL"],
          createdAt: new Date().toISOString()
        }
      ];
      for (const u of sampleUsers) {
        await setDoc(doc(db, 'users', u.uid), u);
      }
    }
  } catch (error) {
    console.warn("Seeding skipped or failed due to permissions:", error);
  }
};
