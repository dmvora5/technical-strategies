import schedule from 'node-schedule';

interface ScheduleJobOptions {
    initialHour?: number;
    initialMinute?: number;
    intervalMinutes?: number;
    jobFunction: () => void;
}

function scheduleJob({
    initialHour = 9,
    initialMinute = 16,
    intervalMinutes = 5,
    jobFunction
}: ScheduleJobOptions): void {
    if (typeof jobFunction !== 'function') {
        throw new Error('jobFunction must be a function');
    }

    let nextRunTime = calculateNextRunTime();

    function calculateNextRunTime(): Date {
        const now = new Date();
        const initialTimeToday = new Date();
        initialTimeToday.setHours(initialHour, initialMinute, 0, 0);

        if (now < initialTimeToday) {
            return initialTimeToday;
        }

        const minutesSinceInitial = Math.floor((now.getTime() - initialTimeToday.getTime()) / 60000);
        const minutesToNextInterval = intervalMinutes - (minutesSinceInitial % intervalMinutes);
        const nextRun = new Date(now.getTime() + minutesToNextInterval * 60000);
        nextRun.setSeconds(30, 0);

        return nextRun;
    }

    function scheduleNextJob(): void {
        console.log('Next job scheduled at:', nextRunTime.toLocaleString());

        schedule.scheduleJob(nextRunTime, function () {
            console.log('Job is running at:', new Date().toLocaleString());
            jobFunction();

            nextRunTime = new Date(nextRunTime.getTime() + intervalMinutes * 60000);
            scheduleNextJob();
        });
    }

    scheduleNextJob();
}

export { scheduleJob };
