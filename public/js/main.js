// Main JavaScript functionality
class LostFoundApp {
    constructor() {
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMoreItems = true;
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
                this.renderItems(data.items);
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
                this.renderItems(data.items || []);
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

    contactAboutItem(itemId) {
        this.showAlert('Contact functionality would be implemented here. In a real application, this would show contact information or a contact form.', 'info');
    }

    claimItem(itemId) {
        this.showAlert('Claim functionality would be implemented here. In a real application, this would initiate the claim process.', 'info');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LostFoundApp();
});