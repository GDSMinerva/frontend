import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

// Data Interfaces
interface StatCard {
    id: string;
    label: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: string;
}

interface ChartDataPoint {
    month: string;
    percentage: number;
}

interface Feature {
    name: string;
    percentage: number;
}

interface SkillGap {
    name: string;
}

interface JobMatchRate {
    sector: string;
    percentage: number;
    rotation: number;
}

interface TrainingStats {
    completed: number;
    inProgress: number;
    overallPercentage: number;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardComponent {
    // Platform Performance Statistics
    statCards: StatCard[] = [
        {
            id: 'total-scans',
            label: 'Total Scans',
            value: '24.5k',
            change: '+12%',
            changeType: 'positive',
            icon: 'document_scanner'
        },
        {
            id: 'successful-matches',
            label: 'Successful Matches',
            value: '18.2k',
            change: '+8%',
            changeType: 'positive',
            icon: 'verified'
        },
        {
            id: 'system-uptime',
            label: 'System Uptime',
            value: '99.98%',
            change: 'Stable',
            changeType: 'neutral',
            icon: 'dns'
        },
        {
            id: 'avg-latency',
            label: 'Avg Latency',
            value: '210ms',
            change: '-15ms',
            changeType: 'positive',
            icon: 'speed'
        }
    ];

    // User Growth Chart Data
    userGrowthData: ChartDataPoint[] = [
        { month: 'Jan', percentage: 30 },
        { month: 'Feb', percentage: 45 },
        { month: 'Mar', percentage: 40 },
        { month: 'Apr', percentage: 65 },
        { month: 'May', percentage: 85 },
        { month: 'Jun', percentage: 90 }
    ];

    // Training Completion Stats
    trainingStats: TrainingStats = {
        completed: 1240,
        inProgress: 413,
        overallPercentage: 75
    };

    // Most Used Features
    features: Feature[] = [
        { name: 'CV Analysis', percentage: 92 },
        { name: 'Job Matching', percentage: 78 },
        { name: 'Interview Simulator', percentage: 65 },
        { name: 'Courses & Projects', percentage: 44 }
    ];

    // Identified Skill Gaps
    skillGaps: SkillGap[] = [
        { name: 'Cloud Architecture' },
        { name: 'TypeScript' },
        { name: 'React.js' },
        { name: 'UI/UX Design' },
        { name: 'Python' },
        { name: 'Agile' },
        { name: 'System Design' },
        { name: 'Kubernetes' },
        { name: 'Data Analysis' },
        { name: 'Machine Learning' }
    ];

    // Job Match Success Rates
    jobMatchRates: JobMatchRate[] = [
        { sector: 'Tech Sector', percentage: 82, rotation: 45 },
        { sector: 'Marketing', percentage: 65, rotation: 20 },
        { sector: 'Healthcare', percentage: 48, rotation: -10 }
    ];

    // Calculate stroke dashoffset for circular progress
    getStrokeDashoffset(): number {
        const circumference = 2 * Math.PI * 70; // radius = 70
        return circumference - (this.trainingStats.overallPercentage / 100) * circumference;
    }
}
