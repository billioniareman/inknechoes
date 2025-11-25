import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
    const { theme, setTheme, effectiveTheme } = useTheme();

    const toggleTheme = () => {
        // Cycle through: light -> dark -> system
        if (theme === 'light') {
            setTheme('dark');
        } else if (theme === 'dark') {
            setTheme('system');
        } else {
            setTheme('light');
        }
    };

    const getIcon = () => {
        if (theme === 'system') {
            return <Monitor className="h-5 w-5" />;
        }
        return effectiveTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />;
    };

    const getTooltip = () => {
        if (theme === 'system') return 'System theme';
        return effectiveTheme === 'dark' ? 'Dark mode' : 'Light mode';
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
