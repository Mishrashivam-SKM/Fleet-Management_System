/**
 * @file Footer Component - Professional footer for Fleet Command application
 * Features responsive design, theme-aware styling, and company information
 */

export const renderFooter = () => {
    const currentYear = new Date().getFullYear();
    
    return `
        <footer class="theme-nav mt-16 border-t">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    
                    <!-- Company Info -->
                    <div class="lg:col-span-1">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-400 rounded-lg shadow-md">
                                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 class="text-lg font-bold theme-text-primary">Fleet Command</h3>
                        </div>
                        <p class="theme-text-muted text-sm mb-4 leading-relaxed">
                            Advanced fleet management platform powered by AI. Optimize routes, 
                            track vehicles in real-time, and reduce operational costs.
                        </p>
                        <div class="flex space-x-3">
                            <button class="w-8 h-8 rounded-full theme-card hover:bg-primary-500 hover:text-white transition-all duration-200 flex items-center justify-center">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                                </svg>
                            </button>
                            <button class="w-8 h-8 rounded-full theme-card hover:bg-primary-500 hover:text-white transition-all duration-200 flex items-center justify-center">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                            </button>
                            <button class="w-8 h-8 rounded-full theme-card hover:bg-primary-500 hover:text-white transition-all duration-200 flex items-center justify-center">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.731.099.12.112.225.085.347-.09.392-.293 1.177-.334 1.345-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Platform -->
                    <div>
                        <h4 class="text-sm font-semibold theme-text-primary uppercase tracking-wider mb-4">Platform</h4>
                        <ul class="space-y-2">
                            <li><a href="#" class="theme-text-muted hover:text-primary-500 text-sm transition-colors duration-200">Fleet Tracking</a></li>
                            <li><a href="#" class="theme-text-muted hover:text-primary-500 text-sm transition-colors duration-200">Route Optimization</a></li>
                            <li><a href="#" class="theme-text-muted hover:text-primary-500 text-sm transition-colors duration-200">Driver Management</a></li>
                            <li><a href="#" class="theme-text-muted hover:text-primary-500 text-sm transition-colors duration-200">Analytics & Reports</a></li>
                            <li><a href="#" class="theme-text-muted hover:text-primary-500 text-sm transition-colors duration-200">API Integration</a></li>
                        </ul>
                    </div>

                    <!-- Support -->
                    <div>
                        <h4 class="text-sm font-semibold theme-text-primary uppercase tracking-wider mb-4">Support</h4>
                        <ul class="space-y-2">
                            <li><a href="#" class="theme-text-muted hover:text-primary-500 text-sm transition-colors duration-200">Documentation</a></li>
                            <li><a href="#" class="theme-text-muted hover:text-primary-500 text-sm transition-colors duration-200">Help Center</a></li>
                            <li><a href="#" class="theme-text-muted hover:text-primary-500 text-sm transition-colors duration-200">Community</a></li>
                            <li><a href="#" class="theme-text-muted hover:text-primary-500 text-sm transition-colors duration-200">Status</a></li>
                            <li><a href="#" class="theme-text-muted hover:text-primary-500 text-sm transition-colors duration-200">Contact</a></li>
                        </ul>
                    </div>

                    <!-- Legal -->
                    <div>
                        <h4 class="text-sm font-semibold theme-text-primary uppercase tracking-wider mb-4">Legal</h4>
                        <ul class="space-y-2">
                            <li><a href="#" class="theme-text-muted hover:text-primary-500 text-sm transition-colors duration-200">Privacy Policy</a></li>
                            <li><a href="#" class="theme-text-muted hover:text-primary-500 text-sm transition-colors duration-200">Terms of Service</a></li>
                            <li><a href="#" class="theme-text-muted hover:text-primary-500 text-sm transition-colors duration-200">Security</a></li>
                            <li><a href="#" class="theme-text-muted hover:text-primary-500 text-sm transition-colors duration-200">Compliance</a></li>
                        </ul>
                    </div>
                </div>

                <!-- Bottom Border -->
                <div class="border-t theme-border-color mt-8 pt-8">
                    <div class="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                        <!-- Copyright -->
                        <div class="theme-text-muted text-sm">
                            © ${currentYear} Fleet Command. All rights reserved.
                        </div>
                        
                        <!-- System Status -->
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-2">
                                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span class="theme-text-muted text-sm">System Operational</span>
                            </div>
                            <div class="theme-text-muted text-sm">
                                v2.1.0
                            </div>
                        </div>
                    </div>

                    <!-- Tech Stack Badge -->
                    <div class="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 mt-6 pt-6 border-t theme-border-color">
                        <div class="theme-text-muted text-xs">Powered by:</div>
                        <div class="flex items-center space-x-4 text-xs theme-text-muted">
                            <div class="flex items-center space-x-1">
                                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/>
                                </svg>
                                <span>HTML5</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/>
                                </svg>
                                <span>JavaScript</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C7.666,17.818,9.027,19.2,12.001,19.2c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z"/>
                                </svg>
                                <span>Tailwind CSS</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                                </svg>
                                <span>Firebase</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    `;
};

/**
 * Initialize footer behavior
 */
export const initializeFooter = () => {
    console.log('✅ Footer initialized');
    
    // Add any footer-specific JavaScript functionality here
    // For example, analytics tracking, newsletter signup, etc.
    
    // Add subtle hover animations to social links
    const socialLinks = document.querySelectorAll('footer button');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            link.style.transform = 'translateY(-1px) scale(1.05)';
        });
        
        link.addEventListener('mouseleave', () => {
            link.style.transform = 'translateY(0) scale(1)';
        });
    });
};
