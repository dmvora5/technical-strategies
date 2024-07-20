import schedule, { Job } from 'node-schedule';

interface ScheduleJobOptions {
    initialHour?: number;
    initialMinute?: number;
    intervalMinutes?: number;
    secondFraction?: number;
    jobFunction: () => void;
}

class JobScheduler {
    private initialHour: number;
    private initialMinute: number;
    private intervalMinutes: number;
    private secondFraction: number;
    private jobFunction: () => void;
    private nextRunTime: Date;
    private scheduledJob: Job | null = null;

    constructor({
        initialHour = 9,
        initialMinute = 16,
        intervalMinutes = 5,
        secondFraction = 30,
        jobFunction
    }: ScheduleJobOptions) {
        if (typeof jobFunction !== 'function') {
            throw new Error('jobFunction must be a function');
        }

        this.initialHour = initialHour;
        this.initialMinute = initialMinute;
        this.intervalMinutes = intervalMinutes;
        this.secondFraction = secondFraction;
        this.jobFunction = jobFunction;
        this.nextRunTime = this.calculateNextRunTime();

        this.scheduleNextJob();
    }

    private calculateNextRunTime(): Date {
        const now = new Date();
        const initialTimeToday = new Date();
        initialTimeToday.setHours(this.initialHour, this.initialMinute, 0, 0);

        if (now < initialTimeToday) {
            return initialTimeToday;
        }

        const minutesSinceInitial = Math.floor((now.getTime() - initialTimeToday.getTime()) / 60000);
        const minutesToNextInterval = this.intervalMinutes - (minutesSinceInitial % this.intervalMinutes);
        const nextRun = new Date(now.getTime() + minutesToNextInterval * 60000);
        nextRun.setSeconds(this.secondFraction, 0);

        return nextRun;
    }

    private scheduleNextJob(): void {
        console.log('Next job scheduled at:', this.nextRunTime.toLocaleString());

        this.scheduledJob = schedule.scheduleJob(this.nextRunTime, () => {
            console.log('Job is running at:', new Date().toLocaleString());
            this.jobFunction();

            this.nextRunTime = new Date(this.nextRunTime.getTime() + this.intervalMinutes * 60000);
            this.scheduleNextJob();
        });
    }

    public cancelJob(): void {
        if (this.scheduledJob) {
            this.scheduledJob.cancel();
            this.scheduledJob = null;
            console.log('Job has been cancelled.');
        } else {
            console.log('No job to cancel.');
        }
    }
}

export { JobScheduler };
