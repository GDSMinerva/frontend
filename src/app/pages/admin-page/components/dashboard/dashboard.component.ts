import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { NgxNumberTickerComponent } from '@omnedia/ngx-number-ticker';

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
    imports: [CommonModule, NgxNumberTickerComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardComponent implements OnInit, AfterViewInit {
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


    // --- Animation Logic ---

    // Initial (0) states for animation
    userGrowthData: ChartDataPoint[] = [];
    trainingStats: TrainingStats = { completed: 0, inProgress: 0, overallPercentage: 0 };
    features: Feature[] = [];
    jobMatchRates: JobMatchRate[] = [];

    // Target (Final) Data
    private readonly userGrowthDataTarget: ChartDataPoint[] = [
        { month: 'Jan', percentage: 30 },
        { month: 'Feb', percentage: 45 },
        { month: 'Mar', percentage: 40 },
        { month: 'Apr', percentage: 65 },
        { month: 'May', percentage: 85 },
        { month: 'Jun', percentage: 90 }
    ];

    private readonly trainingStatsTarget: TrainingStats = {
        completed: 1240,
        inProgress: 413,
        overallPercentage: 75
    };

    private readonly featuresTarget: Feature[] = [
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

    private readonly jobMatchRatesTarget: JobMatchRate[] = [
        { sector: 'Tech Sector', percentage: 82, rotation: 45 },
        { sector: 'Marketing', percentage: 65, rotation: 20 },
        { sector: 'Healthcare', percentage: 48, rotation: -10 }
    ];

    constructor(private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        // Initialize with default/zero values
        this.initializeData();
    }

    ngAfterViewInit() {
        // Trigger animation after view init with a small delay
        setTimeout(() => {
            this.animateCharts();
        }, 300);
    }

    private initializeData() {
        // Init User Growth (bars at 0 height)
        this.userGrowthData = this.userGrowthDataTarget.map(d => ({ ...d, percentage: 0 }));

        // Init Training Stats (circle at 0)
        this.trainingStats = { ...this.trainingStatsTarget, completed: 0, inProgress: 0, overallPercentage: 0 };

        // Init Features (bars at 0 width)
        this.features = this.featuresTarget.map(f => ({ ...f, percentage: 0 }));

        // Init Match Rates (gauges at start rotation)
        this.jobMatchRates = this.jobMatchRatesTarget.map(m => ({ ...m, percentage: 0, rotation: -135 }));
    }

    private animateCharts() {
        // Update to target values - MUTATING existing objects to keep DOM elements stable for CSS transitions

        // User Growth
        this.userGrowthData.forEach((d, i) => {
            d.percentage = this.userGrowthDataTarget[i].percentage;
        });

        // Training Stats
        this.trainingStats.overallPercentage = this.trainingStatsTarget.overallPercentage;
        this.trainingStats.completed = this.trainingStatsTarget.completed;
        this.trainingStats.inProgress = this.trainingStatsTarget.inProgress;

        // Features
        this.features.forEach((f, i) => {
            f.percentage = this.featuresTarget[i].percentage;
        });

        // Job Match Rates
        this.jobMatchRates.forEach((m, i) => {
            m.percentage = this.jobMatchRatesTarget[i].percentage;
            m.rotation = this.jobMatchRatesTarget[i].rotation;
        });

        // Ensure change detection runs to apply the new values
        this.cdr.markForCheck();
    }

    // Calculate stroke dashoffset for circular progress
    getStrokeDashoffset(): number {
        const circumference = 2 * Math.PI * 70; // radius = 70
        return circumference - (this.trainingStats.overallPercentage / 100) * circumference;
    }

    // Helper to parse numeric part for ticker
    getNumericValue(value: string): number {
        const cleaned = value.toString().replace(/,/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }

    // Helper to get non-numeric suffix
    getSuffix(value: string): string {
        const cleaned = value.toString().replace(/,/g, '');
        const num = parseFloat(cleaned);
        if (isNaN(num)) return value;
        return value.replace(num.toString(), '').replace(/,/g, ''); // Simple fallback, or just replace digits roughly
    }

    // Better suffix extraction:
    // "24.5k" -> num 24.5. value.replace('24.5', '') -> 'k'.
    // "1,234" -> num 1234. suffix empty.
    extractSuffix(value: string): string {
        const match = value.match(/[a-zA-Z%]+/);
        return match ? match[0] : '';
    }
}
