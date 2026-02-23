export interface ProjectSummary {
  num: number;
  name: string;
  slug: string;
  phase: number;
  phaseName: string;
  difficulty: string;
  concepts: string;
  levels: number;
  pyodide: 'full' | 'partial' | 'none';
  hasTests: boolean;
}

export interface ProjectDetail extends ProjectSummary {
  moduleName: string;
  className: string;
  readme: string;
  testFile: string;
  testFileName: string;
}

export interface TestResult {
  name: string;
  passed: boolean;
  duration?: number;
  error?: string;
}

export interface TestRunResult {
  exitCode: number;
  tests: TestResult[];
  output: string;
}

export interface ProjectProgress {
  passed: number;
  total: number;
  allPassed: boolean;
}
