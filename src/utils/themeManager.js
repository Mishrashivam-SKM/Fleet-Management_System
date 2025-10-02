/**
 * @fileoverview Unified Theme Management System
 * Centralizes all theme-related functionality to eliminate code duplication
 */

/**
 * Unified Theme Manager - Single Source of Truth for all theme operations
 */
export class ThemeManager {
    constructor() {
        this.isDark = this.loadTheme();
        this.applyTheme();
    }

    /**
     * Load theme preference from localStorage
     * @returns {boolean} true if dark theme, false if light
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        return savedTheme === 'dark';
    }

    /**
     * Apply current theme to document body
     */
    applyTheme() {
        const body = document.body;
        body.classList.remove('dark', 'light');
        body.classList.add(this.isDark ? 'dark' : 'light');
        localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
        
        // Update all theme toggle buttons
        this.updateAllToggles();
        
        // Dispatch theme change event
        this.dispatchThemeEvent();
        
        console.log(`🎨 Theme applied: ${this.isDark ? 'DARK' : 'LIGHT'} mode`);
    }

    /**
     * Toggle between light and dark theme
     */
    toggle() {
        this.isDark = !this.isDark;
        this.applyTheme();
    }

    /**
     * Update all theme toggle buttons with consistent icons
     */
    updateAllToggles() {
        const toggles = document.querySelectorAll('#theme-toggle, #nav-theme-toggle, #landing-theme-toggle');
        
        toggles.forEach(toggle => {
            if (!toggle) return;
            
            if (this.isDark) {
                // Dark mode - show moon icon
                toggle.innerHTML = `
                    <svg class="w-5 h-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                `;
                toggle.title = "Switch to Light Mode";
            } else {
                // Light mode - show sun icon
                toggle.innerHTML = `
                    <svg class="w-5 h-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                `;
                toggle.title = "Switch to Dark Mode";
            }
        });
    }

    /**
     * Initialize theme system and attach event listeners
     */
    initialize() {
        const toggles = document.querySelectorAll('#theme-toggle, #nav-theme-toggle, #landing-theme-toggle');
        
        toggles.forEach(toggle => {
            if (toggle) {
                toggle.addEventListener('click', () => this.toggle());
            }
        });

        console.log(`✅ Theme Manager initialized: ${toggles.length} toggle buttons found`);
    }

    /**
     * Dispatch custom theme change event for components to listen to
     */
    dispatchThemeEvent() {
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: this.isDark ? 'dark' : 'light' } 
        }));
    }

    /**
     * Get current theme
     * @returns {string} 'dark' or 'light'
     */
    getCurrentTheme() {
        return this.isDark ? 'dark' : 'light';
    }
}

// Create global theme manager instance
export const themeManager = new ThemeManager();

// Export convenience functions for backward compatibility
export const toggleTheme = () => themeManager.toggle();
export const initializeTheme = () => themeManager.initialize();
export const getCurrentTheme = () => themeManager.getCurrentTheme();