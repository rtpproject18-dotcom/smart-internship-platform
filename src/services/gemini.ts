import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const analyzeResume = async (resumeText: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following resume text and extract skills, technologies, education, experience, and certifications. 
    Also, provide an ATS score (0-100) based on its strength for technical internship roles.
    
    Resume Text:
    ${resumeText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
          education: { type: Type.ARRAY, items: { type: Type.STRING } },
          experience: { type: Type.ARRAY, items: { type: Type.STRING } },
          certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
          atsScore: { type: Type.NUMBER },
          summary: { type: Type.STRING }
        },
        required: ["skills", "technologies", "atsScore"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const recommendInternships = async (userSkills: string[], domainInterests: string[], internships: any[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the user's skills (${userSkills.join(", ")}) and interests (${domainInterests.join(", ")}), 
    rank the following internship listings by relevance. Return only the IDs in order of relevance.
    
    Internships:
    ${JSON.stringify(internships.map(i => ({ id: i.id, title: i.title, description: i.description })))}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateCodingChallenge = async (difficulty: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a coding challenge with difficulty ${difficulty}. Include a title, description, 3 test cases (input/expected), and starter code for Python and JavaScript.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          testCases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                input: { type: Type.STRING },
                expected: { type: Type.STRING }
              }
            }
          },
          starterCode: {
            type: Type.OBJECT,
            properties: {
              python: { type: Type.STRING },
              javascript: { type: Type.STRING }
            }
          }
        },
        required: ["title", "description", "testCases", "starterCode"]
      }
    }
  });

  return JSON.parse(response.text);
};
