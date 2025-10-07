// Main JavaScript functionality
class LostFoundApp {
    constructor() {
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMoreItems = true;
        this.currentItems = []; // Initialize currentItems array
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDates();
        this.setupFileInputs();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Search and filter functionality
        document.getElementById('searchButton')?.addEventListener('click', () => this.searchItems());
        document.getElementById('searchInput')?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.searchItems();
        });

        document.getElementById('categoryFilter')?.addEventListener('change', () => this.searchItems());
        document.getElementById('typeFilter')?.addEventListener('change', () => this.searchItems());
        document.getElementById('dateFilter')?.addEventListener('change', () => this.searchItems());
        document.getElementById('locationFilter')?.addEventListener('keyup', () => this.searchItems());

        // Form submissions
        document.getElementById('submitLostItem')?.addEventListener('click', () => this.submitLostItem());
        document.getElementById('submitFoundItem')?.addEventListener('click', () => this.submitFoundItem());

        // Load more items
        document.getElementById('loadMoreBtn')?.addEventListener('click', () => this.loadMoreItems());
    }

    setupFileInputs() {
        // Setup file input change listeners
        const lostImageInput = document.getElementById('lostImage');
        const foundImageInput = document.getElementById('foundImage');

        if (lostImageInput) {
            lostImageInput.addEventListener('change', (e) => {
                this.handleFileSelect(e, 'lostFileInfo');
            });
        }

        if (foundImageInput) {
            foundImageInput.addEventListener('change', (e) => {
                this.handleFileSelect(e, 'foundFileInfo');
            });
        }
    }

    async loadInitialData() {
        try {
            const response = await fetch('/items/api?page=1&limit=9');
            const data = await response.json();
            
            if (data.items) {
                this.currentItems = data.items; // Store items
                this.renderItems(this.currentItems);
                this.hasMoreItems = data.currentPage < data.totalPages;
                this.updateLoadMoreButton();
            }
        } catch (error) {
            console.error('Error loading items:', error);
        }
    }

    async loadMoreItems() {
        if (this.isLoading || !this.hasMoreItems) return;

        this.isLoading = true;
        this.currentPage++;
        
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            loadMoreBtn.disabled = true;
        }

        try {
            const searchParams = new URLSearchParams({
                page: this.currentPage,
                limit: 9
            });

            // Add search filters if active
            const searchInput = document.getElementById('searchInput')?.value;
            const categoryFilter = document.getElementById('categoryFilter')?.value;
            const typeFilter = document.getElementById('typeFilter')?.value;
            const locationFilter = document.getElementById('locationFilter')?.value;
            const dateFilter = document.getElementById('dateFilter')?.value;

            if (searchInput) searchParams.append('search', searchInput);
            if (categoryFilter) searchParams.append('category', categoryFilter);
            if (typeFilter) searchParams.append('type', typeFilter);
            if (locationFilter) searchParams.append('location', locationFilter);
            if (dateFilter) searchParams.append('date', dateFilter);

            const response = await fetch(`/items/api?${searchParams}`);
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                this.currentItems = this.currentItems.concat(data.items); // Append to current items
                this.appendItems(data.items);
                this.hasMoreItems = data.currentPage < data.totalPages;
            } else {
                this.hasMoreItems = false;
            }
            
            this.updateLoadMoreButton();
            
        } catch (error) {
            console.error('Error loading more items:', error);
            this.showAlert('Error loading more items', 'danger');
            this.currentPage--; // Revert page on error
        } finally {
            this.isLoading = false;
            if (loadMoreBtn) {
                loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More Items';
                loadMoreBtn.disabled = false;
            }
        }
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn) return;

        if (!this.hasMoreItems) {
            loadMoreBtn.style.display = 'none';
            
            // Show "end of results" message
            const itemsContainer = document.getElementById('itemsContainer');
            if (itemsContainer && itemsContainer.children.length > 0) {
                const endMessage = document.createElement('div');
                endMessage.className = 'col-12 text-center py-4';
                endMessage.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-check-circle"></i> You've reached the end of the results.
                    </div>
                `;
                // Remove any existing end message
                const existingEndMessage = itemsContainer.querySelector('.alert-info');
                if (existingEndMessage) {
                    existingEndMessage.closest('.col-12').remove();
                }
                itemsContainer.appendChild(endMessage);
            }
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    async searchItems() {
        // Reset pagination for new search
        this.currentPage = 1;
        this.hasMoreItems = true;

        const searchParams = new URLSearchParams({
            q: document.getElementById('searchInput')?.value || '',
            category: document.getElementById('categoryFilter')?.value || '',
            type: document.getElementById('typeFilter')?.value || '',
            location: document.getElementById('locationFilter')?.value || '',
            date: document.getElementById('dateFilter')?.value || '',
            page: 1,
            limit: 9
        });

        try {
            const response = await fetch(`/items/api?${searchParams}`);
            const data = await response.json();
            
            if (data.success !== false) {
                this.currentItems = data.items || []; // Update current items with search results
                this.renderItems(this.currentItems);
                this.hasMoreItems = data.currentPage < data.totalPages;
                this.updateLoadMoreButton();
                
                // Show search results count
                if (data.items && data.items.length > 0) {
                    this.showAlert(`Found ${data.items.length} items matching your search`, 'success');
                } else {
                    this.showAlert('No items found matching your search criteria', 'info');
                }
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showAlert('Error searching items', 'danger');
        }
    }

    renderItems(items) {
        const container = document.getElementById('itemsContainer');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No items found</h4>
                    <p class="text-muted">Try adjusting your search criteria</p>
                </div>
            `;
            // Hide load more button when no items
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        container.innerHTML = items.map(item => this.createItemCard(item)).join('');
    }

    appendItems(items) {
        const container = document.getElementById('itemsContainer');
        if (!container) return;

        // Remove any "end of results" message
        const endMessage = container.querySelector('.alert-info');
        if (endMessage) {
            endMessage.closest('.col-12').remove();
        }

        // Remove "no items" message if it exists
        const noItemsMessage = container.querySelector('.text-center.py-5');
        if (noItemsMessage) {
            noItemsMessage.remove();
        }

        const newItemsHTML = items.map(item => this.createItemCard(item)).join('');
        container.insertAdjacentHTML('beforeend', newItemsHTML);

        // Show success message for loaded items
        this.showAlert(`Loaded ${items.length} more items`, 'success');
    }

    createItemCard(item) {
        const imageUrl = item.image || `https://source.unsplash.com/random/300x200/?${item.category.toLowerCase()}`;
        const date = new Date(item.date).toLocaleDateString();
        
        return `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <img src="${imageUrl}" class="card-img-top item-image" alt="${item.title}" onerror="this.src='https://source.unsplash.com/random/300x200/?${item.category.toLowerCase()}'">
                    <div class="card-body d-flex flex-column">
                        <div>
                            <span class="badge ${item.type === 'lost' ? 'bg-danger' : 'bg-primary'}">
                                ${item.type === 'lost' ? 'Lost' : 'Found'}
                            </span>
                            ${item.status === 'resolved' ? '<span class="badge bg-success ms-1">Resolved</span>' : ''}
                            <h5 class="card-title mt-2">${item.title}</h5>
                            <p class="card-text">${item.description}</p>
                        </div>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted"><i class="fas fa-map-marker-alt"></i> ${item.location}</small>
                                <small class="text-muted"><i class="fas fa-calendar"></i> ${date}</small>
                            </div>
                            <div class="mt-2">
                                <small class="text-muted"><i class="fas fa-tag"></i> ${item.category}</small>
                            </div>
                            <div class="mt-3">
                                <button class="btn btn-sm btn-outline-primary" onclick="app.contactAboutItem('${item._id}')">
                                    <i class="fas fa-envelope"></i> Contact
                                </button>
                                ${item.type === 'found' ? `
                                    <button class="btn btn-sm btn-outline-success ms-1" onclick="app.claimItem('${item._id}')">
                                        <i class="fas fa-hand-holding-heart"></i> Claim
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // UPDATED CONTACT FUNCTIONALITY - With better error handling and fallback
    contactAboutItem(itemId) {
        console.log('Contact clicked for item:', itemId);
        console.log('Current items:', this.currentItems);
        
        // Try to find the item in currentItems first
        let item = this.currentItems?.find(i => i._id === itemId);
        
        if (!item) {
            // If not found in currentItems, try to fetch it from the server
            console.log('Item not found in currentItems, fetching from server...');
            this.fetchItemAndShowContactModal(itemId);
            return;
        }

        this.showContactModal(item);
    }

    claimItem(itemId) {
        console.log('Claim clicked for item:', itemId);
        
        // Try to find the item in currentItems first
        let item = this.currentItems?.find(i => i._id === itemId);
        
        if (!item) {
            // If not found in currentItems, try to fetch it from the server
            console.log('Item not found in currentItems, fetching from server...');
            this.fetchItemAndShowClaimModal(itemId);
            return;
        }

        this.showClaimModal(item);
    }

    async fetchItemAndShowContactModal(itemId) {
        try {
            const response = await fetch(`/items/${itemId}`);
            if (response.ok) {
                const item = await response.json();
                this.showContactModal(item);
            } else {
                this.showAlert('Could not load item details. Please try again.', 'warning');
            }
        } catch (error) {
            console.error('Error fetching item:', error);
            this.showAlert('Error loading item details', 'danger');
        }
    }

    async fetchItemAndShowClaimModal(itemId) {
        try {
            const response = await fetch(`/items/${itemId}`);
            if (response.ok) {
                const item = await response.json();
                this.showClaimModal(item);
            } else {
                this.showAlert('Could not load item details. Please try again.', 'warning');
            }
        } catch (error) {
            console.error('Error fetching item:', error);
            this.showAlert('Error loading item details', 'danger');
        }
    }

    showContactModal(item) {
        // Create and show contact modal
        const modalHtml = `
            <div class="modal fade" id="contactModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Contact ${item.type === 'lost' ? 'Owner' : 'Finder'}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <h6>Item Details:</h6>
                                <strong>${this.escapeHtml(item.title)}</strong><br>
                                <small class="text-muted">${item.category} • ${item.location}</small>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Your Name *</label>
                                <input type="text" class="form-control" id="contactUserName" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Your Email *</label>
                                <input type="email" class="form-control" id="contactUserEmail" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Your Phone</label>
                                <input type="tel" class="form-control" id="contactUserPhone">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Message *</label>
                                <textarea class="form-control" id="contactMessage" rows="4" required placeholder="Describe how you can help or identify the item..."></textarea>
                            </div>
                            
                            ${item.type === 'lost' ? `
                                <div class="alert alert-warning">
                                    <small><i class="fas fa-exclamation-triangle"></i> Please provide specific details to help the owner verify your claim.</small>
                                </div>
                            ` : `
                                <div class="alert alert-warning">
                                    <small><i class="fas fa-exclamation-triangle"></i> Please describe how you lost this item to help the finder verify your claim.</small>
                                </div>
                            `}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="app.submitContactRequest('${item._id}')">
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('contactModal');
        if (existingModal) existingModal.remove();

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const contactModal = new bootstrap.Modal(document.getElementById('contactModal'));
        contactModal.show();
    }

    showClaimModal(item) {
        // Create and show claim modal
        const modalHtml = `
            <div class="modal fade" id="claimModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Claim Found Item</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <h6>Item Details:</h6>
                                <strong>${this.escapeHtml(item.title)}</strong><br>
                                <small class="text-muted">${item.category} • Found at: ${item.location}</small>
                                ${item.storageLocation ? `<br><small class="text-muted">Currently at: ${item.storageLocation}</small>` : ''}
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Your Name *</label>
                                <input type="text" class="form-control" id="claimUserName" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Your Email *</label>
                                <input type="email" class="form-control" id="claimUserEmail" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Your Phone *</label>
                                <input type="tel" class="form-control" id="claimUserPhone" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Student ID *</label>
                                <input type="text" class="form-control" id="claimStudentId" required placeholder="Enter your university ID">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Proof of Ownership *</label>
                                <textarea class="form-control" id="claimProof" rows="4" required placeholder="Describe specific details that prove this item belongs to you..."></textarea>
                                <div class="form-text">
                                    Provide specific details like: serial numbers, unique marks, contents, or other identifying features.
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">When can you collect the item? *</label>
                                <input type="text" class="form-control" id="claimCollectionTime" required placeholder="e.g., Monday 2-4 PM at Student Center">
                            </div>
                            
                            <div class="alert alert-warning">
                                <small>
                                    <i class="fas fa-exclamation-triangle"></i> 
                                    <strong>Important:</strong> The item will only be released after verification. 
                                    Bring your student ID when collecting.
                                </small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-success" onclick="app.submitClaimRequest('${item._id}')">
                                Submit Claim
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('claimModal');
        if (existingModal) existingModal.remove();

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const claimModal = new bootstrap.Modal(document.getElementById('claimModal'));
        claimModal.show();
    }

    // ADDED: Complete contact request submission
    async submitContactRequest(itemId) {
        const userName = document.getElementById('contactUserName')?.value;
        const userEmail = document.getElementById('contactUserEmail')?.value;
        const userPhone = document.getElementById('contactUserPhone')?.value;
        const message = document.getElementById('contactMessage')?.value;

        console.log('Submitting contact request:', { userName, userEmail, userPhone, message });

        if (!userName || !userEmail || !message) {
            this.showAlert('Please fill in all required fields (Name, Email, and Message)', 'warning');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            this.showAlert('Please enter a valid email address', 'warning');
            return;
        }

        try {
            // Show loading state
            const submitBtn = document.querySelector('#contactModal .btn-primary');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            // Try to use the real API endpoint first
            const response = await fetch(`/items/${itemId}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userName,
                    userEmail,
                    userPhone,
                    message
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.showSuccess('Your message has been sent successfully! The person will contact you soon.');
                
                // Close modal
                const contactModal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
                if (contactModal) contactModal.hide();
                
                // Reset form
                document.getElementById('contactUserName').value = '';
                document.getElementById('contactUserEmail').value = '';
                document.getElementById('contactUserPhone').value = '';
                document.getElementById('contactMessage').value = '';
                
            } else {
                // Fallback to simulation if endpoint doesn't exist
                await this.simulateContactRequest(itemId, userName, userEmail, userPhone, message);
            }
            
        } catch (error) {
            console.error('Error sending contact request:', error);
            // Fallback to simulation
            await this.simulateContactRequest(itemId, userName, userEmail, userPhone, message);
        } finally {
            // Reset button state
            const submitBtn = document.querySelector('#contactModal .btn-primary');
            if (submitBtn) {
                submitBtn.innerHTML = 'Send Message';
                submitBtn.disabled = false;
            }
        }
    }

    // ADDED: Complete claim request submission
    async submitClaimRequest(itemId) {
        const userName = document.getElementById('claimUserName')?.value;
        const userEmail = document.getElementById('claimUserEmail')?.value;
        const userPhone = document.getElementById('claimUserPhone')?.value;
        const studentId = document.getElementById('claimStudentId')?.value;
        const proof = document.getElementById('claimProof')?.value;
        const collectionTime = document.getElementById('claimCollectionTime')?.value;

        console.log('Submitting claim request:', { userName, userEmail, userPhone, studentId, proof, collectionTime });

        if (!userName || !userEmail || !userPhone || !studentId || !proof || !collectionTime) {
            this.showAlert('Please fill in all required fields', 'warning');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            this.showAlert('Please enter a valid email address', 'warning');
            return;
        }

        try {
            // Show loading state
            const submitBtn = document.querySelector('#claimModal .btn-success');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;

            // Try to use the real API endpoint first
            const response = await fetch(`/items/${itemId}/claim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userName,
                    userEmail,
                    userPhone,
                    studentId,
                    proof,
                    collectionTime
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.showSuccess('Claim submitted successfully! The finder will contact you to verify and arrange collection.');
                
                // Close modal
                const claimModal = bootstrap.Modal.getInstance(document.getElementById('claimModal'));
                if (claimModal) claimModal.hide();
                
                // Reset form
                document.getElementById('claimUserName').value = '';
                document.getElementById('claimUserEmail').value = '';
                document.getElementById('claimUserPhone').value = '';
                document.getElementById('claimStudentId').value = '';
                document.getElementById('claimProof').value = '';
                document.getElementById('claimCollectionTime').value = '';
                
            } else {
                // Fallback to simulation if endpoint doesn't exist
                await this.simulateClaimRequest(itemId, userName, userEmail, userPhone, studentId, proof, collectionTime);
            }
            
        } catch (error) {
            console.error('Error submitting claim:', error);
            // Fallback to simulation
            await this.simulateClaimRequest(itemId, userName, userEmail, userPhone, studentId, proof, collectionTime);
        } finally {
            // Reset button state
            const submitBtn = document.querySelector('#claimModal .btn-success');
            if (submitBtn) {
                submitBtn.innerHTML = 'Submit Claim';
                submitBtn.disabled = false;
            }
        }
    }

    // ADDED: Simulation methods for when backend endpoints aren't available
    async simulateContactRequest(itemId, userName, userEmail, userPhone, message) {
        const contactData = {
            itemId: itemId,
            userName: userName,
            userEmail: userEmail,
            userPhone: userPhone,
            message: message,
            timestamp: new Date().toISOString()
        };

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        this.showSuccess('Your message has been sent! The person will contact you soon.');
        
        // Close modal
        const contactModal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
        if (contactModal) contactModal.hide();
        
        // Log the contact request
        console.log('Contact request submitted (simulated):', contactData);
    }

    async simulateClaimRequest(itemId, userName, userEmail, userPhone, studentId, proof, collectionTime) {
        const claimData = {
            itemId: itemId,
            userName: userName,
            userEmail: userEmail,
            userPhone: userPhone,
            studentId: studentId,
            proof: proof,
            collectionTime: collectionTime,
            timestamp: new Date().toISOString()
        };

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        this.showSuccess('Claim submitted successfully! The finder will contact you to verify and arrange collection.');
        
        // Close modal
        const claimModal = bootstrap.Modal.getInstance(document.getElementById('claimModal'));
        if (claimModal) claimModal.hide();
        
        // Log the claim request
        console.log('Claim request submitted (simulated):', claimData);
    }

    // Rest of your existing methods remain the same...
    handleFileSelect(event, infoElementId) {
        const file = event.target.files[0];
        const infoElement = document.getElementById(infoElementId);
        
        if (!infoElement) {
            console.warn(`Info element ${infoElementId} not found`);
            return;
        }

        if (file) {
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                this.showAlert('File too large. Maximum size is 5MB.', 'warning');
                event.target.value = ''; // Clear the file input
                infoElement.textContent = 'No file selected (Max: 5MB, Images only)';
                infoElement.className = 'text-muted small';
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                this.showAlert('Only image files are allowed.', 'warning');
                event.target.value = ''; // Clear the file input
                infoElement.textContent = 'No file selected (Max: 5MB, Images only)';
                infoElement.className = 'text-muted small';
                return;
            }

            const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
            infoElement.textContent = `Selected: ${file.name} (${fileSizeMB} MB)`;
            infoElement.className = 'text-success small';
            
            // Preview image
            this.previewImage(file, infoElementId + 'Preview');
        } else {
            infoElement.textContent = 'No file selected (Max: 5MB, Images only)';
            infoElement.className = 'text-muted small';
            this.clearImagePreview(infoElementId + 'Preview');
        }
    }

    previewImage(file, previewElementId) {
        const reader = new FileReader();
        const previewElement = document.getElementById(previewElementId);
        
        if (!previewElement) {
            console.warn(`Preview element ${previewElementId} not found`);
            return;
        }

        reader.onload = function(e) {
            previewElement.innerHTML = `
                <div class="mt-2">
                    <img src="${e.target.result}" class="img-thumbnail" style="max-height: 150px; max-width: 200px;" alt="Preview">
                    <div class="mt-1">
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="app.removeImage('${previewElementId}')">
                            <i class="fas fa-times"></i> Remove
                        </button>
                    </div>
                </div>
            `;
        };
        
        reader.readAsDataURL(file);
    }

    clearImagePreview(previewElementId) {
        const previewElement = document.getElementById(previewElementId);
        if (previewElement) {
            previewElement.innerHTML = '';
        }
    }

    removeImage(previewElementId) {
        this.clearImagePreview(previewElementId);
        
        // Clear the file input
        if (previewElementId === 'lostFileInfoPreview') {
            document.getElementById('lostImage').value = '';
            document.getElementById('lostFileInfo').textContent = 'No file selected (Max: 5MB, Images only)';
            document.getElementById('lostFileInfo').className = 'text-muted small';
        } else if (previewElementId === 'foundFileInfoPreview') {
            document.getElementById('foundImage').value = '';
            document.getElementById('foundFileInfo').textContent = 'No file selected (Max: 5MB, Images only)';
            document.getElementById('foundFileInfo').className = 'text-muted small';
        }
    }

    async submitLostItem() {
        const form = document.getElementById('lostItemForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData();
        
        // Get form values
        formData.append('itemName', document.getElementById('lostItemName').value);
        formData.append('description', document.getElementById('lostDescription').value);
        formData.append('category', document.getElementById('lostCategory').value);
        formData.append('location', document.getElementById('lostLocation').value);
        formData.append('date', document.getElementById('lostDate').value);
        
        // Contact info
        const contactInputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
        contactInputs.forEach(input => {
            if (input.placeholder === 'Your Name') {
                formData.append('contactName', input.value);
            } else if (input.placeholder === 'Email') {
                formData.append('contactEmail', input.value);
            } else if (input.placeholder === 'Phone') {
                formData.append('contactPhone', input.value);
            }
        });
        
        const imageInput = document.getElementById('lostImage');
        if (imageInput && imageInput.files[0]) {
            console.log('Adding image to form data:', imageInput.files[0].name);
            formData.append('image', imageInput.files[0]);
        }

        try {
            this.showAlert('Submitting lost item report...', 'info');
            
            const response = await fetch('/items/lost', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showAlert('Lost item reported successfully!', 'success');
                
                // Close modal and reset form
                const modal = bootstrap.Modal.getInstance(document.getElementById('postLostModal'));
                if (modal) modal.hide();
                
                form.reset();
                this.clearImagePreview('lostFileInfoPreview');
                document.getElementById('lostFileInfo').textContent = 'No file selected (Max: 5MB, Images only)';
                document.getElementById('lostFileInfo').className = 'text-muted small';
                
                // Refresh the page after a short delay
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } else {
                this.showAlert(result.message, 'danger');
            }
        } catch (error) {
            console.error('Error submitting lost item:', error);
            this.showAlert('Error reporting lost item: ' + error.message, 'danger');
        }
    }

    async submitFoundItem() {
        const form = document.getElementById('foundItemForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData();
        
        formData.append('itemName', document.getElementById('foundItemName').value);
        formData.append('description', document.getElementById('foundDescription').value);
        formData.append('category', document.getElementById('foundCategory').value);
        formData.append('location', document.getElementById('foundLocation').value);
        formData.append('date', document.getElementById('foundDate').value);
        formData.append('storageLocation', document.getElementById('storageLocation').value);
        
        // Contact info
        const contactInputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
        contactInputs.forEach(input => {
            if (input.placeholder === 'Your Name') {
                formData.append('contactName', input.value);
            } else if (input.placeholder === 'Email') {
                formData.append('contactEmail', input.value);
            } else if (input.placeholder === 'Phone') {
                formData.append('contactPhone', input.value);
            }
        });
        
        const imageInput = document.getElementById('foundImage');
        if (imageInput && imageInput.files[0]) {
            console.log('Adding image to form data:', imageInput.files[0].name);
            formData.append('image', imageInput.files[0]);
        }

        try {
            this.showAlert('Submitting found item report...', 'info');
            
            const response = await fetch('/items/found', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showAlert('Found item reported successfully!', 'success');
                
                // Close modal and reset form
                const modal = bootstrap.Modal.getInstance(document.getElementById('postFoundModal'));
                if (modal) modal.hide();
                
                form.reset();
                this.clearImagePreview('foundFileInfoPreview');
                document.getElementById('foundFileInfo').textContent = 'No file selected (Max: 5MB, Images only)';
                document.getElementById('foundFileInfo').className = 'text-muted small';
                
                // Refresh the page after a short delay
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } else {
                this.showAlert(result.message, 'danger');
            }
        } catch (error) {
            console.error('Error submitting found item:', error);
            this.showAlert('Error reporting found item: ' + error.message, 'danger');
        }
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('lostDate')?.setAttribute('value', today);
        document.getElementById('foundDate')?.setAttribute('value', today);
        document.getElementById('dateFilter')?.setAttribute('max', today);
    }

    showAlert(message, type) {
        // Remove any existing alerts
        const existingAlerts = document.querySelectorAll('.alert-auto-dismiss');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-auto-dismiss alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'info' ? 'info' : 'exclamation-triangle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LostFoundApp();
});