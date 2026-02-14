/**
 * Formats a timestamp into a relative time string
 * Examples: "2 sec ago", "5 mins ago", "3 days ago", "1 week ago", "1 month ago"
 */
export function formatRelativeTime(timestamp: string | Date): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) {
        return 'just now';
    }

    // Less than a minute
    if (diffInSeconds < 60) {
        return `${diffInSeconds} sec ago`;
    }

    // Less than an hour
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? '1 min ago' : `${diffInMinutes} mins ago`;
    }

    // Less than a day
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    }

    // Less than a week
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    }

    // Less than a month (30 days)
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInDays < 30) {
        return diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`;
    }

    // Less than a year
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInDays < 365) {
        return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
    }

    // More than a year
    const diffInYears = Math.floor(diffInDays / 365);
    return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
}
