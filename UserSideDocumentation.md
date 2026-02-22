# User Side Documentation - CareerSeed Project

## 1. Overview
The User Side of CareerSeed is designed to empower job seekers by providing AI-driven tools for CV analysis, job matching, and skill development. It is built using **Angular 17** with a focus on a responsive, dark-themed UI and real-time state management using **Angular Signals**.

## 2. Core Logic & Features

### A. Dashboard (CV Analysis)
The dashboard is the entry point for users to analyze their resumes against specific job descriptions.
- **File Upload & Drag-and-Drop:** Users can upload PDF/DOCX files. The logic validates file types and sizes before processing.
- **AI Scanning Simulation:** The component uses a simulated AI process that calculates a "Match Score" based on hardcoded sample data (simulating a future backend integration).
- **Match Insights:** Provides detailed breakdowns of Strengths, Weaknesses, Missing Skills, and Recommendations.

### B. Job Matching
Connects the user's analyzed profile with potential job opportunities.
- **Conditional Rendering:** If no CV is uploaded, the system shows a "Locked" state, encouraging users to upload their resume first.
- **Filtering & Sorting:** Users can filter jobs by keyword and sort them by Relevance (Match Score) or Date.
- **Detailed View:** Each job can be selected to view its full description, company info, and match analysis.

### C. Courses & Projects
A personalized learning path generator.
- **Skill Gap Identification:** Based on the CV analysis, the system identifies "Skill Gaps" (e.g., Python, Machine Learning) and labels them by priority (Critical, High, Medium).
- **Recommended Learning:** Provides a curated list of courses from platforms like Coursera, Udemy, and freeCodeCamp.
- **Progress Tracking:** Shows "Readiness Score" and "Skills Mastered" to motivate the user.

### D. Profile Management
A central hub for user data.
- **Skill Management:** Users can add and manage Hard and Soft skills.
- **Experience Timeline:** Displays professional history in a clean, chronological format.
- **CV Versioning:** Allows users to maintain multiple versions of their CV and select which one is "Primary."

## 3. Important Code Sections

### State Management with Signals
The project extensively uses `signal`, `computed`, and `effect` for reactive state.
```typescript
// Example from dashboard.component.ts
currentState = signal<DashboardState>(DashboardState.UPLOAD);
uploadedCV = signal<CVFile | null>(null);
analysisResults = signal<CVAnalysisResult | null>(null);

// Computing filtered courses in courses-projects.component.ts
filteredCourses = computed(() => {
  const filter = this.activeFilter();
  if (filter === 'All') return this.courses();
  return this.courses().filter(c => c.category === filter);
});
```

### File Handling Logic
The `handleFile` method ensures only valid resumes are processed.
```typescript
handleFile(file: File): void {
  const fileName = file.name.toLowerCase();
  const validExtensions = ['.pdf', '.docx', '.doc'];
  const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

  if (!isValidExtension) {
    this.errorMessage.set('Please upload a PDF or DOCX file');
    return;
  }
  // ... proceed to set signal
}
```

### Mocking API Calls for Demo
Since the project is currently a frontend prototype, many services use `setTimeout` to simulate backend latency and provide a realistic UX.
```typescript
async simulateScanAPI(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      this.analysisResults.set({
        matchScore: 82,
        strengths: ['React', 'TypeScript'],
        // ... more mock data
      });
      resolve();
    }, 2000);
  });
}
```
