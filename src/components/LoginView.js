/**
 * @file Login View Component - Renders the authentication interface
 * Features premium SaaS aesthetic with animations and theme support
 */

export const renderLoginView = (onSubmit) => {
    return `
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <!-- Animated Background -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-soft"></div>
                <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-soft" style="animation-delay: 1s;"></div>
            </div>

            <!-- Login Card -->
            <div class="relative w-full max-w-md animate-slide-up">
                <!-- Logo and Header -->
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-r from-primary-500 to-primary-400 rounded-2xl shadow-lg animate-glow">
                        <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold text-white mb-2">Fleet Command</h1>
                    <p class="text-gray-400 font-medium">Advanced Fleet Management Platform</p>
                </div>

                <!-- Login Form Card -->
                <div class="glass-effect rounded-2xl p-8 shadow-2xl">
                    <form id="login-form" class="space-y-6">
                        <div class="space-y-4">
                            <div class="animate-slide-up" style="animation-delay: 0.1s;">
                                <label for="email" class="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
                                <input 
                                    id="email" 
                                    name="email" 
                                    type="email" 
                                    autocomplete="email" 
                                    required 
                                    placeholder="Enter your email"
                                    class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                >
                            </div>

                            <div class="animate-slide-up" style="animation-delay: 0.2s;">
                                <label for="password" class="block text-sm font-semibold text-gray-300 mb-2">Password</label>
                                <input 
                                    id="password" 
                                    name="password" 
                                    type="password" 
                                    autocomplete="current-password" 
                                    required 
                                    placeholder="Enter your password"
                                    class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                >
                            </div>

                            <!-- Role Selection -->
                            <div class="animate-slide-up" style="animation-delay: 0.25s;">
                                <label class="block text-sm font-semibold text-gray-300 mb-3">Select Role</label>
                                <div class="grid grid-cols-2 gap-3">
                                    <label class="role-option cursor-pointer">
                                        <input type="radio" name="role" value="dispatcher" class="sr-only" checked>
                                        <div class="p-4 rounded-xl border-2 border-dark-600 bg-dark-800/50 transition-all duration-200 hover:border-primary-500 role-card">
                                            <div class="text-center">
                                                <div class="text-2xl mb-2">🎯</div>
                                                <div class="text-sm font-medium text-white">Dispatcher</div>
                                                <div class="text-xs text-gray-400 mt-1">Fleet Control</div>
                                            </div>
                                        </div>
                                    </label>
                                    <label class="role-option cursor-pointer">
                                        <input type="radio" name="role" value="driver" class="sr-only">
                                        <div class="p-4 rounded-xl border-2 border-dark-600 bg-dark-800/50 transition-all duration-200 hover:border-primary-500 role-card">
                                            <div class="text-center">
                                                <div class="text-2xl mb-2">🚐</div>
                                                <div class="text-sm font-medium text-white">Driver</div>
                                                <div class="text-xs text-gray-400 mt-1">Route Navigation</div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="animate-slide-up" style="animation-delay: 0.3s;">
                            <button 
                                type="submit" 
                                id="login-btn"
                                class="btn-primary w-full py-3 px-4 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span class="flex items-center justify-center">
                                    <span id="login-text">Sign In</span>
                                    <svg id="login-spinner" class="animate-spin -mr-1 ml-3 h-4 w-4 text-white hidden" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </span>
                            </button>
                        </div>

                        <div id="auth-error" class="hidden animate-slide-down">
                            <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                <div class="flex items-center">
                                    <svg class="w-5 h-5 text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p id="auth-error-text" class="text-sm text-red-400"></p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Footer -->
                <div class="text-center mt-8 animate-slide-up" style="animation-delay: 0.5s;">
                    <p class="text-gray-500 text-sm">
                        Secure • Real-time • Intelligent
                    </p>
                </div>
            </div>
        </div>
    `;
};

/**
 * Initialize login form behavior and role selection
 */
export const initializeLoginView = (onSubmit) => {
    // Handle role selection styling
    const roleOptions = document.querySelectorAll('.role-option');
    roleOptions.forEach(option => {
        const input = option.querySelector('input[type="radio"]');
        const card = option.querySelector('.role-card');
        
        // Set initial state
        if (input.checked) {
            card.classList.add('border-primary-500', 'bg-primary-500/10');
            card.classList.remove('border-dark-600');
        }
        
        option.addEventListener('click', () => {
            // Remove selected state from all cards
            roleOptions.forEach(opt => {
                const otherCard = opt.querySelector('.role-card');
                otherCard.classList.remove('border-primary-500', 'bg-primary-500/10');
                otherCard.classList.add('border-dark-600');
            });
            
            // Add selected state to clicked card
            card.classList.add('border-primary-500', 'bg-primary-500/10');
            card.classList.remove('border-dark-600');
            
            // Update radio button
            input.checked = true;
        });
    });

    // Handle form submission with enhanced UX
    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('auth-error');
    const loginBtn = document.getElementById('login-btn');
    const loginText = document.getElementById('login-text');
    const loginSpinner = document.getElementById('login-spinner');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const role = formData.get('role');
        
        // Clear previous errors
        errorEl.classList.add('hidden');
        
        // Show loading state
        loginBtn.disabled = true;
        loginText.textContent = 'Signing in...';
        loginSpinner.classList.remove('hidden');
        
        try {
            // Store selected role in localStorage
            localStorage.setItem('userRole', role);
            
            // Call the authentication handler
            await onSubmit(email, password, false);
            
            console.log(`Login successful for ${role}:`, email);
            
        } catch (error) {
            console.error("Authentication failed:", error);
            
            // Show error with animation
            const errorTextEl = document.getElementById('auth-error-text');
            errorTextEl.textContent = "Login failed. Please check your credentials.";
            errorEl.classList.remove('hidden');
            
            // Reset button state
            loginBtn.disabled = false;
            loginText.textContent = 'Sign In';
            loginSpinner.classList.add('hidden');
        }
    });
};
