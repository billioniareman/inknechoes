import { Moon, Sun, Monitor, BookOpen } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
    const { theme, setTheme, effectiveTheme } = useTheme();

    const toggleTheme = () => {
        // Cycle through: light -> sepia -> dark -> system
        if (theme === 'light') {
            setTheme('sepia');
        } else if (theme === 'sepia') {
            setTheme('dark');
        } else if (theme === 'dark') {
            setTheme('system');
        } else {
            setTheme('light');
        }
    };

    const getIcon = () => {
        if (theme === 'system') {
            return <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />;
        }
        if (effectiveTheme === 'sepia') {
            return <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-literary" />;
        }
        return effectiveTheme === 'dark' ? <Moon className="h-4 w-4 sm:h-5 sm:w-5" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5" />;
    };

    const getTooltip = () => {
        if (theme === 'system') return 'System theme';
        if (effectiveTheme === 'sepia') return 'Sepia reading mode';
        return effectiveTheme === 'dark' ? 'Charcoal night mode' : 'Warm ivory light mode';
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 text-foreground hover:text-primary transition-colors rounded-md hover:bg-secondary/50"
            title={getTooltip()}
            aria-label="Toggle theme"
        >
            {getIcon()}
        </button>
    );
}
